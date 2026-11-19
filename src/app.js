(function () {
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    try {
      if (localStorage.getItem('bk_theme') === 'dark') document.documentElement.classList.add('dark');
    } catch (e) {}
    themeBtn.addEventListener('click', () => {
      const dark = document.documentElement.classList.toggle('dark');
      try { localStorage.setItem('bk_theme', dark ? 'dark' : 'light'); } catch (e) {}
    });
  }

  // Search filter without re-rendering input (preserves keyboard focus)
  const searchInput = document.getElementById('airdropSearch');
  const cardsWrap = document.getElementById('airdropCards');
  if (searchInput && cardsWrap) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      cardsWrap.querySelectorAll('[data-search]').forEach((el) => {
        el.style.display = el.getAttribute('data-search').includes(q) ? '' : 'none';
      });
    });
  }

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();
