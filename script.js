document.addEventListener('DOMContentLoaded', () => {
    
    // --- Sticky Header & Active Link ---
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-links a:not(.btn)');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Active Link Highlighting
        let current = '';
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // --- Mobile Menu Toggle ---
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-links');
    
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
    
    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // --- Scroll Animations (Intersection Observer) ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // --- Screenshot Carousel ---
    const track = document.getElementById('carousel-track');
    if (track) {
        const slides = Array.from(track.children);
        const nextButton = document.querySelector('.next-btn');
        const prevButton = document.querySelector('.prev-btn');
        let currentIndex = 0;
        
        const updateCarousel = () => {
            // Determine how many items are visible based on media queries (approx)
            let itemsPerView = 3;
            if (window.innerWidth <= 768) itemsPerView = 1;
            else if (window.innerWidth <= 1024) itemsPerView = 2;
            
            const slideWidth = slides[0].getBoundingClientRect().width;
            const gap = 32; // 2rem gap
            const amountToMove = (slideWidth + gap) * currentIndex;
            
            track.style.transform = `translateX(-${amountToMove}px)`;
            
            slides.forEach((slide, index) => {
                slide.classList.remove('current-slide');
                if (index === currentIndex + Math.floor(itemsPerView/2) || (itemsPerView===1 && index===currentIndex)) {
                     slide.classList.add('current-slide');
                }
            });
        };
        
        // Initial setup
        window.addEventListener('resize', updateCarousel);
        updateCarousel(); // Run once on load
        
        nextButton.addEventListener('click', () => {
            let itemsPerView = 3;
            if (window.innerWidth <= 768) itemsPerView = 1;
            else if (window.innerWidth <= 1024) itemsPerView = 2;
            
            if (currentIndex < slides.length - itemsPerView) {
                currentIndex++;
                updateCarousel();
            }
        });
        
        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });
    }
});
