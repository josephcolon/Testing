"""Protocol-independent content model for the panel.

This is the *internal* representation of what we want to show — independent of how the
GlanceLED actually receives bytes on the wire (which we learn in Stage-0 recon). Feeds produce
these objects; the renderer previews them; the future device adapter will translate them into
the panel's native payload. Decoupling here means recon only requires writing one small adapter,
not rewriting feeds.
"""
from __future__ import annotations

from dataclasses import dataclass, field

# Pixel dimensions of the panel. The Glance "ticker" is a wide matrix; exact pixel count is
# confirmed during recon. Override per-call until then.
DEFAULT_WIDTH = 64
DEFAULT_HEIGHT = 16

RGB = tuple[int, int, int]
WHITE: RGB = (255, 255, 255)


@dataclass
class PanelSpec:
    width: int = DEFAULT_WIDTH
    height: int = DEFAULT_HEIGHT


@dataclass
class Item:
    """One thing to show: a line of text in a color, optionally scrolled if too wide."""

    text: str
    color: RGB = WHITE
    scroll: bool = True


@dataclass
class Screen:
    """An ordered set of items a feed wants shown (cycled/scrolled by the panel)."""

    items: list[Item] = field(default_factory=list)

    @classmethod
    def text(cls, message: str, color: RGB = WHITE) -> "Screen":
        return cls([Item(message, color)])
