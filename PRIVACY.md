# Currio Privacy Policy

_Last updated: 1 October 2026_

Currio converts currency amounts that **you** select on a webpage. It is designed to work with as little data as possible.

## What Currio does not do

- It does not collect, store or transmit your browsing history.
- It does not send webpage content, selected text, URLs or page titles to any server.
- It does not track your behaviour, use analytics or include advertising.
- It does not scan pages in the background. Text is read only when you select it, use the right-click menu, or press the shortcut.

## What happens when you select text

1. The content script reads the selected text **locally** and parses it (e.g. `AED 850` → amount `850`, currency `AED`).
2. Only the parsed number and currency code are passed to Currio's own background service worker, inside your browser.
3. Conversion uses exchange rates already cached on your device.

The selected text is never stored or sent anywhere.

## Network requests

Currio makes one kind of request: downloading public exchange rates from the provider (by default `https://open.er-api.com/v6/latest/USD`). That request contains no amounts, page content or identifiers, only the base currency code. Requests are sent without cookies or a referrer. The provider can see your IP address, as with any web request.

## Data stored on your device

| Where | What | Why |
| --- | --- | --- |
| `chrome.storage.sync` | Your settings (preferred currency, refresh interval, toggles) | Keeps settings in sync across your Chrome profiles |
| `chrome.storage.local` | The latest exchange-rate snapshot and its timestamp | Instant and offline conversions |
| `chrome.storage.local` | Your most recent conversion (amount, currencies, result, time) | Shown in the popup; contains no page text or URL |

Removing the extension deletes all of this data.

## Permissions

| Permission | Why it's needed |
| --- | --- |
| Content script on `http://*/*`, `https://*/*` | Detect your selections on any site you visit |
| `storage` | Save settings and cached rates |
| `contextMenus` | The "Convert with Currio" right-click item |
| `scripting`, `activeTab` | Start Currio in tabs that were already open before it was installed, when you use the menu or shortcut |
| `alarms` | Refresh cached rates on your chosen schedule |

## Contact

Questions? Open an issue in the project repository.
