# Stage 0 — Recon walkthrough

The panel's protocol is undocumented, so before we can control it we need to observe it.
Everything here is **non-invasive** (no opening the case) and run on **your own network**
against **your own device** — standard interoperability work.

You'll do four things and share the output: (1) find the panel, (2) port-scan it,
(3) capture where it phones home, (4) capture the website's config API.

---

## 1. Find the panel on your LAN

The panel's MAC is printed on the unit and shown on its startup screen.

```bash
python -m glance.recon.discover            # ARP-based, annotates the likely panel
# fallbacks:
arp -a
nmap -sn 192.168.1.0/24                    # use YOUR subnet
```

Record the panel's **IP**. → If `discover` can't see it, your computer and the panel may be
on different subnets / bands (the panel is 2.4 GHz only); fixing that may itself help the
"WiFi never connects" pain.

## 2. Port-scan the panel

```bash
nmap -p- <panel-ip>
```

**Best case:** an open HTTP port (80/8080/etc.) means the firmware has a *local web server* —
possibly direct local control with no cloud at all. Share the full port list.

## 3. Capture where the panel phones home

Goal: the **cloud domains** the panel talks to and whether content is **HTTP (interceptable)
or HTTPS (pinned/harder)** — this decides whether Stage 3 self-hosting is easy or needs firmware.

Easiest sources, in order of preference:
- Your **router's DNS/client logs**, or a **Pi-hole** query log filtered to the panel's IP.
- Packet capture, if your computer can see the panel's traffic (mirror port, or you are the
  gateway). On a normal switched LAN you may only see broadcast — a router log is more reliable.

```bash
sudo tcpdump -i <iface> host <panel-ip> -w glance.pcap     # let it run; reboot the panel
python -m glance.recon.analyze glance.pcap                  # summarizes domains/ports/transport
```

## 4. Capture the config API from the website (no device needed)

This is the fastest path to scripted control and touches only your browser:

1. Open **glancesetup.com**, log in, open **DevTools → Network** (check "Preserve log").
2. Change a feed / add an asset / push a message, watching the requests fire.
3. **Export HAR** (right-click in Network → "Save all as HAR").

```bash
python -m glance.recon.analyze glance.har                   # extracts the config API calls
```

---

## What to send back

The `analyze` summary plus the `nmap` port list. From that I can fill in `client.py`
(Stage 1) to reproduce the config API from Python, then build the CLI and local feed server.
