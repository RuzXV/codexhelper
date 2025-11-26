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

        container.innerHTML = `
            <div class="user-profile">
                <img src="${avatarUrl}" alt="Profile Picture" class="profile-pic">
                <span class="username">${user.display_name || user.global_name || user.username}</span>
                <button class="logout-btn" title="Logout">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
        container.querySelector('.logout-btn').addEventListener('click', logout);
        
        document.dispatchEvent(new CustomEvent('auth:loggedIn', { detail: { user } }));
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

        const scope = 'identify';
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
                    currentUser = null;
                    clearUserCache();
                    if (!document.body.dataset.sessionExpiredAlertShown) {
                        document.body.dataset.sessionExpiredAlertShown = "true";
                        window.showAlert("Your session has expired. Please log in again.", "Session Expired");
                        setTimeout(() => { delete document.body.dataset.sessionExpiredAlertShown; }, 5000);
                    }
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