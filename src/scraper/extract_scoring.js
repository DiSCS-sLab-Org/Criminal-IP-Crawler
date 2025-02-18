// Extract scoring info
async function extract_ip_scoring(page) {
  return await page.evaluate(() => {
    function extract_section(label) {
      let risk = "N/A";
      let score = "N/A";
      const section_h3 = Array.from(document.querySelectorAll("h3")).find(
        (el) => el.textContent.includes(label),
      );
      if (section_h3) {
        const strong_elem = section_h3.querySelector("strong");
        risk = strong_elem ? strong_elem.textContent.trim() : "N/A";
        const container = section_h3.parentElement;
        if (container) {
          const svg_text = container.querySelector("svg text");
          if (svg_text) {
            const tspan_elem = svg_text.querySelector("tspan");
            score = tspan_elem ? tspan_elem.textContent.trim() : "N/A";
          }
        }
      }
      return { risk, score };
    }
    return {
      inbound: extract_section("Inbound:"),
      outbound: extract_section("Outbound:"),
    };
  });
}

export { extract_ip_scoring };
