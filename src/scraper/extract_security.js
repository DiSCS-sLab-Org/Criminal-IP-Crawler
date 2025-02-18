// Extract security info
async function extract_security_info(page) {
  return await page.evaluate(() => {
    const key_map = {
      "Abuse Record": "abuse_record",
      "Open Ports": "open_ports",
      Vulnerabilities: "vulnerabilities",
      "Exploit DB": "exploit_db",
      "Policy Violation": "policy_violation",
      "Remote Address": "remote_address",
      "Network Device": "network_device",
      "Admin Page": "admin_page",
      "Invalid SSL": "invalid_ssl",
    };

    const default_security_data = {
      abuse_record: null,
      open_ports: null,
      vulnerabilities: null,
      exploit_db: null,
      policy_violation: null,
      remote_address: null,
      network_device: null,
      admin_page: null,
      invalid_ssl: null,
    };

    const security_card = Array.from(
      document.querySelectorAll('div[class^="IpSumList__SumListBottom"]'),
    ).find((card) => {
      const title_elem = card.querySelector(
        'div[class^="summaryStyle__SumListCardTitle"]',
      );
      return title_elem && title_elem.textContent.trim() === "Security";
    });

    if (!security_card) return default_security_data;

    const list_items = security_card.querySelectorAll(
      'ul[class^="useCard__CardWrap"] li',
    );
    const security_data = { ...default_security_data };

    list_items.forEach((li) => {
      const name_elem = li.querySelector('[class^="useCard__Name"]');
      const value_elem = li.querySelector('[class^="useCard__Value"]');
      if (!name_elem || !value_elem) return;
      const label = name_elem.textContent.trim();
      const key = key_map[label];
      if (!key) return;
      const value_text = value_elem.textContent.trim();
      let parsed_value;
      if (value_text.toUpperCase() === "N/A") {
        parsed_value = null;
      } else if (value_text.toLowerCase() === "true") {
        parsed_value = true;
      } else if (value_text.toLowerCase() === "false") {
        parsed_value = false;
      } else {
        if (
          key === "open_ports" &&
          !isNaN(value_text) &&
          Number(value_text) === 0
        ) {
          parsed_value = [];
        } else {
          parsed_value = value_text;
        }
      }
      security_data[key] = parsed_value;
    });
    return security_data;
  });
}

export { extract_security_info };
