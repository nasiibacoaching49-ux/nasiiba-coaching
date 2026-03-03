/**
 * Nasiiba Coaching — Student Portal Logic
 * Handles student registration, login, and full dashboard features.
 */

(function () {
    'use strict';

    const db = window.supabaseClient;

    // View & Tab Elements
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const dashboardView = document.getElementById('dashboard-view');
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const dashboardTabs = document.querySelectorAll('.dashboard-tab');

    // View Switching
    function showView(viewId) {
        loginView.style.display = viewId === 'login' ? 'block' : 'none';
        registerView.style.display = viewId === 'register' ? 'block' : 'none';
        dashboardView.style.display = viewId === 'dashboard' ? 'block' : 'none';

        // Adjust container width for dashboard
        const authContainer = document.getElementById('auth-container');
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

    // Tab Switching
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');

            // Update Active Nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update Active Tab
            dashboardTabs.forEach(tab => tab.classList.remove('active'));
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    document.getElementById('to-register').addEventListener('click', (e) => {
        e.preventDefault();
        showView('register');
    });

    document.getElementById('to-login').addEventListener('click', (e) => {
        e.preventDefault();
        showView('login');
    });

    // --- AUTH LOGIC ---

    // Registration
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const whatsapp = document.getElementById('reg-whatsapp').value;
        const password = document.getElementById('reg-password').value;

        if (!db) return;

        const submitBtn = document.getElementById('register-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            const { data, error } = await db.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name, type: 'student' }
                }
            });

            if (error) throw error;
            if (!data.user) throw new Error('Registration failed. Please try again.');

            // Create student profile in database
            const { error: profileError } = await db.from('students').upsert([
                { id: data.user.id, full_name: name, email: email, whatsapp_number: whatsapp }
            ]);

            if (profileError) console.error('Error creating profile:', profileError);

            alert('Registration successful! You can now sign in.');
            showView('login');
        } catch (err) {
            console.error('Registration error:', err);
            alert('Registration failed: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Account <i class="fas fa-user-check"></i>';
        }
    });

    // Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!db) return;

        const submitBtn = document.getElementById('login-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

        try {
            console.log('Attempting login for:', email);
            const { data, error } = await db.auth.signInWithPassword({ email, password });

            if (error) {
                console.error('Supabase Login Error:', error);
                throw error;
            }

            console.log('Login successful, data:', data);
            await checkUser();
        } catch (err) {
            console.error('Login Caught Error:', err);
            alert('Login failed: ' + (err.message.includes('Invalid login credentials') ? 'Invalid email or password.' : err.message));
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In <i class="fas fa-sign-in-alt"></i>';
        }
    });

    // --- DASHBOARD DATA ---

    async function checkUser() {
        if (!db) {
            console.error('Supabase client (db) not found');
            return;
        }
        console.log('Checking auth state...');
        const { data: { user }, error: userError } = await db.auth.getUser();
        if (userError) console.error('getUser Error:', userError);

        if (user) {
            console.log('User session active:', user.id);
            try {
                const { data: profile, error: profileError } = await db.from('students').select('*').eq('id', user.id).single();
                if (profileError) console.error('Profile DB Error:', profileError);

                if (profile) {
                    console.log('Profile loaded for:', profile.full_name);
                    populateDashboard(profile);
                    showView('dashboard');
                    fetchStudentCourses(user.id);
                    fetchCertificates(user.id);

                    // Handle dynamic tab selection from URL
                    const params = new URLSearchParams(window.location.search);
                    const targetTab = params.get('tab');
                    if (targetTab) {
                        const tabBtn = document.querySelector(`.nav-item[data-tab="${targetTab}"]`);
                        if (tabBtn) tabBtn.click();
                    }
                } else {
                    console.warn('No student profile found for user UID');
                    alert('Authenticated but profile not found. If you just registered, please try logging in again.');
                    await db.auth.signOut();
                    showView('login');
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                showView('login');
            }
        } else {
            const params = new URLSearchParams(window.location.search);
            if (params.get('view') === 'register' || window.location.hash === '#register') {
                showView('register');
            } else {
                showView('login');
            }
        }
    }

    function populateDashboard(profile) {
        document.getElementById('dash-welcome').textContent = `Welcome back, ${profile.full_name}!`;
        document.getElementById('dash-user-name').textContent = profile.full_name;
        document.getElementById('user-avatar-initials').textContent = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

        // Populate profile form
        if (document.getElementById('profile-name')) document.getElementById('profile-name').value = profile.full_name;
        if (document.getElementById('profile-whatsapp')) document.getElementById('profile-whatsapp').value = profile.whatsapp_number || '';
        if (document.getElementById('profile-email')) document.getElementById('profile-email').value = profile.email;

        // Show admin link if email matches (robust check)
        const ADMIN_EMAIL = 'info@nasiibacoaching.com'.toLowerCase().trim();
        const userEmail = (profile.email || '').toLowerCase().trim();
        const adminLink = document.getElementById('admin-link');

        if (userEmail === ADMIN_EMAIL && adminLink) {
            console.log('[Admin] Admin user detected, showing panel link.');
            adminLink.style.display = 'flex';
        }
    }

    async function fetchStudentCourses(studentId) {
        const grid = document.getElementById('enrolled-courses-grid');
        const countEl = document.getElementById('dash-courses-count');
        grid.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Loading courses...</p>';

        try {
            const { data: orders, error } = await db.from('orders')
                .select(`course_id, courses(*)`)
                .eq('student_id', studentId)
                .eq('status', 'completed');

            if (error) throw error;

            countEl.textContent = orders ? orders.length : '0';

            if (!orders || orders.length === 0) {
                grid.innerHTML = '<p class="empty-msg">No active courses found. <a href="index.html#courses" style="color: var(--gold);">Browse Academy</a></p>';
                return;
            }

            grid.innerHTML = orders.map(order => {
                const course = order.courses;
                if (!course) return '';
                return `
                    <div class="dashboard-course-card">
                        <div class="course-card__image">
                            <img src="${course.thumbnail_url || 'https://via.placeholder.com/400x250'}" alt="${course.title}">
                        </div>
                        <div class="course-card__body">
                            <h3 class="course-card__title" style="font-size: 1rem; color: #fff;">${course.title}</h3>
                            <div class="course-progress" style="margin-top: 10px;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 5px; color: rgba(255,255,255,0.6);">
                                    <span>Course Progress</span>
                                    <span>0%</span>
                                </div>
                                <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                                    <div style="width: 0%; height: 100%; background: var(--gold);"></div>
                                </div>
                            </div>
                            <a href="course-player.html?courseId=${course.id}" class="btn btn--gold btn--sm btn--full" style="margin-top: 15px; color: #0c1b33;">Continue <i class="fas fa-play" style="font-size: 0.7rem;"></i></a>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error('Error fetching courses:', err);
            grid.innerHTML = '<p style="color: var(--gold);">Error loading courses.</p>';
        }
    }

    async function fetchCertificates(studentId) {
        // Placeholder for certificate logic
        const countEl = document.getElementById('dash-certs-count');
        countEl.textContent = '0';
    }

    // --- FORM SUBMISSIONS ---

    // Profile Update
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('profile-name').value;
        const whatsapp = document.getElementById('profile-whatsapp').value;

        const submitBtn = e.target.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const { data: { user } } = await db.auth.getUser();
            const { error } = await db.from('students').update({
                full_name: name,
                whatsapp_number: whatsapp
            }).eq('id', user.id);

            if (error) throw error;

            // Update UI
            document.getElementById('dash-user-name').textContent = name;
            alert('Profile updated successfully!');
        } catch (err) {
            alert('Error updating profile: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Update Profile';
        }
    });

    // Password Update
    document.getElementById('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;

        if (newPass !== confirmPass) {
            alert('Passwords do not match.');
            return;
        }

        const submitBtn = e.target.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

        try {
            const { error } = await db.auth.updateUser({ password: newPass });
            if (error) throw error;
            alert('Password changed successfully!');
            e.target.reset();
        } catch (err) {
            alert('Error updating password: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Change Password';
        }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        if (db) {
            await db.auth.signOut();
            window.location.reload();
        }
    });

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkUser);
    } else {
        checkUser();
    }

})();
