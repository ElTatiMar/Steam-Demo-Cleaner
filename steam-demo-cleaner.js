async function populate() {
    var appIds = [];
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
    return appIds;
}

async function removePackages(appIds) {
    if (!appIds || appIds.length === 0) {
        console.log("No AppIds provided to remove.");
        return;
    }

    for (let i = 0; i < appIds.length;) {
        try {
            const response = await fetch("https://store.steampowered.com/account/removelicense", {
                "headers": {
                    "accept": "*/*",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                "body": `sessionid=${encodeURIComponent(window.g_sessionID)}&packageid=${appIds[i]}`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            });

            if (response.status !== 200) {
                console.log(`Error: ${response.status} - ${response.statusText}`);
                i++;
                continue;
            }

            const data = await response.json();

            // Steam uses 84 for rate limiting
            if (data.success === 84) {
                console.log(`Rate limited on ${appIds[i]}. Waiting 10 minutes before retrying...`);
                await new Promise(resolve => setTimeout(resolve, 600000));
                // Retry same index by not incrementing i
            }
            else if (data.success === 1 || data.success === true) {
                console.log(`Removed: ${appIds[i]} (${i + 1}/${appIds.length})`);
                // Add a small delay between requests to be gentle on Steam's API
                await new Promise(resolve => setTimeout(resolve, 1000));
                i++;
            }
            else {
                console.log(`Failed to remove ${appIds[i]}: Unknown error (success = ${data.success})`);
                i++;
            }
        } catch (e) {
            console.error(`Exception during removal of ${appIds[i]}:`, e);
            // Add a 5 second delay before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    console.log("Removed all specified AppIds from account.");
}

(async function main() {
    const ids = await populate();
    if (ids && ids.length > 0) {
        console.log("Starting removal process...");
        await removePackages(ids);
        console.log("All done!");
    } else {
        console.log("Nothing to remove.");
    }
})();
