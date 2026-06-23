# glance-control

A scriptable, self-hostable control layer for the **GlanceLED Classic** ticker
(TamariskLabs / PANELFI), an ESP32-based WiFi LED matrix.

The stock device is cloud-only: you configure it at glancesetup.com by MAC address and it
pulls rendered content from Glance's servers. This project replaces that with a local,
scriptable workflow — send custom text, self-host the feeds, and add new ones.

> Status: **protocol cracked — live control works.** A HAR capture of the GLANCE web app
> revealed the full config API, and `glance/client.py` now drives the real panel.

## The protocol (reverse-engineered from a HAR capture)

The web app saves your whole panel config to one endpoint, addressed only by MAC — **no auth**:

```
POST https://passiveincomeconsultingllc.com/GLANCE/API/post.php      (text/plain)
  body = {"O-freetext":"[{...x3}]","O-news":"{...}","O-lifestyle":"{...}",
          "O-sports":"{...}","O-finance":"{...}","O-settings":"{...}",
          "O-macAddress":"\"AA:BB:..\"", ...}   # each value is a JSON-encoded string
  -> "Update successful."
GET .../GLANCE/API/select.php?_st={standings|bt|nts|...}   # option lists
GET .../API/sport.php , .../API/team.php                   # game / team menus
```

`O-freetext` is 3 slots of `{text,color,date}` (color "w"=white confirmed). Every feed
(news, weather, clock, stocks, crypto, sports, lottery, gas prices…) is a boolean toggle.

> ⚠️ **Security note:** the API has no authentication — anyone who knows a panel's MAC can
> reconfigure it. That's why control is so easy, but keep your MAC private.

## Use it

```bash
pip install -e .

# Recommended: seed from your own capture so you don't overwrite other settings.
export GLANCE_HAR=/path/to/your_capture.har

glance text "GO GIANTS"                    # custom message to the panel now
glance on lifestyle weather                # turn a feed on  (off: `glance off ...`)
glance brightness 3 --label HIGH           # adjust brightness
GLANCE_COUNTDOWN=2026-12-25 glance feed push countdown   # a NEW feed -> free-text slot

# No device needed — render any feed locally as ASCII + PNG:
glance preview message --png out.png
```

`glance feed push` is the bridge for **new data feeds**: any local feed (calendar, CI status,
`http_json` against any API) renders to text and lands in a free-text slot on the real panel.
Config is a complete `Config` object seeded from your HAR, so pushes never clobber unrelated
settings (the API has no read-back endpoint).

## What we know

- Maker: **TamariskLabs**. Firmware is public at `github.com/TamariskLabs/glance-releases`
  as `glance-c5` / `glance-s3` binaries → **ESP32-C5 / ESP32-S3** chips.
- Firmware updates OTA from a public raw GitHub URL; `release-info.json` carries a hash
  (likely an integrity check — matters if we ever flash custom firmware).
- Config is cloud-driven, keyed by **MAC address**, via glancesetup.com. No documented local API.

## Stage 0 — run these and share the output

You need a computer on the same WiFi as the panel. See `glance/recon/README.md` for the full
walkthrough; the short version:

```bash
# 1. Find the panel (match its MAC, printed on the unit)
python -m glance.recon.discover            # or: arp -a ; nmap -sn <your-subnet>/24

# 2. Port-scan it for any local service/web server (best case = direct local control)
nmap -p- <panel-ip>

# 3. See where it phones home (cloud domains + HTTP vs HTTPS)
sudo tcpdump -i <iface> host <panel-ip> -w glance.pcap
python -m glance.recon.analyze glance.pcap

# 4. Capture the config API from the website (no device needed):
#    open glancesetup.com, DevTools > Network, change a feed, export HAR, then:
python -m glance.recon.analyze glance.har
```

The analyzer summarizes domains, transports, ports, and config-API request shapes — paste me
that and we fill in `client.py` (Stage 1), the CLI (Stage 2), and the local feed server (Stage 3).

## Roadmap

| Stage | Deliverable |
|-------|-------------|
| 0 | Recon: panel IP/ports, cloud domains, HTTP/HTTPS, config-API shapes |
| 1 | `GlanceClient` — scripts the cloud config API |
| 2 | `glance` CLI — `glance text "..."`, `glance feed ...` |
| 3 | Local feed server — self-hosted + new feeds via DNS redirect |
| 4 | (optional) Flash WLED / AWTRIX 3 for a full local HTTP/MQTT API |
