/**
 * Nasiiba Coaching — Admin Dashboard Logic
 * Handles admin authentication, course management, and order tracking.
 */

(function () {
    'use strict';

    const db = window.supabaseClient;

    // UI Elements
    const authOverlay = document.getElementById('admin-auth');
    const loginForm = document.getElementById('admin-login-form');
    const authError = document.getElementById('auth-error');
    const logoutBtn = document.getElementById('admin-logout');
    const navItems = document.querySelectorAll('.admin-nav__item[data-view]');
    const viewContents = document.querySelectorAll('.view-content');

    // View Management
    function showView(viewName) {
        // Update Nav
        navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-view') === viewName);
        });

        // Update Content
        viewContents.forEach(content => {
            content.style.display = content.id === `view-${viewName}` ? 'block' : 'none';
        });

        // Fetch view-specific data
        if (viewName === 'dashboard') fetchStats();
        if (viewName === 'courses') fetchCourses();
        if (viewName === 'orders') fetchOrders();
        if (viewName === 'reviews') fetchReviews();
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            showView(view);
            window.location.hash = view;
        });
    });

    // Authentication
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        if (!db) return;

        const submitBtn = document.getElementById('admin-login-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        authError.style.display = 'none';

        try {
            const { data, error } = await db.auth.signInWithPassword({ email, password });
            if (error) throw error;

            await checkAdmin(data.user);
        } catch (err) {
            authError.textContent = err.message;
            authError.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In';
        }
    });

    async function checkAdmin(user) {
        if (!user) {
            authOverlay.style.display = 'flex';
            return;
        }

        // Restrict to specific admin email
        const ADMIN_EMAIL = 'info@nasiiba.online';

        if (user.email === ADMIN_EMAIL) {
            authOverlay.style.display = 'none';
            // Trigger initial load
            const hash = window.location.hash.replace('#', '') || 'dashboard';
            showView(hash);
        } else {
            // Not the authorized admin email
            await db.auth.signOut();
            authError.textContent = 'Access Denied: Only authorized administrators can access this panel.';
            authError.style.display = 'block';
            authOverlay.style.display = 'flex';
        }
    }

    logoutBtn.addEventListener('click', async () => {
        if (db) await db.auth.signOut();
        window.location.reload();
    });

    // Modals
    const modalCourse = document.getElementById('modal-course');
    const modalLesson = document.getElementById('modal-lesson');
    const courseForm = document.getElementById('course-form');
    const lessonForm = document.getElementById('lesson-form');

    window.closeAdminModal = (modalId) => {
        document.getElementById(modalId).classList.remove('active');
    };

    // Course Management
    document.getElementById('btn-add-course').addEventListener('click', () => {
        document.getElementById('course-modal-title').textContent = 'Add New Course';
        courseForm.reset();
        document.getElementById('course-id').value = '';
        modalCourse.classList.add('active');
    });

    courseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('course-id').value;
        const title = document.getElementById('course-title').value;
        const description = document.getElementById('course-desc').value;
        const price = document.getElementById('course-price').value;
        const thumbnail_url = document.getElementById('course-thumb').value;

        const courseData = { title, description, price, thumbnail_url };

        try {
            let error;
            if (id) {
                ({ error } = await db.from('courses').update(courseData).eq('id', id));
            } else {
                ({ error } = await db.from('courses').insert([courseData]));
            }

            if (error) throw error;
            modalCourse.classList.remove('active');
            fetchCourses();
        } catch (err) {
            alert('Error saving course: ' + err.message);
        }
    });

    window.editCourse = async (id) => {
        try {
            const { data: course, error } = await db.from('courses').select('*').eq('id', id).single();
            if (error) throw error;

            document.getElementById('course-id').value = course.id;
            document.getElementById('course-title').value = course.title;
            document.getElementById('course-desc').value = course.description;
            document.getElementById('course-price').value = course.price;
            document.getElementById('course-thumb').value = course.thumbnail_url;

            document.getElementById('course-modal-title').textContent = 'Edit Course';
            modalCourse.classList.add('active');
        } catch (err) {
            alert('Error loading course details: ' + err.message);
        }
    };

    // Lesson Management
    let currentCourseId = null;
    const lessonCourseSelect = document.getElementById('lesson-course-select');
    const btnAddLesson = document.getElementById('btn-add-lesson');

    lessonCourseSelect.addEventListener('change', (e) => {
        currentCourseId = e.target.value;
        if (currentCourseId) {
            btnAddLesson.style.display = 'inline-block';
            fetchLessons(currentCourseId);
        } else {
            btnAddLesson.style.display = 'none';
            document.getElementById('lessons-list-container').innerHTML = '';
        }
    });

    btnAddLesson.addEventListener('click', () => {
        document.getElementById('lesson-modal-title').textContent = 'Add Lesson';
        lessonForm.reset();
        document.getElementById('lesson-id').value = '';
        modalLesson.classList.add('active');
    });

    lessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('lesson-id').value;
        const title = document.getElementById('lesson-title').value;
        const type = document.getElementById('lesson-type').value;
        const content = document.getElementById('lesson-content').value;

        const lessonData = { course_id: currentCourseId, title, type, content };

        try {
            let error;
            if (id) {
                ({ error } = await db.from('lessons').update(lessonData).eq('id', id));
            } else {
                ({ error } = await db.from('lessons').insert([lessonData]));
            }

            if (error) throw error;
            modalLesson.classList.remove('active');
            fetchLessons(currentCourseId);
        } catch (err) {
            alert('Error saving lesson: ' + err.message);
        }
    });

    async function fetchLessons(courseId) {
        const container = document.getElementById('lessons-list-container');
        try {
            const { data: lessons, error } = await db.from('lessons').select('*').eq('course_id', courseId).order('order_index', { ascending: true });
            if (error) throw error;

            if (lessons.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-light);">No lessons yet. Add your first lesson above.</p>';
                return;
            }

            container.innerHTML = `
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lessons.map(lesson => `
                                <tr>
                                    <td>${lesson.title}</td>
                                    <td><span class="badge ${lesson.type === 'video' ? 'badge--success' : 'badge--warning'}">${lesson.type}</span></td>
                                    <td>
                                        <button class="btn btn--sm btn--outline" onclick="editLesson('${lesson.id}')"><i class="fas fa-edit"></i></button>
                                        <button class="btn btn--sm btn--danger" onclick="deleteLesson('${lesson.id}')"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            console.error('Error fetching lessons:', err);
        }
    }

    window.editLesson = async (id) => {
        try {
            const { data: lesson, error } = await db.from('lessons').select('*').eq('id', id).single();
            if (error) throw error;

            document.getElementById('lesson-id').value = lesson.id;
            document.getElementById('lesson-title').value = lesson.title;
            document.getElementById('lesson-type').value = lesson.type;
            document.getElementById('lesson-content').value = lesson.content;

            document.getElementById('lesson-modal-title').textContent = 'Edit Lesson';
            modalLesson.classList.add('active');
        } catch (err) {
            alert('Error loading lesson: ' + err.message);
        }
    };

    window.deleteLesson = async (id) => {
        if (confirm('Delete this lesson?')) {
            const { error } = await db.from('lessons').delete().eq('id', id);
            if (!error) fetchLessons(currentCourseId);
        }
    };

    // Data Fetching Functions
    async function fetchStats() {
        if (!db) return;
        try {
            const { count: studentCount } = await db.from('students').select('*', { count: 'exact', head: true });
            const { count: courseCount } = await db.from('courses').select('*', { count: 'exact', head: true });
            const { data: orders } = await db.from('orders').select('amount');
            const { count: reviewCount } = await db.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending');

            document.getElementById('stat-students').textContent = studentCount || 0;
            document.getElementById('stat-courses').textContent = courseCount || 0;
            document.getElementById('stat-reviews').textContent = reviewCount || 0;

            const revenue = orders ? orders.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0) : 0;
            document.getElementById('stat-revenue').textContent = `$${revenue.toLocaleString()}`;

            // Fetch recent orders for dashboard
            fetchRecentOrders();
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }

    async function fetchRecentOrders() {
        const tableBody = document.querySelector('#recent-orders-table tbody');
        try {
            const { data: orders, error } = await db.from('orders').select(`
                id, amount, created_at, status, 
                students(full_name),
                courses(title)
            `).order('created_at', { ascending: false }).limit(5);

            if (error) throw error;

            if (orders.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders yet.</td></tr>';
                return;
            }

            tableBody.innerHTML = orders.map(order => `
                <tr>
                    <td>#${order.id.slice(0, 8)}</td>
                    <td>${order.students ? order.students.full_name : 'Guest'}</td>
                    <td>${order.courses ? order.courses.title : 'Deleted Course'}</td>
                    <td>$${order.amount}</td>
                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                    <td><span class="badge badge--success">${order.status}</span></td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error fetching recent orders:', err);
        }
    }

    async function fetchCourses() {
        const coursesTable = document.querySelector('#courses-table tbody');
        if (!coursesTable) return;

        try {
            const { data: courses, error } = await db.from('courses').select('*').order('created_at', { ascending: false });
            if (error) throw error;

            // Populate course select for lessons view while we're at it
            lessonCourseSelect.innerHTML = '<option value="">-- Choose a course --</option>' +
                courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');

            if (courses.length === 0) {
                coursesTable.innerHTML = '<tr><td colspan="5" style="text-align: center;">No courses found.</td></tr>';
                return;
            }

            coursesTable.innerHTML = courses.map(course => `
                <tr>
                    <td><img src="${course.thumbnail_url || 'https://via.placeholder.com/60x40'}" style="width: 60px; border-radius: 4px;"></td>
                    <td><strong>${course.title}</strong></td>
                    <td>$${course.price}</td>
                    <td>${new Date(course.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn--sm btn--outline" onclick="editCourse('${course.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn--sm btn--danger" onclick="deleteCourse('${course.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error fetching courses:', err);
        }
    }

    async function fetchOrders() {
        const tableBody = document.querySelector('#orders-table tbody');
        try {
            const { data: orders, error } = await db.from('orders').select(`
                id, amount, created_at, status, 
                students(full_name),
                courses(title)
            `).order('created_at', { ascending: false });

            if (error) throw error;

            if (orders.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders found.</td></tr>';
                return;
            }

            tableBody.innerHTML = orders.map(order => `
                <tr>
                    <td>#${order.id.slice(0, 8)}</td>
                    <td>${order.students ? order.students.full_name : 'Guest'}</td>
                    <td>${order.courses ? order.courses.title : 'Deleted Course'}</td>
                    <td>$${order.amount}</td>
                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                    <td><span class="badge badge--success">${order.status}</span></td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error fetching orders:', err);
        }
    }

    async function fetchReviews() {
        const container = document.getElementById('reviews-container');
        try {
            const { data: reviews, error } = await db.from('reviews').select(`
                *,
                students(full_name),
                courses(title)
            `).order('created_at', { ascending: false });

            if (error) throw error;

            if (reviews.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px;">No reviews yet.</p>';
                return;
            }

            container.innerHTML = reviews.map(review => `
                <div class="review-card">
                    <div class="review-card__header">
                        <div>
                            <div class="review-card__student">${review.students ? review.students.full_name : 'Guest'}</div>
                            <div class="review-card__course">Course: ${review.courses ? review.courses.title : 'Deleted'}</div>
                            <div class="review-card__rating">
                                ${Array(review.rating).fill('<i class="fas fa-star"></i>').join('')}
                                ${Array(5 - review.rating).fill('<i class="far fa-star"></i>').join('')}
                            </div>
                        </div>
                        <div class="action-btns">
                            ${review.status === 'pending' ? `
                                <button class="btn btn--sm btn--success" onclick="updateReviewStatus('${review.id}', 'approved')"><i class="fas fa-check"></i> Approve</button>
                                <button class="btn btn--sm btn--danger" onclick="updateReviewStatus('${review.id}', 'rejected')"><i class="fas fa-times"></i> Reject</button>
                            ` : `
                                <span class="badge ${review.status === 'approved' ? 'badge--success' : 'badge--danger'}">${review.status}</span>
                                <button class="btn btn--sm btn--outline" onclick="deleteReview('${review.id}')"><i class="fas fa-trash"></i></button>
                            `}
                        </div>
                    </div>
                    <div class="review-card__body">${review.comment}</div>
                </div>
            `).join('');
        } catch (err) {
            console.error('Error fetching reviews:', err);
        }
    }

    window.updateReviewStatus = async (id, status) => {
        const { error } = await db.from('reviews').update({ status }).eq('id', id);
        if (!error) fetchReviews();
    };

    window.deleteReview = async (id) => {
        if (confirm('Delete this review?')) {
            const { error } = await db.from('reviews').delete().eq('id', id);
            if (!error) fetchReviews();
        }
    };

    // Global Init
    document.addEventListener('DOMContentLoaded', async () => {
        if (db) {
            const { data: { user } } = await db.auth.getUser();
            if (user) await checkAdmin(user);
        }
    });

    window.editCourse = editCourse;
    window.deleteCourse = async (id) => {
        if (confirm('Are you sure you want to delete this course?')) {
            const { error } = await db.from('courses').delete().eq('id', id);
            if (!error) fetchCourses();
        }
    };
    window.editLesson = editLesson;
    window.deleteLesson = deleteLesson;

})();
