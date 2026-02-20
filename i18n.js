/**
 * Nasiiba Coaching — i18n Translation Engine
 * Handles language switching, RTL support, and persistent language preference.
 * Uses data-i18n attributes on HTML elements for translation.
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'nasiiba_language';
    const DEFAULT_LANG = 'en';

    // Get saved language or detect from browser
    function getPreferredLang() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && window.TRANSLATIONS[saved]) return saved;

        // Try browser language
        const browserLang = navigator.language.split('-')[0];
        if (window.TRANSLATIONS[browserLang]) return browserLang;

        return DEFAULT_LANG;
    }

    // Apply translations to all elements with data-i18n attributes
    function applyTranslations(lang) {
        const t = window.TRANSLATIONS[lang];
        if (!t) return;

        // Translate text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                el.textContent = t[key];
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (t[key]) {
                el.placeholder = t[key];
            }
        });

        // Translate aria-labels
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            if (t[key]) {
                el.setAttribute('aria-label', t[key]);
            }
        });

        // Handle RTL/LTR direction
        document.documentElement.setAttribute('dir', t._dir || 'ltr');
        document.documentElement.setAttribute('lang', t._code || lang);

        // Toggle RTL class on body
        if (t._dir === 'rtl') {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }

        // Update language switcher display
        const currentLangEl = document.getElementById('current-lang');
        if (currentLangEl) {
            currentLangEl.textContent = t._flag + ' ' + t._name;
        }

        // Mark active language in dropdown
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === lang);
        });

        // Save preference
        localStorage.setItem(STORAGE_KEY, lang);

        // Dispatch event for other modules (geo-pricing uses this)
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    // Build language switcher dropdown
    function createLanguageSwitcher() {
        // Find all switcher containers (header on each page)
        document.querySelectorAll('.lang-switcher').forEach(container => {
            const currentLang = getPreferredLang();
            const t = window.TRANSLATIONS[currentLang];

            container.innerHTML = `
                <button class="lang-switcher__btn" id="lang-toggle" aria-label="Change language">
                    <span id="current-lang">${t._flag} ${t._name}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="lang-switcher__dropdown" id="lang-dropdown">
                    ${Object.keys(window.TRANSLATIONS).map(code => {
                const lang = window.TRANSLATIONS[code];
                return `<button class="lang-option ${code === currentLang ? 'active' : ''}" data-lang="${code}">
                            <span class="lang-option__flag">${lang._flag}</span>
                            <span class="lang-option__name">${lang._name}</span>
                        </button>`;
            }).join('')}
                </div>
            `;
        });

        // Toggle dropdown
        document.addEventListener('click', (e) => {
            const toggle = e.target.closest('#lang-toggle, .lang-switcher__btn');
            const dropdown = document.getElementById('lang-dropdown');

            if (toggle) {
                e.stopPropagation();
                dropdown.classList.toggle('open');
                return;
            }

            const option = e.target.closest('.lang-option');
            if (option) {
                const lang = option.dataset.lang;
                applyTranslations(lang);
                // Re-trigger geo pricing
                if (window.GeoPricing) {
                    window.GeoPricing.refresh();
                }
                dropdown.classList.remove('open');
                return;
            }

            // Close on outside click
            if (dropdown) dropdown.classList.remove('open');
        });
    }

    // Init on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.TRANSLATIONS) return;
        createLanguageSwitcher();
        applyTranslations(getPreferredLang());
    });

    // Export for other modules
    window.I18n = {
        setLang: applyTranslations,
        getLang: getPreferredLang,
        t: function (key) {
            const lang = getPreferredLang();
            const t = window.TRANSLATIONS[lang];
            return (t && t[key]) || key;
        }
    };
})();
