"""`glance` CLI — STAGE 2 SKELETON.

Command surface is wired up now so the UX is settled; each command calls GlanceClient, whose
bodies are filled in after Stage-0 recon. Until then commands print a clear "needs recon" notice
instead of pretending to work.
"""
from __future__ import annotations

import os

import typer

from .client import GlanceClient

app = typer.Typer(add_completion=False, help="Control your GlanceLED Classic panel.")
feed_app = typer.Typer(help="Manage the panel's feeds.")
app.add_typer(feed_app, name="feed")


def _client() -> GlanceClient:
    mac = os.environ.get("GLANCE_MAC")
    if not mac:
        raise typer.BadParameter("Set GLANCE_MAC to your panel's MAC address.")
    return GlanceClient(mac=mac, token=os.environ.get("GLANCE_TOKEN"))


def _not_yet(action: str) -> None:
    typer.secho(
        f"'{action}' is wired up but not implemented yet — it needs the Stage-0 recon capture "
        "to learn the panel's API. See glance/recon/README.md.",
        fg=typer.colors.YELLOW,
    )
    raise typer.Exit(code=2)


@app.command()
def text(message: str) -> None:
    """Show a custom text message on the panel now."""
    _not_yet("text")


@feed_app.command("list")
def feed_list() -> None:
    """List the feeds the panel is currently showing."""
    _not_yet("feed list")


@feed_app.command("add")
def feed_add(kind: str, args: str = typer.Argument("", help="feed args, e.g. AAPL,NVDA")) -> None:
    """Add a feed (e.g. stocks, weather, sports)."""
    _not_yet("feed add")


if __name__ == "__main__":
    app()
