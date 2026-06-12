"""Tests for the protocol-independent pieces (no panel required)."""
from __future__ import annotations

import os

from glance.content import Item, PanelSpec, Screen
from glance.render import render_ascii, render_png
from glance.server import feeds


def test_screen_text_helper():
    s = Screen.text("hi", (1, 2, 3))
    assert len(s.items) == 1 and s.items[0].text == "hi" and s.items[0].color == (1, 2, 3)


def test_builtin_feeds_registered():
    for name in ("clock", "message", "countdown", "http_json"):
        assert name in feeds.REGISTRY


def test_message_feed_uses_env(monkeypatch=None):
    os.environ["GLANCE_MESSAGE"] = "build passing"
    try:
        screen = feeds.get("message")()
        assert screen.items[0].text == "build passing"
    finally:
        del os.environ["GLANCE_MESSAGE"]


def test_countdown_feed():
    os.environ["GLANCE_COUNTDOWN"] = "2999-01-01"
    try:
        screen = feeds.get("countdown")()
        assert "to go" in screen.items[0].text
    finally:
        del os.environ["GLANCE_COUNTDOWN"]


def test_http_json_feed_degrades_without_url():
    os.environ.pop("GLANCE_HTTP_URL", None)
    screen = feeds.get("http_json")()
    assert "GLANCE_HTTP_URL" in screen.items[0].text  # fails visibly, no crash


def test_render_ascii():
    out = render_ascii(Screen([Item("hello"), Item("world")]), PanelSpec(width=64, height=16))
    assert out.count("\n") == 1 and "hello" in out


def test_render_png_produces_image():
    img = render_png(Screen.text("abc"), PanelSpec(width=64, height=16), scale=4)
    assert img.width == 64 * 4 and img.height > 0


def test_unknown_feed_raises():
    try:
        feeds.get("nope")
    except KeyError as exc:
        assert "unknown feed" in str(exc)
    else:
        raise AssertionError("expected KeyError")
