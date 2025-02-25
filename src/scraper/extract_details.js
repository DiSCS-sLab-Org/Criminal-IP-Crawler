// Extract text info bellow IP scoring
async function extract_top_detail_info(page) {
  return await page.evaluate(() => {
    const container = document.querySelector(
      'div[class^="TopDetail__TopDetailWrap"]',
    );
    let malicious = "";
    let critical_vulnerabilities = null;

    if (container) {
      const detailElements = container.querySelectorAll(
        'div[class^="TopDetail__DetailText"]',
      );

      malicious = detailElements[0].textContent.trim();
      if (detailElements.length > 2) {
        critical_vulnerabilities = detailElements[2].textContent.trim();
      }
    }
    return { malicious, critical_vulnerabilities };
  });
}

export { extract_top_detail_info };
