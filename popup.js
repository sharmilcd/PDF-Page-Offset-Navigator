document.addEventListener('DOMContentLoaded', () => {
  // --- Element refs ---
  const noOffsetDiv  = document.getElementById('no-offset');
  const hasOffsetDiv = document.getElementById('has-offset');
  const indexInput   = document.getElementById('indexPage');
  const realInput    = document.getElementById('realPage');
  const saveBtn      = document.getElementById('saveOffsetBtn');
  const targetInput  = document.getElementById('targetPage');
  const goBtn        = document.getElementById('goBtn');
  const resetBtn     = document.getElementById('resetBtn');

  let basePdfUrl = null;

  // --- Helpers ---
  function getBaseUrl(rawUrl) {
    try {
      const u = new URL(rawUrl);
      return u.origin + u.pathname;
    } catch (e) {
      return rawUrl.split('#')[0].split('?')[0];
    }
  }

  function updateUI(hasOffset) {
    noOffsetDiv.style.display  = hasOffset ? 'none' : 'block';
    hasOffsetDiv.style.display = hasOffset ? 'block' : 'none';
  }

  function reloadExtension() {
    // Force popup UI refresh
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const url = tabs[0].url;
      basePdfUrl = getBaseUrl(url);
      chrome.storage.local.get([basePdfUrl], res => {
        updateUI(res[basePdfUrl] != null);
      });
    });
  }

  // --- 1) On load, figure out basePdfUrl and whether we have an offset ---
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0] || !tabs[0].url) {
      return alert('No active PDF tab found.');
    }
    basePdfUrl = getBaseUrl(tabs[0].url);
    chrome.storage.local.get([basePdfUrl], res => {
      updateUI(res[basePdfUrl] != null);
    });
  });

  // --- 2) Save offset (first-time setup) ---
  saveBtn.addEventListener('click', () => {
    const idx  = parseInt(indexInput.value, 10);
    const real = parseInt(realInput.value, 10);
    if (isNaN(idx) || isNaN(real)) {
      return alert('Both index and actual page must be numbers.');
    }
    const offset = idx - real;
    chrome.storage.local.set({ [basePdfUrl]: offset }, () => {
      updateUI(true);
      indexInput.value = realInput.value = '';  // clear inputs
    });
  });


goBtn.addEventListener('click', () => {
  const logical = parseInt(targetInput.value, 10);
  if (isNaN(logical)) {
    return alert('Enter a valid page number.');
  }

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const rawUrl = tab.url.split('#')[0].split('?')[0];

    chrome.storage.local.get([rawUrl], res => {
      const offset = res[rawUrl];
      if (offset == null) {
        return alert('Offset missing—please set it first.');
      }

      const target = logical + offset;
      const newUrl = `${rawUrl}#page=${target}`;

      chrome.tabs.update(tab.id, { url: newUrl }, () => {
          setTimeout(() => {
            chrome.tabs.reload(tab.id);
          }, 200);
        });

      targetInput.value = '';
    });
  });
});

  // --- 4) Reset offset and go back to setup view ---
  resetBtn.addEventListener('click', () => {
    chrome.storage.local.remove([basePdfUrl], () => {
      updateUI(false);
      indexInput.value = realInput.value = targetInput.value = '';
    });
  });
});
