# Criminal IP Crawler

A Node.js-based crawler designed to scan criminalip.io and extract information from specific IPs.

## Installation

### Install Dependencies
```sh
npm install
pip install -r requirements.txt
```

### Tor Installation and Preparation

This crawler uses Tor for anonymity. Follow these steps to install and configure Tor:

#### 1. Install Tor
Use your preferred package manager to install Tor. For example:
```sh
# Debian/Ubuntu
sudo apt update && sudo apt install tor

# Arch-based distributions
sudo pacman -S tor

# Fedora
sudo dnf install tor

# macOS (using Homebrew)
brew install tor
```

#### 2. Generate a Hashed Control Password
Run the following command and note the output:
```sh
tor --hash-password YOUR_PASSWORD
```
Replace `YOUR_PASSWORD` with a strong password.

#### 3. Update the `torrc` Configuration
Edit the Tor configuration file (`/etc/tor/torrc`) and add the following lines:
```sh
ControlPort 9051
HashedControlPassword <YOUR_HASHED_PASSWORD>
```
Replace `<YOUR_HASHED_PASSWORD>` with the output from step 2.

#### 4. Update `src/tor.js`
Modify the following lines in `src/tor.js` to match your Tor configuration:
```javascript
const control_host = "127.0.0.1";
const control_port = 9051;
const tor_password = "6015185";  // Change this to match your password
```

#### 5. Restart Tor Service
```sh
sudo systemctl restart tor
```

## Usage
Extract IPs from a JSON file and save the output in the `data` directory:
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
  ```
- Scan 139.91.1.1 in headful mode:
  ```sh
  node src/crawler.js -h 1.1
  ```
- Run normally (headless, no specific IP):
  ```sh
  node src/crawler.js
  ```

