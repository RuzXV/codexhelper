<script>
    import CommanderEditor from './CommanderEditor.svelte';
    import GenericJsonEditor from './GenericJsonEditor.svelte';
    import { onMount } from 'svelte';

    let activeTab = 'loading';
    let userState = {
        isSubscriber: false,
        isAdmin: false,
        isLoaded: false
    };

    const MASTER_ADMIN_IDS = [
        '285201373266575361', 
        '388515288666210313'
    ];

    onMount(async () => {
        try {
            const user = await window.auth.fetchWithAuth('/api/users/@me');
            if (user) {
                userState.isSubscriber = user.is_active_patron;
                userState.isAdmin = MASTER_ADMIN_IDS.includes(user.id);
            }
        } catch (e) {
            console.error("Auth check failed", e);
        } finally {
            userState.isLoaded = true;
            setDefaultTab();
        }
    });

    function setDefaultTab() {
        if (userState.isAdmin) {
            activeTab = 'commanders';
        } else if (userState.isSubscriber) {
            activeTab = 'settings';
        } else {
            activeTab = 'unauthorized';
        }
    }
</script>

<div class="dashboard-container">
    {#if !userState.isLoaded}
        <div class="loading-state">
            <div class="animate-spin" style="font-size: 2rem;">⏳</div>
            <p>Verifying Permissions...</p>
        </div>
    {:else if activeTab === 'unauthorized'}
        <div class="error-state">
            <h3>⛔ Access Denied</h3>
            <p>You must be a Subscriber or Master Admin to view this dashboard.</p>
            <a href="/" class="btn-crystal">Return Home</a>
        </div>
    {:else}
        <div class="dashboard-nav">
            <div class="nav-pills">
                {#if userState.isSubscriber}
                    <button 
                        class="nav-pill" 
                        class:active={activeTab === 'settings'} 
                        on:click={() => activeTab = 'settings'}
                    >
                        <i class="fas fa-cog"></i> Server Settings
                    </button>
                {/if}

                {#if userState.isAdmin}
                    <div class="divider"></div>
                    <button class="nav-pill" class:active={activeTab === 'commanders'} on:click={() => activeTab = 'commanders'}>
                        <i class="fas fa-user-shield"></i> Commanders
                    </button>
                    <button class="nav-pill" class:active={activeTab === 'bundles'} on:click={() => activeTab = 'bundles'}>
                        <i class="fas fa-box-open"></i> Bundles
                    </button>
                    <button class="nav-pill" class:active={activeTab === 'events'} on:click={() => activeTab = 'events'}>
                        <i class="fas fa-calendar-alt"></i> Events
                    </button>
                    <button class="nav-pill" class:active={activeTab === 'meta'} on:click={() => activeTab = 'meta'}>
                        <i class="fas fa-chess"></i> Meta
                    </button>
                {/if}
            </div>
        </div>

        <div class="dashboard-content">
            {#if activeTab === 'settings'}
                <div class="coming-soon-box">
                    <div class="icon-glow">⚙️</div>
                    <h2>Server Settings</h2>
                    <p>Powerful tools to manage your server's bot configuration are coming soon.</p>
                    <span class="badge">In Development</span>
                </div>
            {:else if activeTab === 'commanders'}
                <CommanderEditor />
            {:else if activeTab === 'bundles'}
                <GenericJsonEditor apiKey="bundles" title="Bundles" />
            {:else if activeTab === 'events'}
                <GenericJsonEditor apiKey="events" title="Events" />
            {:else if activeTab === 'meta'}
                <GenericJsonEditor apiKey="meta_lineups" title="Meta Lineups" />
            {/if}
        </div>
    {/if}
</div>

<style>
    .dashboard-container {
        min-height: 80vh;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-6);
        animation: fadeIn 0.5s ease-out;
    }

    .dashboard-nav {
        background: rgba(20, 21, 24, 0.6);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-2);
        backdrop-filter: blur(10px);
    }

    .nav-pills {
        display: flex;
        gap: var(--spacing-2);
        flex-wrap: wrap;
        align-items: center;
    }

    .nav-pill {
        background: transparent;
        border: 1px solid transparent;
        color: var(--text-secondary);
        padding: 10px 20px;
        border-radius: var(--radius-md);
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
    }

    .nav-pill:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
    }

    .nav-pill.active {
        background: rgba(59, 130, 246, 0.15);
        border-color: var(--accent-blue);
        color: var(--accent-blue-bright);
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.1);
    }

    .divider {
        width: 1px;
        height: 24px;
        background: var(--border-color);
        margin: 0 10px;
    }

    .coming-soon-box {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-16);
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-4);
        min-height: 400px;
    }

    .icon-glow {
        font-size: 4rem;
        filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.4));
    }

    .badge {
        background: var(--accent-blue-light);
        color: var(--accent-blue);
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 700;
        border: 1px solid var(--accent-blue);
    }

    .loading-state, .error-state {
        text-align: center;
        padding: 100px 0;
        color: var(--text-secondary);
    }

    .btn-crystal {
        display: inline-block;
        margin-top: 20px;
        padding: 10px 20px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        color: white;
        text-decoration: none;
        border-radius: var(--radius-md);
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
</style>