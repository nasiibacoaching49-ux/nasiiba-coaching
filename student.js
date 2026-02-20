/**
 * Nasiiba Coaching — Student Portal Logic
 * Handles student registration, login, and simple dashboard view.
 */

(function () {
    'use strict';

    const db = window.supabaseClient;

    // View Switching
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const dashboardView = document.getElementById('dashboard-view');

    function showView(viewId) {
        loginView.style.display = viewId === 'login' ? 'block' : 'none';
        registerView.style.display = viewId === 'register' ? 'block' : 'none';
        dashboardView.style.display = viewId === 'dashboard' ? 'block' : 'none';
    }

    document.getElementById('to-register').addEventListener('click', (e) => {
        e.preventDefault();
        showView('register');
    });

    document.getElementById('to-login').addEventListener('click', (e) => {
        e.preventDefault();
        showView('login');
    });

    // Registration
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        if (!db) {
            alert('Supabase not connected. Please check configuration.');
            return;
        }

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

            // Create student profile in database
            const { error: profileError } = await db.from('students').insert([
                { id: data.user.id, full_name: name, email: email }
            ]);

            if (profileError) console.error('Error creating profile:', profileError);

            alert('Registration successful! Please check your email for verification.');
            showView('login');
        } catch (err) {
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
            const { data, error } = await db.auth.signInWithPassword({ email, password });
            if (error) throw error;

            await checkUser();
        } catch (err) {
            alert('Login failed: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In <i class="fas fa-sign-in-alt"></i>';
        }
    });

    // Check Current User
    async function checkUser() {
        if (!db) return;
        const { data: { user } } = await db.auth.getUser();

        if (user) {
            const { data: profile } = await db.from('students').select('*').eq('id', user.id).single();
            if (profile) {
                document.getElementById('dash-welcome').textContent = `Welcome, ${profile.full_name}!`;
                showView('dashboard');
            } else {
                // Not a student?
                db.auth.signOut();
                showView('login');
            }
        } else {
            showView('login');
        }
    }

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        if (db) await db.auth.signOut();
        showView('login');
    });

    // Init
    document.addEventListener('DOMContentLoaded', checkUser);

})();
