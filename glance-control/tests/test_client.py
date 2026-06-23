"""Tests for the GLANCE protocol client, validated against a real captured payload."""
from __future__ import annotations

import json
import os

from glance.client import Config, GlanceClient

FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "real_post_body.json")


def _real_body() -> str:
    with open(FIXTURE) as fh:
        return fh.read()


def test_roundtrip_is_byte_identical_to_browser():
    """Config parsed from the real body must reserialize to the exact same bytes."""
    body = _real_body()
    assert Config.from_body(body).to_body() == body


def test_parses_mac_and_settings():
    cfg = Config.from_body(_real_body())
    assert cfg.mac == "AA:BB:CC:DD:EE:FF"
    assert cfg.settings["postalCode"] == "00000"
    assert len(cfg.freetext) == 3


def test_set_text_updates_only_target_slot():
    cfg = Config.from_body(_real_body())
    client = GlanceClient(cfg)
    client.set_text("BUILD PASSING", slot=1, color="w")
    assert cfg.freetext[1] == {"text": "BUILD PASSING", "color": "w", "date": None}
    assert cfg.freetext[0]["text"] == "" and cfg.freetext[2]["text"] == ""
    # still a valid full payload addressed to the same panel
    outer = json.loads(cfg.to_body())
    assert json.loads(outer["O-macAddress"]) == "AA:BB:CC:DD:EE:FF"


def test_set_feature_toggles_feed():
    cfg = Config.from_body(_real_body())
    GlanceClient(cfg).set_feature("lifestyle", "weather", True)
    assert cfg.lifestyle["weather"] is True


def test_from_har_seeds_current_config():
    # the fixture body is also a minimal HAR-equivalent: build one and load it
    har = {"log": {"entries": [
        {"request": {"url": "https://x/GLANCE/API/post.php", "postData": {"text": _real_body()}}}
    ]}}
    import tempfile
    with tempfile.NamedTemporaryFile("w", suffix=".har", delete=False) as fh:
        json.dump(har, fh)
        path = fh.name
    cfg = Config.from_har(path)
    assert cfg.mac == "AA:BB:CC:DD:EE:FF"


def test_fresh_config_defaults_are_serializable():
    body = Config(mac="AA:BB:CC:DD:EE:FF").to_body()
    assert json.loads(json.loads(body)["O-macAddress"]) == "AA:BB:CC:DD:EE:FF"
