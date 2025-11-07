(function() {
    const API_BASE_URL = 'https://api.codexhelper.com';
    const DISCORD_CLIENT_ID = '1434105087722258573';
    const REDIRECT_URI = 'https://api.codexhelper.com/api/auth/callback';
    let authPopup = null;
    let currentUser = null;

    function getLoggedInUser() {
        if (currentUser) return currentUser;
        try {
            const user = localStorage.getItem('codexUser');
            currentUser = user ? JSON.parse(user) : null;
            return currentUser;
        } catch (e) {
            console.error("Failed to parse user data from localStorage", e);
            localStorage.removeItem('codexUser');
            return null;
        }
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
            : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;

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
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
        
        const width = 500, height = 700;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        
        authPopup = window.open(authUrl, 'DiscordAuth', `width=${width},height=${height},top=${top},left=${left}`);

        if (!authPopup || authPopup.closed || typeof authPopup.closed === 'undefined') {
            window.showAlert("Popup was blocked! Please allow popups for this site and try again.");
            const authContainer = document.getElementById('auth-container');
            if (authContainer) renderLoggedOutState(authContainer);
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
            localStorage.removeItem('codexUser');
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
                localStorage.removeItem('codexUser');
                currentUser = null;
                window.showAlert("Your session has expired. Please log in again.", "Session Expired");
                setTimeout(() => window.location.reload(), 2000);
            }
            const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
            throw new Error(errorData.message || `API request failed with status ${response.status}`);
        }
        return response.json().catch(() => ({}));
    }

    function initAuth(containerSelector) {
        const container = document.querySelector(containerSelector);
        if(!container) return;

        const user = getLoggedInUser();
        if (user) {
            renderLoggedInState(container, user);
        } else {
             renderLoggedOutState(container);
        }
        
        window.addEventListener('message', (event) => {
            if (event.origin.startsWith('https://codexhelper.com') && event.data.type === 'auth-success') {
                window.location.reload();
            } else if (event.origin.startsWith('https://codexhelper.com') && event.data.type === 'auth-error') {
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
})();