"""Pluggable feeds for the local server.

A feed is a small callable that returns the data to render on the panel. The base contract is
deliberately tiny so adding a *new* feed (calendar, Home Assistant, CI status, any API) is a
few lines. Concrete rendering (text vs pixels) is bound once the panel's payload format is
known from Stage-0 recon.

Register a feed:

    from glance.server.feeds import feed

    @feed("clock")
    def clock() -> dict:
        from datetime import datetime
        return {"text": datetime.now().strftime("%H:%M")}
"""
from __future__ import annotations

from typing import Callable

# name -> callable returning a dict of content (schema finalized after recon)
REGISTRY: dict[str, Callable[[], dict]] = {}


def feed(name: str) -> Callable[[Callable[[], dict]], Callable[[], dict]]:
    def register(fn: Callable[[], dict]) -> Callable[[], dict]:
        REGISTRY[name] = fn
        return fn
    return register


# A trivial built-in so the server has something to serve on day one.
@feed("clock")
def _clock() -> dict:
    from datetime import datetime

    return {"text": datetime.now().strftime("%H:%M")}
