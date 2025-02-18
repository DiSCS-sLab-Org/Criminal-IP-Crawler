import puppeteer from "puppeteer";
import process from "process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { get_ip, print_total_ips_used } from "./tor.js";
import {
  extract_ip_scoring,
  extract_connection_info,
  extract_security_info,
  extract_top_detail_info,
  extract_open_ports,
} from "./scraper/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create browser instance
async function create_browser_instance(headless) {
  const browser = await puppeteer.launch({
    headless: headless,
    args: ["--proxy-server=socks5://127.0.0.1:9050"],
  });
  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();
  return { browser, page };
}

// Get new IP, reset counter for scrapped IPs
async function change_ip() {
  await get_ip();
  return 0;
}

// Create a queue from file to save IPs
function create_queue(filename) {
  const data = fs.readFileSync(filename, "utf8");
  const json_data = JSON.parse(data);
  return Object.keys(json_data);
}

// Restart browser instance when changing IPs
// otherwise criminalip recognizes it
async function restart_browser(browser, options) {
  console.log(`\x1b[35m[DEBUG]\x1b[0m Creating a new browser instance`);
  await browser.close();
  const { browser: new_browser, page } = await create_browser_instance(
    options.headless,
  );
  const search_counter = await change_ip();
  return { browser: new_browser, page, search_counter };
}

// Check if upgrade message is present
// which means IP is blocked and we need
// a new one
async function check_upgrade_plan_text(page) {
  try {
    return await page.evaluate(() => {
      const container = document.querySelector(
        'div[class^="NoResultComponent__NoResultComponentWrap"]',
      );
      if (!container) return false;
      return container.textContent.includes(
        "Upgrade your plan and increase your credit",
      );
    });
  } catch (error) {
    return false;
  }
}

// Crawling function
async function crawl(options) {
  try {
    const dataDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Define the output file.
    const outputFile = path.join(dataDir, "scraped_ips.json");

    // Initialize array to store the results.
    const results = [];

    // Create the initial browser instance.
    let { browser, page } = await create_browser_instance(options.headless);
    let search_counter = await change_ip();

    let queue = [];
    const filename = path.join(dataDir, "shodan_ips.json");

    // If a specific IP is provided, search only that one.
    if (options.specific_ip) {
      queue.push(options.specific_ip);
    } else {
      queue = create_queue(filename);
    }

    // If we get consecutive timeouts it means the tor IP
    // has an issue, so change it
    let consecutive_timeouts = 0;

    // While queue has still IPs to check
    while (queue.length > 0) {
      const address = queue.shift();

      // We know that after 2 srapes with the same tor IP
      // it will get banned, so change it
      if (search_counter > 1 || consecutive_timeouts > 1) {
        ({ browser, page, search_counter } = await restart_browser(
          browser,
          options,
        ));
      }

      try {
        console.log(`\x1b[36m[INFO]\x1b[0m Checking IP: ${address}`);
        // Try scraping
        await page.goto(`https://www.criminalip.io/asset/report/${address}`, {
          waitUntil: "networkidle0",
          timeout: 60000,
        });

        // If upgrade plan text is present change tor IP
        if (await check_upgrade_plan_text(page)) {
          // Push the IP to the queue so we check it latter
          queue.push(address);
          console.log(
            `\x1b[36m[INFO]\x1b[0m Detected a upgrade plan text for ${address}`,
          );
          // Restart the browser, change IP
          ({ browser, page, search_counter } = await restart_browser(
            browser,
            options,
          ));
          continue;
        }

        // Extract data from the page
        const ip_scoring_data = await extract_ip_scoring(page);
        const connection_data = await extract_connection_info(page);
        const security_data = await extract_security_info(page);
        const top_detail_info = await extract_top_detail_info(page);
        let open_ports = null;
        // If there are open ports scrape all of their info
        if (security_data.open_ports != 0) {
          open_ports = await extract_open_ports(page);
        }

        const ip_scoring = {
          ...ip_scoring_data,
          malicious: top_detail_info.malicious,
          critical_vulnerabilities: top_detail_info.critical_vulnerabilities,
        };

        const ip_entry = {
          ip: address,
          ip_scoring,
          connection: connection_data,
          security: security_data,
          open_ports: open_ports,
        };

        // Push the entry into the results array.
        results.push(ip_entry);

        // Increment search counter after successful scraping
        search_counter++;
        // Reset consecutive timeout counter
        consecutive_timeouts = 0;
      } catch (error) {
        // Requeue the address if an error occurs so it can be retried.
        queue.push(address);
        console.error("\x1b[31m[ERROR]\x1b[0m IP error: ", error);
        consecutive_timeouts++;
      }
    }

    await browser.close();

    // Write the entire results array to the output file, pretty printed.
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), "utf8");
    console.log(`\x1b[32m[INFO]\x1b[0m Finished writing data to ${outputFile}`);
    // Print number of tor IPs used
    print_total_ips_used();
  } catch (error) {
    console.error("\x1b[31m[ERROR]\x1b[0m Crawl error: ", error);
  }
}

// Parse command-line arguments.
const args = process.argv.slice(2);
const headful = args.includes("-h");

// Look for an argument matching the pattern "xx.xx"
const ip_suffix = args.find((arg) => /^\d+\.\d+$/.test(arg));
let specific_ip = null;
if (ip_suffix) {
  specific_ip = `139.91.${ip_suffix}`;
}

if (headful) {
  console.log("\x1b[36m[INFO]\x1b[0m Running in headful mode...");
} else {
  console.log("\x1b[36m[INFO]\x1b[0m Running in headless mode...");
}

crawl({ headless: !headful, specific_ip });
