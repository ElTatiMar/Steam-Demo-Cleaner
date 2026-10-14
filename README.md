# Steam Demo Cleaner

A JavaScript console script to automatically scan for and remove unwanted free licenses (such as demos, trailers, and teasers) from your Steam account.

## Features

- **Automated Scanning**: Automatically pages through your entire Steam licenses history to find target packages.
- **Keyword Filtering**: Targets common unwanted free license types like "demo", "trailer", "teaser", "pegi", and "esrb".
- **All-in-One Execution**: The new `steam-demo-cleaner.js` script handles both finding and removing licenses seamlessly in one run.
- **Smart Rate-Limit Handling**: Automatically pauses for 10 minutes when Steam's API rate limits (Code 84) are hit and resumes without user intervention.
- **Gentle on API**: Built-in delays between actions to prevent aggressive throttling.
- **Resilient**: Captures network exceptions and automatically retries failed removals.

## How to Use

To use these scripts, you will need to run them in your web browser's Developer Tools Console while logged into your Steam account.

### Step 1: Navigate to your Steam Licenses Page

1. Log in to your Steam account in your web browser.
2. Navigate to the Steam licenses page: [https://store.steampowered.com/account/licenses/](https://store.steampowered.com/account/licenses/)
3. Open your browser's Developer Tools:
   - **Chrome / Edge:** Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Opt+I` (Mac).
   - **Firefox:** Press `F12` or `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Opt+K` (Mac).
4. Select the **Console** tab.

### Step 2: Find and Remove Unwanted Licenses (`steam-demo-cleaner.js`)

1. Open the `steam-demo-cleaner.js` file and copy all of its contents.
2. Paste the code into the Console and press Enter (or click the run button).
3. The script will automatically page through your license history and find items that contain keywords like "demo", "trailer", "teaser", etc.
4. Once it finishes scanning, it will automatically begin removing the identified items one by one.
5. **Note:** Steam has rate limits for removing licenses. The script handles this automatically; if it hits a rate limit, it will pause for 10 minutes before continuing. Be patient and leave the tab open until it finishes logging `Removed all specified AppIds from account.`

## Credits

These are updated scripts based on [Remove All Demos From Account](https://steamcommunity.com/sharedfiles/filedetails/?id=2933330310) by Jazzverso.

## Disclaimer

Please use these scripts at your own risk. They will permanently remove the identified free licenses from your account.
