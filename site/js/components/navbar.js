// Load Navbar Component
fetch('components/navbar.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('navbar-placeholder').innerHTML = data;
    highlightCurrentPage();

  })
  .catch(error => console.error('Error loading navbar:', error));

// js/components/navbar.js

function initNavbar() {
    highlightCurrentPage();
    initMobileMenu();
    initScrollBehavior();
}

function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .btn-book-header');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || href === './' + currentPage) {
            link.classList.add('active');
        }
    });
}

function initMobileMenu() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.navigation');

    if (!mobileBtn || !nav) return;

    mobileBtn.addEventListener('click', () => {
        nav.classList.toggle('mobile-active');
        mobileBtn.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !mobileBtn.contains(e.target)) {
            nav.classList.remove('mobile-active');
            mobileBtn.classList.remove('active');
        }
    });

    // Close mobile menu after clicking any link
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('mobile-active');
            mobileBtn.classList.remove('active');
        });
    });
}

function initScrollBehavior() {
    const header = document.querySelector('header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 80) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Optional: hide on scroll down, show on scroll up
        if (currentScroll > lastScroll && currentScroll > 300) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }

        lastScroll = currentScroll;
    });
}

