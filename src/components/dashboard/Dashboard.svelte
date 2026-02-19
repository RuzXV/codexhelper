<script>
    import { onMount } from 'svelte';
    import MasterPanel from './master_panel/MasterPanel.svelte';
    import BotConfigPanel from './bot_panel/BotConfigPanel.svelte';
    import ChangelogPanel from './master_panel/ChangelogPanel.svelte';
    import HistoryPanel from './master_panel/HistoryPanel.svelte';
    import { fade } from 'svelte/transition';
    import { initAuthStore, fetchWithAuth, getLoggedInUser } from '../../stores/auth.js';
    import {
        selectedServer as selectedServerStore,
        availableServers as availableServersStore,
        selectServer as guildSelectServer,
        restoreLastServer,
    } from '../../stores/guild.js';

    const SUPER_ADMIN_ID = '285201373266575361';

    let user = null;
    let loading = true;
    let currentView = '';
    let allowedViews = [];

    let isMobile = false;

    onMount(async () => {
        checkMobile();
        window.addEventListener('resize', checkMobile);

        initAuthStore();

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
            const loggedInUser = getLoggedInUser();
            if (loggedInUser) {
                user = loggedInUser;
                determineAccess(user);
                fetchUserServers(user);
            }
            loading = false;
        }, 500);

        return () => {
            document.removeEventListener('auth:loggedIn', authHandler);
            window.removeEventListener('resize', checkMobile);
        };
    });

    function checkMobile() {
        const userAgent = navigator.userAgent || navigator.vendor;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        isMobile = mobileRegex.test(userAgent) || (isTouchDevice && isSmallScreen);
    }

    function determineAccess(userData) {
        allowedViews = [];
        if (userData.is_active_patron) {
            allowedViews.push({ id: 'config', label: 'Bot Config', icon: 'fa-robot' });
        }

        if (userData.is_master_admin) {
            allowedViews.push({ id: 'master', label: 'Master Panel', icon: 'fa-user-shield' });
            allowedViews.push({ id: 'changelog', label: 'Changelog', icon: 'fa-history' });
        }

        if (userData.id === SUPER_ADMIN_ID) {
            allowedViews.push({ id: 'recovery', label: 'Recovery', icon: 'fa-database' });
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
            const servers = await fetchWithAuth('/api/users/guilds');
            if (Array.isArray(servers)) {
                availableServersStore.set(servers);
                if (servers.length > 0) {
                    restoreLastServer(servers);
                } else {
                    guildSelectServer(null);
                }
            }
        } catch (e) {
            console.error('Failed to fetch user servers:', e);
            availableServersStore.set([]);
        } finally {
        }
    }

    function handleSelectServer(e) {
        if (e.detail) {
            guildSelectServer(e.detail);
        } else {
            guildSelectServer(null);
        }
    }
</script>

{#if isMobile}
    <div class="mobile-warning">
        <div class="mobile-warning-content">
            <div class="mobile-warning-icon">
                <i class="fas fa-desktop"></i>
            </div>
            <h2 class="mobile-warning-title">Desktop Required</h2>
            <p class="mobile-warning-text">
                The Dashboard is not optimized for mobile devices due to its complex interactive interface.
            </p>
            <p class="mobile-warning-text">
                For the best experience, please visit this page on a <strong>desktop computer</strong>,
                <strong>laptop</strong>, or <strong>tablet in landscape mode</strong>.
            </p>
        </div>
    </div>
{:else}
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
                <a
                    href="https://www.patreon.com/c/kingscodex"
                    target="_blank"
                    class="btn-primary"
                    style="margin-top: 20px;"
                >
                    Subscribe on Patreon
                </a>
            </div>
        {:else}
            <!-- Dashboard Sub-Nav (flush against the main navbar) -->
            <div class="dashboard-subnav">
                <div class="dashboard-subnav-inner">
                    {#each allowedViews as view}
                        <button
                            class="subnav-tab"
                            class:active={currentView === view.id}
                            on:click={() => switchView(view.id)}
                        >
                            <i class="fas {view.icon}"></i>
                            <span>{view.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Full-width content area -->
            <main class="dashboard-content">
                {#key currentView}
                    <div class="panel-transition" in:fade={{ duration: 150 }}>
                        {#if currentView === 'master'}
                            <MasterPanel {user} />
                        {:else if currentView === 'config'}
                            <BotConfigPanel
                                {user}
                                on:selectServer={handleSelectServer}
                            />
                        {:else if currentView === 'changelog'}
                            <ChangelogPanel {user} />
                        {:else if currentView === 'recovery'}
                            <HistoryPanel {user} />
                        {/if}
                    </div>
                {/key}
            </main>
        {/if}
    </div>
{/if}

<style>
    /* Mobile Warning */
    .mobile-warning {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: 40px 20px;
    }

    .mobile-warning-content {
        text-align: center;
        max-width: 400px;
        padding: 30px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
    }

    .mobile-warning-icon {
        font-size: 3rem;
        color: var(--accent-blue);
        margin-bottom: 20px;
    }

    .mobile-warning-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 15px;
    }

    .mobile-warning-text {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.6;
        margin-bottom: 15px;
    }

    .mobile-warning-text strong {
        color: var(--accent-blue-bright);
    }

    /* Dashboard Wrapper - Full Page */
    .dashboard-wrapper {
        min-height: 100vh;
        background-color: var(--bg-primary);
        display: flex;
        flex-direction: column;
    }

    /* Sub-Nav Bar - flush with the main navbar */
    .dashboard-subnav {
        background: rgba(30, 30, 35, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-top: none;
        border-radius: 0 0 20px 20px;
        max-width: 1200px;
        margin: 0 auto;
        width: calc(100% - 2 * var(--spacing-4));
        position: relative;
        z-index: 50;
        margin-top: -1px;
        overflow: hidden;
    }

    .dashboard-subnav-inner {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        width: 100%;
        padding: 0 2rem;
    }

    .subnav-tab {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: var(--spacing-3) var(--spacing-4);
        background: none;
        border: none;
        color: var(--text-secondary);
        font-weight: 500;
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: color 0.2s ease;
        white-space: nowrap;
        position: relative;
    }

    .subnav-tab:hover {
        color: var(--text-primary);
    }

    .subnav-tab.active {
        color: var(--text-primary);
    }

    .subnav-tab.active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--accent-blue);
    }

    .subnav-tab i {
        font-size: 0.9em;
    }

    /* Full-width Content Area */
    .dashboard-content {
        flex: 1;
        padding: var(--spacing-8) var(--spacing-6);
        max-width: 1600px;
        width: 100%;
        margin: 0 auto;
        min-height: 600px;
    }

    /* Loading & Auth States */
    .loading-container,
    .unauthorized-container {
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

    .panel-transition {
        width: 100%;
    }

    /* Responsive: match navbar margin changes */
    @media (max-width: 1024px) {
        .dashboard-subnav {
            width: calc(100% - 2 * var(--spacing-2));
        }
    }

    @media (max-width: 768px) {
        .dashboard-subnav {
            width: calc(100% - 2 * var(--spacing-1));
            border-radius: 0 0 var(--radius-md) var(--radius-md);
        }
    }

    @media (max-width: 480px) {
        .dashboard-subnav {
            width: calc(100% - 2 * var(--spacing-1));
        }
        .subnav-tab span {
            display: none;
        }
        .subnav-tab {
            padding: var(--spacing-3) var(--spacing-2);
        }
    }
</style>
