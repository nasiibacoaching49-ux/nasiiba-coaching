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

        // Restrict to specific admin email (case-insensitive)
        const ADMIN_EMAIL = 'info@nasiibacoaching.com'.toLowerCase().trim();
        const userEmail = (user.email || '').toLowerCase().trim();

        if (userEmail === ADMIN_EMAIL) {
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
    const courseForm = document.getElementById('course-form');
    const modalLessonsList = document.getElementById('modal-lessons-list');
    const btnModalAddLesson = document.getElementById('btn-modal-add-lesson');
    const thumbFileInput = document.getElementById('course-thumb-file');
    const thumbPreview = document.getElementById('thumb-preview');
    const thumbUrlHidden = document.getElementById('course-thumb-url');

    window.closeAdminModal = (modalId) => {
        document.getElementById(modalId).classList.remove('active');
    };

    // Helper: Add Lesson Row to Modal
    function addLessonRow(lessonData = {}) {
        const rowId = `lesson-row-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const div = document.createElement('div');
        div.className = 'lesson-row';
        div.id = rowId;
        div.style.background = 'var(--bg-alt)';
        div.style.padding = '15px';
        div.style.borderRadius = '8px';
        div.style.marginBottom = '10px';
        div.style.position = 'relative';
        div.style.border = '1px solid var(--gray-200)';

        div.innerHTML = `
            <input type="hidden" class="lesson-id" value="${lessonData.id || ''}">
            <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-size: 0.75rem;">Lesson Title</label>
                <input type="text" class="lesson-title" value="${lessonData.title || ''}" placeholder="e.g. Introduction to Leadership" required>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="form-group">
                    <label style="font-size: 0.75rem;">Type</label>
                    <select class="lesson-type" style="padding: 10px; width: 100%; border-radius: 6px; border: 1px solid var(--gray-200);">
                        <option value="video" ${lessonData.type === 'video' ? 'selected' : ''}>Video</option>
                        <option value="pdf" ${lessonData.type === 'pdf' ? 'selected' : ''}>PDF</option>
                        <option value="quiz" ${lessonData.type === 'quiz' ? 'selected' : ''}>Quiz</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="font-size: 0.75rem;">Content (URL/YouTube)</label>
                    <input type="text" class="lesson-content" value="${lessonData.content || ''}" placeholder="YouTube URL" required>
                </div>
            </div>
            <button type="button" class="btn-remove-lesson" onclick="deleteLesson('${lessonData.id || ''}', '${rowId}')" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 1rem;">
                <i class="fas fa-times-circle"></i>
            </button>
        `;
        modalLessonsList.appendChild(div);
    }

    btnModalAddLesson.addEventListener('click', () => addLessonRow());

    // Thumbnail Preview handler
    thumbFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                thumbPreview.src = e.target.result;
                thumbPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Helper: Upload Image to Supabase
    async function uploadThumbnail(file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `course-thumbs/${fileName}`;

        const { data, error } = await db.storage
            .from('thumbnails')
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = db.storage
            .from('thumbnails')
            .getPublicUrl(filePath);

        return publicUrl;
    }

    // Course Management
    document.getElementById('btn-add-course').addEventListener('click', () => {
        document.getElementById('course-modal-title').textContent = 'Add New Course';
        courseForm.reset();
        document.getElementById('course-id').value = '';
        modalLessonsList.innerHTML = '';
        thumbPreview.style.display = 'none';
        thumbUrlHidden.value = '';
        addLessonRow(); // Add first lesson row by default
        modalCourse.classList.add('active');
    });

    courseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('course-save-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const id = document.getElementById('course-id').value;
        const title = document.getElementById('course-title').value;
        const description = document.getElementById('course-desc').value;
        const price = document.getElementById('course-price').value;

        try {
            // 1. Handle Thumbnail Upload
            let finalThumbUrl = thumbUrlHidden.value;
            const thumbFile = thumbFileInput.files[0];
            if (thumbFile) {
                finalThumbUrl = await uploadThumbnail(thumbFile);
            }

            // 2. Save Course
            const courseData = { title, description, price, thumbnail_url: finalThumbUrl };
            let courseId = id;

            if (id) {
                const { error } = await db.from('courses').update(courseData).eq('id', id);
                if (error) throw error;
            } else {
                const { data, error } = await db.from('courses').insert([courseData]).select();
                if (error) throw error;
                courseId = data[0].id;
            }

            // 3. Handle Lessons
            const lessonRows = modalLessonsList.querySelectorAll('.lesson-row');
            const lessonsData = Array.from(lessonRows).map((row, index) => {
                const lessonId = row.querySelector('.lesson-id').value;
                const lesson = {
                    course_id: courseId,
                    title: row.querySelector('.lesson-title').value,
                    type: row.querySelector('.lesson-type').value,
                    content: row.querySelector('.lesson-content').value,
                    order_index: index
                };
                if (lessonId) lesson.id = lessonId;
                return lesson;
            });

            // Delete removed lessons (those NOT in current modal list but previously in DB)
            if (id) {
                const existingLessonIds = lessonsData.filter(l => l.id).map(l => l.id);
                if (existingLessonIds.length > 0) {
                    await db.from('lessons').delete().eq('course_id', id).not('id', 'in', `(${existingLessonIds.join(',')})`);
                } else {
                    await db.from('lessons').delete().eq('course_id', id);
                }
            }

            // Upsert remaining lessons
            if (lessonsData.length > 0) {
                const { error: lessonError } = await db.from('lessons').upsert(lessonsData);
                if (lessonError) throw lessonError;
            }

            modalCourse.classList.remove('active');
            fetchCourses();
            alert('Course and lessons saved successfully!');
        } catch (err) {
            console.error('Error saving:', err);
            alert('Error saving course/lessons: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Course & Lessons';
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

            thumbUrlHidden.value = course.thumbnail_url || '';
            if (course.thumbnail_url) {
                thumbPreview.src = course.thumbnail_url;
                thumbPreview.style.display = 'block';
            } else {
                thumbPreview.style.display = 'none';
            }

            // Fetch and populate lessons
            modalLessonsList.innerHTML = '';
            const { data: lessons, error: lessonError } = await db.from('lessons')
                .select('*')
                .eq('course_id', id)
                .order('order_index', { ascending: true });

            if (lessonError) throw lessonError;

            if (lessons && lessons.length > 0) {
                lessons.forEach(l => addLessonRow(l));
            } else {
                addLessonRow();
            }

            document.getElementById('course-modal-title').textContent = 'Edit Course';
            modalCourse.classList.add('active');
        } catch (err) {
            alert('Error loading course details: ' + err.message);
        }
    };

    window.deleteLesson = async (id, rowId) => {
        if (id) {
            if (confirm('Delete this lesson permanently?')) {
                const { error } = await db.from('lessons').delete().eq('id', id);
                if (error) alert('Error deleting lesson: ' + error.message);
                else if (document.getElementById(rowId)) document.getElementById(rowId).remove();
            }
        } else {
            if (document.getElementById(rowId)) document.getElementById(rowId).remove();
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

            if (courses.length === 0) {
                coursesTable.innerHTML = '<tr><td colspan="5" style="text-align: center;">No courses found.</td></tr>';
                return;
            }

            coursesTable.innerHTML = courses.map(course => `
                <tr>
                    <td><img src="${course.thumbnail_url || 'https://via.placeholder.com/60x40'}" style="width: 60px; border-radius: 4px;" onerror="this.src='https://via.placeholder.com/60x40'"></td>
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

})();
