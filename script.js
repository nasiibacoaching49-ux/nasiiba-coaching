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

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add fade-in class to animated elements
    const animatedElements = document.querySelectorAll(
        '.service-card, .course-card, .testimonial-card, .trust__image-wrapper, .trust__content'
    );

    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

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
