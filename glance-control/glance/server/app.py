"""Local feed server — STAGE 3 SKELETON.

Idea: redirect the panel's cloud domain (via your router DNS / Pi-hole / dnsmasq) to this
server, which answers with content in the panel's native format. That frees the panel from
Glance's cloud and lets us add feeds Glance doesn't offer.

The response format and routes are filled in from Stage-0 recon (glance/recon/analyze of the
pcap shows what the panel requests). Whether this works at all depends on the content
transport: HTTP is interceptable; HTTPS with a pinned cert is not (then we fall back to the
Stage-1 cloud API, or Stage-4 custom firmware).

Run (once implemented):
    uvicorn glance.server.app:app --host 0.0.0.0 --port 80
"""
from __future__ import annotations

from fastapi import FastAPI

from .feeds import REGISTRY

app = FastAPI(title="glance-control local feed server")


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok", "feeds": sorted(REGISTRY)}


# The real content route mirrors whatever path the panel polls (learned in Stage 0), e.g.:
#
# @app.get("/devices/{mac}/content")
# def content(mac: str):
#     return render_panel_payload(REGISTRY)   # format confirmed from the pcap
#
# Left unrouted until recon pins down the path + payload schema.
