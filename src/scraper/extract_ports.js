// Extract open port info
async function extract_open_ports(page) {
  const container_selector =
    'div[class^="CurrentOpenPorts__CurrentOpenPortsWrap"]';
  await page.waitForSelector(container_selector, { visible: true });

  // Helper function: extract open port items from the current page within the container.
  const extract_ports_from_page = async () => {
    return await page.evaluate((sel) => {
      const container = document.querySelector(sel);
      if (!container) return [];
      const port_items = Array.from(
        container.querySelectorAll(
          'div[class^="PortsListItem__OpenPortsWrap"]',
        ),
      );
      return port_items.map((item) => {
        let port = null;
        const port_span = item.querySelector(
          'span[class^="HoverLinkStyle__LinkChildrenSpanEl"]',
        );
        if (port_span) port = port_span.textContent.trim();

        let product = null,
          version = null,
          service = null,
          socket = null,
          confirmed_time = null;

        const info_rows = Array.from(
          item.querySelectorAll('div[class^="PortsListItem__InfoRow"]'),
        );
        info_rows.forEach((row) => {
          const name_elem = row.querySelector(
            'p[class^="PortsListItem__InfoName"]',
          );
          const value_elem = row.querySelector(
            'p[class^="PortsListItem__InfoValue"]',
          );
          if (name_elem && value_elem) {
            const name_text = name_elem.textContent.trim().toLowerCase();
            const value_text = value_elem.textContent.trim();
            const clean_value =
              value_text.toUpperCase() === "N/A" ? null : value_text;
            if (name_text === "product") product = clean_value;
            else if (name_text === "version") version = clean_value;
            else if (name_text === "service") service = clean_value;
            else if (name_text === "socket") socket = clean_value;
            else if (name_text === "confirmed time")
              confirmed_time = clean_value;
          }
        });

        let vulnerable = false;
        const vuln_elem = item.querySelector(
          'span[class^="PortsListItem__HoverDesc"]',
        );
        if (
          vuln_elem &&
          vuln_elem.textContent
            .trim()
            .toLowerCase()
            .includes("vulnerability found")
        ) {
          vulnerable = true;
        }

        return {
          port,
          product,
          version,
          service,
          socket,
          confirmed_time,
          vulnerable,
        };
      });
    }, container_selector);
  };

  let ports = await extract_ports_from_page();

  // Check for pagination within the specified container.
  const pagination_exists = await page.$(
    `${container_selector} div[class^="pagination-styled__FlexDivWrap"]`,
  );
  if (pagination_exists) {
    const total_pages = await page.evaluate((sel) => {
      const container = document.querySelector(sel);
      if (!container) return 1;
      const pager_items = Array.from(
        container.querySelectorAll(
          'div[class^="pagination-styled__FlexDivWrap"] button',
        ),
      );
      return pager_items.length;
    }, container_selector);

    for (let i = 2; i <= total_pages; i++) {
      await page.evaluate(
        (i, sel) => {
          const container = document.querySelector(sel);
          if (!container) return;
          const pager_items = Array.from(
            container.querySelectorAll(
              'div[class^="pagination-styled__FlexDivWrap"] button',
            ),
          );
          const btn = pager_items.find(
            (b) =>
              b.getAttribute("title") &&
              b.getAttribute("title").includes(`${i} page`),
          );
          if (btn) {
            btn.click();
          }
        },
        i,
        container_selector,
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));
      const ports_this_page = await extract_ports_from_page();
      ports = ports.concat(ports_this_page);
    }
  }

  return ports;
}

export { extract_open_ports };
