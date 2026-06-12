"""Bundled feeds.

These produce the protocol-independent content model and are fully testable/previewable
without the panel. Offline feeds (clock, countdown, message) work anywhere; network feeds
(http_json) degrade gracefully when outbound access is blocked. The http_json feed is the
template for the "new data feeds" goal — point it at any API and map the result to text.
"""
from __future__ import annotations

import datetime as _dt
import json as _json
import os
import urllib.request

from ...content import RGB, Item, Screen

AMBER: RGB = (255, 176, 0)
GREEN: RGB = (0, 220, 90)
RED: RGB = (235, 60, 60)
CYAN: RGB = (0, 200, 220)

from . import feed  # noqa: E402  (registry lives in package __init__)


@feed("clock")
def clock() -> Screen:
    return Screen([Item(_dt.datetime.now().strftime("%H:%M"), CYAN)])


@feed("message")
def message() -> Screen:
    """Custom text from the GLANCE_MESSAGE env var (your 'send custom text' priority)."""
    return Screen.text(os.environ.get("GLANCE_MESSAGE", "hello from glance-control"), AMBER)


@feed("countdown")
def countdown() -> Screen:
    """Days until the date in GLANCE_COUNTDOWN (YYYY-MM-DD). Example 'new feed'."""
    target = os.environ.get("GLANCE_COUNTDOWN")
    if not target:
        return Screen.text("set GLANCE_COUNTDOWN=YYYY-MM-DD", RED)
    try:
        days = (_dt.date.fromisoformat(target) - _dt.date.today()).days
    except ValueError:
        return Screen.text("bad date", RED)
    return Screen([Item(f"{days}d to go", GREEN if days >= 0 else RED)])


@feed("http_json")
def http_json() -> Screen:
    """Generic feed template: fetch JSON from GLANCE_HTTP_URL, show GLANCE_HTTP_PATH.

    GLANCE_HTTP_PATH is a dotted path into the JSON (e.g. 'main.temp'). This is the pattern
    to clone for stocks/weather/calendar/CI — each is just a URL + a path + a label.
    """
    url = os.environ.get("GLANCE_HTTP_URL")
    if not url:
        return Screen.text("set GLANCE_HTTP_URL", RED)
    path = os.environ.get("GLANCE_HTTP_PATH", "")
    label = os.environ.get("GLANCE_HTTP_LABEL", "")
    try:
        with urllib.request.urlopen(url, timeout=8) as resp:  # noqa: S310 (user-supplied URL)
            data = _json.load(resp)
    except Exception as exc:  # network blocked / bad URL — fail visibly, don't crash the panel
        return Screen.text(f"feed err: {type(exc).__name__}", RED)
    value = data
    for key in filter(None, path.split(".")):
        value = value[int(key)] if isinstance(value, list) else value[key]
    return Screen([Item(f"{label}{value}".strip(), CYAN)])
