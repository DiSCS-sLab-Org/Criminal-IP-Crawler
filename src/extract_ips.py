import json
import os
import sys

if len(sys.argv) != 2:
    sys.exit("Usage: python extract.py <input_file>")

input_file_path = sys.argv[1]
data_dir = os.path.dirname(input_file_path) or "."
output_file_path = os.path.join(data_dir, "shodan_ips.json")

ip_ports = {}

if os.path.exists(output_file_path):
    with open(output_file_path, "r", encoding="utf-8") as output_file:
        try:
            loaded = json.load(output_file)
            if loaded:
                first_value = next(iter(loaded.values()))
                if not isinstance(first_value, int):
                    for ip, ports in loaded.items():
                        ip_ports[ip] = set(ports)
        except json.JSONDecodeError:
            pass

with open(input_file_path, "r", encoding="utf-8") as input_file:
    for line in input_file:
        try:
            entry = json.loads(line.strip())
            ip = entry.get("ip")
            port = entry.get("port")
            if ip and port and port != "N/A":
                if ip not in ip_ports:
                    ip_ports[ip] = set()
                ip_ports[ip].add(port)
        except json.JSONDecodeError:
            pass

ip_port_counts = {ip: len(ports) for ip, ports in ip_ports.items()}

with open(output_file_path, "w", encoding="utf-8") as output_file:
    json.dump(ip_port_counts, output_file, indent=4)
