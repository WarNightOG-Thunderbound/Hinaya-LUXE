/**
 * HinayaLUXE PWA install handler (Chrome / Chromium only).
 * Captures beforeinstallprompt and triggers it from footer CTA buttons.
 */
(function () {
    'use strict';

    var INSTALL_UNAVAILABLE_MSG =
        'Install not available on this device, please use Chrome on Android.';

    var deferredPrompt = null;
    var installButton = null;

    function isSupportedBrowser() {
        if (!window.isSecureContext) return false;
        if (!('serviceWorker' in navigator)) return false;

        var ua = navigator.userAgent;
        var isChromium =
            /Chrome\//.test(ua) &&
            !/Firefox\//i.test(ua) &&
            !/OPR\//.test(ua) &&
            !/Opera\//i.test(ua) &&
            !/SamsungBrowser\//i.test(ua) &&
            !/UCBrowser\//i.test(ua);

        var isEdgeChromium = /Edg\//.test(ua);

        return isChromium || isEdgeChromium;
    }

    function isStandalone() {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            window.navigator.standalone === true
        );
    }

    function notify(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type || 'info');
            return;
        }

        var container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pwaInstallToastContainer';
            container.setAttribute(
                'style',
                'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:10000;display:flex;flex-direction:column;gap:8px;max-width:90vw;'
            );
            document.body.appendChild(container);
        }

        var toast = document.createElement('div');
        toast.setAttribute(
            'style',
            'background:' +
                (type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#0f172a') +
                ';color:#fff;padding:12px 18px;border-radius:10px;font-size:0.9rem;box-shadow:0 8px 24px rgba(0,0,0,0.2);'
        );
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(function () {
            toast.remove();
        }, 4000);
    }

    function updateButton() {
        if (!installButton) return;

        var canShow =
            isSupportedBrowser() &&
            !isStandalone();

        installButton.hidden = !canShow;
        installButton.disabled = !canShow;
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {
            /* SW may only exist on production; install still needs manifest + SW when deployed */
        });
    }

    async function onInstallClick() {
        if (!isSupportedBrowser()) {
            notify(INSTALL_UNAVAILABLE_MSG, 'error');
            return;
        }

        if (isStandalone()) {
            notify('App is already installed.', 'info');
            return;
        }

        if (!deferredPrompt) {
            notify(INSTALL_UNAVAILABLE_MSG, 'error');
            return;
        }

        deferredPrompt.prompt();

        try {
            var choice = await deferredPrompt.userChoice;
            deferredPrompt = null;
            updateButton();

            if (choice && choice.outcome === 'accepted') {
                notify('Installing app…', 'success');
            }
        } catch (err) {
            deferredPrompt = null;
            updateButton();
            notify(INSTALL_UNAVAILABLE_MSG, 'error');
        }
    }

    function init() {
        installButton = document.getElementById('pwaInstallBtn');
        if (!installButton) return;

        registerServiceWorker();
        updateButton();

        if (!isSupportedBrowser()) {
            return;
        }

        installButton.addEventListener('click', onInstallClick);

        window.addEventListener('beforeinstallprompt', function (e) {
            e.preventDefault();
            deferredPrompt = e;
            updateButton();
        });

        window.addEventListener('appinstalled', function () {
            deferredPrompt = null;
            updateButton();
            notify('App installed successfully!', 'success');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
