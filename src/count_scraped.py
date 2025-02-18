import json

with open("data/scraped_ips.json", "r") as file:
    data = json.load(file)

num_entries = len(data)

print(f"Number of entries: {num_entries}")
