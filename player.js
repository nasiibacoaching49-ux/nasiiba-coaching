/**
 * Nasiiba Coaching — Course Player Logic
 * Handles content rendering, lesson switching, and student reviews.
 */

(function () {
    'use strict';

    const db = window.supabaseClient;
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');

    // UI Elements
    const videoPlaceholder = document.getElementById('video-placeholder');
    const pdfPlaceholder = document.getElementById('pdf-placeholder');
    const pdfDownloadLink = document.getElementById('pdf-download-link');
    const lessonListElement = document.getElementById('player-lesson-list');
    const currentLessonTitle = document.getElementById('current-lesson-title');
    const lessonDescription = document.getElementById('lesson-description');
    const coursePlayerTitle = document.getElementById('course-player-title');
    const lessonsCountLabel = document.getElementById('lessons-count');
    const ratingStars = document.querySelectorAll('#rating-input i');
    const reviewForm = document.getElementById('review-form');

    let currentLessons = [];
    let currentStudent = null;
    let selectedRating = 0;

    // Authentication Checks
    async function initPlayer() {
        if (!db) return;
        const { data: { user } } = await db.auth.getUser();

        if (!user) {
            window.location.href = 'student.html';
            return;
        }
        currentStudent = user;

        if (!courseId) {
            alert('No course selected.');
            window.location.href = 'student.html';
            return;
        }

        // Check enrollment (simplified: assuming if they have a link they might be enrolled, 
        // but in real app we'd check the 'orders' table)
        const { data: enrollment } = await db.from('orders')
            .select('*')
            .eq('student_id', user.id)
            .eq('course_id', courseId)
            .eq('status', 'completed')
            .single();

        // For demo/dev purposes, if no order found, we still allow for now or alert
        // if (!enrollment) { alert('You are not enrolled in this course.'); window.location.href = 'student.html'; return; }

        fetchCourseDetails();
    }

    async function fetchCourseDetails() {
        try {
            // Fetch Course
            const { data: course } = await db.from('courses').select('title').eq('id', courseId).single();
            if (course) coursePlayerTitle.textContent = course.title;

            // Fetch Lessons
            const { data: lessons, error } = await db.from('lessons')
                .select('*')
                .eq('course_id', courseId)
                .order('order_index', { ascending: true });

            if (error) throw error;
            currentLessons = lessons;
            renderLessonList(lessons);
            lessonsCountLabel.textContent = `${lessons.length} LESSONS`;

            if (lessons.length > 0) {
                loadLesson(lessons[0].id);
            }
        } catch (err) {
            console.error('Error fetching course data:', err);
        }
    }

    function renderLessonList(lessons) {
        lessonListElement.innerHTML = lessons.map((lesson, index) => `
            <a href="#" class="lesson-item" data-lesson-id="${lesson.id}" onclick="event.preventDefault(); window.loadLesson('${lesson.id}');">
                <div class="lesson-item__icon">${index + 1}</div>
                <div class="lesson-item__info">
                    <h5>${lesson.title}</h5>
                    <span><i class="fas ${lesson.type === 'video' ? 'fa-play-circle' : 'fa-file-alt'}"></i> ${lesson.type.toUpperCase()}</span>
                </div>
            </a>
        `).join('');
    }

    window.loadLesson = (lessonId) => {
        const lesson = currentLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        // Update Active State
        document.querySelectorAll('.lesson-item').forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-lesson-id') === lessonId);
        });

        currentLessonTitle.textContent = lesson.title;

        // Render Content
        if (lesson.type === 'video') {
            videoPlaceholder.style.display = 'block';
            pdfPlaceholder.style.display = 'none';

            // Extract Video ID if it's a YouTube link
            const videoId = extractYouTubeId(lesson.content);
            if (videoId) {
                videoPlaceholder.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1" frameborder="0" allowfullscreen></iframe>`;
            } else {
                videoPlaceholder.innerHTML = `<video src="${lesson.content}" controls style="width:100%;"></video>`;
            }
        } else if (lesson.type === 'pdf') {
            videoPlaceholder.style.display = 'none';
            pdfPlaceholder.style.display = 'block';
            pdfDownloadLink.href = lesson.content;
        }

        // Update Progress (Simulated)
        const progress = (currentLessons.findIndex(l => l.id === lessonId) + 1) / currentLessons.length * 100;
        document.getElementById('course-progress').style.width = `${progress}%`;
    };

    function extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // Rating Logic
    ratingStars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const val = parseInt(star.getAttribute('data-value'));
            highlightStars(val);
        });

        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-value'));
            highlightStars(selectedRating);
        });
    });

    document.getElementById('rating-input').addEventListener('mouseleave', () => {
        highlightStars(selectedRating);
    });

    function highlightStars(val) {
        ratingStars.forEach(s => {
            s.classList.toggle('active', parseInt(s.getAttribute('data-value')) <= val);
            s.classList.toggle('fas', parseInt(s.getAttribute('data-value')) <= val);
            s.classList.toggle('far', parseInt(s.getAttribute('data-value')) > val);
        });
    }

    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (selectedRating === 0) {
            alert('Please select a star rating.');
            return;
        }

        const comment = document.getElementById('review-comment').value;
        const statusEl = document.getElementById('review-status');

        try {
            const { error } = await db.from('reviews').insert([{
                student_id: currentStudent.id,
                course_id: courseId,
                rating: selectedRating,
                comment: comment,
                status: 'pending'
            }]);

            if (error) throw error;

            reviewForm.style.display = 'none';
            statusEl.textContent = 'Thank you! Your review has been submitted for approval.';
            statusEl.style.display = 'block';
        } catch (err) {
            alert('Error submitting review: ' + err.message);
        }
    });

    // Init
    document.addEventListener('DOMContentLoaded', initPlayer);

})();
