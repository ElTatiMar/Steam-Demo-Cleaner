var appIds = [];

(async function() {
    var nextHref = "";
    var hasMorePages = true;
    var count = 0;
    var pageNum = 1;

    console.log("Scanning licenses pages...");

    while (hasMorePages) {
        console.log(`Fetching page ${pageNum}...`);
        try {
            const url = `https://store.steampowered.com/account/licenses/${nextHref}`;
            const response = await fetch(url);
            if (!response.ok) break;
            
            const text = await response.text();
            const doc = new DOMParser().parseFromString(text, 'text/html');
            const table = doc.querySelector(".account_table");
            
            if (!table) break;
            
            let rows = table.rows;
            
            for (let row of rows) {
                if (row.cells.length < 2) continue;
                var cell = row.cells[1];
                var cellText = cell.textContent || "";
                
                if (/\b(?:trailer|teaser|demo|pegi|esrb)\b/i.test(cellText)) {
                    let packageIdMatch = /RemoveFreeLicense\s*\(\s*(\d+)/.exec(cell.innerHTML);

                    if (packageIdMatch !== null) {
                        let packageId = packageIdMatch[1];
                        if (!appIds.includes(packageId)) {
                            count++;
                            let name = cellText.replace("Remove", "").trim().replace(/[\r\n\t]+/g, " ");
                            console.log(`[${count}] Found: ${packageId} - ${name}`);
                            appIds.push(packageId);
                        }
                    }
                }
            }
            
            const nextLink = doc.querySelector('.license_paginator_next');
            if (!nextLink) {
                hasMorePages = false;
            } else {
                nextHref = nextLink.getAttribute('href');
                pageNum++;
                // Add a small delay to avoid rate limiting
                await new Promise(r => setTimeout(r, 250));
            }
        } catch (e) {
            console.error("Error fetching page:", e);
            hasMorePages = false;
        }
    }

    console.log(`Finished scanning. Found ${appIds.length} items to remove.`);
    console.log(appIds);
    window.appIds = appIds;
})();