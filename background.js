/**
 * Same Tab Links - background service worker.
 * Seeds defaults the first time the extension runs against empty storage.
 */

const DEFAULT_SITES = ['*://*.genspark.ai/*'];

function seedIfNeeded() {
  chrome.storage.sync.get(['_seeded', 'enabled', 'enabledSites'], (result) => {
    if (result._seeded) return;

    const updates = { _seeded: true };
    if (typeof result.enabled !== 'boolean') updates.enabled = true;
    if (!Array.isArray(result.enabledSites) || result.enabledSites.length === 0) {
      updates.enabledSites = DEFAULT_SITES.slice();
    }
    chrome.storage.sync.set(updates);
  });
}

chrome.runtime.onInstalled.addListener(seedIfNeeded);
chrome.runtime.onStartup.addListener(seedIfNeeded);
