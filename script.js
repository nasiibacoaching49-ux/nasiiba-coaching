// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });

        // Close mobile nav on link click
        document.querySelectorAll('.nav__list .nav__link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }

    // Header scroll effect
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.15)';
            } else {
                header.style.boxShadow = 'none';
            }
        });
    }

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
        fetchDynamicTestimonials();
        fetchDynamicGallery();
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

            grid.innerHTML = courses.map(c => `
                    <article class="course-card reveal" style="cursor: pointer;" onclick="window.location.href='course.html?id=${c.id}'">
                        <div class="course-card__image">
                            <img src="${c.thumbnail_url || 'images/course-placeholder.jpg'}" alt="${c.title}">
                            <div class="course-card__overlay">
                                <div class="course-card__hover-content">
                                    <h4 class="course-card__hover-title" style="color: white; margin-bottom: 10px;">${c.title}</h4>
                                    <p class="course-card__hover-desc" style="color: rgba(255,255,255,0.9); font-size: 0.85rem; line-height: 1.4;">
                                        ${c.description ? c.description.substring(0, 120) + '...' : 'Dive into professional coaching with Abdullahi Yusuf.'}
                                    </p>
                                    <div style="margin-top: 20px;">
                                        <span class="btn btn--outline" style="border-color: white; color: white;">Learn More</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="course-card__stats-bar">
                            <div class="stat-item"><i class="far fa-user"></i> <span>${c.views_count || 0} Learners</span></div>
                            <div class="stat-item"><i class="far fa-star"></i> <span>5.0</span></div>
                        </div>
                        <div class="course-card__body">
                            <span class="course-card__category">NASIIBA COACHING</span>
                            <h3 class="course-card__title">
                                <a href="course.html?id=${c.id}">${c.title}</a>
                            </h3>
                            <div class="course-card__footer-premium">
                                <div class="course-card__price-section">
                                    <span class="course-card__price">$${c.price}</span>
                                </div>
                                <div class="course-card__stars">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                </div>
                            </div>
                        </div>
                    </article>
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

    async function fetchDynamicTestimonials() {
        const swiperWrapper = document.querySelector('.testimonial-swiper .swiper-wrapper');
        if (!swiperWrapper) return;

        try {
            const { data: testimonials, error } = await db.from('testimonials')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('[Testimonials] Supabase error, keeping static content:', error.message);
                return;
            }

            if (!testimonials || testimonials.length === 0) {
                console.log('[Testimonials] No dynamic content found, keeping static.');
                return;
            }

            swiperWrapper.innerHTML = testimonials.map(t => `
                <div class="swiper-slide">
                    <div class="testimonial-card">
                        <div class="testimonial-card__header">
                            <img src="${t.avatar_url || 'https://via.placeholder.com/60x60'}" alt="${t.name}" class="testimonial-card__avatar">
                            <div>
                                <h4 class="testimonial-card__name">${t.name}</h4>
                                <p class="testimonial-card__role">${t.role || 'Verified Student'}</p>
                            </div>
                        </div>
                        <div class="testimonial-card__rating">
                            ${Array(t.rating).fill('<i class="fas fa-star"></i>').join('')}
                        </div>
                        <p class="testimonial-card__text">"${t.content}"</p>
                    </div>
                </div>
            `).join('');

            if (window.testimonialSwiper) window.testimonialSwiper.update();
        } catch (err) {
            console.error('Error loading testimonials:', err);
        }
    }

    async function fetchDynamicGallery() {
        const swiperWrapper = document.querySelector('.gallery-swiper .swiper-wrapper');
        if (!swiperWrapper) return;

        try {
            const { data: gallery, error } = await db.from('galleries')
                .select('*')
                .eq('is_featured', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('[Gallery] Supabase error, keeping static content:', error.message);
                return;
            }

            if (!gallery || gallery.length === 0) return;

            swiperWrapper.innerHTML = gallery.map(item => `
                <div class="swiper-slide">
                    <div class="gallery-slide-img">
                        <img src="${item.image_url}" alt="${item.title}">
                    </div>
                </div>
            `).join('');

            if (window.gallerySwiper) window.gallerySwiper.update();
        } catch (err) {
            console.error('Error loading gallery:', err);
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
        const pricingGrid = document.querySelector('.pricing-grid');
        const blogGrid = document.getElementById('blog-list-container');

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

                // 1. Prefer explicit data attributes (Reliable)
                const dataTitle = btn.getAttribute('data-course-title');
                const dataPrice = btn.getAttribute('data-course-price');
                if (dataTitle && dataPrice) {
                    window.openPaymentModal(dataTitle, dataPrice);
                    return;
                }

                // 2. Check if inside a course card (Fallback)
                const card = btn.closest('.course-card');
                if (card) {
                    const titleEl = card.querySelector('.course-card__title');
                    const priceEl = card.querySelector('.course-card__price') || card.querySelector('.course-card__price-tag');
                    const title = titleEl ? titleEl.textContent : 'Course';
                    const price = priceEl ? priceEl.textContent : '$0';
                    window.openPaymentModal(title, price);
                    return;
                }

                // 3. Check if inside an enrollment card (Course Detail Page Fallback)
                const enrollCard = btn.closest('.enrollment-card');
                if (enrollCard) {
                    const titleEl = document.getElementById('course-title-display');
                    const priceEl = document.getElementById('course-price-display');
                    const title = titleEl ? (titleEl.textContent.trim() !== 'Course Details' ? titleEl.textContent : 'Course') : 'Course';
                    const price = priceEl ? priceEl.textContent : '$0';
                    window.openPaymentModal(title, price);
                    return;
                }

                // 4. Final Fallback
                window.openPaymentModal('Course', '$0');
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
                        if (!amount || amount <= 0) {
                            throw new Error('Course price not found. Please reload the page and try again.');
                        }
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
                        if (!response.ok) {
                            throw new Error(session.error || 'Could not create Stripe session. Check that Stripe is configured in Vercel.');
                        }
                        if (session.url) {
                            window.location.href = session.url;
                        } else {
                            throw new Error(session.error || 'Could not create Stripe session.');
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
            if (!db) throw new Error('Supabase client not available');

            const { data: course, error } = await db.from('courses').select('*').eq('id', courseId).single();

            if (error || !course) {
                console.error('[Course Details] Course not found:', error);
                document.getElementById('course-details-container').innerHTML = `
                    <div class="container" style="padding: 100px 20px; text-align: center;">
                        <h2>Course Not Found</h2>
                        <p>The course you are looking for does not exist or has been removed.</p>
                        <a href="index.html#courses" class="btn btn--gold">Back to Courses</a>
                    </div>`;
                return;
            }

            if (course) {
                // Explicitly update Banner Content
                const titleDisplay = document.getElementById('course-title-display');
                const descDisplay = document.getElementById('course-desc-display');
                if (titleDisplay) titleDisplay.textContent = course.title;
                if (descDisplay) descDisplay.textContent = course.description;

                // Update Page Title
                document.title = `${course.title} | NASIIBA COACHING`;

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

                // Update ALL Enrollment Buttons (main and any others that exist)
                const updateEnrollButtons = (cId, cTitle, cPrice) => {
                    document.querySelectorAll('.btn-enroll').forEach(btn => {
                        // Only update if it doesn't already have specific related-course data
                        if (!btn.hasAttribute('data-course-id') || btn.getAttribute('data-course-id') === cId) {
                            btn.setAttribute('data-course-id', cId);
                            btn.setAttribute('data-course-title', cTitle);
                            btn.setAttribute('data-course-price', cPrice);
                        }
                    });
                };
                updateEnrollButtons(course.id, course.title, course.price);

                if (thumbEl) {
                    let thumbUrl = course.thumbnail_url || 'images/course-placeholder.jpg';
                    // Only add images/ prefix if it's a simple filename (no dots other than extension, no slashes)
                    if (thumbUrl && !thumbUrl.startsWith('http') && !thumbUrl.includes('/') && thumbUrl.includes('.')) {
                        thumbUrl = 'images/' + thumbUrl;
                    }
                    thumbEl.src = thumbUrl;
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
                            <article class="course-card reveal" style="cursor: pointer;" onclick="window.location.href='course.html?id=${c.id}'">
                                <div class="course-card__image">
                                    <img src="${c.thumbnail_url || 'images/course-placeholder.jpg'}" alt="${c.title}" class="course-card__img">
                                    <div class="course-card__overlay">
                                        <div class="course-card__hover-content">
                                            <h4 class="course-card__hover-title" style="color: white; margin-bottom: 10px;">${c.title}</h4>
                                            <p class="course-card__hover-desc" style="color: rgba(255,255,255,0.9); font-size: 0.85rem; line-height: 1.4;">
                                                ${c.description ? c.description.substring(0, 120) + '...' : 'View course details and enrollment options.'}
                                            </p>
                                            <div style="margin-top: 15px;">
                                                <span class="btn btn--outline" style="border-color: white; color: white;">Learn More</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="course-card__body" style="padding: 20px 15px;">
                                    <div class="course-card__meta" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                        <span class="course-card__tag" style="font-size: 0.75rem; color: var(--gold); font-weight: 700;">Premium</span>
                                        <span class="course-card__price" style="font-weight: 800; color: var(--navy);">$${c.price}</span>
                                    </div>
                                    <h3 class="course-card__title" style="font-size: 1.1rem; margin-bottom:10px;">
                                        <a href="course.html?id=${c.id}">${c.title}</a>
                                    </h3>
                                    <div class="course-card__stats" style="display: flex; gap: 15px; font-size: 0.8rem; color: var(--text-light);">
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

                        // Enrollment buttons removed from cards, so we don't need to re-initialize here
                        // unless we add them back. Currently adhering to user request for hover desc.

                    } else {
                        const section = document.getElementById('related-courses-section');
                        if (section) section.style.display = 'none';
                    }
                };

                fetchRelatedCourses();

                // Trigger I18n update after content is loaded
                if (window.I18n && typeof window.I18n.updatePageContent === 'function') {
                    window.I18n.updatePageContent();
                }
            }
        } catch (err) {
            console.error('[Course Details] Error fetching info:', err);
            const container = document.getElementById('course-details-container');
            if (container) {
                container.innerHTML = `
                    <div class="container" style="padding: 100px 20px; text-align: center;">
                        <h2 style="color: var(--navy);">Something went wrong</h2>
                        <p style="color: var(--text-light); margin-bottom: 30px;">We encountered an error while loading the course information. Please try again later.</p>
                        <a href="index.html#courses" class="btn btn--gold">Back to Courses</a>
                    </div>`;
            }
        }
    };

    window.showBlogPostModal = async (id) => {
        try {
            const { data: post, error } = await db.from('blogs').select('*').eq('id', id).single();
            if (error) throw error;

            let modal = document.getElementById('blog-post-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'blog-post-modal';
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                        <button class="modal__close"><i class="fas fa-times"></i></button>
                        <div class="modal__body" style="padding: 50px;">
                            <span id="modal-blog-category" class="section__label" style="display: block; margin-bottom: 20px;"></span>
                            <h2 id="modal-blog-title" class="section__title" style="text-align: left; margin-bottom: 30px; font-size: 2.5rem;"></h2>
                            <div id="modal-blog-meta" style="margin-bottom: 40px; color: var(--text-light); border-bottom: 1px solid var(--border-color); padding-bottom: 20px;"></div>
                            <img id="modal-blog-image" src="" style="width: 100%; height: 400px; object-fit: cover; border-radius: var(--radius-lg); margin-bottom: 40px; display: none;">
                            <div id="modal-blog-content" class="blog-post-body" style="line-height: 1.8; font-size: 1.1rem; color: var(--text-color);"></div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                modal.querySelector('.modal__close').addEventListener('click', () => modal.classList.remove('active'));
                modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
            }

            document.getElementById('modal-blog-title').textContent = post.title;
            document.getElementById('modal-blog-category').textContent = post.category || 'General';
            document.getElementById('modal-blog-meta').innerHTML = `By <strong>${post.author_name || 'Abdullahi Yusuf'}</strong> • Published on ${new Date(post.created_at).toLocaleDateString()}`;

            const modalImg = document.getElementById('modal-blog-image');
            if (post.thumbnail_url) {
                modalImg.src = post.thumbnail_url;
                modalImg.style.display = 'block';
            } else {
                modalImg.style.display = 'none';
            }

            document.getElementById('modal-blog-content').innerHTML = post.content.replace(/\n/g, '<br>');
            modal.classList.add('active');

            db.from('blogs').update({ views_count: (post.views_count || 0) + 1 }).eq('id', id).then();
        } catch (err) {
            console.error('Error showing post:', err);
            alert('Could not load the full article.');
        }
    };

    async function fetchBlogs() {
        if (!blogGrid) return;
        try {
            const { data: blogs, error } = await db.from('blogs').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (!blogs || blogs.length === 0) {
                blogGrid.innerHTML = '<div style="text-align: center; padding: 60px; width: 100%;"><p style="color: var(--text-light);">No articles found yet. Check back soon!</p></div>';
                return;
            }
            blogGrid.innerHTML = blogs.map(post => `
                <article class="blog-post-card reveal">
                    <div class="blog-post-card__image">
                        <img src="${post.thumbnail_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&fit=crop'}" 
                             alt="${post.title}" onerror="this.src='https://via.placeholder.com/400x250'">
                    </div>
                    <div class="blog-post-card__content">
                        <span class="blog-post-card__meta">${post.category || 'General'} • ${new Date(post.created_at).toLocaleDateString()}</span>
                        <h2 class="blog-post-card__title" style="margin-bottom: 15px;">${post.title}</h2>
                        <p class="blog-post-card__excerpt" style="margin-bottom: 25px;">${post.excerpt || (post.content.substring(0, 150) + '...')}</p>
                        <button class="btn btn--navy btn--sm" onclick="showBlogPostModal('${post.id}')">Read Article</button>
                    </div>
                </article>
            `).join('');
            if (window.observer) {
                blogGrid.querySelectorAll('.reveal').forEach(el => window.observer.observe(el));
            }
        } catch (err) {
            console.error('Error fetching blogs:', err);
            blogGrid.innerHTML = '<p style="text-align: center; color: var(--gold); padding: 40px;">Error loading blogs.</p>';
        }
    }

    if (blogGrid) fetchBlogs();
    initCourseDetails();
});
