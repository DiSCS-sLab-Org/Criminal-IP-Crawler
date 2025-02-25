import net from "net";
import axios from "axios";
import { SocksProxyAgent } from "socks-proxy-agent";

// Configuration settings:
const control_host = "127.0.0.1";
const control_port = 9051;
const tor_password = "YOUR_PASSWORD";

const tor_socks_proxy = "socks5h://127.0.0.1:9050";

// Set to store used IPs
const ip_set = new Set();

function change_tor_ip() {
  return new Promise((resolve, reject) => {
    const socket = net.connect(
      { port: control_port, host: control_host },
      () => {
        socket.write(`AUTHENTICATE "${tor_password}"\r\n`);
      },
    );

    socket._newnym_sent = false;

    socket.on("data", (data) => {
      const response = data.toString();

      if (response.includes("250 OK")) {
        if (!socket._newnym_sent) {
          socket._newnym_sent = true;
          socket.write("signal NEWNYM\r\n");
        } else {
          socket.end();
          resolve("\x1b[35m[DEBUG]\x1b[0m IP change requested successfully.");
        }
      } else if (response.includes("515")) {
        socket.end();
        reject(
          new Error(
            "\x1b[31m[ERROR]\x1b[0m Authentication failed. Check your Tor control password.",
          ),
        );
      }
    });

    socket.on("error", (err) => {
      reject(err);
    });
  });
}

async function get_current_ip() {
  const agent = new SocksProxyAgent(tor_socks_proxy);

  try {
    const response = await axios.get("http://icanhazip.com", {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 10000,
    });
    return response.data.trim();
  } catch (err) {
    throw new Error(
      "\x1b[31m[ERROR]\x1b[0m Error fetching current IP: " + err.message,
    );
  }
}

async function get_ip() {
  try {
    let current_ip;
    let unique_ip_found = false;

    // Loop until a unique IP is obtained
    while (!unique_ip_found) {
      const change_msg = await change_tor_ip();
      console.log(change_msg);

      // Wait for Tor to apply the IP change
      await new Promise((resolve) => setTimeout(resolve, 5000));

      current_ip = await get_current_ip();

      if (ip_set.has(current_ip)) {
        console.log(
          `\x1b[35m[DEBUG]\x1b[0m IP ${current_ip} already used. Fetching a new one...`,
        );
      } else {
        ip_set.add(current_ip);
        unique_ip_found = true;
      }
    }

    console.log("\x1b[35m[DEBUG]\x1b[0m Current IP:", current_ip);
  } catch (err) {
    console.error("\x1b[31m[ERROR]\x1b[0m", err.message);
  }
}

function print_total_ips_used() {
  console.log(`\x1b[35m[DEBUG]\x1b[0m Total IPs used: ${ip_set.size}`);
}

export { get_ip, print_total_ips_used };
