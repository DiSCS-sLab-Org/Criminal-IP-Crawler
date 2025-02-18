//async function extract_hover_info(page, selector) {
//  // Wait for the target element to be visible.
//  await page.waitForSelector(selector, { visible: true });
//
//  // Dispatch a mouseover event on that element to trigger the hover popup.
//  await page.evaluate((sel) => {
//    const el = document.querySelector(sel);
//    if (el) {
//      const event = new MouseEvent("mouseover", {
//        bubbles: true,
//        cancelable: true,
//      });
//      el.dispatchEvent(event);
//    }
//  }, selector);
//
//  // Wait briefly for the portal content to load.
//  await new Promise((resolve) => setTimeout(resolve, 500));
//
//  // Extract the inner HTML of the portal.
//  const portal_html = await page.evaluate(() => {
//    const portal = document.getElementById("portal");
//    return portal ? portal.innerHTML : null;
//  });
//
//  // Parse the portal HTML and extract certificate info.
//  const certificates = await page.evaluate((html) => {
//    if (!html) return [];
//    const parser = new DOMParser();
//    const doc = parser.parseFromString(html, "text/html");
//
//    // Select all certificate blocks.
//    const certWraps = Array.from(
//      doc.querySelectorAll(
//        ".SSLCertificateData__CertificateWrap-sc-9bcb3d1f-2",
//      ),
//    );
//
//    // Select all hover items that should contain additional info.
//    const hoverItems = Array.from(
//      doc.querySelectorAll(".HoverLinkStyle__LinkHoverItemWrap-sc-77f7c479-5"),
//    );
//
//    // Map over certificate blocks. We assume they appear in order and, if available,
//    // pair each certificate block with the corresponding hover item.
//    return certWraps.map((cert, index) => {
//      // Extract SSL status and count from the certificate block.
//      const ssl_status_elem = cert.querySelector(".ssl_status");
//      const ssl_count_elem = cert.querySelector(".ssl_count");
//      const ssl_status = ssl_status_elem
//        ? ssl_status_elem.textContent.trim()
//        : null;
//      const ssl_count = ssl_count_elem
//        ? ssl_count_elem.textContent.trim()
//        : null;
//
//      // Try to get port and common name from the corresponding hover item.
//      let port = null;
//      let common_name = null;
//      if (hoverItems[index]) {
//        const port_elem = hoverItems[index].querySelector("em.port");
//        const common_name_elem = hoverItems[index].querySelector(
//          "span.sdn_common_name",
//        );
//        port = port_elem ? port_elem.textContent.trim() : null;
//        common_name = common_name_elem
//          ? common_name_elem.textContent.trim()
//          : null;
//      }
//
//      return { ssl_status, ssl_count, port, common_name };
//    });
//  }, portal_html);
//
//  return certificates;
//}
//
//
// Extract SSL certificate info
async function extract_ssl_certificates_info(page) {
  return await page.evaluate(() => {
    const container = document.querySelector(
      'div[class^="SSLCertificateData__SslCertificateDataArea"]',
    );
    if (!container) return [];
    const cert_wraps = container.querySelectorAll(
      'div[class^="SSLCertificateData__CertificateWrap"]',
    );
    const certificate_counts = {};

    cert_wraps.forEach((cert) => {
      const status_elem = cert.querySelector('span[class^="ssl_status"]');
      const count_elem = cert.querySelector('span[class^="ssl_count"]');
      if (status_elem && count_elem) {
        const status = status_elem.textContent.trim();
        const count = parseInt(count_elem.textContent.trim(), 10) || 0;
        if (Object.prototype.hasOwnProperty.call(certificate_counts, status)) {
          certificate_counts[status] += count;
        } else {
          certificate_counts[status] = count;
        }
      }
    });

    return Object.entries(certificate_counts).map(
      ([ssl_status, ssl_count]) => ({
        ssl_status,
        ssl_count,
      }),
    );
  });
}

// Extract connection info
async function extract_connection_info(page) {
  const connection_data = await page.evaluate(() => {
    const key_map = {
      "Representative Domain": "representative_domain",
      "IP Address Owner": "ip_address_owner",
      Hostname: "hostname",
      "Connected Domains": "connected_domains",
      Country: "country",
    };

    const default_data = {
      representative_domain: null,
      ssl_certificate: null,
      ip_address_owner: null,
      hostname: null,
      connected_domains: null,
      country: null,
    };

    const connection_card = Array.from(
      document.querySelectorAll('div[class^="summaryStyle__SumListCardWrap"]'),
    ).find((card) => {
      const title_elem = card.querySelector(
        'div[class^="summaryStyle__SumListCardTitle"]',
      );
      return title_elem && title_elem.textContent.trim() === "Connection";
    });

    if (!connection_card) return default_data;

    const list_items = connection_card.querySelectorAll(
      'ul[class^="useCard__CardWrap"] li',
    );
    const data = { ...default_data };

    list_items.forEach((li) => {
      const name_elem = li.querySelector('[class^="useCard__Name"]');
      const value_elem = li.querySelector('[class^="useCard__Value"]');
      if (!name_elem || !value_elem) return;
      const label = name_elem.textContent.trim();
      if (label === "SSL Certificate") {
        data.ssl_certificate = null;
      } else {
        const key = key_map[label];
        if (!key) return;
        let value_text = value_elem.textContent.trim();
        data[key] = value_text.toUpperCase() === "N/A" ? null : value_text;
      }
    });
    return data;
  });

  const ssl_certificates_data = await extract_ssl_certificates_info(page);
  connection_data.ssl_certificate = ssl_certificates_data;
  return connection_data;
}

export { extract_connection_info };
