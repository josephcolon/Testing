"""`glance` CLI — control your GlanceLED panel from the command line.

Config source (so we never clobber your other settings, since the API has no read-back):
  * GLANCE_HAR=/path/to/capture.har  -> seed from your live settings (recommended), or
  * GLANCE_MAC=AA:BB:CC:DD:EE:FF      -> start from defaults for that panel.

Examples:
  GLANCE_HAR=mine.har glance text "BUILD PASSING" --color w
  GLANCE_HAR=mine.har glance on lifestyle weather
  GLANCE_COUNTDOWN=2026-12-25 GLANCE_HAR=mine.har glance feed push countdown
  glance preview message            # render locally, no panel needed
"""
from __future__ import annotations

import os

import typer

from .client import GlanceClient
from .content import PanelSpec
from .render import render_ascii, save_png
from .server.feeds import REGISTRY, get

app = typer.Typer(add_completion=False, help="Control and preview your GlanceLED panel.")
feed_app = typer.Typer(help="Manage / preview / push feeds.")
app.add_typer(feed_app, name="feed")


def _client() -> GlanceClient:
    if har := os.environ.get("GLANCE_HAR"):
        return GlanceClient.from_har(har)
    if mac := os.environ.get("GLANCE_MAC"):
        return GlanceClient.from_mac(mac)
    raise typer.BadParameter("Set GLANCE_HAR=<capture.har> (recommended) or GLANCE_MAC=<mac>.")


def _report(reply: str) -> None:
    typer.secho(f"panel says: {reply}", fg=typer.colors.GREEN)


# --- live control --------------------------------------------------------------------------
@app.command()
def text(
    message: str,
    slot: int = typer.Option(0, help="free-text slot 0-2"),
    color: str = typer.Option("w", help="color code (w=white confirmed)"),
) -> None:
    """Show a custom message on the panel now."""
    c = _client()
    _report(c.set_text(message, slot=slot, color=color).push())


@app.command()
def on(group: str, name: str) -> None:
    """Enable a feed, e.g. `glance on lifestyle weather` or `glance on news sports`."""
    c = _client()
    _report(c.set_feature(group, name, True).push())


@app.command()
def off(group: str, name: str) -> None:
    """Disable a feed, e.g. `glance off lifestyle clockDisplay`."""
    c = _client()
    _report(c.set_feature(group, name, False).push())


@app.command()
def brightness(value: str, label: str = typer.Option("", help="optional label e.g. LOW/HIGH")) -> None:
    """Set LED brightness (value as seen in your capture, e.g. 1)."""
    c = _client()
    _report(c.set_brightness(value, label or None).push())


# --- feeds ---------------------------------------------------------------------------------
@feed_app.command("list")
def feed_list() -> None:
    """List available local feeds."""
    for name in sorted(REGISTRY):
        typer.echo(name)


@feed_app.command("push")
def feed_push(
    name: str,
    slot: int = typer.Option(0, help="free-text slot 0-2"),
    color: str = typer.Option("w"),
) -> None:
    """Render a local feed to text and push it to the panel (your 'new data feeds')."""
    screen = get(name)()
    message = " ".join(item.text for item in screen.items) or "(empty)"
    c = _client()
    _report(c.set_text(message, slot=slot, color=color).push())


@app.command()
def preview(
    feed_name: str = typer.Argument("message", help="feed to render (see `glance feed list`)"),
    png: str = typer.Option("", "--png", help="also save a scaled PNG to this path"),
    scale: int = typer.Option(8, help="PNG upscale factor"),
) -> None:
    """Render a feed locally — ASCII to the terminal, optional PNG to a file (no panel needed)."""
    screen = get(feed_name)()
    typer.echo(render_ascii(screen, PanelSpec()))
    if png:
        save_png(screen, png, PanelSpec(), scale)
        typer.secho(f"saved {png}", fg=typer.colors.GREEN)


if __name__ == "__main__":
    app()
