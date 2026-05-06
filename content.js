/**
 * SameTab Extension - Main content script
 * Multi-layer interception: only active when current site is in enabled list.
 * CRITICAL: Middle-click (button 1) must ALWAYS open new tabs!
 */

(function() {
  'use strict';

  const storage = typeof SameTabStorage !== 'undefined' ? SameTabStorage : null;
  const interceptor = typeof SameTabInterceptor !== 'undefined' ? SameTabInterceptor : null;

  let enabled = false;
  let settings = {};

  /**
   * Inject a script into the page (MAIN) world to override window.open.
   */
  function injectWindowOpenOverride() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() { script.remove(); };
    (document.documentElement || document.head).appendChild(script);
  }

  /**
   * Run interception only when site is enabled.
   */
  async function init() {
    try {
      if (!storage) return;
      settings = await storage.getAllSettings();
      enabled = settings.enabled && await storage.isSiteEnabled(settings);
    } catch (e) {
      console.error('[SameTab] Init failed', e);
      return;
    }

    if (!enabled) {
      setupMessageListenerOnly();
      return;
    }

    if (!interceptor) return;

    // Layer 1: Inject window.open override
    try {
      injectWindowOpenOverride();
    } catch (e) {
      console.error('[SameTab] Failed to inject window.open override', e);
      interceptor.recordError();
    }

    // Listen for blocked window.open from injected script
    document.addEventListener('sametab-windowopen-blocked', function(e) {
      if (interceptor) interceptor.recordWindowOpenBlocked();
    }, true);

    // Layer 2: Override setAttribute
    try {
      const origSetAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(name, value) {
        if (this.tagName && this.tagName.toUpperCase() === 'A' && name && name.toLowerCase() === 'target') {
          const v = (value == null ? '' : String(value)).toLowerCase();
          if (v === '_blank' || v === '_new' || v === 'blank') {
            interceptor.removeTarget(this);
            return;
          }
        }
        return origSetAttribute.apply(this, arguments);
      };
    } catch (e) {
      console.error('[SameTab] setAttribute override failed', e);
      interceptor.recordError();
    }

    // Layer 3: Event capture
    document.addEventListener('mousedown', function(e) {
      // CRITICAL: If middle-click, do NOTHING
      if (e.button === 1) {
        return;
      }
      
      const info = interceptor.getLinkInfo(e.target);
      if (!info) return;
      
      interceptor.recordLinkProcessed();
      interceptor.removeTarget(info.el);
    }, true);

    document.addEventListener('auxclick', function(e) {
      // CRITICAL: auxclick with button 1 is middle-click - NEVER intercept
      if (e.button === 1) {
        return;
      }
      
      const info = interceptor.getLinkInfo(e.target);
      if (!info || !interceptor.isNewTabLink(info.el)) return;
      
      interceptor.recordEventIntercepted();
      interceptor.recordLinkProcessed();
      interceptor.removeTarget(info.el);
    }, true);

    document.addEventListener('click', function(e) {
      // CRITICAL: If middle-click, NEVER intercept
      if (e.button === 1 || e.buttons === 4) {
        return;
      }
      
      const info = interceptor.getLinkInfo(e.target);
      if (!info) return;
      
      const target = (info.target || '').toLowerCase();
      
      if (target === '_blank' || target === '_new' || target === 'blank') {
        interceptor.recordEventIntercepted();
        interceptor.recordLinkProcessed();
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (interceptor.isNavigableHref(info.href)) {
          try {
            // Use anchor navigation so browser history (back/forward) works correctly
            const a = document.createElement('a');
            a.href = info.href;
            a.setAttribute('data-sametab-nav', '1');
            document.body.appendChild(a);
            a.click();
            a.remove();
          } catch (err) {
            console.error('[SameTab] Navigation failed', err);
            interceptor.recordError();
          }
        }
        return false;
      }
    }, true);

    // Native Chrome swipe-back/forward: re-enable by forcing overscroll-behavior-x so the
    // browser handles the gesture (with native animation) instead of the page blocking it.
    (function() {
      const style = document.createElement('style');
      style.id = 'sametab-overscroll';
      style.textContent = 'html, body { overscroll-behavior-x: auto !important; }';
      const root = document.documentElement || document.head;
      if (root) {
        root.appendChild(style);
      } else {
        document.addEventListener('DOMContentLoaded', function() {
          (document.documentElement || document.head).appendChild(style);
        });
      }
    })();

    // Layer 4: MutationObserver (debounced)
    function scanAndFixLinks() {
      if (!document.body) return;
      try {
        const links = document.querySelectorAll('a[target="_blank"], a[target="_new"], a[target="blank"]');
        for (let i = 0; i < links.length; i++) {
          interceptor.recordLinkProcessed();
          interceptor.removeTarget(links[i]);
        }
      } catch (e) {
        console.error('[SameTab] Scan failed', e);
      }
    }

    let scanTimer = 0;
    function debouncedScan() {
      if (scanTimer) clearTimeout(scanTimer);
      scanTimer = setTimeout(function() {
        scanTimer = 0;
        scanAndFixLinks();
      }, 80);
    }

    const observer = new MutationObserver(debouncedScan);
    const obsConfig = { childList: true, subtree: true, attributes: true, attributeFilter: ['target', 'href'] };

    if (document.body) {
      observer.observe(document.body, obsConfig);
      scanAndFixLinks();
    } else {
      const bodyObs = new MutationObserver(function() {
        if (document.body) {
          observer.observe(document.body, obsConfig);
          scanAndFixLinks();
          bodyObs.disconnect();
        }
      });
      bodyObs.observe(document.documentElement, { childList: true });
    }

    // Layer 5: Backup scan (less frequent; debounced observer does the heavy lifting)
    const intervalMs = Math.max(1500, (settings.scanIntervalMs || 300) * 4);
    setInterval(scanAndFixLinks, intervalMs);

    setupMessageListenerOnly();
  }

  function setupMessageListenerOnly() {
    chrome.runtime.onMessage.addListener(function(msg, _sender, sendResponse) {
      if (msg === 'getStats' && interceptor) {
        sendResponse(interceptor.getStats());
      } else if (msg === 'getEnabled') {
        sendResponse({ enabled: enabled });
      } else if (msg === 'ping') {
        sendResponse({ ok: true });
      } else {
        sendResponse(null);
      }
      return true;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
