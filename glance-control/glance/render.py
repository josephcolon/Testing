"""Render the content model to a preview — so you can see a feed before the device speaks.

Two renderers:
  * render_png(): pixel-accurate PIL image (scaled up) — what the panel would display.
  * render_ascii(): zero-dependency text preview — works anywhere, used in tests.

Neither needs the panel; they let us validate feeds end-to-end locally while the wire
protocol is still being reverse-engineered.
"""
from __future__ import annotations

from .content import PanelSpec, Screen

# A 5px-tall, 1px-gap layout reads well on short matrices.
_GLYPH_GAP = 1


def render_ascii(screen: Screen, spec: PanelSpec | None = None) -> str:
    """Render each item as a row of the panel using block characters."""
    spec = spec or PanelSpec()
    lines = []
    for item in screen.items:
        text = item.text
        # crude horizontal fit: a ticker would scroll; preview shows the leading window + marker
        cols = max(1, spec.width // 4)  # ~4px per char at this scale
        shown = text if len(text) <= cols else text[: cols - 1] + "…"
        lines.append(f"[{shown:<{cols}}]")
    return "\n".join(lines) if lines else "[ (empty) ]"


def render_png(screen: Screen, spec: PanelSpec | None = None, scale: int = 8):
    """Render the screen to a PIL Image at panel resolution, scaled up `scale`x for viewing.

    Returns a PIL.Image. Requires Pillow (install the base deps).
    """
    from PIL import Image, ImageDraw, ImageFont  # local import keeps PIL optional

    spec = spec or PanelSpec()
    rows = max(1, len(screen.items))
    row_h = max(spec.height // rows, 7)
    img = Image.new("RGB", (spec.width, row_h * rows), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.load_default()
    except Exception:  # pragma: no cover - default font is always present
        font = None

    for i, item in enumerate(screen.items):
        y = i * row_h + max(0, (row_h - 8) // 2)
        draw.text((1, y), item.text, fill=item.color, font=font)

    if scale != 1:
        img = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    return img


def save_png(screen: Screen, path: str, spec: PanelSpec | None = None, scale: int = 8) -> str:
    img = render_png(screen, spec, scale)
    img.save(path)
    return path
