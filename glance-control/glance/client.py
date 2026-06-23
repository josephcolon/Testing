"""GlanceClient — drives the GlanceLED panel through the GLANCE cloud config API.

Reverse-engineered from the web app's traffic (see glance/recon/). The protocol:

  POST {base}/GLANCE/API/post.php   content-type: text/plain
      body = a JSON object whose values are each a JSON-encoded string, e.g.
             {"O-freetext":"[{...}]", "O-settings":"{...}", "O-macAddress":"\"AA:..\"", ...}
      The device is addressed solely by the MAC in O-macAddress. There is NO auth.
      Server replies "Update successful." / "Request completed."

  GET {base}/GLANCE/API/select.php?_st=<kind>   -> option lists (standings, bt, nts, ...)
  GET {base}/API/sport.php , {base}/API/team.php -> game / team option lists

The app always sends the FULL config, and no read-back endpoint was observed, so to avoid
clobbering settings the client carries a complete `Config` and is normally seeded from your
own HAR capture via `Config.from_har()` (your capture == your current settings).

Confirmed color code: "w" = white. Other letters exist but weren't in the capture; pass
whatever single-char code you find by experimenting (the panel ignores/!defaults unknowns).
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field, replace
from typing import Any

import httpx

DEFAULT_BASE_URL = "https://passiveincomeconsultingllc.com"

# Order matches the observed payload (kept stable so our bytes mirror the browser's).
_FIELD_TO_KEY = {
    "freetext": "O-freetext",
    "news": "O-news",
    "fun": "O-fun",
    "settings": "O-settings",
    "profile": "O-profile",
    "lifestyle": "O-lifestyle",
    "sports": "O-sports",
    "finance": "O-finance",
    "mac": "O-macAddress",
    "profile_names": "O-profileNames",
}
_KEY_TO_FIELD = {v: k for k, v in _FIELD_TO_KEY.items()}

# Browser JSON.stringify uses no whitespace; match it so payloads are byte-identical.
_COMPACT = (",", ":")

WHITE = "w"  # the only color code seen in captures


def _default_freetext() -> list[dict]:
    return [{"text": "", "color": WHITE, "date": None} for _ in range(3)]


@dataclass
class Config:
    """The complete panel configuration (native Python; serialized on push)."""

    mac: str
    freetext: list[dict] = field(default_factory=_default_freetext)
    news: dict = field(default_factory=lambda: {"world": False, "finance": False, "sports": False, "ipo": False})
    fun: dict = field(default_factory=lambda: {
        "wordOfTheDay": False, "trivia": False, "todayInHistory": False, "dailyFacts": False,
        "flagOfTheDay": False, "greatQuotes": False, "learnNewLanguage": {"key": "", "value": "None"}})
    settings: dict = field(default_factory=lambda: {
        "sDifference": False, "ledBrightness": {"value": "1", "label": "LOW"},
        "screenDisplayTime": "3", "postalCode": "", "playerStats": False,
        "weatherUnit": False, "currency": "USD", "startTime": None, "endTime": None})
    profile: str = "1"
    lifestyle: dict = field(default_factory=lambda: {
        "clockDisplay": False, "airQuality": False, "weather": False, "moonPhase": False,
        "beachTides": {"value": "", "label": ""}, "nycTrainStations": {"value": "", "label": ""},
        "cheapestGas": {"value": "", "label": ""}, "cityScape": {"value": "", "label": ""},
        "ETHGwei": False, "powerBall": False, "megaMillion": False,
        "youtube": "", "instagram": "", "tiktok": ""})
    sports: dict = field(default_factory=lambda: {"standings": [], "game": [], "team": []})
    finance: dict = field(default_factory=lambda: {"stock": [], "crypto": [], "topMovers": []})
    profile_names: dict = field(default_factory=lambda: {"1": "Profile 1", "2": "Profile 2", "3": "Profile 3"})

    # --- serialization -------------------------------------------------------------------
    def to_body(self) -> str:
        """Serialize to the exact text/plain body the API expects (double-encoded JSON)."""
        outer = {}
        for attr, key in _FIELD_TO_KEY.items():
            outer[key] = json.dumps(getattr(self, attr), separators=_COMPACT)
        return json.dumps(outer, separators=_COMPACT)

    @classmethod
    def from_body(cls, body: str) -> "Config":
        outer = json.loads(body)
        kwargs: dict[str, Any] = {}
        for key, attr in _KEY_TO_FIELD.items():
            if key in outer:
                kwargs[attr] = json.loads(outer[key])
        return cls(**kwargs)

    @classmethod
    def from_har(cls, path: str) -> "Config":
        """Seed from the most recent post.php request in a HAR capture (your live settings)."""
        with open(path) as fh:
            har = json.load(fh)
        bodies = [e["request"]["postData"]["text"]
                  for e in har["log"]["entries"]
                  if e["request"]["url"].endswith("post.php") and e["request"].get("postData")]
        if not bodies:
            raise ValueError("no post.php request with a body found in HAR")
        return cls.from_body(bodies[-1])


@dataclass
class GlanceClient:
    """Reads/edits a `Config` and pushes it to the panel."""

    config: Config
    base_url: str = DEFAULT_BASE_URL
    _http: httpx.Client = field(default_factory=lambda: httpx.Client(timeout=20), repr=False)

    @classmethod
    def from_mac(cls, mac: str, **kw) -> "GlanceClient":
        return cls(Config(mac=mac), **kw)

    @classmethod
    def from_har(cls, path: str, **kw) -> "GlanceClient":
        return cls(Config.from_har(path), **kw)

    # --- editing (mutates config; call push() to apply) ----------------------------------
    def set_text(self, message: str, slot: int = 0, color: str = WHITE, date=None) -> "GlanceClient":
        """Set one of the 3 free-text slots."""
        if not 0 <= slot <= 2:
            raise ValueError("slot must be 0, 1, or 2")
        self.config.freetext[slot] = {"text": message, "color": color, "date": date}
        return self

    def clear_text(self) -> "GlanceClient":
        self.config.freetext = _default_freetext()
        return self

    def set_feature(self, group: str, name: str, value: bool) -> "GlanceClient":
        """Toggle a boolean feed, e.g. set_feature('lifestyle','weather',True)."""
        getattr(self.config, group)[name] = value
        return self

    def set_brightness(self, value: str, label: str | None = None) -> "GlanceClient":
        self.config.settings["ledBrightness"] = {"value": str(value), "label": label or ""}
        return self

    def set_display_time(self, seconds: int) -> "GlanceClient":
        self.config.settings["screenDisplayTime"] = str(seconds)
        return self

    # --- network -------------------------------------------------------------------------
    def push(self) -> str:
        """POST the full config to the panel. Returns the server's reply text."""
        resp = self._http.post(
            f"{self.base_url}/GLANCE/API/post.php",
            content=self.config.to_body(),
            headers={"content-type": "text/plain;charset=UTF-8", "accept": "application/json"},
        )
        resp.raise_for_status()
        return resp.text

    def options(self, kind: str) -> Any:
        """GET an option list: kind in {'standings','bt','nts',...} (select.php?_st=kind)."""
        resp = self._http.get(f"{self.base_url}/GLANCE/API/select.php", params={"_st": kind})
        resp.raise_for_status()
        return resp.json()

    def sport_options(self) -> list:
        return self._http.get(f"{self.base_url}/API/sport.php").json()

    def team_options(self) -> list:
        return self._http.get(f"{self.base_url}/API/team.php").json()

    def close(self) -> None:
        self._http.close()
