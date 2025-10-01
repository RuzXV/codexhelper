// FAQ Toggle Functionality
function toggleFAQ(button) {
    const faqItem = button.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Open clicked item if it wasn't active
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Patreon Subscribe Function
function subscribePatreon() {
    // Replace with your actual Patreon URL
    const patreonURL = 'https://www.patreon.com/c/kingscodex';
    window.open(patreonURL, '_blank');
}

// Bot Invite Function (kept for compatibility)
function inviteBot() {
    subscribePatreon();
}

// Add particles effect to hero section
function createParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    particlesContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
    `;
    
    hero.appendChild(particlesContainer);
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(59, 130, 246, 0.3);
            border-radius: 50%;
            animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 2}s;
        `;
        particlesContainer.appendChild(particle);
    }
}

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles effect
    createParticles();
    // Handle smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add scroll effect to navbar
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            navbar.style.background = 'rgba(30, 30, 35, 0.4)';
        } else {
            navbar.style.background = 'rgba(30, 30, 35, 0.4)';
        }
        
        lastScrollY = currentScrollY;
    });

    // Commander carousel functionality with touch support
    const track = document.querySelector('.commanders-track');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const cards = document.querySelectorAll('.commander-card');
    const carousel = document.querySelector('.commanders-carousel');
    let cardWidth = 250 + 32; // card width + gap
    let currentIndex = 0;
    const totalCards = cards.length;
    
    // Touch/swipe variables
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let startTime = 0;

    function updateCardWidth() {
        if (window.innerWidth <= 360) {
            cardWidth = 160 + 12;
        } else if (window.innerWidth <= 480) {
            cardWidth = 180 + 16;
        } else if (window.innerWidth <= 768) {
            cardWidth = 200 + 16;
        } else {
            cardWidth = 250 + 32;
        }
    }
    
    function moveToSlide(index) {
        currentIndex = index;
        track.style.transform = `translateX(-${(currentIndex + 1) * cardWidth}px)`;
    }
    
    function nextSlide() {
        if (currentIndex < totalCards - 1) {
            currentIndex++;
            moveToSlide(currentIndex);
        } else {
            track.style.transition = 'none';
            track.style.transform = `translateX(0px)`;
            setTimeout(() => {
                track.style.transition = 'transform 0.5s ease';
                currentIndex = 0;
                moveToSlide(currentIndex);
            }, 10);
        }
    }
    
    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex--;
            moveToSlide(currentIndex);
        } else {
            track.style.transition = 'none';
            track.style.transform = `translateX(-${(totalCards + 1) * cardWidth}px)`;
            setTimeout(() => {
                track.style.transition = 'transform 0.5s ease';
                currentIndex = totalCards - 1;
                moveToSlide(currentIndex);
            }, 10);
        }
    }

    if (prevBtn && nextBtn && track && totalCards > 0) {
        updateCardWidth();
        
        const firstCard = cards[0].cloneNode(true);
        const lastCard = cards[totalCards - 1].cloneNode(true);
        track.appendChild(firstCard);
        track.insertBefore(lastCard, cards[0]);
        
        moveToSlide(0);
        
        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', nextSlide);
        
        if (carousel) {
            let touchStartTime = 0;
            
            carousel.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                touchStartTime = Date.now();
                isDragging = true;
                track.style.transition = 'none';
                e.preventDefault();
            }, { passive: false });
            
            carousel.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                e.preventDefault();
                currentX = e.touches[0].clientX;
                const diffX = currentX - startX;
                const currentTransform = -(currentIndex + 1) * cardWidth;
                track.style.transform = `translateX(${currentTransform + diffX * 0.8}px)`;
            }, { passive: false });
            
            carousel.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                isDragging = false;
                track.style.transition = 'transform 0.5s ease';
                
                const diffX = currentX - startX;
                const timeDiff = Date.now() - startTime;
                const velocity = Math.abs(diffX) / timeDiff;
                
                if (Math.abs(diffX) > 50 || velocity > 0.3) {
                    if (diffX > 0) {
                        prevSlide();
                    } else {
                        nextSlide();
                    }
                } else {
                    moveToSlide(currentIndex);
                }
            }, { passive: true });
        }
        
        window.addEventListener('resize', () => {
            updateCardWidth();
            moveToSlide(currentIndex);
        });
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .stat-item, .faq-item, .feature-showcase-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.style.transition = 'opacity 1s ease, transform 1s ease';
        observer.observe(el);
    });

    const mobileMenuToggle = document.querySelector('.nav-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
    
    function toggleMobileMenu() {
        const isActive = navLinks.classList.contains('active');
        
        if (isActive) {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            document.body.style.position = '';
        } else {
            navLinks.classList.add('active');
            hamburger.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        }
    }
    
    if (mobileMenuToggle && hamburger) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileMenu();
        });
    }
    
    overlay.addEventListener('click', toggleMobileMenu);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            toggleMobileMenu();
        }
    });
    
    document.querySelectorAll('.nav-link, .patreon-btn').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks && navLinks.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });

    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.getAttribute('href') && this.getAttribute('href').startsWith('http')) {
                return;
            }
            
            const originalText = this.innerHTML;
            this.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Loading...';
            
            setTimeout(() => {
                this.innerHTML = originalText;
            }, 1000);
        });
    });

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadApiData();
                
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const sectionToObserve = document.querySelector('.top-servers');
    if (sectionToObserve) {
        statsObserver.observe(sectionToObserve);
    }
});

const style = document.createElement('style');
style.textContent = `
    .animate-spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    
    @keyframes float {
        0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.3;
        }
        50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.8;
        }
    }
    
    .hero-container {
        animation: fadeInUp 0.8s ease-out;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Counter animation */
    .stat-number {
        transition: all 0.3s ease;
    }
    
    /* Server carousel styles */
    .server-carousel-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-4);
        margin-top: 50px;
    }

    .server-list-container {
        overflow: hidden;
        position: relative;
        width: 100%;
        height: 80px;
    }
    
    .server-list {
        display: flex;
        list-style: none;
        padding: 0;
        margin: 0;
        width: max-content;
        animation-name: scroll-left;
        animation-duration: 60s; /* Set a fixed, long duration for smooth speed */
        animation-timing-function: linear;
        animation-iteration-count: infinite;
    }

    .server-list[data-direction="right"] {
        animation-name: scroll-right;
    }
    
    @keyframes scroll-left {
        0% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(-50%);
        }
    }

    @keyframes scroll-right {
        0% {
            transform: translateX(-50%);
        }
        100% {
            transform: translateX(0);
        }
    }
    
    .server-item {
        display: flex;
        align-items: center;
        padding: 0 20px;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        min-width: 250px;
    }
    
    .server-logo {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 15px;
        object-fit: cover;
    }
    
    .server-info {
        display: flex;
        flex-direction: column;
    }
    
    .server-name {
        font-weight: 600;
        font-size: 0.9rem;
        margin: 0 0 5px 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 180px;
    }
    
    .server-members {
        display: flex;
        align-items: center;
        font-size: 0.8rem;
        color: #94a3b8;
    }
    
    .server-members svg {
        margin-right: 5px;
    }
    
    .server-placeholder,
    .server-error {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 80px;
        width: 100%;
        color: #94a3b8;
        font-style: italic;
    }
    
    .server-error {
        color: #ef4444;
    }
    
    .top-servers-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 60px 20px;
    }
    
    .top-servers-header {
        text-align: center;
        margin-bottom: 40px;
    }
    
    .top-servers-text p {
        color: #94a3b8;
        max-width: 600px;
        margin: 15px auto 0;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .server-item {
            min-width: 200px;
            padding: 0 15px;
        }
        
        .server-name {
            font-size: 0.8rem;
            max-width: 140px;
        }
        
        .server-logo {
            width: 35px;
            height: 35px;
            margin-right: 10px;
        }
    }
    
    @media (max-width: 480px) {
        .server-item {
            min-width: 180px;
            padding: 0 10px;
        }
        
        .server-name {
            font-size: 0.75rem;
            max-width: 120px;
        }
        
        .server-members {
            font-size: 0.7rem;
        }
    }
`;
document.head.appendChild(style);

// API Integration Functions
const API_BASE_URL = 'https://api.codexhelper.com';
const STATS_ENDPOINT = '/api/stats';
const TOP_SERVERS_ENDPOINT = '/api/top-servers';

// Function to log messages with timestamps
function logMessage(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    
    switch(type) {
        case 'error':
            console.error(logEntry);
            break;
        case 'warn':
            console.warn(logEntry);
            break;
        case 'debug':
            console.debug(logEntry);
            break;
        default:
            console.log(logEntry);
    }
}

// Enhanced fetch function with CORS handling and fallback
async function fetchApiData(endpoint) {
    const url = API_BASE_URL + endpoint;
    logMessage(`Fetching data from: ${url}`, 'debug');
    
    // Check if we're running locally (file://) and might have CORS issues
    const isLocalFile = window.location.protocol === 'file:';
    if (isLocalFile) {
        logMessage('Running from local file, CORS issues may occur', 'warn');
    }
    
    // Create a timeout promise
    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
    });
    
    try {
        // Configure fetch options
        const fetchOptions = {
            method: 'GET',
            mode: 'cors', // Enable CORS
            cache: 'no-cache',
            credentials: 'omit', // Don't send cookies or auth headers
            headers: {
                'Content-Type': 'application/json',
                // The 'X-Client' header that caused the issue has been REMOVED.
            }
        };
        
        logMessage(`Fetch options: ${JSON.stringify(fetchOptions)}`, 'debug');
        
        // Race the fetch request against the timeout
        const response = await Promise.race([
            fetch(url, fetchOptions),
            timeout
        ]);
        
        logMessage(`Response status for ${endpoint}: ${response.status}`, 'debug');
        logMessage(`Response headers for ${endpoint}: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`, 'debug');
        
        // Log CORS-related headers
        const corsHeaders = [
            'access-control-allow-origin',
            'access-control-allow-credentials',
            'access-control-allow-headers',
            'access-control-allow-methods'
        ];
        
        corsHeaders.forEach(header => {
            const value = response.headers.get(header);
            if (value) {
                logMessage(`CORS Header ${header}: ${value}`, 'debug');
            }
        });
        
        // Check if the origin is allowed
        const allowedOrigin = response.headers.get('access-control-allow-origin');
        if (allowedOrigin) {
            logMessage(`API allows origin: ${allowedOrigin}`, 'debug');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        logMessage(`Response content type: ${contentType}`, 'debug');
        
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON. Content-Type: ' + contentType);
        }
        
        const data = await response.json();
        logMessage(`Successfully fetched data from ${endpoint}`, 'info');
        logMessage(`Data keys: ${Object.keys(data).join(', ')}`, 'debug');
        return data;
    } catch (error) {
        logMessage(`Error fetching data from ${endpoint}: ${error.message}`, 'error');
        
        // Log additional details for different types of errors
        if (error instanceof TypeError) {
            if (error.message.includes('fetch')) {
                logMessage('Network error or CORS issue detected', 'error');
                logMessage('Possible causes:', 'error');
                logMessage('1. API server is unreachable', 'error');
                logMessage('2. CORS policy is blocking the request', 'error');
                logMessage('3. Network connectivity issues', 'error');
                logMessage('4. SSL/TLS certificate issues', 'error');
                
                // Special handling for CORS issues
                if (isLocalFile) {
                    logMessage('NOTE: You are running this from a file:// URL which may cause CORS issues.', 'warn');
                    logMessage('Solution: Deploy to a web server or ask your API provider to allow file:// origins', 'warn');
                    logMessage('For development, you can use a local server (e.g., Python HTTP server)', 'warn');
                }
            } else {
                logMessage(`Type error: ${error.message}`, 'error');
            }
        } else if (error.message.includes('timeout')) {
            logMessage('Request timed out. The server might be slow or unreachable.', 'error');
        } else if (error.message.includes('HTTP error')) {
            logMessage('Server returned an error response', 'error');
        } else {
            logMessage(`Unexpected error: ${error.message}`, 'error');
        }
        
        throw error;
    }
}

// Function to render top servers in carousel format
function renderTopServers(servers) {
    logMessage(`Rendering ${servers.length} servers into two carousel rows`, 'debug');
    const serverListRow1 = document.getElementById('serverListRow1');
    const serverListRow2 = document.getElementById('serverListRow2');
    
    if (!serverListRow1 || !serverListRow2) {
        logMessage('One or both server list elements not found', 'error');
        return;
    }
    
    if (servers.length === 0) {
        serverListRow1.innerHTML = '<li class="server-placeholder">No servers found</li>';
        serverListRow2.innerHTML = ''; // Keep the second row empty
        return;
    }
    
    // Clear the lists
    serverListRow1.innerHTML = '';
    serverListRow2.innerHTML = '';

    // Split servers into two groups (up to 10 each)
    const serversRow1 = servers.slice(0, 10);
    const serversRow2 = servers.slice(10, 20);
    
    // Helper function to create a server item element
    function createServerItem(server) {
        const serverItem = document.createElement('li');
        serverItem.className = 'server-item';
        
        serverItem.innerHTML = `
            <img src="${server.icon_url}" alt="${server.name} Icon" class="server-logo" onerror="this.src='images/logo.png'">
            <div class="server-info">
                <p class="server-name">${server.name}</p>
                <span class="server-members">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="6" cy="6" r="6" fill="#43b581"></circle>
                    </svg>
                    ${server.member_count.toLocaleString()} members
                </span>
            </div>
        `;
        
        return serverItem;
    }
    
    // Populate the first row
    if (serversRow1.length > 0) {
        serversRow1.forEach(server => {
            serverListRow1.appendChild(createServerItem(server));
        });
        // Duplicate for seamless loop
        serversRow1.forEach(server => {
            const duplicateItem = createServerItem(server);
            duplicateItem.setAttribute('aria-hidden', 'true');
            serverListRow1.appendChild(duplicateItem);
        });
    }

    // Populate the second row
    if (serversRow2.length > 0) {
        serversRow2.forEach(server => {
            serverListRow2.appendChild(createServerItem(server));
        });
        // Duplicate for seamless loop
        serversRow2.forEach(server => {
            const duplicateItem = createServerItem(server);
            duplicateItem.setAttribute('aria-hidden', 'true');
            serverListRow2.appendChild(duplicateItem);
        });
    }
}

// Function to load fallback data when API is unavailable
function loadFallbackData() {
    logMessage('Loading fallback data due to API issues', 'warn');
    
    // Fallback stats data
    const fallbackStats = {
        total_servers: 1234,
        total_users: 567890,
        total_commands_used: 1234567
    };
    
    // Update stats with fallback data
    const statElements = document.querySelectorAll('.stat-number');
    statElements.forEach(element => {
        const statType = element.getAttribute('data-stat');
        
        switch(statType) {
            case 'total_servers':
                animateCounter(element, fallbackStats.total_servers, 2000);
                break;
            case 'total_users':
                animateCounter(element, fallbackStats.total_users, 2000);
                break;
            case 'total_commands_used':
                animateCounter(element, fallbackStats.total_commands_used, 2000);
                break;
            case 'pricing':
                element.textContent = '$3/mo';
                break;
        }
    });
    
    // Fallback servers data (only the 5 servers mentioned by the client)
    const fallbackServers = [
        {
            icon_url: 'https://cdn.discordapp.com/icons/474739462589382667/a_ba71b1a1461efb0e2fda104ea9474411.gif?size=1024',
            member_count: 235752,
            name: 'Rise of Kingdoms'
        },
        {
            icon_url: 'https://cdn.discordapp.com/icons/538735518037442560/a_10bedab0c8877a2ca616f3c4209e09bd.gif?size=1024',
            member_count: 47374,
            name: 'Chisgule Gaming'
        },
        {
            icon_url: 'https://cdn.discordapp.com/icons/1031515159627300924/a_778ebbee161c50472d506d2cbe433e02.gif?size=1024',
            member_count: 14998,
            name: 'The King\'s Codex'
        },
        {
            icon_url: 'https://cdn.discordapp.com/icons/1298023304271233114/a73cdfe7db17a0c7ec69f4cd57abb9ef.png?size=1024',
            member_count: 7362,
            name: 'WarDaddyChadski'
        },
        {
            icon_url: 'https://cdn.discordapp.com/icons/946738284195872828/e5f39917d000761594168bc9d3e20abc.png?size=1024',
            member_count: 1978,
            name: 'Cortex'
        }
    ];
    
    // Render fallback servers
    renderTopServers(fallbackServers);
}

// Function to show loading state
function showLoadingState(section) {
    logMessage(`Showing loading state for ${section}`, 'debug');
    
    if (section === 'stats') {
        // Don't show loading state to users - keep current values
        logMessage('Stats loading state hidden from user', 'debug');
    }
    // No loading state for servers since they're pre-populated
}

// Function to handle API errors
function handleApiError(error, section) {
    logMessage(`API Error in ${section}: ${error.message}`, 'error');
    
    if (section === 'stats') {
        // Don't show error to users - keep current values or use fallback
        logMessage('Stats error hidden from user, using fallback data', 'debug');
        const statElements = document.querySelectorAll('.stat-number');
        statElements.forEach(element => {
            const statType = element.getAttribute('data-stat');
            if (statType !== 'pricing') { // Don't change pricing
                // Keep current values or reset to initial values
                const initialValue = element.getAttribute('data-initial') || '0';
                element.textContent = initialValue;
            }
        });
    }
    // No error handling for servers since they're pre-populated
}

// Function to initialize API data loading
async function loadApiData() {
    logMessage('Starting API data loading', 'info');
    logMessage(`User agent: ${navigator.userAgent}`, 'debug');
    logMessage(`Current origin: ${window.location.origin}`, 'debug');
    logMessage(`Current protocol: ${window.location.protocol}`, 'debug');
    
    // Check if we're in a browser that supports fetch
    if (!window.fetch) {
        logMessage('Fetch API not supported in this browser', 'error');
        return;
    }
    
    // Load stats data
    try {
        logMessage('Loading stats data', 'info');
        const statsData = await fetchApiData(STATS_ENDPOINT);
        updateStats(statsData);
        logMessage('Stats data loaded and displayed successfully', 'info');
    } catch (error) {
        logMessage('Failed to load stats data, using default values', 'info');
        // Silently fail - keep current values
    }
    
    // Load top servers data
    try {
        logMessage('Loading top servers data', 'info');
        const serversData = await fetchApiData(TOP_SERVERS_ENDPOINT);
        renderTopServers(serversData);
        logMessage('Top servers data loaded and displayed successfully', 'info');
    } catch (error) {
        logMessage('Failed to load servers data, using pre-populated HTML', 'info');
        // Servers are already pre-populated in HTML, so no need to do anything
        // Just ensure the animation is running
        const serverListElements = document.querySelectorAll('.server-list');
        serverListElements.forEach(serverList => {
        });
    }
}

// Function to update stats with animation
function updateStats(statsData) {
    logMessage('Updating stats with data', 'debug');
    logMessage(JSON.stringify(statsData, null, 2), 'debug');
    
    const statElements = document.querySelectorAll('.stat-number');
    
    // Store initial values for potential fallback
    statElements.forEach(element => {
        if (!element.hasAttribute('data-initial')) {
            element.setAttribute('data-initial', element.textContent);
        }
    });
    
    statElements.forEach(element => {
        const statType = element.getAttribute('data-stat');
        
        switch(statType) {
            case 'total_servers':
                animateCounter(element, statsData.total_servers, 2000);
                break;
            case 'total_users':
                animateCounter(element, statsData.total_users, 2000);
                break;
            case 'total_commands_used':
                animateCounter(element, statsData.total_commands_used, 2000);
                break;
            case 'pricing':
                // Keep the pricing static as $3/month
                element.textContent = '$3/mo';
                break;
            default:
                logMessage(`Unknown stat type: ${statType}`, 'warn');
        }
    });
}

// Counter animation for statistics
function animateCounter(element, target, duration) {
    const start = 0;
    const increment = target / (duration / 16); // 16ms per frame for 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// Error handling for images
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
        });
    });
});

// Performance optimization: Lazy load images if any are added
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Prevent default touch behaviors that might interfere
document.addEventListener('touchstart', function(e) {
    // Allow normal scrolling but prevent zoom on double tap
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Improve scroll performance on mobile
let ticking = false;
function updateScrollPosition() {
    // Any scroll-related updates can go here
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
    }
}, { passive: true });