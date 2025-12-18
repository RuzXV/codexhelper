(function() {
    const API_BASE_URL = '';
    const WEBSITE_APP_ID = '1434105087722258573';
    const REDIRECT_URI = `${window.location.origin}/api/auth/callback`;
    const CACHE_KEY = 'codex-auth-user';
    const CACHE_DURATION_MS = 5 * 60 * 1000;

    let currentUser = null;
    let authContainerSelector = null;

    function getLoggedInUser() {
        return currentUser;
    }

    function renderLoggedOutState(container) {
        container.innerHTML = `
            <button class="discord-login-btn">
                <i class="fa-brands fa-discord"></i>
                <span>Login with Discord</span>
            </button>
        `;
        container.querySelector('.discord-login-btn').addEventListener('click', login);
    }

    function renderLoggedInState(container, user) {
        let avatarUrl;

        if (user.avatar) {
            avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
        } else {
            if (user.discriminator === '0' || !user.discriminator) {
                try {
                    const index = Number((BigInt(user.id) >> 22n) % 6n);
                    avatarUrl = `https://cdn.discordapp.com/embed/avatars/${index}.png`;
                } catch (e) {
                    avatarUrl = `https://cdn.discordapp.com/embed/avatars/0.png`;
                }
            } else {
                const index = parseInt(user.discriminator) % 5;
                avatarUrl = `https://cdn.discordapp.com/embed/avatars/${index}.png`;
            }
        }

        const isSubscribed = user.is_active_patron;
        let dropdownContent = '';

        if (isSubscribed) {
            dropdownContent = `
                <a href="/dashboard" class="dropdown-item">
                    <i class="fas fa-tachometer-alt"></i> <span>Dashboard</span>
                </a>
                <div class="dropdown-item logout-trigger">
                    <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
                </div>
            `;
        } else {
            const dashboardLink = user.is_master_admin ? `
                <a href="/dashboard" class="dropdown-item">
                    <i class="fas fa-tachometer-alt"></i> <span>Dashboard</span>
                </a>
            ` : '';

            dropdownContent = `
                <a href="https://www.patreon.com/c/kingscodex" target="_blank" class="dropdown-item">
                    <i class="fab fa-patreon" style="color: #FF424D;"></i> <span>Subscribe</span>
                </a>
                ${dashboardLink}
                <div class="dropdown-item logout-trigger">
                    <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="user-profile relative-container" style="position: relative; display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 5px 12px 5px 5px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;">
                <img src="${avatarUrl}" alt="Profile" class="profile-pic" style="width: 32px; height: 32px; border-radius: 50%;">
                <span class="username" style="font-weight: 600; font-size: 0.9rem;">${user.display_name || user.global_name || user.username}</span>
                <i class="fas fa-chevron-down dropdown-arrow" style="font-size: 0.8rem; opacity: 0.7; transition: transform 0.2s;"></i>
                
                <div class="user-dropdown hidden" style="position: absolute; top: 115%; right: 0; background: #1a1b1e; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; min-width: 160px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5); z-index: 1000; display: none;">
                    ${dropdownContent}
                </div>
            </div>
        `;

        const profileContainer = container.querySelector('.user-profile');
        const dropdown = container.querySelector('.user-dropdown');
        const arrow = container.querySelector('.dropdown-arrow');
        const logoutBtn = container.querySelector('.logout-trigger');

        profileContainer.addEventListener('click', (e) => {
            if (e.target.closest('.dropdown-item') && !e.target.closest('.logout-trigger')) return;
            
            e.stopPropagation();
            const isHidden = dropdown.style.display === 'none';
            dropdown.style.display = isHidden ? 'block' : 'none';
            arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        });

        logoutBtn.addEventListener('click', logout);

        document.addEventListener('click', (e) => {
            if (!profileContainer.contains(e.target)) {
                dropdown.style.display = 'none';
                arrow.style.transform = 'rotate(0deg)';
            }
        });
        
        document.dispatchEvent(new CustomEvent('auth:loggedIn', { detail: { user } }));
        
        if (!document.getElementById('auth-dropdown-styles')) {
            const style = document.createElement('style');
            style.id = 'auth-dropdown-styles';
            style.textContent = `
                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    color: #ccc;
                    text-decoration: none;
                    transition: background 0.2s;
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                .dropdown-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
                .dropdown-item i {
                    width: 20px;
                    text-align: center;
                    transform: translateY(1.3px); 
                }
            `;
            document.head.appendChild(style);
        }
    }

    function cacheUser(user) {
        const cacheData = {
            timestamp: Date.now(),
            user: user
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    }
    
    function clearUserCache() {
        localStorage.removeItem(CACHE_KEY);
    }

    async function refreshAuthState() {
        if (!authContainerSelector) return;
        const container = document.querySelector(authContainerSelector);
        if (!container) return;

        try {
            const user = await fetchWithAuth('/api/users/@me');
            currentUser = user;
            cacheUser(user);
            renderLoggedInState(container, user);
        } catch (error) {
            console.log("No active session found or session is invalid during refresh.");
            currentUser = null;
            clearUserCache();
            renderLoggedOutState(container);
        }
    }

    function login(event) {
        const loginButton = event.currentTarget;
        loginButton.disabled = true;
        loginButton.innerHTML = `<span>Redirecting...</span>`;

        if (typeof window.getPreLoginState === 'function') {
            const state = window.getPreLoginState();
            if (state) {
                console.log("Saving pre-login state...", state);
                sessionStorage.setItem('preLoginState', JSON.stringify(state));
                sessionStorage.setItem('preLoginToolPath', window.location.pathname);
            }
        }

        const scope = 'identify guilds'; 
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${WEBSITE_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
        window.location.href = authUrl;
    }

    async function logout() {
        try {
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            currentUser = null;
            clearUserCache();
            window.location.reload();
        }
    }
    
    async function fetchWithAuth(endpoint, options = {}) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            credentials: 'include',
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
            },
        });
    
        if (!response.ok) {
            if (response.status === 401) {
                if (currentUser) {
                    console.log("Session expired or invalid token. Logging out...");
                    currentUser = null;
                    clearUserCache();
                    
                    await logout(); 
                    return;
                }
            }
            const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
            throw new Error(errorData.message || `API request failed with status ${response.status}`);
        }
        return response.json().catch(() => ({}));
    }

    async function initAuth(containerSelector) {
        authContainerSelector = containerSelector;
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const cachedItem = localStorage.getItem(CACHE_KEY);
        if (cachedItem) {
            const { timestamp, user } = JSON.parse(cachedItem);
            if (Date.now() - timestamp < CACHE_DURATION_MS) {
                currentUser = user;
                renderLoggedInState(container, user);
                refreshAuthState(); 
                return;
            } else {
                clearUserCache();
            }
        }

        const preLoginToolPath = sessionStorage.getItem('preLoginToolPath');
        if (preLoginToolPath) {
            if (window.location.pathname !== preLoginToolPath) {
                window.location.href = preLoginToolPath;
                return;
            } else {
                const stateJSON = sessionStorage.getItem('preLoginState');
                if (stateJSON && typeof window.restoreToolState === 'function') {
                    console.log("Restoring tool state...");
                    const state = JSON.parse(stateJSON);
                    window.restoreToolState(state);
                }
                sessionStorage.removeItem('preLoginState');
                sessionStorage.removeItem('preLoginToolPath');
            }
        }

        try {
            const user = await fetchWithAuth('/api/users/@me');
            currentUser = user;
            cacheUser(user);
            renderLoggedInState(container, user);
        } catch (error) {
            console.log("No active session found or session is invalid.");
            currentUser = null;
            clearUserCache();
            renderLoggedOutState(container);
        }
    }

    window.auth = {
        init: initAuth,
        fetchWithAuth: fetchWithAuth,
        getLoggedInUser: getLoggedInUser,
    };

})();