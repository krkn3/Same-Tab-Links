/**
 * SameTab Extension - Injected into page (MAIN) world.
 * Overrides window.open so page scripts (React, etc.) open in same tab.
 */
(function() {
  'use strict';
  
  var orig = window.open;
  if (!orig) return;
  
  var isMiddleClick = false;
  
  document.addEventListener('mousedown', function(e) {
    isMiddleClick = (e.button === 1);
  }, true);
  
  document.addEventListener('mouseup', function(e) {
    if (e.button === 1) {
      setTimeout(function() { isMiddleClick = false; }, 100);
    }
  }, true);
  
  window.open = function(url, target, features) {
    if (isMiddleClick) {
      return orig.call(window, url, target, features);
    }
    
    var t = (target == null ? '_self' : target).toString().toLowerCase();
    
    if (t === '_blank' || t === 'blank' || t === '_new') {
      try {
        document.dispatchEvent(new CustomEvent('sametab-windowopen-blocked', { 
          detail: { url: url, target: target } 
        }));
      } catch (e) {}
      
      try {
        if (url && typeof url === 'string' && url.length > 0) {
          // Use anchor navigation so browser history (back/forward) works correctly
          var a = document.createElement('a');
          a.href = url;
          a.setAttribute('data-sametab-nav', '1');
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      } catch (e) {}
      return null;
    }
    
    return orig.call(window, url, t || '_self', features);
  };
})();
