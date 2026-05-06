/**
 * Same Tab Links - popup UI.
 */

const DEFAULTS = {
  enabled: true,
  enabledSites: ['*://*.genspark.ai/*']
};

async function getSettings() {
  const data = await chrome.storage.sync.get(['enabled', 'enabledSites']);
  return { ...DEFAULTS, ...data };
}

async function setSettings(updates) {
  await chrome.storage.sync.set(updates);
}

function parseUrl(input) {
  const value = (input || '').trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : 'https://' + value;
  try {
    const url = new URL(withScheme);
    if (!url.hostname) return null;
    return url;
  } catch (e) {
    return null;
  }
}

function urlToPattern(input, scope) {
  const url = parseUrl(input);
  if (!url) return null;
  switch (scope) {
    case 'exact':
      return url.href;
    case 'subdomain':
      return `*://*.${url.hostname}/*`;
    case 'domain':
    default:
      return `*://${url.hostname}/*`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('statusBadge');
  const mainToggle = document.getElementById('mainToggle');
  const urlInput = document.getElementById('urlInput');
  const scopeSelect = document.getElementById('scopeSelect');
  const patternPreview = document.getElementById('patternPreview');
  const addUrl = document.getElementById('addUrl');
  const siteList = document.getElementById('siteList');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');

  function showPreview(text, isError) {
    patternPreview.textContent = text || '';
    patternPreview.style.color = isError ? '#f87171' : 'rgba(255, 255, 255, 0.6)';
  }

  function updatePreview() {
    const value = urlInput.value.trim();
    if (!value) {
      showPreview('', false);
      return;
    }
    const pattern = urlToPattern(value, scopeSelect.value);
    if (pattern) showPreview('Will add: ' + pattern, false);
    else showPreview('Invalid URL', true);
  }

  urlInput.addEventListener('input', updatePreview);
  scopeSelect.addEventListener('change', updatePreview);

  async function refreshUI() {
    const settings = await getSettings();
    mainToggle.checked = settings.enabled;
    statusBadge.textContent = settings.enabled ? 'Active' : 'Inactive';
    statusBadge.className = 'status-badge ' + (settings.enabled ? 'active' : 'inactive');

    const sites = settings.enabledSites || [];
    siteList.innerHTML = '';
    if (!sites.length) {
      siteList.innerHTML = '<div class="empty">No websites added</div>';
      return;
    }
    const fragment = document.createDocumentFragment();
    sites.forEach((site) => {
      const item = document.createElement('div');
      item.className = 'site-item';
      const text = document.createElement('span');
      text.className = 'site-text';
      text.textContent = site;
      const btn = document.createElement('button');
      btn.className = 'btn-icon';
      btn.textContent = '×';
      btn.title = 'Remove';
      btn.addEventListener('click', async () => {
        const current = await getSettings();
        const list = (current.enabledSites || []).filter((p) => p !== site);
        await setSettings({ enabledSites: list });
        refreshUI();
      });
      item.appendChild(text);
      item.appendChild(btn);
      fragment.appendChild(item);
    });
    siteList.appendChild(fragment);
  }

  mainToggle.addEventListener('change', async () => {
    await setSettings({ enabled: mainToggle.checked });
    refreshUI();
  });

  addUrl.addEventListener('click', async () => {
    const value = urlInput.value.trim();
    if (!value) {
      showPreview('Please enter a URL', true);
      return;
    }
    const pattern = urlToPattern(value, scopeSelect.value);
    if (!pattern) {
      showPreview('Invalid URL', true);
      return;
    }
    const settings = await getSettings();
    const existing = settings.enabledSites || [];
    if (existing.includes(pattern)) {
      showPreview('Already added', true);
      return;
    }
    await setSettings({ enabledSites: [...existing, pattern] });
    urlInput.value = '';
    showPreview('', false);
    refreshUI();
  });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addUrl.click();
    }
  });

  exportBtn.addEventListener('click', async () => {
    const settings = await getSettings();
    const json = JSON.stringify(settings.enabledSites || [], null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'same-tab-sites.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const sites = JSON.parse(await file.text());
        if (!Array.isArray(sites) || !sites.every((s) => typeof s === 'string')) {
          throw new Error('Expected an array of patterns');
        }
        await setSettings({ enabledSites: sites });
        refreshUI();
      } catch (err) {
        showPreview('Import failed: ' + err.message, true);
      }
    });
    input.click();
  });

  refreshUI();
});
