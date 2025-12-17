<script>
    import { onMount } from 'svelte';
    import MasterPanel from './master_panel/MasterPanel.svelte';
    import BotConfigPanel from './bot_panel/BotConfigPanel.svelte';
    import ChangelogPanel from './master_panel/ChangelogPanel.svelte';

    let user = null;
    let loading = true;
    let currentView = ''; 
    let allowedViews = [];

    onMount(async () => {
        if (window.auth && typeof window.auth.init === 'function') {
            await window.auth.init('#auth-container-dashboard');
        }
        
        setTimeout(() => {
            const loggedInUser = window.auth.getLoggedInUser();
            if (loggedInUser) {
                user = loggedInUser;
                determineAccess(user);
            }
            loading = false;
        }, 500);

        const authHandler = (e) => {
            user = e.detail.user;
            determineAccess(user);
            loading = false;
        };

        document.addEventListener('auth:loggedIn', authHandler);

        return () => {
            document.removeEventListener('auth:loggedIn', authHandler);
        };
    });

    function determineAccess(userData) {
        allowedViews = [];
        if (userData.is_master_admin) {
            allowedViews.push({ id: 'master', label: 'Master Panel', icon: 'fa-user-shield' });
            allowedViews.push({ id: 'changelog', label: 'Changelog', icon: 'fa-history' });
        }

        if (userData.is_active_patron) {
            allowedViews.push({ id: 'config', label: 'Bot Config', icon: 'fa-robot' });
        }

        if (allowedViews.length > 0) {
            currentView = allowedViews[0].id;
        }
    }

    function switchView(viewId) {
        currentView = viewId;
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
            </nav>

            <main class="dashboard-content">
                {#if currentView === 'master'}
                    <MasterPanel {user} />
                {:else if currentView === 'bot_config'}
                    <BotConfigPanel {user} />
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
        gap: var(--spacing-2);
        margin-bottom: 0;
        padding-left: var(--spacing-2);
        z-index: 10;
        position: relative;
        top: 1px;
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

    .nav-tab i {
        font-size: 1.1em;
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
    
    .dashboard-wrapper :global(.dashboard-header) {
        margin-bottom: var(--spacing-8);
        padding-bottom: var(--spacing-6);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }

    .dashboard-wrapper :global(.dashboard-header h1) {
        font-size: var(--font-size-3xl);
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: var(--spacing-2);
    }

    .dashboard-wrapper :global(.dashboard-header p) {
        color: var(--text-secondary);
        font-size: var(--font-size-lg);
    }

    .dashboard-wrapper :global(.panel-content) {
        color: var(--text-primary);
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
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 0;
        }
        .nav-tab {
            flex: 1;
            min-width: auto;
            padding: var(--spacing-3);
            font-size: var(--font-size-sm);
            white-space: nowrap;
        }
        .dashboard-content {
            padding: var(--spacing-4);
        }
    }
</style>