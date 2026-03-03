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
                        <img src="${course.thumbnail_url || 'https://via.placeholder.com/400x250'}" alt="${course.title}" onerror="this.src='https://via.placeholder.com/400x250'">
                        <span class="course-card__price-tag">$${Math.round(course.price * 0.4)}</span>
                    </div>
                    <div class="course-card__body">
                        <h3 class="course-card__title">${course.title}</h3>
                        <p class="course-card__desc">${course.description || ''}</p>
                        <div class="course-card__footer">
                            <span class="course-card__price">$${course.price}</span>
                            <button class="btn btn--navy btn--sm btn-enroll" data-i18n="enroll">Enroll</button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Re-observe new elements for reveal animations
            if (window.observer) {
                document.querySelectorAll('.course-card.reveal').forEach(el => window.observer.observe(el));
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

        let openPaymentModal = (title, priceText) => {
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
                const card = btn.closest('.course-card');
                if (card) {
                    const title = card.querySelector('.course-card__title').textContent;
                    const price = card.querySelector('.course-card__price').textContent;
                    openPaymentModal(title, price);
                }
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
            if (!db) return false;
            const { data: { session } } = await db.auth.getSession();
            return !!session;
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
        const originalOpenPaymentModal = openPaymentModal;
        openPaymentModal = async (title, priceText) => {
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
});
