SAME TAB LINKS
==============

A Chrome extension that forces links on the websites YOU choose to open
in the same tab. Middle-click and Ctrl/Cmd+click are preserved.

WHAT'S IN THIS FOLDER
---------------------
manifest.json, background.js, content.js, injected.js,
popup.html / popup.css / popup.js, utils/, icon16.png, icon48.png, icon128.png
    -> The extension itself.

PRIVACY_POLICY.md
    -> Privacy policy. Must be hosted at a public URL before submitting.

STORE_LISTING.md
    -> Copy/paste fields for the Chrome Web Store dashboard
       (description, single purpose, permission justifications, etc.).

SUBMISSION_GUIDE.md
    -> Step-by-step walkthrough: zip the build, host the privacy
       policy, create the listing, submit for review.

LOCAL TESTING
-------------
1. chrome://extensions/
2. Developer mode ON (top right)
3. Load unpacked -> select this folder
4. Click the extension icon, paste a URL, choose a scope, Add Site
5. Visit that site -> "open in new tab" links now open in the same tab.
   Middle-click and Ctrl/Cmd+click still open a new tab.

PUBLISHING
----------
See SUBMISSION_GUIDE.md.
