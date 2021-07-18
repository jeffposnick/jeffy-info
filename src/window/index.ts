async function addUncachedClass() {
  const cache = await caches.open('static');
  const keys = await cache.keys();
  const cachedPaths = new Set(keys.map((request) => {
    const url = new URL(request.url);
    return url.pathname;
  }));

  const els = document.querySelectorAll('[data-json-file]');
  for (const el of els) {
    if (!cachedPaths.has((el as HTMLElement).dataset.jsonFile)) {
      el.classList.add('uncached');
    }
  }
}

function removeUncachedClass() {
  const els = document.querySelectorAll('.uncached');
  for (const el of els) {
    el.classList.remove('uncached');
  }
}

export function setupOfflineListeners() {
  window.addEventListener('online',  () => {
    removeUncachedClass();
  });
  
  window.addEventListener('offline', () => {
    addUncachedClass();
  });

  if (navigator.onLine) {
    removeUncachedClass();
  } else {
    addUncachedClass();
  }
}
