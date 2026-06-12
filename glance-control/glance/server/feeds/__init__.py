"""Pluggable feeds for the local server.

A feed is a callable returning a `Screen` (see glance.content). The contract is tiny so a
*new* feed — calendar, Home Assistant, CI status, any API — is a few lines. Feeds are
protocol-independent: they describe what to show, not how the panel receives it.

Register a feed:

    from glance.server.feeds import feed
    from glance.content import Screen

    @feed("hello")
    def hello() -> Screen:
        return Screen.text("hi")
"""
from __future__ import annotations

from typing import Callable

from ...content import Screen

FeedFn = Callable[[], Screen]
REGISTRY: dict[str, FeedFn] = {}


def feed(name: str) -> Callable[[FeedFn], FeedFn]:
    def register(fn: FeedFn) -> FeedFn:
        REGISTRY[name] = fn
        return fn
    return register


def get(name: str) -> FeedFn:
    if name not in REGISTRY:
        raise KeyError(f"unknown feed '{name}'. Available: {', '.join(sorted(REGISTRY)) or '(none)'}")
    return REGISTRY[name]


# Importing builtin registers the bundled feeds.
from . import builtin as _builtin  # noqa: E402,F401
