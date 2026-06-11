"""GlanceClient — drives the panel's configuration the way glancesetup.com does.

STAGE 1 SKELETON. The real endpoints/payloads are filled in from the Stage-0 HAR capture
(see glance/recon/). The shape below mirrors what these cloud-config tickers typically expose
(auth by account, target device by MAC, set an ordered list of "feeds"); confirm against the
capture before trusting it.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import httpx

# Replace with the real base once recon confirms it (Stage 0.4).
DEFAULT_BASE_URL = "https://api.glance-led.com"  # PLACEHOLDER — verify against HAR


@dataclass
class GlanceClient:
    """Talks to the Glance cloud config API for a single panel (keyed by MAC)."""

    mac: str
    token: str | None = None
    base_url: str = DEFAULT_BASE_URL
    _http: httpx.Client = field(default_factory=lambda: httpx.Client(timeout=15), repr=False)

    # --- to be implemented once the config API is captured ---------------------------------
    def set_feeds(self, feeds: list[dict]) -> None:
        """Replace the panel's ordered feed list. Payload shape comes from recon."""
        raise NotImplementedError("Fill in from Stage-0 HAR: POST <base>/devices/<mac>/feeds")

    def push_text(self, message: str, **opts) -> None:
        """Show a custom text message now (if Glance exposes a text/message feed)."""
        raise NotImplementedError("Fill in from Stage-0 HAR once the text feed is identified")

    def get_status(self) -> dict:
        """Return what the panel is currently configured to show."""
        raise NotImplementedError("Fill in from Stage-0 HAR: GET <base>/devices/<mac>")

    def close(self) -> None:
        self._http.close()
