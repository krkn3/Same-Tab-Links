/**
 * SameTab Extension - Interceptor utility
 */
const SameTabInterceptor = (function() {
  'use strict';
  
  let stats = {
    linksProcessed: 0,
    linksModified: 0,
    windowOpenBlocked: 0,
    eventsIntercepted: 0,
    errors: 0,
    startTime: Date.now()
  };
  
  function getLinkInfo(target) {
    let el = target;
    let depth = 0;
    
    while (el && depth < 15) {
      if (el.tagName && el.tagName.toUpperCase() === 'A') {
        return {
          el: el,
          href: el.getAttribute('href'),
          target: el.getAttribute('target')
        };
      }
      el = el.parentElement;
      depth++;
    }
    
    return null;
  }
  
  function isNewTabLink(linkElement) {
    if (!linkElement) return false;
    const target = (linkElement.getAttribute('target') || '').toLowerCase();
    return target === '_blank' || target === '_new' || target === 'blank';
  }
  
  function isNavigableHref(href) {
    if (!href) return false;
    const h = href.trim();
    if (h === '' || h === '#') return false;
    if (h.startsWith('javascript:')) return false;
    return true;
  }
  
  function removeTarget(linkElement) {
    if (!linkElement || linkElement.tagName.toUpperCase() !== 'A') return;
    
    const hadTarget = linkElement.hasAttribute('target');
    if (hadTarget) {
      linkElement.removeAttribute('target');
      stats.linksModified++;
    }
  }
  
  function recordLinkProcessed() {
    stats.linksProcessed++;
  }
  
  function recordWindowOpenBlocked() {
    stats.windowOpenBlocked++;
  }
  
  function recordEventIntercepted() {
    stats.eventsIntercepted++;
  }
  
  function recordError() {
    stats.errors++;
  }
  
  function getStats() {
    return {
      ...stats,
      uptime: Date.now() - stats.startTime
    };
  }
  
  return {
    getLinkInfo,
    isNewTabLink,
    isNavigableHref,
    removeTarget,
    recordLinkProcessed,
    recordWindowOpenBlocked,
    recordEventIntercepted,
    recordError,
    getStats
  };
})();
