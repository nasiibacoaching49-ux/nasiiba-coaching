/**
 * Nasiiba Coaching — Geo-Pricing System
 * Detects user's country via IP and adjusts course prices accordingly.
 * Uses free IP geolocation API (ip-api.com).
 */

(function () {
    'use strict';

    // ===== PRICING CONFIGURATION =====
    // Add new courses here — just add a new key matching the data-course-id
    const PRICING = {
        // Somalia & neighboring Horn of Africa countries — local pricing in USD
        somalia: {
            countries: ['SO', 'DJ', 'ER', 'ET'],
            currency: '$',
            currencyCode: 'USD',
            label: '🇸🇴 Somalia Price',
            courses: {
                'exec-leadership': { price: 29, originalPrice: 49, tagPrice: 15 },
                'business-scaling': { price: 25, originalPrice: 45, tagPrice: 12 },
                'high-performance': { price: 19, originalPrice: 35, tagPrice: 9 }
            }
        },
        // International — standard pricing
        international: {
            countries: [], // fallback for all other countries
            currency: '$',
            currencyCode: 'USD',
            label: 'International Price',
            courses: {
                'exec-leadership': { price: 169, originalPrice: 249, tagPrice: 69 },
                'business-scaling': { price: 159, originalPrice: 229, tagPrice: 59 },
                'high-performance': { price: 129, originalPrice: 199, tagPrice: 29 }
            }
        }
    };

    // ===== STATE =====
    let detectedCountry = null;
    let currentRegion = 'international';

    // ===== DETECT COUNTRY VIA IP =====
    async function detectCountry() {
        try {
            // Try ip-api.com (free, no key needed, allows CORS)
            const response = await fetch('http://ip-api.com/json/?fields=countryCode,country');
            if (response.ok) {
                const data = await response.json();
                detectedCountry = data.countryCode;
                return data.countryCode;
            }
        } catch (e) {
            console.log('Geo detection fallback: using international pricing');
        }

        try {
            // Fallback: ipapi.co
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
                const data = await response.json();
                detectedCountry = data.country_code;
                return data.country_code;
            }
        } catch (e) {
            console.log('All geo detection failed: defaulting to international');
        }

        return null;
    }

    // ===== GET PRICING REGION =====
    function getRegion(countryCode) {
        if (!countryCode) return 'international';

        for (const [regionKey, region] of Object.entries(PRICING)) {
            if (region.countries.includes(countryCode)) {
                return regionKey;
            }
        }
        return 'international';
    }

    // ===== UPDATE PRICES IN DOM =====
    function updatePrices(region) {
        currentRegion = region;
        const pricing = PRICING[region];
        if (!pricing) return;

        // Update each course card with data-course-id
        document.querySelectorAll('[data-course-id]').forEach(card => {
            const courseId = card.getAttribute('data-course-id');
            const coursePricing = pricing.courses[courseId];
            if (!coursePricing) return;

            // Update price tag (badge on image)
            const priceTag = card.querySelector('.course-card__price-tag');
            if (priceTag) {
                priceTag.textContent = pricing.currency + coursePricing.tagPrice;
            }

            // Update main price
            const priceEl = card.querySelector('.course-card__price');
            if (priceEl) {
                priceEl.textContent = pricing.currency + coursePricing.price.toFixed(2);
            }
        });

        // Show geo-pricing badge if Somalia region
        const geoBadge = document.getElementById('geo-price-badge');
        if (geoBadge) {
            if (region === 'somalia') {
                geoBadge.style.display = 'inline-flex';
                geoBadge.textContent = '🇸🇴 Special Somalia pricing applied!';
            } else {
                geoBadge.style.display = 'none';
            }
        }
    }

    // ===== MANUAL REGION OVERRIDE (for testing) =====
    function setRegion(region) {
        if (PRICING[region]) {
            updatePrices(region);
        }
    }

    // ===== INIT =====
    async function init() {
        const country = await detectCountry();
        const region = getRegion(country);
        updatePrices(region);

        console.log(`[GeoPricing] Country: ${country || 'unknown'}, Region: ${region}`);
    }

    // Re-apply prices when language changes (in case DOM was re-rendered)
    window.addEventListener('languageChanged', () => {
        updatePrices(currentRegion);
    });

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for testing/debugging
    window.GeoPricing = {
        setRegion: setRegion,
        getRegion: () => currentRegion,
        getCountry: () => detectedCountry,
        refresh: () => updatePrices(currentRegion),
        PRICING: PRICING
    };
})();
