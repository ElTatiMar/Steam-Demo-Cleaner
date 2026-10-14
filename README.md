# Steam Demo Cleaner

A JavaScript console script to automatically scan for and remove unwanted free licenses (such as demos, trailers, and teasers) from your Steam account.

## Features

- **Automated Scanning**: Automatically pages through your entire Steam licenses history to find target packages.
- **Keyword Filtering**: Targets common unwanted free license types like "demo", "trailer", "teaser", "pegi", and "esrb".
- **All-in-One Execution**: The `steam-demo-cleaner.js` script handles both scanning and removal in a single execution.
- **Smart Rate-Limit Handling**: Automatically pauses for 10 minutes when Steam's API rate limits (Code 84) are hit and resumes without user intervention.
- **Session Expiry Recovery**: Detects expired Steam sessions mid-run or pre-run, safely pauses without crashing, and automatically resumes once you re-authenticate in another tab.
- **Dynamic Session Handling**: Reads the updated `sessionid` directly from browser cookies upon re-login, avoiding stale session tokens.
- **Gentle on API**: Built-in delays between actions to prevent aggressive throttling.
- **Resilient**: Captures network exceptions, uses safe JSON parsing to avoid syntax crashes on HTML redirects, and enforces a retry limit (3 attempts) to prevent infinite loops on unrecoverable items.

## How to Use

To use this script, run it in your web browser's Developer Tools Console while on your Steam account licenses page.

### Step 1: Navigate to your Steam Licenses Page

1. Log in to your Steam account in your web browser.
2. Navigate to the Steam licenses page: [https://store.steampowered.com/account/licenses/](https://store.steampowered.com/account/licenses/)
3. Open your browser's Developer Tools:
   - **Chrome / Edge:** Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Opt+I` (Mac).
   - **Firefox:** Press `F12` or `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Opt+K` (Mac).
4. Select the **Console** tab.

### Step 2: Run the Script (`steam-demo-cleaner.js`)

1. Open the [steam-demo-cleaner.js](steam-demo-cleaner.js) file and copy all of its contents.
2. Paste the code into the Console and press Enter (or click run).
3. The script will verify your session, page through your license history, and identify items matching target keywords.
4. Once scanning finishes, it will automatically begin removing the identified items one by one.

### Expected Behavior & Edge Cases

- **Rate Limits (Code 84):** Steam limits how many licenses can be removed in a short period. If this occurs, the script pauses for 10 minutes and resumes automatically.
- **Session Expiration:** If your Steam login session expires during a long cleanup session:
  1. The script will pause safely and display a warning in the console:  
     `[Steam Demo Cleaner] ⚠️ Steam session expired mid-script!`
  2. Open a new tab, navigate to [Steam Login](https://store.steampowered.com/login), and log back in.
  3. The script checks every 10 seconds in the background and will automatically detect your renewed session, refresh the session ID, and resume without losing progress.
- **Failed Removals:** If an item fails due to a network glitch or server error, it will retry up to 3 times before moving on to the next item, preventing infinite loops.

## Credits

Based on [Remove All Demos From Account](https://steamcommunity.com/sharedfiles/filedetails/?id=2933330310) by Jazzverso.

## Disclaimer

Please use this script at your own risk. It will permanently remove the identified free licenses from your account.
