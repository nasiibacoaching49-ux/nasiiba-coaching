/**
 * Nasiiba Coaching — Affiliate System
 * Handles registration, login, dashboard, referral tracking, and commission management.
 * Uses localStorage for demo — swap with API calls for production.
 */

(function () {
    'use strict';

    // ===== CONFIG =====
    const CONFIG = {
        COMMISSION_RATE: 0.20,
        COOKIE_DAYS: 30,
        SITE_URL: window.location.origin || window.location.href.replace(/\/[^/]*$/, ''),
        STORAGE_KEYS: {
            AFFILIATES: 'nasiiba_affiliates',
            CURRENT_USER: 'nasiiba_current_affiliate',
            REFERRALS: 'nasiiba_referrals',
            REFERRER: 'nasiiba_referrer'
        }
    };

    // ===== UTILITY FUNCTIONS =====
    function generateId() {
        return 'aff_' + Math.random().toString(36).substr(2, 8) + Date.now().toString(36);
    }

    function generateRefCode(name) {
        const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const suffix = Math.random().toString(36).substr(2, 4);
        return clean.substr(0, 8) + suffix;
    }

    function getStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || null;
        } catch { return null; }
    }

    function setStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function hashPassword(password) {
        // Simple hash for demo — in production use bcrypt on server
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return 'h_' + Math.abs(hash).toString(36);
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function formatCurrency(amount) {
        return '$' + amount.toFixed(2);
    }

    // ===== DATA LAYER =====
    // ===== DATA LAYER (SUPABASE) =====
    const db = window.supabaseClient;

    async function getAffiliateData(email) {
        if (!db) return null;
        const { data, error } = await db.from('affiliates').select('*').eq('email', email).single();
        if (error) return null;
        return data;
    }

    async function saveAffiliateData(affiliate) {
        if (!db) return;
        const { error } = await db.from('affiliates').upsert(affiliate);
        if (error) console.error('Error saving affiliate:', error);
    }

    async function getCurrentUser() {
        if (!db) return getStorage(CONFIG.STORAGE_KEYS.CURRENT_USER);
        const { data: { user } } = await db.auth.getUser();
        if (!user) return null;

        // Fetch extra profile data from our affiliates table
        const { data, error } = await db.from('affiliates').select('*').eq('id', user.id).single();
        return data || null;
    }

    function setCurrentUser(user) {
        setStorage(CONFIG.STORAGE_KEYS.CURRENT_USER, user);
    }

    function clearCurrentUser() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
        if (db) db.auth.signOut();
    }

    async function getReferrals(refCode) {
        if (!db) {
            const all = getStorage(CONFIG.STORAGE_KEYS.REFERRALS) || {};
            return all[refCode] || [];
        }
        const { data, error } = await db.from('referrals').select('*').eq('ref_code', refCode);
        if (error) return [];
        return data;
    }

    async function addReferral(refCode, referralData) {
        if (!db) {
            const all = getStorage(CONFIG.STORAGE_KEYS.REFERRALS) || {};
            if (!all[refCode]) all[refCode] = [];
            all[refCode].push(referralData);
            setStorage(CONFIG.STORAGE_KEYS.REFERRALS, all);
            return;
        }
        const { error } = await db.from('referrals').insert({
            ref_code: refCode,
            ...referralData
        });
        if (error) console.error('Error adding referral:', error);
    }

    // ===== REFERRAL TRACKING (runs on ALL pages) =====
    async function trackReferral() {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            const referrerData = {
                refCode: ref,
                timestamp: new Date().toISOString(),
                landingPage: window.location.pathname,
                expires: new Date(Date.now() + CONFIG.COOKIE_DAYS * 86400000).toISOString()
            };
            setStorage(CONFIG.STORAGE_KEYS.REFERRER, referrerData);

            // Increment click count for this affiliate
            if (db) {
                // Fetch current clicks and increment
                const { data, error } = await db.from('affiliates').select('clicks').eq('ref_code', ref).single();
                if (data) {
                    await db.from('affiliates').update({ clicks: (data.clicks || 0) + 1 }).eq('ref_code', ref);
                }
            } else {
                const affiliates = getStorage(CONFIG.STORAGE_KEYS.AFFILIATES) || [];
                const aff = affiliates.find(a => a.refCode === ref);
                if (aff) {
                    aff.clicks = (aff.clicks || 0) + 1;
                    setStorage(CONFIG.STORAGE_KEYS.AFFILIATES, affiliates);
                }
            }

            // Clean URL without reload
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, '', cleanUrl);
        }
    }

    // Run tracking immediately on page load
    trackReferral();

    // ===== AFFILIATE PAGE LOGIC =====
    // Only run if we're on the affiliate page
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    if (!authSection || !dashboardSection) return;

    // ----- TAB SWITCHING -----
    const tabs = document.querySelectorAll('.aff-auth__tab');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (tab.dataset.tab === 'register') {
                registerForm.style.display = 'block';
                loginForm.style.display = 'none';
            } else {
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
            }
        });
    });

    // ----- REGISTER -----
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('register-error');
        errorEl.textContent = '';
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim().toLowerCase();
        const password = document.getElementById('reg-password').value;
        const paypal = document.getElementById('reg-paypal').value.trim();

        if (db) {
            const { data, error } = await db.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                    }
                }
            });

            if (error) {
                errorEl.textContent = error.message;
                submitBtn.disabled = false;
                return;
            }

            // Save additional affiliate data to our public table
            const newAffiliate = {
                id: data.user.id,
                name: name,
                email: email,
                paypal_email: paypal,
                ref_code: generateRefCode(name),
                clicks: 0,
                created_at: new Date().toISOString()
            };

            const { error: dbError } = await db.from('affiliates').insert(newAffiliate);
            if (dbError) {
                errorEl.textContent = 'Auth successful but profile creation failed. Please contact support.';
                submitBtn.disabled = false;
                return;
            }

            showDashboard(newAffiliate);
        } else {
            // Local fallback
            const affiliates = getStorage(CONFIG.STORAGE_KEYS.AFFILIATES) || [];
            if (affiliates.find(a => a.email === email)) {
                errorEl.textContent = 'An account with this email already exists. Please login instead.';
                submitBtn.disabled = false;
                return;
            }

            const newAffiliate = {
                id: generateId(),
                name: name,
                email: email,
                passwordHash: hashPassword(password),
                paypal_email: paypal,
                ref_code: generateRefCode(name),
                clicks: 0,
                created_at: new Date().toISOString()
            };

            affiliates.push(newAffiliate);
            setStorage(CONFIG.STORAGE_KEYS.AFFILIATES, affiliates);
            setCurrentUser(newAffiliate);
            showDashboard(newAffiliate);
        }
        submitBtn.disabled = false;
    });

    // ----- LOGIN -----
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('login-error');
        errorEl.textContent = '';
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        if (db) {
            const { data, error } = await db.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                errorEl.textContent = error.message;
                submitBtn.disabled = false;
                return;
            }

            const userProfile = await getAffiliateData(email);
            if (userProfile) {
                showDashboard(userProfile);
            } else {
                errorEl.textContent = 'Account found but profile data is missing.';
            }
        } else {
            const affiliates = getStorage(CONFIG.STORAGE_KEYS.AFFILIATES) || [];
            const user = affiliates.find(a => a.email === email);

            if (!user) {
                errorEl.textContent = 'No account found with this email. Please register first.';
                submitBtn.disabled = false;
                return;
            }

            if (user.passwordHash !== hashPassword(password)) {
                errorEl.textContent = 'Incorrect password. Please try again.';
                submitBtn.disabled = false;
                return;
            }

            setCurrentUser(user);
            showDashboard(user);
        }
        submitBtn.disabled = false;
    });

    // ----- LOGOUT -----
    document.getElementById('logout-btn').addEventListener('click', () => {
        clearCurrentUser();
        showAuth();
    });

    // ----- SHOW AUTH / DASHBOARD -----
    function showAuth() {
        authSection.style.display = 'block';
        dashboardSection.style.display = 'none';
    }

    async function showDashboard(user) {
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';

        // Refresh user data from Supabase (or fallback)
        let freshUser = user;
        if (db) {
            const { data, error } = await db.from('affiliates').select('*').eq('id', user.id).single();
            if (data) freshUser = data;
        }

        // Populate name
        document.getElementById('dash-name').textContent = freshUser.name.split(' ')[0];

        // Build referral link
        const baseUrl = CONFIG.SITE_URL.replace(/\/$/, '');
        const refLink = baseUrl + '/index.html?ref=' + freshUser.ref_code;
        document.getElementById('referral-link').value = refLink;

        // Stats
        const referrals = await getReferrals(freshUser.ref_code);
        const totalEarnings = referrals.reduce((sum, r) => sum + (r.commission || 0), 0);

        document.getElementById('stat-clicks').textContent = freshUser.clicks || 0;
        document.getElementById('stat-referrals').textContent = referrals.length;
        document.getElementById('stat-earnings').textContent = formatCurrency(totalEarnings);

        // Determine tier
        const count = referrals.length;
        let rate = '20%';
        if (count > 50) rate = '30%';
        else if (count > 10) rate = '25%';
        document.getElementById('stat-rate').textContent = rate;

        // Referral history table
        const tbody = document.getElementById('referral-tbody');
        const noReferrals = document.getElementById('no-referrals');
        tbody.innerHTML = '';

        if (referrals.length === 0) {
            noReferrals.style.display = 'block';
        } else {
            noReferrals.style.display = 'none';
            referrals.forEach(ref => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatDate(ref.created_at || ref.date)}</td>
                    <td>${ref.client_name || ref.clientName || 'Anonymous'}</td>
                    <td>${ref.course || 'N/A'}</td>
                    <td>${formatCurrency(ref.amount || 0)}</td>
                    <td class="aff-commission">${formatCurrency(ref.commission || 0)}</td>
                    <td><span class="aff-status aff-status--${ref.status || 'pending'}">${ref.status || 'Pending'}</span></td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Scroll to dashboard
        dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ----- COPY LINK -----
    document.getElementById('copy-link-btn').addEventListener('click', () => {
        const linkInput = document.getElementById('referral-link');
        const successMsg = document.getElementById('copy-success');

        navigator.clipboard.writeText(linkInput.value).then(() => {
            successMsg.style.display = 'block';
            setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
        }).catch(() => {
            // Fallback for older browsers
            linkInput.select();
            document.execCommand('copy');
            successMsg.style.display = 'block';
            setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
        });
    });

    // ----- SOCIAL SHARE -----
    function getShareUrl() {
        return document.getElementById('referral-link').value;
    }

    function getShareText() {
        return 'Transform your business skills with Nasiiba Coaching! Check it out:';
    }

    document.getElementById('share-twitter').addEventListener('click', socialShare);
    document.getElementById('share-facebook').addEventListener('click', socialShare);
    document.getElementById('share-linkedin').addEventListener('click', socialShare);
    document.getElementById('share-whatsapp').addEventListener('click', socialShare);
    document.getElementById('share-email').addEventListener('click', socialShare);

    function socialShare(e) {
        const id = e.currentTarget.id;
        const url = getShareUrl();
        const text = getShareText();
        let shareUrl = '';

        switch (id) {
            case 'share-twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                break;
            case 'share-facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'share-linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            case 'share-whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
                break;
            case 'share-email':
                const subject = encodeURIComponent('Check out Nasiiba Coaching!');
                const body = encodeURIComponent(text + '\n\n' + url);
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
                return;
        }

        if (shareUrl) window.open(shareUrl, '_blank', 'width=550,height=420');
    }

    // ----- FAQ ACCORDION -----
    document.querySelectorAll('.aff-faq__question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            const isOpen = item.classList.contains('open');

            // Close all
            document.querySelectorAll('.aff-faq__item').forEach(i => i.classList.remove('open'));

            // Toggle current
            if (!isOpen) item.classList.add('open');
        });
    });

    // ----- SIMULATE A REFERRAL (for demo/testing) -----
    function setupEnrollTracking() {
        document.querySelectorAll('.btn--navy, .btn--sm').forEach(btn => {
            if (btn.textContent.trim() === 'Enroll' || btn.getAttribute('data-i18n') === 'enroll') {
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const storedRef = getStorage(CONFIG.STORAGE_KEYS.REFERRER);
                    if (storedRef && new Date(storedRef.expires) > new Date()) {
                        const card = btn.closest('.course-card');
                        const courseName = card ? card.querySelector('.course-card__title').textContent : 'Unknown';
                        const priceText = card ? card.querySelector('.course-card__price').textContent : '$0';
                        const amount = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
                        const commission = amount * CONFIG.COMMISSION_RATE;

                        await addReferral(storedRef.refCode, {
                            date: new Date().toISOString(),
                            client_name: 'Web Visitor',
                            course: courseName,
                            amount: amount,
                            commission: commission,
                            status: 'confirmed'
                        });

                        localStorage.removeItem(CONFIG.STORAGE_KEYS.REFERRER);
                        alert(`🎉 Enrollment recorded!\n\nCourse: ${courseName}\nPrice: ${priceText}\n\nThank you for enrolling!`);
                    } else {
                        alert('🎉 Thank you for your interest! Enrollment system coming soon.');
                    }
                });
            }
        });
    }

    setupEnrollTracking();

    // ----- INIT: Check if already logged in -----
    async function init() {
        const currentUser = await getCurrentUser();
        if (currentUser) {
            showDashboard(currentUser);
        }
    }

    init();

})();
