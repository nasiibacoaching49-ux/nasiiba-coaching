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
                // Update text using i18n if available
                dynamicWord.setAttribute('data-i18n', nextWordKey);
                if (window.i18n && typeof window.i18n.updatePageContent === 'function') {
                    window.i18n.updatePageContent();
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
    // DYNAMIC GALLERY ROTATION
    // ===========================
    function initGalleryRotation() {
        const galleryGrid = document.getElementById('dynamic-gallery');
        if (!galleryGrid) return;

        const images = [
            'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=450&fit=crop',
            'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=450&fit=crop',
            'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=450&fit=crop',
            'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=450&fit=crop',
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=450&fit=crop',
            'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=450&fit=crop',
            'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=450&fit=crop'
        ];

        let currentIndex = 0;
        const imgElements = [
            document.getElementById('gallery-img-1'),
            document.getElementById('gallery-img-2'),
            document.getElementById('gallery-img-3'),
            document.getElementById('gallery-img-4'),
            document.getElementById('gallery-img-5')
        ];

        setInterval(() => {
            // Pick a random slot to change
            const slotIndex = Math.floor(Math.random() * imgElements.length);
            const imgEl = imgElements[slotIndex];

            if (imgEl) {
                // Smooth fade transition
                imgEl.style.opacity = '0';

                setTimeout(() => {
                    currentIndex = (currentIndex + 1) % images.length;
                    imgEl.src = images[currentIndex];
                    imgEl.style.opacity = '1';
                }, 600);
            }
        }, 3000);
    }
    initGalleryRotation();

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

        const openPaymentModal = (title, priceText) => {
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
        paymentIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                paymentIcons.forEach(i => i.classList.remove('active'));
                icon.classList.add('active');
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
            const isLoggedIn = await checkAuthState();
            const activeMethod = document.querySelector('.payment-icon.active')?.getAttribute('data-method') || 'evc';

            if (!isLoggedIn) {
                window.location.href = 'student.html?view=register';
            } else {
                // Handle payment processing...
                alert(`Proceeding with ${activeMethod.toUpperCase()} payment for ${courseTitle.textContent}`);
                // window.location.href = 'course-player.html';
            }
        });
    }
});
