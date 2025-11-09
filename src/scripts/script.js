function toggleFAQ(event) {
    const button = event.currentTarget;
    const faqItem = button.parentElement;
    const isActive = faqItem.classList.contains('active');

    document.querySelectorAll('.faq-item.active').forEach(item => {
        if (item !== faqItem) {
            item.classList.remove('active');
        }
    });
    
    faqItem.classList.toggle('active');
}

function createStars() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const starContainer = document.createElement('div');
    starContainer.className = 'stars';
    hero.appendChild(starContainer);

    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 30 : 100;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        star.style.animationDelay = `${Math.random() * 5}s`;
        star.style.animationDuration = `${3 + Math.random() * 4}s`;

        starContainer.appendChild(star);
    }
}

createStars();

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


document.querySelectorAll('.btn-primary:not(#copy-btn):not(#copy-image-btn), .btn-secondary:not(#filter-toggle-btn):not(#download-image-btn):not(#comparison-filter-toggle-btn)').forEach(button => {
    button.addEventListener('click', function(e) {
        if (this.getAttribute('href') && this.getAttribute('href').startsWith('http')) {
            return;
        }
        
        const originalText = this.innerHTML;
        this.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Loading...';
        
        setTimeout(() => {
            this.innerHTML = originalText;
        }, 500);
    });
});

document.addEventListener('visibilitychange', () => {
    const serverLists = document.querySelectorAll('.server-list');
    const isPaused = document.hidden ? 'paused' : 'running';
    serverLists.forEach(list => {
        list.style.animationPlayState = isPaused;
    });
});

if (window.auth) {
    window.auth.init('#auth-container');
}

const API_BASE_URL = '';
const STATS_ENDPOINT = '/api/stats';
const TOP_SERVERS_ENDPOINT = '/api/top-servers';

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

async function fetchApiData(endpoint) {
    const url = API_BASE_URL + endpoint;
    logMessage(`Fetching data from: ${url}`, 'debug');
    
    const isLocalFile = window.location.protocol === 'file:';
    if (isLocalFile) {
        logMessage('Running from local file, CORS issues may occur', 'warn');
    }
    
    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
    });
    
    try {
        const fetchOptions = {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        logMessage(`Fetch options: ${JSON.stringify(fetchOptions)}`, 'debug');
        
        const response = await Promise.race([
            fetch(url, fetchOptions),
            timeout
        ]);
        
        logMessage(`Response status for ${endpoint}: ${response.status}`, 'debug');
        logMessage(`Response headers for ${endpoint}: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`, 'debug');
        
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
        
        if (error instanceof TypeError) {
            if (error.message.includes('fetch')) {
                logMessage('Network error or CORS issue detected', 'error');
                logMessage('Possible causes:', 'error');
                logMessage('1. API server is unreachable', 'error');
                logMessage('2. CORS policy is blocking the request', 'error');
                logMessage('3. Network connectivity issues', 'error');
                logMessage('4. SSL/TLS certificate issues', 'error');
                
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
        serverListRow2.innerHTML = '';
        return;
    }
    
    serverListRow1.innerHTML = '';
    serverListRow2.innerHTML = '';

    const serversRow1 = servers.slice(0, 10);
    const serversRow2 = servers.slice(10, 20);
    
    function createServerItem(server) {
        const serverItem = document.createElement('li');
        serverItem.className = 'server-item';
        
        serverItem.innerHTML = `
            <img src="${server.icon_url}" alt="${server.name} Icon" class="server-logo" onerror="this.src='/images/global/logo-new.webp'">
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
    
    if (serversRow1.length > 0) {
        serversRow1.forEach(server => {
            serverListRow1.appendChild(createServerItem(server));
        });
        serversRow1.forEach(server => {
            const duplicateItem = createServerItem(server);
            duplicateItem.setAttribute('aria-hidden', 'true');
            serverListRow1.appendChild(duplicateItem);
        });
        serverListRow1.classList.add('is-animated');
    }

    if (serversRow2.length > 0) {
        serversRow2.forEach(server => {
            serverListRow2.appendChild(createServerItem(server));
        });
        serversRow2.forEach(server => {
            const duplicateItem = createServerItem(server);
            duplicateItem.setAttribute('aria-hidden', 'true');
            serverListRow2.appendChild(duplicateItem);
        });
        serverListRow2.classList.add('is-animated');
    }
}

function loadFallbackData() {
    logMessage('Loading fallback data due to API issues', 'warn');
    
    const fallbackStats = {
        total_servers: 1234,
        total_users: 567890,
        total_commands_used: 1234567
    };
    
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
    
    renderTopServers(fallbackServers);
}


function showLoadingState(section) {
    logMessage(`Showing loading state for ${section}`, 'debug');
    
    if (section === 'stats') {
        logMessage('Stats loading state hidden from user', 'debug');
    }
}

function handleApiError(error, section) {
    logMessage(`API Error in ${section}: ${error.message}`, 'error');
    
    if (section === 'stats') {
        logMessage('Stats error hidden from user, using fallback data', 'debug');
        const statElements = document.querySelectorAll('.stat-number');
        statElements.forEach(element => {
            const statType = element.getAttribute('data-stat');
            if (statType !== 'pricing') {
                const initialValue = element.getAttribute('data-initial') || '0';
                element.textContent = initialValue;
            }
        });
    }
}

function showOfflineWarning() {
    let warningEl = document.getElementById('offline-warning');
    if (!warningEl) {
        warningEl = document.createElement('div');
        warningEl.id = 'offline-warning';
        warningEl.style.position = 'fixed';
        warningEl.style.bottom = '20px';
        warningEl.style.left = '20px';
        warningEl.style.backgroundColor = 'var(--accent-yellow)';
        warningEl.style.color = 'var(--bg-primary)';
        warningEl.style.padding = '10px 15px';
        warningEl.style.borderRadius = 'var(--radius-md)';
        warningEl.style.zIndex = '2000';
        warningEl.style.fontSize = 'var(--font-size-sm)';
        warningEl.style.fontWeight = '500';
        warningEl.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        document.body.appendChild(warningEl);
    }
    warningEl.textContent = '⚠️ Displaying cached data. Live stats are currently unavailable.';
}


async function handleApiRequest(endpoint, cacheKey, renderFunction, errorRenderFunction) {
    const cachedItem = localStorage.getItem(cacheKey);
    let cachedData = null;
    if (cachedItem) {
        try {
            cachedData = JSON.parse(cachedItem);
        } catch (e) {
            logMessage(`Could not parse cached data for ${cacheKey}`, 'error');
            localStorage.removeItem(cacheKey);
        }
    }

    try {
        logMessage(`Attempting to fetch live data for ${cacheKey}...`, 'info');
        const liveData = await fetchApiData(endpoint);

        const hasDataChanged = !cachedData || JSON.stringify(liveData) !== JSON.stringify(cachedData.data);

        if (hasDataChanged) {
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: liveData
            }));
            logMessage(`Live data for ${cacheKey} was new, updated cache.`, 'info');
        } else {
            logMessage(`Live data for ${cacheKey} is unchanged.`, 'info');
        }

        renderFunction(liveData);
        return false;
    } catch (error) {
        logMessage(`Failed to load live data for ${cacheKey}. Attempting to use indefinite cache.`, 'warn');
        if (cachedData) {
            logMessage(`Found valid cached data for ${cacheKey}. Rendering...`, 'info');
            renderFunction(cachedData.data);
            return true;
        } else {
            logMessage(`No cached data found for ${cacheKey}.`, 'error');
            if (errorRenderFunction) {
                errorRenderFunction();
            }
            return true;
        }
    }
}


async function loadApiData() {
    logMessage('Starting API data loading with indefinite cache logic.', 'info');

    const statsCacheUsed = await handleApiRequest(
        STATS_ENDPOINT,
        'statsCache',
        updateStats,
        () => {
            const statElements = document.querySelectorAll('.stat-number');
            statElements.forEach(element => {
                const statType = element.getAttribute('data-stat');
                if (statType !== 'pricing') {
                    element.textContent = element.getAttribute('data-initial') || 'N/A';
                }
            });
        }
    );

    const serversCacheUsed = await handleApiRequest(
        TOP_SERVERS_ENDPOINT,
        'serversCache',
        renderTopServers,
        () => {
            const serverListElements = document.querySelectorAll('.server-list');
            serverListElements.forEach(serverList => {
                serverList.innerHTML = '<li class="server-error">Could not load server list</li>';
            });
        }
    );

    if (statsCacheUsed || serversCacheUsed) {
        showOfflineWarning();
    }
}


function updateStats(statsData) {
    logMessage('Updating stats with data', 'debug');
    logMessage(JSON.stringify(statsData, null, 2), 'debug');
    
    const statElements = document.querySelectorAll('.stat-number');
    
    statElements.forEach(element => {
        if (!element.hasAttribute('data-initial')) {
            element.setAttribute('data-initial', element.textContent);
        }
    });
    
    statElements.forEach(element => {
        const statType = element.getAttribute('data-stat');
        
        if (typeof animateCounter !== 'function') {
            console.error('animateCounter is not defined. Make sure utils.js is loaded.');
            return;
        }

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
                element.textContent = '$3/mo';
                break;
            default:
                logMessage(`Unknown stat type: ${statType}`, 'warn');
        }
    });
}


document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
        });
    });

    const faqButtons = document.querySelectorAll('.faq-question');
    faqButtons.forEach(button => {
        button.addEventListener('click', toggleFAQ);
    });

    if (document.body.classList.contains('home')) {
        loadApiData();
    }
});

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

document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

let ticking = false;
function updateScrollPosition() {
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
    }
}, { passive: true });

function getStorageKey(key) {
    const user = window.auth ? window.auth.getLoggedInUser() : null;
    if (user && user.id) {
        return `codex-user-${user.id}-${key}`;
    }
    return `codex-guest-${key}`;
}

window.saveUserData = (key, data) => {
    try {
        localStorage.setItem(getStorageKey(key), JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save user data to localStorage", e);
    }
};

window.loadUserData = (key) => {
    try {
        const data = localStorage.getItem(getStorageKey(key));
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Failed to load user data from localStorage", e);
        return null;
    }
};