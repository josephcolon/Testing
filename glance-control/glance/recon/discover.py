"""Find the GlanceLED panel on the local network via the system ARP table.

Non-invasive: reads the OS ARP cache (and optionally pings the subnet first to populate it).
Prints every host it can see and flags the one whose MAC matches a GlanceLED, if known.

Usage:
    python -m glance.recon.discover
    python -m glance.recon.discover --mac AA:BB:CC:DD:EE:FF   # the MAC on your panel's label
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys

# Filled in during Stage 0 once we read a real panel's MAC. The first 3 octets (OUI)
# identify the NIC vendor; ESP32 modules commonly show Espressif OUIs.
ESPRESSIF_OUIS = {"24:0a:c4", "24:6f:28", "30:ae:a4", "3c:71:bf", "a4:cf:12",
                  "b4:e6:2d", "cc:50:e3", "ec:fa:bc", "f4:cf:a2", "fc:f5:c4"}

ARP_LINE = re.compile(r"(?P<ip>\d+\.\d+\.\d+\.\d+).*?(?P<mac>(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2})")


def arp_table() -> list[tuple[str, str]]:
    try:
        out = subprocess.run(["arp", "-a"], capture_output=True, text=True, timeout=10).stdout
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        sys.exit(f"could not run 'arp -a': {exc}")
    hosts = []
    for line in out.splitlines():
        m = ARP_LINE.search(line)
        if m:
            hosts.append((m["ip"], m["mac"].lower().replace("-", ":")))
    return hosts


def main() -> None:
    ap = argparse.ArgumentParser(description="Locate the GlanceLED panel on the LAN")
    ap.add_argument("--mac", help="the panel's MAC (from its label/startup screen)")
    args = ap.parse_args()

    target = args.mac.lower() if args.mac else None
    hosts = arp_table()
    if not hosts:
        sys.exit("ARP table empty. Try pinging your subnet first (e.g. `nmap -sn <subnet>/24`).")

    print(f"{'IP':<16} {'MAC':<18} note")
    print("-" * 50)
    for ip, mac in sorted(hosts):
        note = ""
        if target and mac == target:
            note = "<-- THIS IS YOUR PANEL"
        elif mac[:8] in ESPRESSIF_OUIS:
            note = "(Espressif OUI — likely an ESP32, possibly the panel)"
        print(f"{ip:<16} {mac:<18} {note}")

    if target and not any(mac == target for _, mac in hosts):
        print(f"\nMAC {target} not in ARP cache. Ping the subnet to populate it, or the panel "
              "may be on another band/subnet (it is 2.4 GHz only).")


if __name__ == "__main__":
    main()
