document.addEventListener('DOMContentLoaded', () => {
    // Canvas Background Animation
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let particles = [];
    
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 1.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }
        draw() {
            ctx.fillStyle = `rgba(0, 243, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function initParticles() {
        particles = [];
        const numParticles = Math.min(width * height / 10000, 100);
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    }
    
    initParticles();
    
    function animateBackground() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateBackground);
    }
    
    // Only animate if reduced motion is not preferred
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
        animateBackground();
    }

    // Arrow Grid Centerpiece
    const arrowGrid = document.getElementById('arrowGrid');
    const arrowCount = 25; // 5x5 grid
    
    // Array of futuristic neon colors (checked for > 5.29:1 contrast)
    const neonColors = ['#00f3ff', '#c879ff', '#ff00ff', '#00ffaa', '#ffea00', '#ff5c8a', '#00aeff'];
    
    for (let i = 0; i < arrowCount; i++) {
        const arrow = document.createElement('div');
        arrow.className = 'arrow-item';
        
        // Assign a random neon color to each arrow using a CSS custom property
        const randomColor = neonColors[Math.floor(Math.random() * neonColors.length)];
        arrow.style.setProperty('--arrow-color', randomColor);
        
        arrow.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M12 2L12 22M12 2L20 10M12 2L4 10" />
            </svg>
        `;
        // Random initial rotation
        arrow.style.transform = `rotate(${Math.floor(Math.random() * 4) * 90}deg)`;
        arrowGrid.appendChild(arrow);
    }

    // Parallax & Interactive Arrows
    const heroContainer = document.querySelector('.hero-container');
    const arrows = document.querySelectorAll('.arrow-item');
    
    let mouseX = width / 2;
    let mouseY = height / 2;

    heroContainer.addEventListener('mousemove', (e) => {
        if (prefersReducedMotion) return;
        
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Grid 3D Tilt
        const xAxis = (width / 2 - e.pageX) / 50;
        const yAxis = (height / 2 - e.pageY) / 50;
        arrowGrid.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        
        // Arrow rotation towards mouse
        arrows.forEach(arrow => {
            const rect = arrow.getBoundingClientRect();
            const arrowX = rect.left + rect.width / 2;
            const arrowY = rect.top + rect.height / 2;
            
            const dx = mouseX - arrowX;
            const dy = mouseY - arrowY;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // +90 because the SVG arrow points UP by default (which is -90deg in atan2)
            arrow.style.transform = `rotate(${angle + 90}deg)`;
        });
    });

    // Reset on mouse leave
    heroContainer.addEventListener('mouseleave', () => {
        if (prefersReducedMotion) return;
        arrowGrid.style.transform = `rotateY(0deg) rotateX(0deg)`;
        arrows.forEach(arrow => {
            arrow.style.transform = `rotate(${Math.floor(Math.random() * 4) * 90}deg)`;
        });
    });
});
