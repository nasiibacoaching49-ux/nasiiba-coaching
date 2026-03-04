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
            }
        });
    }, observerOptions);

    window.observer = observer;

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
    // DYNAMIC HERO TEXT
    // ===========================
    const dynamicWord = document.getElementById('dynamic-word');
    if (dynamicWord) {
        const words = ['hero_business', 'hero_life'];
        let currentIndex = 0;

        setInterval(() => {
            currentIndex = (currentIndex + 1) % words.length;
            const nextWordKey = words[currentIndex];

            // Fade out
            dynamicWord.style.opacity = '0';
            dynamicWord.style.transform = 'translateY(10px)';
            dynamicWord.style.transition = 'all 0.5s ease';

            setTimeout(() => {
                // Update text using I18n if available
                dynamicWord.setAttribute('data-i18n', nextWordKey);
                if (window.I18n && typeof window.I18n.updatePageContent === 'function') {
                    window.I18n.updatePageContent();
                } else {
                    // Fallback
                    dynamicWord.textContent = nextWordKey === 'hero_life' ? 'Life.' : 'Business.';
                }

                // Fade in
                dynamicWord.style.opacity = '1';
                dynamicWord.style.transform = 'translateY(0)';
            }, 500);
        }, 4000);
    }

    // ===========================
    // RAIN ANIMATION (DARK MODE)
    // ===========================
    function createRain() {
        const rainContainer = document.getElementById('rain-container');
        if (!rainContainer) return;

        const dropCount = 100;
        for (let i = 0; i < dropCount; i++) {
            const drop = document.createElement('div');
            drop.classList.add('drop');
            drop.style.left = Math.random() * 100 + 'vw';
            drop.style.animationDuration = 0.5 + Math.random() * 1.5 + 's';
            drop.style.animationDelay = Math.random() * 2 + 's';
            rainContainer.appendChild(drop);
        }
    }
    createRain();

    // ===========================
    // SWIPER TESTIMONIALS
    // ===========================
    function initTestimonialSwiper(isRTL = false) {
        if (typeof Swiper !== 'undefined') {
            const swiperEl = document.querySelector('.testimonial-swiper');
            if (swiperEl) {
                if (window.testimonialSwiper && typeof window.testimonialSwiper.destroy === 'function') {
                    window.testimonialSwiper.destroy(true, true);
                }
                window.testimonialSwiper = new Swiper('.testimonial-swiper', {
                    loop: true,
                    spaceBetween: 30,
                    rtl: isRTL,
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
                    }
                });
            }
        }
    }

    // Initial check for RTL
    const initialRTL = document.documentElement.getAttribute('dir') === 'rtl';
    initTestimonialSwiper(initialRTL);

    // ===========================
    // DYNAMIC GALLERY ROTATION (Swiper)
    // ===========================
    function initGalleryRotation(isRTL = false) {
        if (typeof Swiper !== 'undefined') {
            const gallerySwiperEl = document.querySelector('.gallery-swiper');
            if (gallerySwiperEl) {
                if (window.gallerySwiper && typeof window.gallerySwiper.destroy === 'function') {
                    window.gallerySwiper.destroy(true, true);
                }
                window.gallerySwiper = new Swiper('.gallery-swiper', {
                    slidesPerView: 1,
                    spaceBetween: 30,
                    loop: true,
                    rtl: isRTL,
                    autoplay: {
                        delay: 4000,
                        disableOnInteraction: false,
                    },
                    pagination: {
                        el: '.swiper-pagination',
                        clickable: true,
                    },
                    breakpoints: {
                        768: {
                            slidesPerView: 2,
                            spaceBetween: 30,
                        }
                    }
                });
            }
        }
    }
    initGalleryRotation(initialRTL);

    // ===========================
    // GLOBAL LANGUAGE LISTENER
    // ===========================
    window.addEventListener('languageChanged', (e) => {
        const lang = e.detail.lang;
        const isNowRTL = ['ar'].includes(lang);

        // 1. Re-init swipers with correct direction
        initTestimonialSwiper(isNowRTL);
        initGalleryRotation(isNowRTL);

        // 2. Update service modal if open
        if (typeof window.checkAndPopulateServiceModal === 'function') {
            window.checkAndPopulateServiceModal();
        }
    });

    // ===========================
    // DYNAMIC COURSES & REVIEWS
    // ===========================
    const db = window.supabaseClient;

    async function initDynamicContent() {
        if (!db) return;
        fetchDynamicCourses();
        // NOTE: fetchDynamicReviews disabled — it replaces static HTML
        // (which has data-i18n attributes for all 5 languages) with
        // dynamic DB content that cannot be translated. Static testimonials
        // are the correct approach for a multi-language site.
        // fetchDynamicReviews();
    }

    async function fetchDynamicCourses() {
        const grid = document.getElementById('courses-grid');
        if (!grid) {
            console.warn('[Courses] Grid element #courses-grid not found on this page.');
            return;
        }

        try {
            console.log('[Courses] Fetching dynamic courses from Supabase...');
            const db = window.supabaseClient;
            if (!db) throw new Error('Supabase client not available');
            const { data: courses, error } = await db.from('courses').select('*').order('created_at', { ascending: false });

            if (error) throw error;

            console.log(`[Courses] Successfully fetched ${courses ? courses.length : 0} courses.`);

            if (!courses || courses.length === 0) {
                console.info('[Courses] No courses found in database. Keeping static HTML or empty grid.');
                return;
            }

            grid.innerHTML = courses.map((course, index) => `
                <div class="course-card reveal stagger-${(index % 3) + 1}" data-course-id="${course.id}">
                    <div class="course-card__image">
                        ${course.is_distinguished ? '<div class="course-card__badge-distinguished">Distinguished</div>' : ''}
                        <img src="${course.thumbnail_url || 'https://via.placeholder.com/400x250'}" alt="${course.title}" onerror="this.src='https://via.placeholder.com/400x250'">
                        <div class="course-card__overlay-premium">
                            <h4 class="course-card__hover-title">${course.title}</h4>
                            <p class="course-card__hover-desc">${course.description || ''}</p>
                            <div class="course-card__hover-actions">
                                <a href="course.html?id=${course.id}" class="btn btn--outline btn--sm">Details</a>
                                <button class="btn btn--gold btn--sm btn-enroll" data-course-id="${course.id}" data-course-title="${course.title}" data-course-price="${course.price}">Get Course</button>
                            </div>
                        </div>
                    </div>
                    <div class="course-card__stats-bar">
                        <div class="stat-item"><i class="far fa-eye"></i> <span>${course.views_count || 0}</span></div>
                        <div class="stat-item"><i class="far fa-comment"></i> <span>${course.comments_count || 0}</span></div>
                    </div>
                    <div class="course-card__body">
                        <p class="course-card__category">Paid courses</p>
                        <h3 class="course-card__title">${course.title}</h3>
                        <div class="course-card__footer-premium">
                            <div class="course-card__price-section">
                                <span class="course-card__old-price">$${Math.round(course.price * 1.5)}</span>
                                <span class="course-card__price">$${course.price}</span>
                            </div>
                            <div class="course-card__stars">
                                4.9 <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            // Re-observe new elements for reveal animations
            if (window.observer) {
                grid.querySelectorAll('.reveal').forEach(el => {
                    window.observer.observe(el);
                });
            }
        } catch (err) {
            console.error('[Courses] Error loading dynamic courses:', err);
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

            if (error) {
                console.warn('[Reviews] Supabase error, keeping static testimonials:', error.message);
                return;
            }

            // Only replace static content if we actually have dynamic reviews
            if (!reviews || reviews.length === 0) {
                console.log('[Reviews] No dynamic reviews found, keeping static testimonials.');
                return;
            }

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
        window.checkAndPopulateServiceModal = () => {
            if (currentOpenService && serviceModal.classList.contains('active')) {
                populateModalList(currentOpenService);
            }
        };
    }

    // ===========================
    // COUPON & PAYMENT ICONS
    // ===========================
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) {
        const paymentClose = document.getElementById('payment-modal-close');
        const courseTitle = document.getElementById('payment-course-title');
        const coursePrice = document.getElementById('payment-course-price');
        const couponInput = document.getElementById('coupon-code');
        const applyBtn = document.getElementById('apply-coupon');
        const couponMsg = document.getElementById('coupon-message');
        const paymentIcons = document.querySelectorAll('.payment-icon');

        let originalPriceValue = 0;
        const COUPONS = {
            'NASIIBA20': 0.20,
            'WELCOME10': 0.10,
            'SPECIAL': 0.50
        };

        window.openPaymentModal = (title, priceText) => {
            courseTitle.textContent = title;
            coursePrice.textContent = priceText;
            originalPriceValue = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

            // Reset coupon
            couponInput.value = '';
            couponMsg.textContent = '';
            couponMsg.className = 'coupon-msg';

            paymentModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closePaymentModal = () => {
            paymentModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        // Delegate click for enrollment buttons
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-enroll, [data-i18n="enroll"]');
            if (btn) {
                e.preventDefault();

                // 1. Check if inside a course card (Homepage)
                const card = btn.closest('.course-card');
                if (card) {
                    const titleEl = card.querySelector('.course-card__title');
                    const priceEl = card.querySelector('.course-card__price') || card.querySelector('.course-card__price-tag');
                    const title = titleEl ? titleEl.textContent : 'Course';
                    const price = priceEl ? priceEl.textContent : '$0';
                    window.openPaymentModal(title, price);
                    return;
                }

                // 2. Check if inside an enrollment card (Course Detail Page)
                const enrollCard = btn.closest('.enrollment-card');
                if (enrollCard) {
                    const titleEl = document.getElementById('course-title-display');
                    const priceEl = document.getElementById('course-price-display');
                    const title = titleEl ? titleEl.textContent : 'Course';
                    const price = priceEl ? priceEl.textContent : '$0';
                    window.openPaymentModal(title, price);
                    return;
                }

                // 3. Fallback for any other .btn-enroll (e.g. from attributes)
                const title = btn.getAttribute('data-course-title') || 'Course';
                const price = btn.getAttribute('data-course-price') || '$0';
                window.openPaymentModal(title, price);
            }
        });

        paymentClose.addEventListener('click', closePaymentModal);
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) closePaymentModal();
        });

        // Coupon Logic
        applyBtn.addEventListener('click', () => {
            const code = couponInput.value.trim().toUpperCase();
            if (COUPONS[code]) {
                const discount = originalPriceValue * COUPONS[code];
                const newPrice = originalPriceValue - discount;
                coursePrice.textContent = '$' + newPrice.toFixed(2);
                couponMsg.textContent = `Success! ${code} applied (${COUPONS[code] * 100}% off)`;
                couponMsg.className = 'coupon-msg success';
            } else {
                couponMsg.textContent = 'Invalid coupon code.';
                couponMsg.className = 'coupon-msg error';
                coursePrice.textContent = '$' + originalPriceValue.toFixed(2);
            }
        });

        // Payment Method Selection
        const phoneInputSection = document.getElementById('phone-input-section');
        paymentIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                paymentIcons.forEach(i => i.classList.remove('active'));
                icon.classList.add('active');

                const method = icon.getAttribute('data-method');
                if (method === 'evc' || method === 'edahab') {
                    phoneInputSection.style.display = 'block';
                } else {
                    phoneInputSection.style.display = 'none';
                }
            });
        });

        // Proceed to Payment
        const proceedBtn = document.getElementById('proceed-payment');
        const authPrompt = document.getElementById('auth-prompt');

        const checkAuthState = async () => {
            try {
                const db = window.supabaseClient;
                if (!db) return false;
                const { data: { session }, error } = await db.auth.getSession();
                if (error) throw error;
                return !!session;
            } catch (err) {
                console.error('[Auth] Error getting session:', err);
                return false;
            }
        };

        const updateModalAuth = async () => {
            const isLoggedIn = await checkAuthState();
            if (isLoggedIn) {
                authPrompt.style.display = 'none';
                proceedBtn.textContent = 'Enroll Now';
            } else {
                authPrompt.style.display = 'block';
                proceedBtn.textContent = 'Register to Enroll';
            }
        };

        // Update auth state on open
        const originalOpenPaymentModal = window.openPaymentModal;
        window.openPaymentModal = async (title, priceText) => {
            originalOpenPaymentModal(title, priceText);
            await updateModalAuth();
        };

        proceedBtn.addEventListener('click', async () => {
            console.log('Proceed button clicked');
            const isLoggedIn = await checkAuthState();
            console.log('Auth state:', isLoggedIn);
            const activeMethod = document.querySelector('.payment-icon.active')?.getAttribute('data-method') || 'evc';
            console.log('Active method:', activeMethod);

            if (!isLoggedIn) {
                window.location.href = 'student.html?view=register';
            } else {
                const amount = parseFloat(coursePrice.textContent.replace(/[^0-9.]/g, '')) || 0;
                const courseTitleVal = courseTitle.textContent;

                proceedBtn.disabled = true;
                proceedBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

                try {
                    if (activeMethod === 'evc' || activeMethod === 'edahab') {
                        const phone = document.getElementById('payer-phone').value.trim();
                        if (!phone || phone.length < 9) {
                            alert('Please enter a valid Somali phone number (9 digits).');
                            proceedBtn.disabled = false;
                            proceedBtn.innerHTML = 'Proceed to Payment';
                            return;
                        }

                        const response = await fetch('/api/process-waafi', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                amount: amount,
                                phone: phone,
                                courseTitle: courseTitleVal
                            })
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`Server Error (${response.status}): ${errorText || 'Check Vercel Logs'}`);
                        }

                        const result = await response.json();
                        if (result.errorCode === '0') {
                            alert('Success! Payment request sent to your phone. Please enter your PIN on your mobile device to complete the enrollment.');
                            window.location.href = 'student.html?tab=courses';
                        } else {
                            // Specific Waafi error handling
                            const errorMsg = result.description || result.error || 'Payment declined or account issue.';
                            if (errorMsg.toLowerCase().includes('balance') || errorMsg.toLowerCase().includes('insufficient')) {
                                throw new Error('haraaga xisaabtada kuguma filna');
                            }
                            throw new Error(`Waafi Error: ${errorMsg}`);
                        }

                    } else if (activeMethod === 'stripe') {
                        const response = await fetch('/api/create-stripe-session', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                amount: amount,
                                courseTitle: courseTitleVal,
                                successUrl: window.location.origin + '/student.html?tab=courses&session_id={CHECKOUT_SESSION_ID}',
                                cancelUrl: window.location.href
                            })
                        });

                        const session = await response.json();
                        if (session.url) {
                            window.location.href = session.url;
                        } else {
                            throw new Error('Could not create Stripe session.');
                        }
                    } else {
                        alert(`Method ${activeMethod} is not fully implemented yet.`);
                        proceedBtn.disabled = false;
                        proceedBtn.innerHTML = 'Proceed to Payment';
                    }

                } catch (err) {
                    console.error('Payment Error:', err);
                    alert('Error: ' + err.message);
                    proceedBtn.disabled = false;
                    proceedBtn.innerHTML = 'Proceed to Payment';
                }
            }
        });
    }

    // ===========================
    // COURSE DETAILS PAGE LOGIC
    // ===========================
    const initCourseDetails = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('id');
        if (!courseId || !document.getElementById('course-details-container')) return;

        try {
            const db = window.supabaseClient;
            const { data: course, error } = await db.from('courses').select('*').eq('id', courseId).single();
            if (error) throw error;

            if (course) {
                // Update Page Title
                document.title = `${course.title} - Nasiiba Coaching`;

                // Select Elements
                const titleEl = document.getElementById('course-title-display');
                const descEl = document.getElementById('course-desc-display');
                const fullDescEl = document.getElementById('course-full-description');
                const priceEl = document.getElementById('course-price-display');
                const oldPriceEl = document.getElementById('course-old-price-display');
                const thumbEl = document.getElementById('course-thumbnail-display');

                // Metadata Elements
                const teacherStatEl = document.querySelector('.course-banner__stats .stat-box:last-child span');
                const studentStatEl = document.getElementById('registered-students');
                const durationEl = document.getElementById('course-duration-display');
                const lecturesEl = document.getElementById('course-lectures-display');
                const videoEl = document.getElementById('course-video-display');

                // Populate Basic Info
                if (titleEl) titleEl.textContent = course.title;
                if (descEl) descEl.textContent = course.description || '';

                // Full Description (Use course.full_description if it exists, else use description)
                if (fullDescEl) {
                    const fullDesc = course.full_description || course.description || 'No detailed description available.';
                    fullDescEl.innerHTML = fullDesc.replace(/\n/g, '<br>');
                }

                if (priceEl) priceEl.textContent = `$${course.price}`;
                if (oldPriceEl) oldPriceEl.textContent = `$${Math.round(course.price * 1.5)}`;

                if (thumbEl) {
                    thumbEl.src = course.thumbnail_url || 'https://via.placeholder.com/400x250';
                    thumbEl.alt = course.title;
                }

                // Populate Metadata Stats
                if (teacherStatEl) teacherStatEl.textContent = course.teacher_name || 'Abdullahi Yusuf';
                if (studentStatEl) studentStatEl.textContent = course.views_count || '0';
                if (durationEl) durationEl.textContent = course.duration || 'Not specified';
                if (lecturesEl) lecturesEl.textContent = course.lectures_count || '5';
                if (videoEl) videoEl.textContent = course.video_minutes ? `${course.video_minutes} minutes` : '60 minutes';

                // Fetch Curriculum (Lessons)
                const curriculumListEl = document.getElementById('course-curriculum-list');
                const { data: lessons, error: lessonsError } = await db.from('lessons')
                    .select('*')
                    .eq('course_id', courseId)
                    .order('order_index', { ascending: true });

                if (!lessonsError && lessons && lessons.length > 0) {
                    curriculumListEl.innerHTML = lessons.map(lesson => `
                        <div class="lesson-item" style="display: flex; align-items: center; justify-between; padding: 15px; border-bottom: 1px solid rgba(0,0,0,0.05); gap: 15px;">
                            <div style="flex-grow: 1; display: flex; align-items: center; gap: 15px;">
                                <i class="${lesson.type === 'video' ? 'fas fa-play-circle' : 'fas fa-file-pdf'}" style="color: var(--gold); font-size: 1.2rem;"></i>
                                <span style="font-weight: 600;">${lesson.title}</span>
                            </div>
                            <span style="font-size: 0.8rem; color: var(--text-light);">${lesson.type.toUpperCase()}</span>
                        </div>
                    `).join('');
                } else {
                    curriculumListEl.innerHTML = '<p>No lessons uploaded yet for this course.</p>';
                }

                // Fetch Related Courses (Upsells)
                const fetchRelatedCourses = async () => {
                    const relatedGridEl = document.getElementById('related-courses-grid');
                    if (!relatedGridEl) return;

                    const { data: relatedCourses, error: relatedError } = await db.from('courses')
                        .select('*')
                        .neq('id', courseId)
                        .limit(3);

                    if (!relatedError && relatedCourses && relatedCourses.length > 0) {
                        relatedGridEl.innerHTML = relatedCourses.map(c => `
                            <article class="course-card reveal">
                                <div class="course-card__img-container">
                                    <img src="${c.thumbnail_url || 'images/course-placeholder.jpg'}" alt="${c.title}" class="course-card__img">
                                    <div class="course-card__overlay">
                                        <div class="course-card__hover-content">
                                            <h4 class="course-card__hover-title">${c.title}</h4>
                                            <p class="course-card__hover-desc">${c.description ? c.description.substring(0, 100) + '...' : ''}</p>
                                            <div class="course-card__hover-actions">
                                                <button class="btn btn--primary btn-enroll" 
                                                        data-course-id="${c.id}" 
                                                        data-course-title="${c.title}" 
                                                        data-course-price="${c.price}">
                                                    Enroll Now
                                                </button>
                                                <a href="course.html?id=${c.id}" class="btn btn--outline">View Details</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="course-card__content">
                                    <div class="course-card__meta">
                                        <span class="course-card__tag">Premium</span>
                                        <span class="course-card__price">$${c.price}</span>
                                    </div>
                                    <h3 class="course-card__title">
                                        <a href="course.html?id=${c.id}">${c.title}</a>
                                    </h3>
                                    <div class="course-card__stats">
                                        <span><i class="far fa-user"></i> ${c.views_count || 0}</span>
                                        <span><i class="far fa-star"></i> 5.0</span>
                                    </div>
                                </div>
                            </article>
                        `).join('');

                        // Observe new elements
                        if (window.observer) {
                            relatedGridEl.querySelectorAll('.reveal').forEach(el => window.observer.observe(el));
                        }
                    } else {
                        const section = document.getElementById('related-courses-section');
                        if (section) section.style.display = 'none';
                    }
                };

                fetchRelatedCourses();
            }
        } catch (err) {
            console.error('[Course Details] Error fetching info:', err);
        }
    };

    initCourseDetails();
});
