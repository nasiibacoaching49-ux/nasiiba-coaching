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
        if (viewName === 'affiliates') fetchAffiliates();
        if (viewName === 'blogs') fetchBlogs();
        if (viewName === 'testimonials') fetchTestimonials();
        if (viewName === 'galleries') fetchGalleries();
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

    // Blogs UI Elements
    const modalBlog = document.getElementById('modal-blog');
    const blogForm = document.getElementById('blog-form');
    const blogThumbFileInput = document.getElementById('blog-thumb-file');
    const blogThumbPreview = document.getElementById('blog-thumb-preview');
    const blogThumbUrlHidden = document.getElementById('blog-thumb-url');

    // Testimonials UI Elements
    const modalTestimonial = document.getElementById('modal-testimonial');
    const testimonialForm = document.getElementById('testimonial-form');
    const testimonialAvatarFile = document.getElementById('testimonial-avatar-file');
    const testimonialAvatarPreview = document.getElementById('testimonial-avatar-preview');
    const testimonialAvatarUrlHidden = document.getElementById('testimonial-avatar-url');

    // Gallery UI Elements
    const modalGallery = document.getElementById('modal-gallery');
    const galleryForm = document.getElementById('gallery-form');
    const galleryImageFile = document.getElementById('gallery-image-file');
    const galleryImagePreview = document.getElementById('gallery-image-preview');
    const galleryImageUrlHidden = document.getElementById('gallery-image-url');

    // Manual Enrollment UI Elements
    const modalManualEnroll = document.getElementById('modal-manual-enroll');
    const manualEnrollForm = document.getElementById('manual-enroll-form');
    const enrollCourseSelect = document.getElementById('enroll-course-id');

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

    blogThumbFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                blogThumbPreview.src = e.target.result;
                blogThumbPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    testimonialAvatarFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                testimonialAvatarPreview.src = e.target.result;
                testimonialAvatarPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    galleryImageFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                galleryImagePreview.src = e.target.result;
                galleryImagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Helper: Upload Image to Supabase
    async function uploadThumbnail(file) {
        console.log('[Storage] Starting thumbnail upload:', file.name);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `course-thumbs/${fileName}`;

        const { data, error } = await db.storage
            .from('thumbnails')
            .upload(filePath, file);

        if (error) {
            console.error('[Storage] Upload error:', error);
            throw error;
        }

        const { data: { publicUrl } } = db.storage
            .from('thumbnails')
            .getPublicUrl(filePath);

        console.log('[Storage] Upload successful. Public URL:', publicUrl);
        return publicUrl;
    }

    async function uploadBlogThumbnail(file) {
        console.log('[Storage] Starting blog thumbnail upload:', file.name);
        const fileExt = file.name.split('.').pop();
        const fileName = `blog-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `blog-thumbs/${fileName}`;

        const { data, error } = await db.storage
            .from('thumbnails')
            .upload(filePath, file);

        if (error) {
            console.error('[Storage] Blog thumbnail upload error:', error);
            throw error;
        }

        return publicUrl;
    }

    async function uploadGenericImage(file, folder = 'general') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

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
        const teacher_name = document.getElementById('course-teacher').value;
        const duration = document.getElementById('course-duration').value;
        const lectures_count = document.getElementById('course-lectures').value;
        const video_minutes = document.getElementById('course-minutes').value;
        const views_count = document.getElementById('course-views').value;
        const comments_count = document.getElementById('course-comments').value;
        const is_distinguished = document.getElementById('course-distinguished').checked;

        try {
            // 1. Handle Thumbnail Upload
            let finalThumbUrl = thumbUrlHidden.value;
            const thumbFile = thumbFileInput.files[0];
            if (thumbFile) {
                finalThumbUrl = await uploadThumbnail(thumbFile);
                if (finalThumbUrl) {
                    alert(`Upload Successful!\nImage URL: ${finalThumbUrl}\n\nPlease check if this opens in a new tab.`);
                }
            }

            if (!finalThumbUrl || finalThumbUrl === 'undefined' || finalThumbUrl === 'null') {
                console.warn('[Storage] Warning: No valid thumbnail URL generated.');
            }

            // 2. Save Course
            const courseData = {
                title,
                description,
                price,
                thumbnail_url: finalThumbUrl,
                teacher_name,
                duration,
                lectures_count: parseInt(lectures_count),
                video_minutes: parseInt(video_minutes),
                views_count: parseInt(views_count),
                comments_count: parseInt(comments_count),
                is_distinguished
            };
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

            // Upsert remaining lessons (Split by new vs existing constraints for PostgREST)
            const newLessons = lessonsData.filter(l => !l.id);
            const existingLessons = lessonsData.filter(l => l.id);

            if (newLessons.length > 0) {
                const { error: insertErr } = await db.from('lessons').insert(newLessons);
                if (insertErr) throw new Error('Lesson Insert Error: ' + insertErr.message);
            }

            if (existingLessons.length > 0) {
                const { error: updateErr } = await db.from('lessons').upsert(existingLessons);
                if (updateErr) throw new Error('Lesson Update Error: ' + updateErr.message);
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

    // Blogs Management
    document.getElementById('btn-add-blog').addEventListener('click', () => {
        document.getElementById('blog-modal-title').textContent = 'New Blog Article';
        blogForm.reset();
        document.getElementById('blog-id').value = '';
        blogThumbPreview.style.display = 'none';
        blogThumbUrlHidden.value = '';
        modalBlog.classList.add('active');
    });

    blogForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('blog-save-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';

        const id = document.getElementById('blog-id').value;
        const title = document.getElementById('blog-title').value;
        const excerpt = document.getElementById('blog-excerpt').value;
        const content = document.getElementById('blog-content').value;
        const category = document.getElementById('blog-category').value;
        const author_name = document.getElementById('blog-author').value;

        try {
            // Handle Thumbnail
            let finalThumbUrl = blogThumbUrlHidden.value;
            const thumbFile = blogThumbFileInput.files[0];
            if (thumbFile) {
                finalThumbUrl = await uploadBlogThumbnail(thumbFile);
            }

            const blogData = {
                title,
                excerpt,
                content,
                category,
                author_name,
                thumbnail_url: finalThumbUrl,
                updated_at: new Date().toISOString()
            };

            if (id) {
                const { error } = await db.from('blogs').update(blogData).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await db.from('blogs').insert([blogData]);
                if (error) throw error;
            }

            modalBlog.classList.remove('active');
            fetchBlogs();
            alert('Article saved successfully!');
        } catch (err) {
            console.error('Error saving blog:', err);
            alert('Error saving blog: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Publish Article';
        }
    });

    window.editBlog = async (id) => {
        try {
            const { data: blog, error } = await db.from('blogs').select('*').eq('id', id).single();
            if (error) throw error;

            document.getElementById('blog-id').value = blog.id;
            document.getElementById('blog-title').value = blog.title;
            document.getElementById('blog-excerpt').value = blog.excerpt || '';
            document.getElementById('blog-content').value = blog.content;
            document.getElementById('blog-category').value = blog.category;
            document.getElementById('blog-author').value = blog.author_name;

            blogThumbUrlHidden.value = blog.thumbnail_url || '';
            if (blog.thumbnail_url) {
                blogThumbPreview.src = blog.thumbnail_url;
                blogThumbPreview.style.display = 'block';
            } else {
                blogThumbPreview.style.display = 'none';
            }

            document.getElementById('blog-modal-title').textContent = 'Edit Blog Article';
            modalBlog.classList.add('active');
        } catch (err) {
            alert('Error loading blog details: ' + err.message);
        }
    };

    window.deleteBlog = async (id) => {
        if (confirm('Are you sure you want to delete this article?')) {
            const { error } = await db.from('blogs').delete().eq('id', id);
            if (!error) fetchBlogs();
            else alert('Error: ' + error.message);
        }
    };

    window.editCourse = async (id) => {
        try {
            const { data: course, error } = await db.from('courses').select('*').eq('id', id).single();
            if (error) throw error;

            document.getElementById('course-id').value = course.id;
            document.getElementById('course-title').value = course.title;
            document.getElementById('course-desc').value = course.description;
            document.getElementById('course-price').value = course.price;
            document.getElementById('course-teacher').value = course.teacher_name || 'Abdullahi Yusuf';
            document.getElementById('course-duration').value = course.duration || '';
            document.getElementById('course-lectures').value = course.lectures_count || 0;
            document.getElementById('course-minutes').value = course.video_minutes || 0;
            document.getElementById('course-views').value = course.views_count || 0;
            document.getElementById('course-comments').value = course.comments_count || 0;
            document.getElementById('course-distinguished').checked = course.is_distinguished || false;

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

    // Testimonials Management
    document.getElementById('btn-add-testimonial').addEventListener('click', () => {
        document.getElementById('testimonial-modal-title').textContent = 'New Testimonial';
        testimonialForm.reset();
        document.getElementById('testimonial-id').value = '';
        testimonialAvatarPreview.style.display = 'none';
        testimonialAvatarUrlHidden.value = '';
        modalTestimonial.classList.add('active');
    });

    testimonialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('testimonial-save-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const id = document.getElementById('testimonial-id').value;
        const name = document.getElementById('testimonial-name').value;
        const role = document.getElementById('testimonial-role').value;
        const rating = document.getElementById('testimonial-rating').value;
        const content = document.getElementById('testimonial-content').value;

        try {
            let finalAvatarUrl = testimonialAvatarUrlHidden.value;
            const avatarFile = testimonialAvatarFile.files[0];
            if (avatarFile) {
                finalAvatarUrl = await uploadGenericImage(avatarFile, 'avatars');
            }

            const testimonialData = {
                name,
                role,
                rating: parseInt(rating),
                content,
                avatar_url: finalAvatarUrl
            };

            if (id) {
                const { error } = await db.from('testimonials').update(testimonialData).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await db.from('testimonials').insert([testimonialData]);
                if (error) throw error;
            }

            modalTestimonial.classList.remove('active');
            fetchTestimonials();
            alert('Testimonial saved successfully!');
        } catch (err) {
            console.error('Error saving testimonial:', err);
            alert('Error saving testimonial: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Testimonial';
        }
    });

    window.editTestimonial = async (id) => {
        try {
            const { data: t, error } = await db.from('testimonials').select('*').eq('id', id).single();
            if (error) throw error;

            document.getElementById('testimonial-id').value = t.id;
            document.getElementById('testimonial-name').value = t.name;
            document.getElementById('testimonial-role').value = t.role || 'Student';
            document.getElementById('testimonial-rating').value = t.rating || 5;
            document.getElementById('testimonial-content').value = t.content;

            testimonialAvatarUrlHidden.value = t.avatar_url || '';
            if (t.avatar_url) {
                testimonialAvatarPreview.src = t.avatar_url;
                testimonialAvatarPreview.style.display = 'block';
            } else {
                testimonialAvatarPreview.style.display = 'none';
            }

            document.getElementById('testimonial-modal-title').textContent = 'Edit Testimonial';
            modalTestimonial.classList.add('active');
        } catch (err) {
            alert('Error loading testimonial: ' + err.message);
        }
    };

    window.deleteTestimonial = async (id) => {
        if (confirm('Delete this testimonial?')) {
            const { error } = await db.from('testimonials').delete().eq('id', id);
            if (!error) fetchTestimonials();
            else alert('Error: ' + error.message);
        }
    };

    async function fetchTestimonials() {
        const tableBody = document.querySelector('#testimonials-table tbody');
        if (!tableBody) return;

        try {
            const { data: testimonials, error } = await db.from('testimonials').select('*').order('created_at', { ascending: false });
            if (error) throw error;

            if (testimonials.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No testimonials found.</td></tr>';
                return;
            }

            tableBody.innerHTML = testimonials.map(t => `
                <tr>
                    <td><img src="${t.avatar_url || 'images/avatar-placeholder.png'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
                    <td><strong>${t.name}</strong></td>
                    <td>${t.role}</td>
                    <td>${'★'.repeat(t.rating)}</td>
                    <td>${new Date(t.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn--sm btn--outline" onclick="editTestimonial('${t.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn--sm btn--danger" onclick="deleteTestimonial('${t.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error fetching testimonials:', err);
        }
    }

    // Gallery Management
    document.getElementById('btn-add-gallery').addEventListener('click', () => {
        document.getElementById('gallery-modal-title').textContent = 'New Gallery Item';
        galleryForm.reset();
        document.getElementById('gallery-id').value = '';
        galleryImagePreview.style.display = 'none';
        galleryImageUrlHidden.value = '';
        modalGallery.classList.add('active');
    });

    galleryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('gallery-save-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const id = document.getElementById('gallery-id').value;
        const title = document.getElementById('gallery-title').value;
        const category = document.getElementById('gallery-category').value;
        const is_featured = document.getElementById('gallery-featured').checked;

        try {
            let finalImageUrl = galleryImageUrlHidden.value;
            const imageFile = galleryImageFile.files[0];
            if (imageFile) {
                finalImageUrl = await uploadGenericImage(imageFile, 'gallery');
            }

            if (!finalImageUrl) throw new Error('Please select an image.');

            const galleryData = {
                title,
                category,
                is_featured,
                image_url: finalImageUrl
            };

            if (id) {
                const { error } = await db.from('galleries').update(galleryData).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await db.from('galleries').insert([galleryData]);
                if (error) throw error;
            }

            modalGallery.classList.remove('active');
            fetchGalleries();
            alert('Gallery item saved successfully!');
        } catch (err) {
            console.error('Error saving gallery item:', err);
            alert('Error saving gallery item: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Gallery Item';
        }
    });

    window.editGallery = async (id) => {
        try {
            const { data: g, error } = await db.from('galleries').select('*').eq('id', id).single();
            if (error) throw error;

            document.getElementById('gallery-id').value = g.id;
            document.getElementById('gallery-title').value = g.title;
            document.getElementById('gallery-category').value = g.category || 'Academy';
            document.getElementById('gallery-featured').checked = g.is_featured || false;

            galleryImageUrlHidden.value = g.image_url || '';
            if (g.image_url) {
                galleryImagePreview.src = g.image_url;
                galleryImagePreview.style.display = 'block';
            } else {
                galleryImagePreview.style.display = 'none';
            }

            document.getElementById('gallery-modal-title').textContent = 'Edit Gallery Item';
            modalGallery.classList.add('active');
        } catch (err) {
            alert('Error loading gallery item: ' + err.message);
        }
    };

    window.deleteGallery = async (id) => {
        if (confirm('Delete this gallery item?')) {
            const { error } = await db.from('galleries').delete().eq('id', id);
            if (!error) fetchGalleries();
            else alert('Error: ' + error.message);
        }
    };

    async function fetchGalleries() {
        const tableBody = document.querySelector('#galleries-table tbody');
        if (!tableBody) return;

        try {
            const { data: items, error } = await db.from('galleries').select('*').order('created_at', { ascending: false });
            if (error) throw error;

            if (items.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No gallery items found.</td></tr>';
                return;
            }

            tableBody.innerHTML = items.map(g => `
                <tr>
                    <td><img src="${g.image_url}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                    <td><strong>${g.title}</strong></td>
                    <td><span class="badge badge--warning">${g.category}</span></td>
                    <td>${g.is_featured ? '<i class="fas fa-check-circle" style="color: var(--gold);"></i>' : '-'}</td>
                    <td>${new Date(g.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn--sm btn--outline" onclick="editGallery('${g.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn--sm btn--danger" onclick="deleteGallery('${g.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error fetching galleries:', err);
        }
    }

    // Manual Enrollment
    document.getElementById('btn-manual-enroll').addEventListener('click', async () => {
        // Populate courses dropdown
        try {
            const { data: courses, error } = await db.from('courses').select('id, title').order('title');
            if (error) throw error;

            enrollCourseSelect.innerHTML = '<option value="">-- Choose Course --</option>' +
                courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');

            modalManualEnroll.classList.add('active');
        } catch (err) {
            alert('Error loading courses: ' + err.message);
        }
    });

    manualEnrollForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('manual-enroll-save-btn');
        const email = document.getElementById('enroll-student-email').value;
        const courseId = document.getElementById('enroll-course-id').value;
        const amount = document.getElementById('enroll-amount').value;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enrolling...';

        try {
            // 1. Find student by email
            const { data: student, error: studentError } = await db
                .from('students')
                .select('id')
                .eq('email', email)
                .single();

            if (studentError || !student) {
                throw new Error('Student with this email not found. Please ensure they have registered.');
            }

            // 2. Create Order
            const { error: orderError } = await db.from('orders').insert([{
                student_id: student.id,
                course_id: courseId,
                amount: parseFloat(amount) || 0,
                status: 'completed',
                payment_method: 'admin_manual'
            }]);

            if (orderError) throw orderError;

            alert('Student enrolled successfully!');
            modalManualEnroll.classList.remove('active');
            manualEnrollForm.reset();
            fetchOrders();
        } catch (err) {
            console.error('Manual Enrollment Error:', err);
            alert('Error: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Enroll Student';
        }
    });

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
                students(full_name, email, whatsapp_number),
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
                    <td>
                        <div><strong>${order.students ? order.students.full_name : 'Guest'}</strong></div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">${order.students ? order.students.email : ''}</div>
                        <div style="font-size: 0.75rem; color: var(--gold);">${order.students ? (order.students.whatsapp_number || '') : ''}</div>
                    </td>
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

    async function fetchAffiliates() {
        const tableBody = document.querySelector('#affiliates-table tbody');
        if (!tableBody) return;

        try {
            const { data: affiliates, error } = await db.from('affiliates').select('*').order('created_at', { ascending: false });
            if (error) throw error;

            if (affiliates.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No affiliates found.</td></tr>';
                return;
            }

            tableBody.innerHTML = affiliates.map(aff => `
                <tr>
                    <td><strong>${aff.name}</strong></td>
                    <td>${aff.email}</td>
                    <td>${aff.whatsapp || 'N/A'}</td>
                    <td><code>${aff.ref_code}</code></td>
                    <td>${aff.clicks || 0}</td>
                    <td>${new Date(aff.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error fetching affiliates:', err);
            const msg = err.message ? err.message.toLowerCase() : '';
            if (msg.includes('could not find the table')) {
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--gold); padding: 40px;">
                    <strong>Setup Required:</strong> The 'affiliates' table is missing from your Supabase database.<br>
                    Please create an 'affiliates' table to start tracking partners.
                </td></tr>`;
            } else {
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--gold); padding: 40px;">Error: ${err.message || JSON.stringify(err)}</td></tr>`;
            }
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

    async function fetchBlogs() {
        const tableBody = document.querySelector('#blogs-table tbody');
        if (!tableBody) return;

        try {
            const { data: blogs, error } = await db.from('blogs').select('*').order('created_at', { ascending: false });
            if (error) throw error;

            if (blogs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">No articles found.</td></tr>';
                return;
            }

            tableBody.innerHTML = blogs.map(blog => `
                <tr>
                    <td><img src="${blog.thumbnail_url || 'https://via.placeholder.com/100x60'}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://via.placeholder.com/100x60'"></td>
                    <td><strong>${blog.title}</strong></td>
                    <td><span class="badge badge--warning">${blog.category}</span></td>
                    <td>${new Date(blog.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn--sm btn--outline" onclick="editBlog('${blog.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn--sm btn--danger" onclick="deleteBlog('${blog.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error fetching blogs:', err);
        }
    }

})();
