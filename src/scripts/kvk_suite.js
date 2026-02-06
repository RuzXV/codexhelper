document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.carousel-track');
    if (!track) return;

    const container = document.querySelector('.carousel-container');
    const slides = Array.from(track.children);
    const quickNav = document.getElementById('quick-access-nav');
    const mainTitle = document.getElementById('calculator-main-title');
    const mainDescription = document.getElementById('calculator-main-description');

    const SLIDE_SLUGS = [
        'crystal-tech',
        'timers',
        'flag-calculator'
    ];

    let currentIndex = 0;

    // Check URL for specific tool
    const urlParams = new URLSearchParams(window.location.search);
    const currentTool = urlParams.get('tool');
    if (currentTool) {
        const slugIndex = SLIDE_SLUGS.indexOf(currentTool);
        if (slugIndex !== -1) {
            currentIndex = slugIndex;
        }
    }

    // Build quick nav buttons
    function buildQuickNav() {
        quickNav.innerHTML = '';
        slides.forEach((slide, index) => {
            const title = slide.dataset.title || `Tool ${index + 1}`;
            const button = document.createElement('button');
            button.classList.add('quick-nav-btn');
            if (index === currentIndex) button.classList.add('active');
            button.textContent = title;
            button.addEventListener('click', () => moveToSlide(index));
            quickNav.appendChild(button);
        });
    }

    // Update the hero section with current slide info
    function updateHeroSection() {
        const currentSlide = slides[currentIndex];
        const title = currentSlide.dataset.title || 'KvK Suite';
        const description = currentSlide.dataset.description || '';

        const crystalIcon = window.kvkCrystalIcon || '';
        mainTitle.innerHTML = `<img src="${crystalIcon}" alt="Crystal" style="width: 32px; height: 32px; margin-right: 10px; vertical-align: middle;" />${title}`;
        mainDescription.textContent = description;
    }

    // Move to specific slide
    function moveToSlide(index) {
        if (index < 0 || index >= slides.length) return;

        currentIndex = index;
        const offset = -currentIndex * 100;
        track.style.transform = `translateX(${offset}%)`;

        // Update active state in quick nav
        const buttons = quickNav.querySelectorAll('.quick-nav-btn');
        buttons.forEach((btn, i) => {
            btn.classList.toggle('active', i === currentIndex);
        });

        // Update hero section
        updateHeroSection();

        // Update URL without reload
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('tool', SLIDE_SLUGS[currentIndex]);
        window.history.replaceState({}, '', newUrl);
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Only handle if not inside tech tree
        const techTreeViewport = document.getElementById('tech-tree-viewport');
        if (techTreeViewport && techTreeViewport.contains(document.activeElement)) {
            return;
        }

        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            moveToSlide(currentIndex - 1);
        } else if (e.key === 'ArrowRight' && currentIndex < slides.length - 1) {
            moveToSlide(currentIndex + 1);
        }
    });

    // Initialize
    buildQuickNav();
    moveToSlide(currentIndex);
});
