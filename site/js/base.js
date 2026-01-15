// Main JavaScript
window.addEventListener('load', () => {
    console.log('Bagares Optical Clinic website loaded successfully');
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// js/base.js - Central component loader + smooth scroll helpers

document.addEventListener('DOMContentLoaded', () => {
    const components = [
        { id: 'navbar-placeholder', path: 'components/navbar.html' },
        { id: 'hero-placeholder', path: 'components/hero.html' },
        { id: 'services-preview-placeholder', path: 'components/services-preview.html' },
        { id: 'why-choose-us-placeholder', path: 'components/why-choose-us.html' },
        { id: 'doctors-placeholder',           path: 'components/doctors.html' },
        { id: 'footer-placeholder', path: 'components/footer.html' }
    ];

    components.forEach(comp => {
        fetch(comp.path)
            .then(res => res.ok ? res.text() : Promise.reject('Failed'))
            .then(html => {
                const el = document.getElementById(comp.id);
                if (el) {
                    el.innerHTML = html;
                    // Trigger specific initializers
                    if (comp.id === 'navbar-placeholder') {
                        if (window.initNavbar) window.initNavbar();
                    }
                }
            })
            .catch(err => console.error(`Error loading ${comp.path}:`, err));
    });

    // Enhanced smooth scroll handling (backup + mobile menu close)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Close mobile menu if open
                document.querySelector('.navigation')?.classList.remove('mobile-active');
                document.querySelector('.mobile-menu-btn')?.classList.remove('active');
            }
        });
    });
});