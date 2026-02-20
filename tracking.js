/**
 * Nasiiba Coaching — Comprehensive Tracking System
 * Logs visits, clicks, and geo-data to Supabase to ensure everything is saved.
 */

(function () {
    'use strict';

    const db = window.supabaseClient;

    // Helper to log data to Supabase
    async function logToSupabase(tableName, data) {
        if (!db) return;
        try {
            const { error } = await db.from(tableName).insert([{
                ...data,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                page_url: window.location.href,
                referrer: document.referrer
            }]);
            if (error) console.error(`[Tracking] Error logging to ${tableName}:`, error);
        } catch (e) {
            console.error(`[Tracking] Critical error logging to ${tableName}:`, e);
        }
    }

    // 1. Log Page Visit
    async function logVisit() {
        const geoData = window.GeoPricing ? {
            country: window.GeoPricing.getCountry(),
            region: window.GeoPricing.getRegion()
        } : {};

        await logToSupabase('page_views', {
            path: window.location.pathname,
            search_params: window.location.search,
            ...geoData
        });
    }

    // 2. Log Interaction (Clicks)
    async function logInteraction(type, elementId, metadata = {}) {
        await logToSupabase('interactions', {
            interaction_type: type,
            element_id: elementId,
            metadata: JSON.stringify(metadata)
        });
    }

    // 3. Setup Listeners for key buttons
    function setupInteractionListeners() {
        // Consultation Buttons
        document.querySelectorAll('a[href*="calendar.app.google"]').forEach(btn => {
            btn.addEventListener('click', () => {
                logInteraction('click_consultation', btn.id || 'consultation_btn', {
                    section: btn.closest('section')?.id || 'header'
                });
            });
        });

        // Enroll Buttons
        document.querySelectorAll('a.btn--navy, [data-i18n="enroll"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.course-card');
                const courseId = card ? card.getAttribute('data-course-id') : 'unknown';
                logInteraction('click_enroll', btn.id || 'enroll_btn', {
                    course_id: courseId
                });
            });
        });

        // Whatsapp Float
        const whatsapp = document.querySelector('.whatsapp-float');
        if (whatsapp) {
            whatsapp.addEventListener('click', () => {
                logInteraction('click_whatsapp', 'whatsapp_float');
            });
        }
    }

    // Initialize tracking
    function init() {
        // Delay slightly to ensure geo-pricing has run
        setTimeout(() => {
            logVisit();
            setupInteractionListeners();
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Global access for manual logging
    window.AppTracking = {
        logInteraction: logInteraction
    };

})();
