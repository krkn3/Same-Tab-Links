/**
 * SameTab Extension - Storage utility
 */
const SameTabStorage = (function() {
  'use strict';
  
  const DEFAULTS = {
    enabled: true,
    enabledSites: ['*://*.genspark.ai/*'],
    scanIntervalMs: 300
  };
  
  async function getAllSettings() {
    try {
      const data = await chrome.storage.sync.get(null);
      return { ...DEFAULTS, ...data };
    } catch (e) {
      console.error('[SameTab] Failed to get settings', e);
      return DEFAULTS;
    }
  }
  
  async function setSetting(key, value) {
    try {
      await chrome.storage.sync.set({ [key]: value });
      return true;
    } catch (e) {
      console.error('[SameTab] Failed to set setting', e);
      return false;
    }
  }
  
  function matchesPattern(url, pattern) {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    try {
      const regex = new RegExp('^' + regexPattern + '$');
      return regex.test(url);
    } catch (e) {
      return false;
    }
  }
  
  async function isSiteEnabled(settingsOrNull) {
    try {
      const settings = settingsOrNull || await getAllSettings();
      if (!settings.enabled) return false;
      const sites = settings.enabledSites || [];
      if (!sites.length) return false;
      const currentUrl = location.href;
      return sites.some(pattern => matchesPattern(currentUrl, pattern));
    } catch (e) {
      console.error('[SameTab] Failed to check if site enabled', e);
      return false;
    }
  }
  
  return {
    getAllSettings,
    setSetting,
    matchesPattern,
    isSiteEnabled,
    DEFAULTS
  };
})();
