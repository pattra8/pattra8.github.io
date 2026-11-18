/* Shared resident header. Keep account nodes and page handlers intact. */
(() => {
  const apply = () => {
    // Payment pages render their shell asynchronously in React.
    if (/^\/(myparking|upload-slip)(\/|$)/.test(location.pathname)) {
      const shell = document.querySelector('header');
      if (shell) shell.setAttribute('data-resident-header', '');
    }
    document.querySelectorAll('[data-resident-header]').forEach(header => {
    if (header.dataset.headerReady) return;
    const brand = header.querySelector('a[href="/"], a[href="https://pattra8.com/"]');
    if (!brand) return;
    header.dataset.headerReady = 'true';
    if (header.parentElement.classList.contains('wrap')) {
      header.parentElement.before(header);
    }
    header.classList.add('pattra-resident-header');
    brand.className = 'pattra-resident-brand';
    brand.setAttribute('aria-label', 'Pattra Villa 8 — กลับหน้าแรก');
    brand.innerHTML = '<span class="pattra-resident-wordmark">Pattra Villa 8</span><span class="pattra-resident-subtitle">Resident Services</span>';
  });
  };
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = '/assets/resident-header.css?v=20261118';
  document.head.appendChild(css);
  apply();
  new MutationObserver(apply).observe(document.body, {childList:true, subtree:true});
})();
