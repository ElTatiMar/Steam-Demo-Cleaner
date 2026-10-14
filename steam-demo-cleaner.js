function getSessionID() {
    const match = document.cookie.match(/(?:^|;\s*)sessionid=([^;]*)/);
    return (match && match[1]) ? decodeURIComponent(match[1]) : (window.g_sessionID || "");
}

async function checkSessionValid() {
    try {
        const res = await fetch("https://store.steampowered.com/account/licenses/", {
            method: "GET",
            credentials: "include",
            cache: "no-store"
        });
        if (!res.ok) return false;
        if (res.redirected && (res.url.includes("/login") || res.url.includes("login.steampowered.com"))) {
            return false;
        }
        const html = await res.text();
        const isLoginPage = html.includes("id=\"login_btn\"") ||
                            html.includes("login.steampowered.com") ||
                            (html.includes("global_action_link") && !html.includes("account_pulldown"));
        return html.includes("account_table") && !isLoginPage;
    } catch {
        return false;
    }
}

async function waitForSessionRenewal() {
    console.warn("%c[Steam Demo Cleaner] ⚠️ Steam session expired mid-script!", "font-weight: bold; color: #ff9800; font-size: 13px;");
    console.log("%c👉 Please log in to Steam in another tab (https://store.steampowered.com/login).", "font-weight: bold; color: #2196f3;");
    console.log("⏳ The script is paused and checking every 10 seconds. It will resume automatically once you log back in...");

    while (true) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        const isValid = await checkSessionValid();
        if (isValid) {
            const newSessionId = getSessionID();
            if (newSessionId) {
                window.g_sessionID = newSessionId;
            }
            console.log("%c[Steam Demo Cleaner] ✅ Session restored! Resuming cleanup...", "font-weight: bold; color: #4caf50; font-size: 13px;");
            await new Promise(resolve => setTimeout(resolve, 1500));
            return;
        }
    }
}

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
            const response = await fetch(url, { credentials: "include" });

            if (
                (response.redirected && (response.url.includes("/login") || response.url.includes("login.steampowered.com"))) ||
                response.status === 401 ||
                response.status === 403
            ) {
                await waitForSessionRenewal();
                continue;
            }

            if (!response.ok) {
                console.warn(`Error fetching page ${pageNum}: HTTP ${response.status} - ${response.statusText}`);
                break;
            }

            const text = await response.text();
            const doc = new DOMParser().parseFromString(text, 'text/html');
            const table = doc.querySelector(".account_table");

            if (!table) {
                const sessionValid = await checkSessionValid();
                if (!sessionValid) {
                    await waitForSessionRenewal();
                    continue;
                }
                break;
            }

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
            const errorMsg = e && e.message ? e.message : String(e);
            console.warn(`Error fetching page ${pageNum}: ${errorMsg}`);
            const sessionValid = await checkSessionValid();
            if (!sessionValid) {
                await waitForSessionRenewal();
                continue;
            }
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

    let retries = 0;
    const maxRetries = 3;

    for (let i = 0; i < appIds.length;) {
        const currentPackageId = appIds[i];

        try {
            const sessionId = getSessionID();
            const response = await fetch("https://store.steampowered.com/account/removelicense", {
                "headers": {
                    "accept": "*/*",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                "body": `sessionid=${encodeURIComponent(sessionId)}&packageid=${encodeURIComponent(currentPackageId)}`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            });

            const isRedirectedToLogin = response.redirected &&
                (response.url.includes("/login") || response.url.includes("login.steampowered.com"));

            if (isRedirectedToLogin || response.status === 401 || response.status === 403) {
                await waitForSessionRenewal();
                retries = 0;
                continue;
            }

            if (response.status !== 200) {
                console.warn(`HTTP ${response.status} (${response.statusText}) on package ${currentPackageId}`);
                retries++;
                if (retries >= maxRetries) {
                    console.warn(`Skipping package ${currentPackageId} after ${maxRetries} failed attempts.`);
                    retries = 0;
                    i++;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                continue;
            }

            const responseText = await response.text();
            let data = null;

            try {
                data = JSON.parse(responseText);
            } catch {
                // Response was not JSON (e.g. HTML login redirect or server error page)
                const isHtml = responseText.trim().startsWith("<");
                if (isHtml) {
                    const sessionValid = await checkSessionValid();
                    if (!sessionValid) {
                        await waitForSessionRenewal();
                        retries = 0;
                        continue;
                    }
                }

                console.warn(`Non-JSON response received for package ${currentPackageId}.`);
                retries++;
                if (retries >= maxRetries) {
                    console.warn(`Skipping package ${currentPackageId} after ${maxRetries} invalid responses.`);
                    retries = 0;
                    i++;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                continue;
            }

            // Steam uses 84 for rate limiting
            if (data.success === 84) {
                console.log(`Rate limited on package ${currentPackageId}. Waiting 10 minutes before retrying...`);
                await new Promise(resolve => setTimeout(resolve, 600000));
                retries = 0;
                // Retry same index by not incrementing i
            }
            else if (data.success === 1 || data.success === true) {
                console.log(`Removed: ${currentPackageId} (${i + 1}/${appIds.length})`);
                retries = 0;
                i++;
                // Add a small delay between requests to be gentle on Steam's API
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            else {
                if (data.requires_login) {
                    await waitForSessionRenewal();
                    retries = 0;
                    continue;
                }

                console.log(`Failed to remove ${currentPackageId}: Unknown error (success = ${data.success})`);
                retries = 0;
                i++;
            }
        } catch (e) {
            const errorMsg = e && e.message ? e.message : String(e);
            console.warn(`Network exception during removal of ${currentPackageId}: ${errorMsg}`);

            const sessionValid = await checkSessionValid();
            if (!sessionValid) {
                await waitForSessionRenewal();
                retries = 0;
                continue;
            }

            retries++;
            if (retries >= maxRetries) {
                console.warn(`Skipping package ${currentPackageId} after ${maxRetries} network exceptions.`);
                retries = 0;
                i++;
            } else {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    console.log("Finished processing all specified AppIds.");
}

(async function main() {
    const sessionValid = await checkSessionValid();
    if (!sessionValid) {
        await waitForSessionRenewal();
    }

    const ids = await populate();
    if (ids && ids.length > 0) {
        console.log(`Starting removal process for ${ids.length} items...`);
        await removePackages(ids);
        console.log("All done!");
    } else {
        console.log("Nothing to remove.");
    }
})();
