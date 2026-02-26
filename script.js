// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
    });

    // Close mobile nav on link click
    document.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
        });
    });

    // Header scroll effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.15)';
        } else {
            header.style.boxShadow = 'none';
        }
    });

    // Intersection Observer for reveal animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once visible
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements with .reveal class
    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });

    // ===========================
    // THEME SWITCHER
    // ===========================
    const themeToggle = document.getElementById('theme-toggle');
    const storageKey = 'nasiiba_theme';

    const getTheme = () => {
        return localStorage.getItem(storageKey) || 'light';
    };

    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(storageKey, theme);
    };

    // Initialize theme
    setTheme(getTheme());

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = getTheme() === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }

    // ===========================
    // SWIPER TESTIMONIALS
    // ===========================
    if (typeof Swiper !== 'undefined') {
        window.testimonialSwiper = new Swiper('.testimonial-swiper', {
            loop: true,
            spaceBetween: 30,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                640: {
                    slidesPerView: 1,
                },
                768: {
                    slidesPerView: 1,
                },
                1024: {
                    slidesPerView: 1,
                },
            }
        });
    }

    // ===========================
    // DYNAMIC COURSES & REVIEWS
    // ===========================
    const db = window.supabaseClient;

    async function initDynamicContent() {
        if (!db) return;
        fetchDynamicCourses();
        fetchDynamicReviews();
    }

    async function fetchDynamicCourses() {
        const grid = document.getElementById('courses-grid');
        if (!grid) return;

        try {
            const { data: courses, error } = await db.from('courses').select('*').order('created_at', { ascending: false });
            if (error) throw error;

            if (!courses || courses.length === 0) return;

            grid.innerHTML = courses.map((course, index) => `
                <div class="course-card reveal stagger-${(index % 3) + 1}" data-course-id="${course.id}">
                    <div class="course-card__image">
                        <img src="${course.thumbnail_url || 'https://via.placeholder.com/400x250'}" alt="${course.title}">
                        <span class="course-card__price-tag">$${Math.round(course.price * 0.4)}</span>
                    </div>
                    <div class="course-card__body">
                        <h3 class="course-card__title">${course.title}</h3>
                        <p class="course-card__desc">${course.description || ''}</p>
                        <div class="course-card__footer">
                            <span class="course-card__price">$${course.price}</span>
                            <a href="student.html" class="btn btn--navy btn--sm">Enroll</a>
                        </div>
                    </div>
                </div>
            `).join('');

            // Re-observe new elements
            document.querySelectorAll('.course-card.reveal').forEach(el => observer.observe(el));
        } catch (err) {
            console.error('Error loading courses:', err);
        }
    }

    async function fetchDynamicReviews() {
        const swiperWrapper = document.querySelector('.testimonial-swiper .swiper-wrapper');
        if (!swiperWrapper) return;

        try {
            const { data: reviews, error } = await db.from('reviews')
                .select(`*, students(full_name)`)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!reviews || reviews.length === 0) return;

            swiperWrapper.innerHTML = reviews.map(review => `
                <div class="swiper-slide">
                    <div class="testimonial-card">
                        <div class="testimonial-card__header">
                            <div class="testimonial-card__avatar-placeholder" style="width:60px; height:60px; background: var(--bg-alt); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; color:var(--gold);">
                                ${review.students ? review.students.full_name.charAt(0) : 'S'}
                            </div>
                            <div>
                                <h4 class="testimonial-card__name">${review.students ? review.students.full_name : 'Student'}</h4>
                                <p class="testimonial-card__role">Verified Student</p>
                            </div>
                        </div>
                        <div class="review-card__rating" style="margin-bottom: 10px; color: var(--gold);">
                            ${Array(review.rating).fill('<i class="fas fa-star"></i>').join('')}
                        </div>
                        <p class="testimonial-card__text">"${review.comment}"</p>
                    </div>
                </div>
            `).join('');

            // Re-init Swiper if it exists
            if (window.testimonialSwiper) {
                window.testimonialSwiper.update();
            }
        } catch (err) {
            console.error('Error loading reviews:', err);
        }
    }

    // Call init
    initDynamicContent();

    // ===========================
    // SERVICE DETAILS MODAL LOGIC
    // ===========================
    const serviceLinks = document.querySelectorAll('.service-card__link[data-service]');
    const serviceModal = document.getElementById('service-modal');

    if (serviceModal && serviceLinks.length > 0) {
        const modalClose = document.getElementById('modal-close');
        const modalTitle = document.getElementById('modal-title');
        const modalIcon = document.getElementById('modal-icon');
        const modalText = document.getElementById('modal-text');
        const modalList = document.getElementById('modal-list');
        let currentOpenService = null;

        const populateModalList = (serviceId) => {
            if (!window.TRANSLATIONS) return;
            const lang = window.I18n ? window.I18n.getLang() : 'en';
            const features = window.TRANSLATIONS[lang][serviceId + '_details_features'];

            if (features && Array.isArray(features)) {
                modalList.innerHTML = features.map(feature =>
                    `<li><i class="fas fa-check-circle"></i> <span>${feature}</span></li>`
                ).join('');
            }
        };

        const openModal = (serviceId, iconHtml) => {
            currentOpenService = serviceId;

            // Set dynamic icon
            modalIcon.innerHTML = iconHtml;

            // Set data-i18n attributes for static text translation
            modalTitle.setAttribute('data-i18n', serviceId + '_title');
            modalText.setAttribute('data-i18n', serviceId + '_details_text');

            // Populate list items (needs manual translation handling)
            populateModalList(serviceId);

            // Re-run i18n to translate the newly set data-i18n attributes
            if (window.I18n) {
                window.I18n.setLang(window.I18n.getLang());
            }

            serviceModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        };

        const closeModal = () => {
            serviceModal.classList.remove('active');
            document.body.style.overflow = '';
            currentOpenService = null;
        };

        serviceLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const serviceId = link.getAttribute('data-service');
                const iconElement = link.closest('.service-card').querySelector('.service-card__icon').innerHTML;
                openModal(serviceId, iconElement);
            });
        });

        // Close events
        modalClose.addEventListener('click', closeModal);
        serviceModal.addEventListener('click', (e) => {
            if (e.target === serviceModal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && serviceModal.classList.contains('active')) {
                closeModal();
            }
        });

        // Handle language change while modal is open
        window.addEventListener('languageChanged', () => {
            if (currentOpenService && serviceModal.classList.contains('active')) {
                populateModalList(currentOpenService);
            }
        });
    }
});
