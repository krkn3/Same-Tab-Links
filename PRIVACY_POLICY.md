# Privacy Policy — Same Tab Links

_Last updated: 2026-05-07_

Same Tab Links is a Chrome extension that forces links on the websites you choose to open in the same tab instead of a new one.

## What we collect

**Nothing.** Same Tab Links does not collect, transmit, sell, or share any personal data, browsing history, or analytics.

## What is stored locally

The extension uses Chrome's built-in `chrome.storage.sync` API to save:

- Whether the extension is enabled (a boolean).
- The list of URL patterns you have manually added on the popup (e.g. `*://example.com/*`).

This data is stored by Chrome and synced across your own signed-in Chrome browsers. It never leaves Google's sync infrastructure and is not visible to the developer.

## Permissions and why we need them

- **`storage`** — to remember your settings between sessions.
- **Host permission `<all_urls>`** — required because the user can add any website to the list. The content script runs at `document_start` on every page, immediately checks whether the current site matches one of your saved patterns, and if it does not match, exits without doing anything else. No content is read, recorded, or transmitted.

## Network activity

Same Tab Links makes **no network requests**. It does not contact any server, including the developer's.

## Cookies, tracking, fingerprinting

None.

## Children

The extension does not knowingly collect any data from anyone, including children.

## Changes to this policy

If this policy is ever updated, the new version will replace this file in the published extension. The "Last updated" date at the top will change.

## Contact

For questions about this policy, email **seyfallah230@gmail.com**.
