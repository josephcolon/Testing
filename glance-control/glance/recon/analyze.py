"""Summarize a recon capture so we can learn the panel's protocol.

Accepts either:
  * a HAR file  (exported from glancesetup.com DevTools) -> the cloud CONFIG API, or
  * a pcap file (from `tcpdump -w`)                       -> the panel's outbound traffic.

It reports the hosts/domains contacted, HTTP vs HTTPS (interceptable vs pinned), ports,
and — for HAR — the request/response shapes of the config API so we can reproduce them.

Usage:
    python -m glance.recon.analyze capture.har
    python -m glance.recon.analyze glance.pcap     # needs the [recon] extra (scapy)
"""
from __future__ import annotations

import argparse
import collections
import json
import sys
from urllib.parse import urlparse


def analyze_har(path: str) -> None:
    with open(path) as fh:
        har = json.load(fh)
    entries = har.get("log", {}).get("entries", [])
    if not entries:
        sys.exit("No entries in HAR — make sure DevTools 'Preserve log' was on while you acted.")

    hosts = collections.Counter()
    api_calls = []
    for e in entries:
        req = e["request"]
        url = req["url"]
        host = urlparse(url).netloc
        hosts[host] += 1
        # Heuristic: config API calls are the non-asset XHR/fetch requests.
        mime = e.get("response", {}).get("content", {}).get("mimeType", "")
        is_data = "json" in mime or req["method"] in ("POST", "PUT", "PATCH", "DELETE")
        if is_data and not any(url.endswith(ext) for ext in (".js", ".css", ".png", ".woff2")):
            body = req.get("postData", {}).get("text", "")
            api_calls.append((req["method"], url, body[:500]))

    print("== Hosts contacted by the website ==")
    for host, n in hosts.most_common():
        print(f"  {host:<40} {n} request(s)")

    print("\n== Candidate config-API calls (method, url, request body) ==")
    if not api_calls:
        print("  none detected — try a clearer action (add an asset / push a message) and re-export.")
    for method, url, body in api_calls:
        print(f"\n  {method} {url}")
        if body:
            print(f"    body: {body}")
    print("\nShare this back — it tells us how to drive the panel from Python (client.py).")


def analyze_pcap(path: str) -> None:
    try:
        from scapy.all import DNSQR, IP, TCP, rdpcap  # type: ignore
    except ImportError:
        sys.exit("pcap analysis needs scapy: pip install 'glance-control[recon]'")

    pkts = rdpcap(path)
    dns_names: collections.Counter = collections.Counter()
    dst_ports: collections.Counter = collections.Counter()
    for p in pkts:
        if p.haslayer(DNSQR):
            dns_names[p[DNSQR].qname.decode(errors="replace").rstrip(".")] += 1
        if p.haslayer(TCP) and p.haslayer(IP):
            dst_ports[p[TCP].dport] += 1

    print("== Domains the panel looked up (DNS) ==")
    for name, n in dns_names.most_common():
        print(f"  {name:<45} {n}")
    print("\n== Destination ports (transport hint) ==")
    for port, n in dst_ports.most_common(15):
        kind = {80: "HTTP (interceptable!)", 443: "HTTPS (likely pinned)",
                1883: "MQTT", 8883: "MQTT/TLS"}.get(port, "")
        print(f"  {port:<6} {n:<6} {kind}")
    print("\nIf content rides on port 80, Stage 3 self-hosting is straightforward; if 443 only, "
          "we check for cert pinning before deciding Stage 3 vs Stage 4 (firmware).")


def main() -> None:
    ap = argparse.ArgumentParser(description="Summarize a HAR or pcap recon capture")
    ap.add_argument("capture", help="path to a .har or .pcap/.pcapng file")
    args = ap.parse_args()

    if args.capture.endswith(".har"):
        analyze_har(args.capture)
    elif args.capture.endswith((".pcap", ".pcapng", ".cap")):
        analyze_pcap(args.capture)
    else:
        sys.exit("Unrecognized capture; expected a .har or .pcap file.")


if __name__ == "__main__":
    main()
