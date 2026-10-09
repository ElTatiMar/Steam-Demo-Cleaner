async function removeNextPackage(appIds, i) {
    if (!appIds || appIds.length === 0) {
        console.log("No AppIds provided to remove.");
        return;
    }

    if (i >= appIds.length) {
        console.log("Removed all AppIds from account.");
        return;
    }

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
            // Still increment on failure so it doesn't get stuck indefinitely
            await removeNextPackage(appIds, i + 1);
            return;
        }

        const data = await response.json();

        // Steam uses 84 for rate limiting
        if (data.success === 84) {
            console.log(`Rate limited on ${appIds[i]}. Waiting 10 minutes before retrying...`);
            await new Promise(resolve => setTimeout(resolve, 600000));
            await removeNextPackage(appIds, i); // Retry same index
        }
        else if (data.success === 1 || data.success === true) {
            console.log(`Removed: ${appIds[i]} (${i + 1}/${appIds.length})`);
            // Add a small delay between requests to be gentle on Steam's API
            await new Promise(resolve => setTimeout(resolve, 1000));
            await removeNextPackage(appIds, i + 1);
        }
        else {
            console.log(`Failed to remove ${appIds[i]}: Unknown error (success = ${data.success})`);
            await removeNextPackage(appIds, i + 1);
        }
    } catch (e) {
        console.error(`Exception during removal of ${appIds[i]}:`, e);
        // Add a 5 second delay before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
        await removeNextPackage(appIds, i);
    }
}

removeNextPackage(appIds, 0);