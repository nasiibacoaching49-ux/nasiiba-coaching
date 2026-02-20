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
    function getAffiliates() {
        return getStorage(CONFIG.STORAGE_KEYS.AFFILIATES) || [];
    }

    function saveAffiliates(affiliates) {
        setStorage(CONFIG.STORAGE_KEYS.AFFILIATES, affiliates);
    }

    function getCurrentUser() {
        return getStorage(CONFIG.STORAGE_KEYS.CURRENT_USER);
    }

    function setCurrentUser(user) {
        setStorage(CONFIG.STORAGE_KEYS.CURRENT_USER, user);
    }

    function clearCurrentUser() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
    }

    function getReferrals(refCode) {
        const all = getStorage(CONFIG.STORAGE_KEYS.REFERRALS) || {};
        return all[refCode] || [];
    }

    function addReferral(refCode, referralData) {
        const all = getStorage(CONFIG.STORAGE_KEYS.REFERRALS) || {};
        if (!all[refCode]) all[refCode] = [];
        all[refCode].push(referralData);
        setStorage(CONFIG.STORAGE_KEYS.REFERRALS, all);
    }

    // ===== REFERRAL TRACKING (runs on ALL pages) =====
    function trackReferral() {
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
            const affiliates = getAffiliates();
            const aff = affiliates.find(a => a.refCode === ref);
            if (aff) {
                aff.clicks = (aff.clicks || 0) + 1;
                saveAffiliates(affiliates);
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
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('register-error');
        errorEl.textContent = '';

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim().toLowerCase();
        const password = document.getElementById('reg-password').value;
        const paypal = document.getElementById('reg-paypal').value.trim();

        const affiliates = getAffiliates();
        if (affiliates.find(a => a.email === email)) {
            errorEl.textContent = 'An account with this email already exists. Please login instead.';
            return;
        }

        const newAffiliate = {
            id: generateId(),
            name: name,
            email: email,
            passwordHash: hashPassword(password),
            paypalEmail: paypal,
            refCode: generateRefCode(name),
            clicks: 0,
            createdAt: new Date().toISOString()
        };

        affiliates.push(newAffiliate);
        saveAffiliates(affiliates);
        setCurrentUser(newAffiliate);
        showDashboard(newAffiliate);
    });

    // ----- LOGIN -----
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('login-error');
        errorEl.textContent = '';

        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        const affiliates = getAffiliates();
        const user = affiliates.find(a => a.email === email);

        if (!user) {
            errorEl.textContent = 'No account found with this email. Please register first.';
            return;
        }

        if (user.passwordHash !== hashPassword(password)) {
            errorEl.textContent = 'Incorrect password. Please try again.';
            return;
        }

        setCurrentUser(user);
        showDashboard(user);
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

    function showDashboard(user) {
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';

        // Refresh user data from storage (may have updated clicks)
        const affiliates = getAffiliates();
        const freshUser = affiliates.find(a => a.id === user.id) || user;

        // Populate name
        document.getElementById('dash-name').textContent = freshUser.name.split(' ')[0];

        // Build referral link
        const baseUrl = CONFIG.SITE_URL.replace(/\/$/, '');
        const refLink = baseUrl + '/index.html?ref=' + freshUser.refCode;
        document.getElementById('referral-link').value = refLink;

        // Stats
        const referrals = getReferrals(freshUser.refCode);
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
                    <td>${formatDate(ref.date)}</td>
                    <td>${ref.clientName || 'Anonymous'}</td>
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

    document.getElementById('share-twitter').addEventListener('click', () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank', 'width=550,height=420');
    });

    document.getElementById('share-facebook').addEventListener('click', () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank', 'width=550,height=420');
    });

    document.getElementById('share-linkedin').addEventListener('click', () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank', 'width=550,height=420');
    });

    document.getElementById('share-whatsapp').addEventListener('click', () => {
        const url = `https://wa.me/?text=${encodeURIComponent(getShareText() + ' ' + getShareUrl())}`;
        window.open(url, '_blank');
    });

    document.getElementById('share-email').addEventListener('click', () => {
        const subject = encodeURIComponent('Check out Nasiiba Coaching!');
        const body = encodeURIComponent(getShareText() + '\n\n' + getShareUrl());
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });

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
    // When someone lands with ?ref= and later "enrolls" (clicks an Enroll button),
    // record it as a referral for the affiliate
    function setupEnrollTracking() {
        // This runs on ALL pages
        document.querySelectorAll('.btn--navy').forEach(btn => {
            if (btn.textContent.trim() === 'Enroll') {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const storedRef = getStorage(CONFIG.STORAGE_KEYS.REFERRER);
                    if (storedRef && new Date(storedRef.expires) > new Date()) {
                        // Find the course info
                        const card = btn.closest('.course-card');
                        const courseName = card ? card.querySelector('.course-card__title').textContent : 'Unknown';
                        const priceText = card ? card.querySelector('.course-card__price').textContent : '$0';
                        const amount = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
                        const commission = amount * CONFIG.COMMISSION_RATE;

                        addReferral(storedRef.refCode, {
                            date: new Date().toISOString(),
                            clientName: 'Web Visitor',
                            course: courseName,
                            amount: amount,
                            commission: commission,
                            status: 'confirmed'
                        });

                        // Clear the referrer after conversion
                        localStorage.removeItem(CONFIG.STORAGE_KEYS.REFERRER);

                        alert(`🎉 Enrollment recorded!\n\nCourse: ${courseName}\nPrice: ${priceText}\n\nThank you for enrolling!`);
                    } else {
                        alert('🎉 Thank you for your interest! Enrollment system coming soon.');
                    }
                });
            }
        });
    }

    // Run enroll tracking on page load (for index.html course cards)
    setupEnrollTracking();

    // ----- INIT: Check if already logged in -----
    const currentUser = getCurrentUser();
    if (currentUser) {
        showDashboard(currentUser);
    }

})();
