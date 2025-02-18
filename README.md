# Criminal IP Crawler

A Node.js-based crawler designed to scan criminalip.io and extract information from specific IPs.

## Installation

### Install dependencies
```sh
npm install
pip install -r requirements.txt
```
## Usage
Extract IPs from a json file and save the output in the data directory:
```sh
python src/extract_ips.py <input_file>
```
Run the crawler for extracted IPs with:
```sh
node src/crawler.js
```

### Command-line Options
- `-h` → Run in **headful mode** (useful for debugging)
- `xx.xx` → Specify an **IP address** to scan

### Example Commands
- Run in headful mode:
  ```sh
  node src/crawler.js -h
  ```
- Scan 139.91.1.1:
  ```sh
  node src/crawler.js 1.1

- Scan 139.91.1.1 in headful mode:
  ```sh
  node src/crawler.js -h 1.1
  ```
- Run normally (headless, no specific IP):
  ```sh
  node src/crawler.js
  ```
