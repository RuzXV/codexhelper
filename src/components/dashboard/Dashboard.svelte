<script>
    import { onMount } from 'svelte';
    import MasterPanel from './master_panel/MasterPanel.svelte';
    import BotConfigPanel from './bot_panel/BotConfigPanel.svelte';
    import ChangelogPanel from './master_panel/ChangelogPanel.svelte';
    import { fade } from 'svelte/transition';

    let user = null;
    let loading = true;
    let currentView = ''; 
    let allowedViews = [];
    
    let availableServers = [];
    let selectedServer = null;
    let isServerDropdownOpen = false;

    onMount(async () => {
        if (window.auth && typeof window.auth.init === 'function') {
            await window.auth.init('#auth-container-dashboard');
        }
        
        const authHandler = (e) => {
            user = e.detail.user;
            determineAccess(user);
            fetchUserServers(user);
            loading = false;
        };

        document.addEventListener('auth:loggedIn', authHandler);

        setTimeout(() => {
            const loggedInUser = window.auth.getLoggedInUser();
            if (loggedInUser) {
                user = loggedInUser;
                determineAccess(user);
                fetchUserServers(user);
            }
            loading = false;
        }, 500);

        return () => {
            document.removeEventListener('auth:loggedIn', authHandler);
            document.removeEventListener('click', closeServerDropdown);
        };
    });

    function determineAccess(userData) {
        allowedViews = [];
        if (userData.is_active_patron) {
            allowedViews.push({ id: 'config', label: 'Bot Config', icon: 'fa-robot' });
        }

        if (userData.is_master_admin) {
            allowedViews.push({ id: 'master', label: 'Master Panel', icon: 'fa-user-shield' });
            allowedViews.push({ id: 'changelog', label: 'Changelog', icon: 'fa-history' });
        }

        if (allowedViews.length > 0 && !currentView) {
            currentView = allowedViews[0].id;
        }
    }

    function switchView(viewId) {
        currentView = viewId;
    }
    
    async function fetchUserServers(user) {
        loading = true;
        try {
            const servers = await window.auth.fetchWithAuth('/api/users/guilds');
            
            if (Array.isArray(servers)) {
                availableServers = servers;
                
                if (availableServers.length > 0) {
                    const storedId = localStorage.getItem('codex_last_server_id');
                    const previousSelection = availableServers.find(s => s.id === storedId);
                    
                    if (previousSelection) {
                        selectServer(previousSelection);
                    } else {
                        selectServer(availableServers[0]);
                    }
                } else {
                    selectedServer = null;
                }
            }
        } catch (e) {
            console.error("Failed to fetch user servers:", e);
            availableServers = [];
        } finally {
        }
    }

    function toggleServerDropdown(event) {
        event.stopPropagation();
        isServerDropdownOpen = !isServerDropdownOpen;
        if (isServerDropdownOpen) {
            document.addEventListener('click', closeServerDropdown);
        }
    }

    function closeServerDropdown() {
        isServerDropdownOpen = false;
        document.removeEventListener('click', closeServerDropdown);
    }

    function selectServer(server) {
        selectedServer = server;
        isServerDropdownOpen = false;
        localStorage.setItem('codex_last_server_id', server.id);
    }

    function getIcon(server) {
        if (server.icon) return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&background=2d2d2d&color=fff`;
    }
</script>

<div class="dashboard-wrapper">
    {#if loading}
        <div class="loading-container">
            <i class="fas fa-circle-notch fa-spin" style="font-size: 3rem; color: var(--accent-blue);"></i>
        </div>
    {:else if !user}
        <div class="unauthorized-container">
            <h2>Login Required</h2>
            <p>You must be logged in to access the dashboard.</p>
            <div id="auth-container-dashboard"></div>
        </div>
    {:else if allowedViews.length === 0}
        <div class="unauthorized-container">
            <i class="fas fa-lock" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 20px;"></i>
            <h2>Access Restricted</h2>
            <p>You do not have the required permissions to view this dashboard.</p>
            <p style="font-size: 0.9rem;">This area is restricted to active Patrons and Administrators.</p>
            <a href="https://www.patreon.com/c/kingscodex" target="_blank" class="btn-primary" style="margin-top: 20px;">
                Subscribe on Patreon
            </a>
        </div>
    {:else}
        <div class="dashboard-container">
            <nav class="dashboard-nav">
                <div class="nav-left">
                    {#each allowedViews as view}
                        <button 
                            class="nav-tab" 
                            class:active={currentView === view.id}
                            on:click={() => switchView(view.id)}
                        >
                            <i class="fas {view.icon}"></i>
                            <span>{view.label}</span>
                        </button>
                    {/each}
                </div>

                {#if currentView === 'config'}
                    <div class="server-selector-container" transition:fade={{ duration: 200 }}>
                        <button class="server-select-btn" on:click={toggleServerDropdown}>
                            {#if selectedServer}
                                <img src={getIcon(selectedServer)} alt="" class="server-icon-mini" />
                                <span class="server-name">{selectedServer.name}</span>
                            {:else}
                                <span class="server-name">Select Server...</span>
                            {/if}
                            <i class="fas fa-chevron-down" style="font-size: 0.8em; opacity: 0.7;"></i>
                        </button>

                        {#if isServerDropdownOpen}
                            <div class="server-dropdown">
                                {#each availableServers as server}
                                    <button class="server-option" on:click={() => selectServer(server)}>
                                        <img src={getIcon(server)} alt="" class="server-icon-mini" />
                                        <span>{server.name}</span>
                                    </button>
                                {/each}
                                {#if availableServers.length === 0}
                                    <div class="server-option empty">No common servers found</div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/if}
            </nav>

            <main class="dashboard-content">
                {#if currentView === 'master'}
                    <MasterPanel {user} />
                {:else if currentView === 'config'}
                    <BotConfigPanel {user} {selectedServer} />
                {:else if currentView === 'changelog'}
                     <ChangelogPanel {user} /> 
                {/if}
            </main>
        </div>
    {/if}
</div>

<style>
    .dashboard-wrapper {
        min-height: 100vh;
        padding-top: 80px;
        background-color: var(--bg-primary);
        display: flex;
        flex-direction: column;
    }

    .dashboard-container {
        width: 100%;
        max-width: 1600px;
        margin: 0 auto;
        padding: var(--spacing-6);
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .dashboard-nav {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 0;
        padding-left: var(--spacing-2);
        padding-right: var(--spacing-2);
        z-index: 10;
        position: relative;
        top: 1px;
    }
    
    .nav-left {
        display: flex;
        gap: var(--spacing-2);
    }

    .nav-tab {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-bottom: none;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        padding: var(--spacing-3) var(--spacing-6);
        color: var(--text-secondary);
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        transition: all 0.2s ease;
        font-size: var(--font-size-base);
        min-width: 160px;
        justify-content: center;
        opacity: 0.7;
    }

    .nav-tab:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
        opacity: 1;
    }

    .nav-tab.active {
        background: var(--bg-card);
        color: var(--accent-blue);
        border-color: var(--border-color);
        border-bottom: 1px solid var(--bg-card);
        opacity: 1;
    }

    .server-selector-container {
        position: relative;
        margin-bottom: 5px;
    }

    .server-select-btn {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 8px 16px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s ease;
        min-width: 200px;
        justify-content: space-between;
    }

    .server-select-btn:hover {
        background: var(--bg-secondary);
        border-color: var(--accent-blue);
    }

    .server-icon-mini {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: cover;
    }

    .server-dropdown {
        position: absolute;
        top: calc(100% + 5px);
        right: 0;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        width: 100%;
        min-width: 220px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 100;
        overflow: hidden;
    }

    .server-option {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 16px;
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        text-align: left;
        transition: background 0.2s;
    }

    .server-option:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }
    
    .server-option.empty {
        cursor: default;
        font-style: italic;
        padding: 15px;
        text-align: center;
    }

    .dashboard-content {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-8);
        min-height: 600px;
        position: relative;
        z-index: 5;
    }
    
    .loading-container, .unauthorized-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        width: 100%;
    }

    .unauthorized-container h2 {
        font-size: var(--font-size-2xl);
        margin-bottom: var(--spacing-4);
        color: var(--text-primary);
    }

    .unauthorized-container p {
        color: var(--text-secondary);
        max-width: 500px;
        margin-bottom: var(--spacing-6);
    }

    @media (max-width: 768px) {
        .dashboard-nav {
            flex-direction: column-reverse;
            align-items: stretch;
            gap: 10px;
        }
        .nav-left {
            overflow-x: auto;
        }
        .server-selector-container {
            width: 100%;
            margin-bottom: 10px;
        }
        .server-select-btn {
            width: 100%;
        }
    }
</style>