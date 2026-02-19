function toggleFAQ(event) {
    const button = event.currentTarget;
    const faqItem = button.parentElement;

    document.querySelectorAll('.faq-item.active').forEach((item) => {
        if (item !== faqItem) {
            item.classList.remove('active');
            const otherBtn = item.querySelector('.faq-question');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
    });

    faqItem.classList.toggle('active');
    const isNowActive = faqItem.classList.contains('active');
    button.setAttribute('aria-expanded', String(isNowActive));
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

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    });
});

const navbar = document.querySelector('.navbar');

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .stat-item, .faq-item, .feature-showcase-item').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(50px)';
    el.style.transition = 'opacity 1s ease, transform 1s ease';
    observer.observe(el);
});

document
    .querySelectorAll(
        '.btn-primary:not(#copy-btn):not(#copy-image-btn), .btn-secondary:not(#filter-toggle-btn):not(#download-image-btn):not(#comparison-filter-toggle-btn)',
    )
    .forEach((button) => {
        button.addEventListener('click', function (e) {
            if (this.getAttribute('href') && this.getAttribute('href').startsWith('http')) {
                return;
            }

            const originalText = this.innerHTML;
            this.innerHTML =
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Loading...';

            setTimeout(() => {
                this.innerHTML = originalText;
            }, 500);
        });
    });

document.addEventListener('visibilitychange', () => {
    const serverLists = document.querySelectorAll('.server-list');
    const isPaused = document.hidden ? 'paused' : 'running';
    serverLists.forEach((list) => {
        list.style.animationPlayState = isPaused;
    });
});

if (window.auth) {
    window.auth.init('#auth-container');
}

const API_BASE_URL = '';
const STATS_ENDPOINT = '/api/stats';
const TOP_SERVERS_ENDPOINT = '/api/top-servers';
const REVIEWS_ENDPOINT = '/api/reviews';

async function fetchApiData(endpoint) {
    const url = API_BASE_URL + endpoint;

    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
    });

    try {
        const response = await Promise.race([
            fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers: { 'Content-Type': 'application/json' },
            }),
            timeout,
        ]);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON. Content-Type: ' + contentType);
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch ${endpoint}:`, error.message);
        throw error;
    }
}

function renderTopServers(servers) {
    const serverListRow1 = document.getElementById('serverListRow1');
    const serverListRow2 = document.getElementById('serverListRow2');

    if (!serverListRow1 || !serverListRow2) {
        console.error('Server list elements not found');
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

    const escapeHtml = window.escapeHtml;

    function createServerItem(server) {
        const serverItem = document.createElement('li');
        serverItem.className = 'server-item';

        const safeName = escapeHtml(server.name);
        const safeIconUrl = escapeHtml(server.icon_url);

        serverItem.innerHTML = `
            <img src="${safeIconUrl}" alt="${safeName} Icon" class="server-logo">
            <div class="server-info">
                <p class="server-name">${safeName}</p>
                <span class="server-members">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="6" cy="6" r="6" fill="#43b581"></circle>
                    </svg>
                    ${server.member_count.toLocaleString()} members
                </span>
            </div>
        `;

        const img = serverItem.querySelector('.server-logo');
        if (img) img.addEventListener('error', () => { img.src = '/images/global/logo-new.webp'; }, { once: true });

        return serverItem;
    }

    if (serversRow1.length > 0) {
        serversRow1.forEach((server) => {
            serverListRow1.appendChild(createServerItem(server));
        });
        serversRow1.forEach((server) => {
            const duplicateItem = createServerItem(server);
            duplicateItem.setAttribute('aria-hidden', 'true');
            serverListRow1.appendChild(duplicateItem);
        });
        serverListRow1.classList.add('is-animated');
    }

    if (serversRow2.length > 0) {
        serversRow2.forEach((server) => {
            serverListRow2.appendChild(createServerItem(server));
        });
        serversRow2.forEach((server) => {
            const duplicateItem = createServerItem(server);
            duplicateItem.setAttribute('aria-hidden', 'true');
            serverListRow2.appendChild(duplicateItem);
        });
        serverListRow2.classList.add('is-animated');
    }
}

function renderReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;

    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = '';
        const section = reviewsList.closest('.reviews-section');
        if (section) section.style.display = 'none';
        return;
    }

    reviewsList.innerHTML = '';

    const escapeHtml = window.escapeHtml;

    function renderDiscordFormatting(text) {
        // Discord custom emojis — only allow numeric IDs and word-char names (already escaped)
        text = text.replace(/&lt;(a?):(\w{1,32}):(\d{17,20})&gt;/g, (_, animated, name, id) => {
            const ext = animated ? 'gif' : 'png';
            return `<img src="https://cdn.discordapp.com/emojis/${id}.${ext}" alt=":${name}:" class="review-emoji">`;
        });
        // Bold **text** — non-greedy, no nested HTML tags allowed
        text = text.replace(/\*\*([^*<>]+?)\*\*/g, '<strong>$1</strong>');
        // Italic *text* — non-greedy, no nested HTML tags
        text = text.replace(/(?<!\*)\*([^*<>]+?)\*(?!\*)/g, '<em>$1</em>');
        // Underline __text__ — non-greedy, no nested HTML tags
        text = text.replace(/__([^_<>]+?)__/g, '<u>$1</u>');
        // Strikethrough ~~text~~ — non-greedy, no nested HTML tags
        text = text.replace(/~~([^~<>]+?)~~/g, '<s>$1</s>');
        return text;
    }

    function createReviewItem(review) {
        const item = document.createElement('li');
        item.className = 'review-item';

        const safeName = escapeHtml(review.username);
        const safeText = renderDiscordFormatting(escapeHtml(review.review_text));
        const avatarUrl = review.avatar_url || '/images/global/logo-new.webp';
        const safeAvatar = escapeHtml(avatarUrl);
        const dateStr = review.submitted_at ? new Date(review.submitted_at * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

        item.innerHTML = `
            <div class="review-header">
                <span class="review-username">${safeName}</span>
                <img src="${safeAvatar}" alt="${safeName}" class="review-avatar">
            </div>
            <div class="review-body">
                <p class="review-text">${safeText}</p>
            </div>
            ${dateStr ? `<span class="review-date"><svg class="review-discord-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>${dateStr}</span>` : ''}
        `;

        const avatarImg = item.querySelector('.review-avatar');
        if (avatarImg) avatarImg.addEventListener('error', () => { avatarImg.src = '/images/global/logo-new.webp'; }, { once: true });

        return item;
    }

    reviews.forEach((review) => {
        reviewsList.appendChild(createReviewItem(review));
    });

    reviews.forEach((review) => {
        const duplicate = createReviewItem(review);
        duplicate.setAttribute('aria-hidden', 'true');
        reviewsList.appendChild(duplicate);
    });

    reviewsList.classList.add('is-animated');
}

function loadFallbackData() {

    const fallbackStats = {
        total_servers: 1234,
        total_users: 567890,
        total_commands_used: 1234567,
    };

    const statElements = document.querySelectorAll('.stat-number');
    statElements.forEach((element) => {
        const statType = element.getAttribute('data-stat');

        switch (statType) {
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
            icon_url:
                'https://cdn.discordapp.com/icons/474739462589382667/a_ba71b1a1461efb0e2fda104ea9474411.gif?size=1024',
            member_count: 235752,
            name: 'Rise of Kingdoms',
        },
        {
            icon_url:
                'https://cdn.discordapp.com/icons/538735518037442560/a_10bedab0c8877a2ca616f3c4209e09bd.gif?size=1024',
            member_count: 47374,
            name: 'Chisgule Gaming',
        },
        {
            icon_url:
                'https://cdn.discordapp.com/icons/1031515159627300924/a_778ebbee161c50472d506d2cbe433e02.gif?size=1024',
            member_count: 14998,
            name: "The King's Codex",
        },
        {
            icon_url:
                'https://cdn.discordapp.com/icons/1298023304271233114/a73cdfe7db17a0c7ec69f4cd57abb9ef.png?size=1024',
            member_count: 7362,
            name: 'WarDaddyChadski',
        },
        {
            icon_url:
                'https://cdn.discordapp.com/icons/946738284195872828/e5f39917d000761594168bc9d3e20abc.png?size=1024',
            member_count: 1978,
            name: 'Cortex',
        },
    ];

    renderTopServers(fallbackServers);
}

function showLoadingState(section) {

    if (section === 'stats') {
    }
}

function handleApiError(error, section) {
    console.error(`API Error in ${section}:`, error.message);

    if (section === 'stats') {
        const statElements = document.querySelectorAll('.stat-number');
        statElements.forEach((element) => {
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
            console.error(`Could not parse cached data for ${cacheKey}`);
            localStorage.removeItem(cacheKey);
        }
    }

    try {
        const liveData = await fetchApiData(endpoint);

        const hasDataChanged = !cachedData || JSON.stringify(liveData) !== JSON.stringify(cachedData.data);

        if (hasDataChanged) {
            localStorage.setItem(
                cacheKey,
                JSON.stringify({
                    timestamp: Date.now(),
                    data: liveData,
                }),
            );
        } else {
        }

        renderFunction(liveData);
        return false;
    } catch (error) {
        if (cachedData) {
            renderFunction(cachedData.data);
            return true;
        } else {
            console.error(`No cached data found for ${cacheKey}.`);
            if (errorRenderFunction) {
                errorRenderFunction();
            }
            return true;
        }
    }
}

async function loadApiData() {

    const statsCacheUsed = await handleApiRequest(STATS_ENDPOINT, 'statsCache', updateStats, () => {
        const statElements = document.querySelectorAll('.stat-number');
        statElements.forEach((element) => {
            const statType = element.getAttribute('data-stat');
            if (statType !== 'pricing') {
                element.textContent = element.getAttribute('data-initial') || 'N/A';
            }
        });
    });

    const serversCacheUsed = await handleApiRequest(TOP_SERVERS_ENDPOINT, 'serversCache', renderTopServers, () => {
        const serverListElements = document.querySelectorAll('.server-list');
        serverListElements.forEach((serverList) => {
            serverList.innerHTML = '<li class="server-error">Could not load server list</li>';
        });
    });

    await handleApiRequest(REVIEWS_ENDPOINT, 'reviewsCache', renderReviews, () => {
        const reviewsList = document.getElementById('reviewsList');
        if (reviewsList) reviewsList.innerHTML = '';
        const section = document.querySelector('.reviews-section');
        if (section) section.style.display = 'none';
    });

    if (statsCacheUsed || serversCacheUsed) {
        showOfflineWarning();
    }
}

function updateStats(statsData) {

    const statElements = document.querySelectorAll('.stat-number');

    statElements.forEach((element) => {
        if (!element.hasAttribute('data-initial')) {
            element.setAttribute('data-initial', element.textContent);
        }
    });

    statElements.forEach((element) => {
        const statType = element.getAttribute('data-stat');

        if (typeof animateCounter !== 'function') {
            console.error('animateCounter is not defined. Make sure utils.js is loaded.');
            return;
        }

        switch (statType) {
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
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('img').forEach((img) => {
        img.addEventListener('error', function () {
            this.style.display = 'none';
        });
    });

    const faqButtons = document.querySelectorAll('.faq-question');
    faqButtons.forEach((button) => {
        button.addEventListener('click', toggleFAQ);
    });

    if (document.body.classList.contains('home')) {
        loadApiData();
    }
});

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
    });
}

document.addEventListener(
    'touchstart',
    function (e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    },
    { passive: false },
);

// saveUserData / loadUserData / getStorageKey are defined in utils.js (loaded first via Layout.astro)
