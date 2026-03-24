(function () {
    'use strict';

    let db = window.supabaseClient;

    // View & Tab Elements
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const forgotView = document.getElementById('forgot-view');
    const dashboardView = document.getElementById('dashboard-view');
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const dashboardTabs = document.querySelectorAll('.dashboard-tab');

    // Password Visibility Toggle Logic
    function initPasswordToggles() {
        console.log('[Auth] Initializing password toggles...');
        document.addEventListener('click', function (e) {
            const toggleBtn = e.target.closest('.password-toggle-btn');
            if (!toggleBtn) return;

            e.preventDefault(); // Prevent accidental form submit
            const targetId = toggleBtn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = toggleBtn.querySelector('i');

            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            } else {
                console.error('[Auth] Password input not found for ID:', targetId);
            }
        });
    }

    // View Switching
    function showView(viewId) {
        if (loginView) loginView.style.display = viewId === 'login' ? 'block' : 'none';
        if (registerView) registerView.style.display = viewId === 'register' ? 'block' : 'none';
        if (forgotView) forgotView.style.display = viewId === 'forgot' ? 'block' : 'none';
        if (dashboardView) dashboardView.style.display = viewId === 'dashboard' ? 'block' : 'none';

        // Adjust container width for dashboard
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            if (viewId === 'dashboard') {
                authContainer.style.maxWidth = '1000px';
                authContainer.style.padding = '0';
                authContainer.style.background = 'transparent';
                authContainer.style.boxShadow = 'none';
            } else {
                authContainer.style.maxWidth = '500px';
                authContainer.style.padding = '40px';
                authContainer.style.background = '';
                authContainer.style.boxShadow = '';
            }
        }
    }

    // --- AUTH LISTENERS ---

    function initAuthListeners() {
        // Tab Switching
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabId = item.getAttribute('data-tab');
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                dashboardTabs.forEach(tab => tab.classList.remove('active'));
                const targetTab = document.getElementById(`tab-${tabId}`);
                if (targetTab) targetTab.classList.add('active');
            });
        });

        const toRegister = document.getElementById('to-register');
        if (toRegister) toRegister.addEventListener('click', (e) => { e.preventDefault(); showView('register'); });

        const toLogin = document.getElementById('to-login');
        if (toLogin) toLogin.addEventListener('click', (e) => { e.preventDefault(); showView('login'); });

        const toLoginFromReg = document.getElementById('to-login-from-reg');
        if (toLoginFromReg) toLoginFromReg.addEventListener('click', (e) => { e.preventDefault(); showView('login'); });

        const toLoginFromForgot = document.getElementById('to-login-from-forgot');
        if (toLoginFromForgot) toLoginFromForgot.addEventListener('click', (e) => { e.preventDefault(); showView('login'); });

        const toForgot = document.getElementById('to-forgot');
        if (toForgot) toForgot.addEventListener('click', (e) => { e.preventDefault(); showView('forgot'); });

        // Registration
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!db) db = window.supabaseClient;
                const name = document.getElementById('reg-name').value;
                const email = document.getElementById('reg-email').value;
                const whatsapp = document.getElementById('reg-whatsapp').value;
                const password = document.getElementById('reg-password').value;

                const submitBtn = document.getElementById('register-btn');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

                try {
                    const { data, error } = await db.auth.signUp({
                        email, password, options: { data: { full_name: name, type: 'student' } }
                    });
                    if (error) throw error;
                    await db.from('students').upsert([{ id: data.user.id, full_name: name, email: email, whatsapp_number: whatsapp }]);
                    alert('Registration successful! You can now sign in.');
                    showView('login');
                } catch (err) {
                    alert('Registration failed: ' + err.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Create Account <i class="fas fa-user-check"></i>';
                }
            });
        }

        // Login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!db) db = window.supabaseClient;
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;

                const submitBtn = document.getElementById('login-btn');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

                try {
                    const { error } = await db.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    await checkUser();
                } catch (err) {
                    alert('Login failed: ' + err.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Sign In <i class="fas fa-sign-in-alt"></i>';
                }
            });
        }

        // Forgot Password
        const forgotForm = document.getElementById('forgot-form');
        if (forgotForm) {
            forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!db) db = window.supabaseClient;
                const email = document.getElementById('forgot-email').value;

                const submitBtn = document.getElementById('forgot-btn');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

                try {
                    const { error } = await db.auth.resetPasswordForEmail(email, {
                        redirectTo: window.location.origin + '/student.html?view=dashboard&tab=security',
                    });
                    if (error) throw error;
                    alert('Password reset link sent! Please check your email.');
                    showView('login');
                } catch (err) {
                    alert('Error: ' + err.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Send Reset Link <i class="fas fa-paper-plane"></i>';
                }
            });
        }

        // Google Sign-In
        const googleBtns = document.querySelectorAll('.google-signin-btn');
        googleBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!db) db = window.supabaseClient;
                try {
                    const { error } = await db.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: window.location.origin + '/student.html' }
                    });
                    if (error) throw error;
                } catch (err) {
                    alert('Sign-in failed: ' + err.message);
                }
            });
        });
    }

    // --- DASHBOARD DATA ---

    async function checkUser() {
        if (!db) db = window.supabaseClient;
        if (!db) return;

        const { data: { user } } = await db.auth.getUser();
        if (user) {
            try {
                const { data: profile } = await db.from('students').select('*').eq('id', user.id).single();
                if (profile) {
                    populateDashboard(profile);
                    showView('dashboard');
                    fetchStudentCourses(user.id);
                } else {
                    await db.auth.signOut();
                    showView('login');
                }
            } catch (err) {
                console.error('Check user error:', err);
            }
        } else {
            const params = new URLSearchParams(window.location.search);
            showView(params.get('view') === 'register' ? 'register' : 'login');
        }
    }

    function populateDashboard(profile) {
        const welcome = document.getElementById('dash-welcome');
        if (welcome) welcome.textContent = `Welcome back, ${profile.full_name}!`;
        const nameDisplay = document.getElementById('dash-user-name');
        if (nameDisplay) nameDisplay.textContent = profile.full_name;

        if (document.getElementById('profile-name')) document.getElementById('profile-name').value = profile.full_name;
        if (document.getElementById('profile-whatsapp')) document.getElementById('profile-whatsapp').value = profile.whatsapp_number || '';
        if (document.getElementById('profile-email')) document.getElementById('profile-email').value = profile.email;
    }

    async function fetchStudentCourses(studentId) {
        const grid = document.getElementById('enrolled-courses-grid');
        if (!grid) return;
        grid.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Loading courses...</p>';

        try {
            const { data: orders } = await db.from('orders')
                .select(`course_id, courses(*)`)
                .eq('student_id', studentId)
                .eq('status', 'completed');

            if (!orders || orders.length === 0) {
                grid.innerHTML = '<p class="empty-msg">No active courses found.</p>';
                return;
            }

            grid.innerHTML = orders.map(order => {
                const course = order.courses;
                if (!course) return '';
                return `
                    <div class="dashboard-course-card">
                        <img src="${course.thumbnail_url || 'https://via.placeholder.com/400x250'}" alt="${course.title}">
                        <div class="course-card__body">
                            <h3>${course.title}</h3>
                            <a href="course-player.html?courseId=${course.id}" class="btn btn--gold btn--sm btn--full">Continue</a>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            grid.innerHTML = '<p>Error loading courses.</p>';
        }
    }

    // --- INIT ---
    function init() {
        initPasswordToggles();
        initAuthListeners();
        checkUser();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
