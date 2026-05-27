/**
 * Register the HinayaLUXE service worker on store pages (required for PWA install).
 */
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function (err) {
      console.warn('HinayaLUXE service worker registration failed:', err);
    });
  });
})();
