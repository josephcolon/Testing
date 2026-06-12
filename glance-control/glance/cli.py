"""`glance` CLI.

Two kinds of commands:
  * Working now (no device needed): `preview`, `feed list` — render the content model so you
    can see custom text and new feeds exactly as the panel will show them.
  * Pending Stage-0 recon: `text`, `feed add` — these push to the real panel and need the
    captured protocol; they print a clear notice until then.
"""
from __future__ import annotations

import os

import typer

from .content import Item, PanelSpec, Screen
from .render import render_ascii, save_png
from .server.feeds import REGISTRY, get

app = typer.Typer(add_completion=False, help="Control and preview your GlanceLED panel.")
feed_app = typer.Typer(help="Manage / preview feeds.")
app.add_typer(feed_app, name="feed")


def _not_yet(action: str) -> None:
    typer.secho(
        f"'{action}' pushes to the real panel and needs the Stage-0 recon capture to learn its "
        "API. See glance/recon/README.md. (Try `glance preview` to see feeds rendered now.)",
        fg=typer.colors.YELLOW,
    )
    raise typer.Exit(code=2)


@app.command()
def preview(
    feed_name: str = typer.Argument("message", help="feed to render (see `glance feed list`)"),
    png: str = typer.Option("", "--png", help="also save a scaled PNG to this path"),
    scale: int = typer.Option(8, help="PNG upscale factor"),
) -> None:
    """Render a feed locally — ASCII to the terminal, optional PNG to a file."""
    screen = get(feed_name)()
    typer.echo(render_ascii(screen, PanelSpec()))
    if png:
        save_png(screen, png, PanelSpec(), scale)
        typer.secho(f"saved {png}", fg=typer.colors.GREEN)


@feed_app.command("list")
def feed_list() -> None:
    """List available feeds (works now)."""
    for name in sorted(REGISTRY):
        typer.echo(name)


@feed_app.command("add")
def feed_add(kind: str, args: str = typer.Argument("", help="feed args, e.g. AAPL,NVDA")) -> None:
    """Add a feed to the real panel (needs recon)."""
    _not_yet("feed add")


@app.command()
def text(message: str) -> None:
    """Show a custom message on the real panel now (needs recon)."""
    _ = Screen([Item(message)])  # the content we'd push, once the adapter exists
    _not_yet("text")


if __name__ == "__main__":
    app()
