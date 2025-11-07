(function() {
    const API_BASE_URL = 'https://api.codexhelper.com';
    const WEBSITE_APP_ID = '1434105087722258573';
    const REDIRECT_URI = 'https://api.codexhelper.com/api/auth/callback';
    let authPopup = null;
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
        const avatarUrl = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;

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
    }

    async function refreshAuthState() {
        if (!authContainerSelector) return;
        const container = document.querySelector(authContainerSelector);
        if (!container) return;

        try {
            const user = await fetchWithAuth('/api/users/@me');
            currentUser = user;
            renderLoggedInState(container, user);
        } catch (error) {
            console.log("No active session found or session is invalid during refresh.");
            currentUser = null;
            renderLoggedOutState(container);
        }
    }

    function login(event) {
        const loginButton = event.currentTarget;
        loginButton.disabled = true;
        loginButton.classList.add('is-loading');
        loginButton.innerHTML = `
            <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
            <span>Logging in...</span>
        `;

        if (typeof window.getPreLoginState === 'function') {
            const state = window.getPreLoginState();
            if (state) {
                sessionStorage.setItem('preLoginState', JSON.stringify(state));
                sessionStorage.setItem('preLoginToolPath', window.location.pathname);
            }
        }

        const scope = 'identify';
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${WEBSITE_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
        
        const width = 500, height = 700;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        
        authPopup = window.open(authUrl, 'DiscordAuth', `width=${width},height=${height},top=${top},left=${left}`);

        if (!authPopup || authPopup.closed || typeof authPopup.closed === 'undefined') {
            window.showAlert("Popup was blocked! Please allow popups for this site and try again.");
            if (event.currentTarget) renderLoggedOutState(event.currentTarget.parentElement);
        }
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
                    if (!document.body.dataset.sessionExpiredAlertShown) {
                        document.body.dataset.sessionExpiredAlertShown = "true";
                        window.showAlert("Your session has expired. Please log in again.", "Session Expired");
                        refreshAuthState();
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

        try {
            const user = await fetchWithAuth('/api/users/@me');
            currentUser = user;
            renderLoggedInState(container, user);
        } catch (error) {
            console.log("No active session found or session is invalid.");
            currentUser = null;
            renderLoggedOutState(container);
        }
        
        window.addEventListener('message', (event) => {
            const isSafeOrigin = event.origin === 'https://codexhelper.com' || event.origin === 'https://api.codexhelper.com';
            if (!isSafeOrigin) return;

            if (event.data.type === 'auth-success') {
                if (authPopup) authPopup.close();
                refreshAuthState();
                if (typeof window.onAuthSuccess === 'function') {
                    window.onAuthSuccess();
                }
            } else if (event.data.type === 'auth-error') {
                 if (authPopup) authPopup.close();
                 console.error('Authentication error received from popup:', event.data.error);
                 window.showAlert("Discord login failed. Please try again.", "Authentication Error");
                 const authContainer = document.querySelector(containerSelector);
                 if(authContainer) renderLoggedOutState(authContainer);
            }
        });
    }

    window.auth = {
        init: initAuth,
        fetchWithAuth: fetchWithAuth,
        getLoggedInUser: getLoggedInUser,
    };

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && authPopup && authPopup.closed) {
            console.log("Tab is visible again, re-checking auth state.");
            
            refreshAuthState();

            if (typeof window.onAuthSuccess === 'function') {
                window.onAuthSuccess();
            }
            
            authPopup = null;
        }
    });

})();