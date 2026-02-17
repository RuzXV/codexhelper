<script lang="ts">
    // ============================================
    // KvK Timers & Tracking
    // Thin parent: manages tab state and tick interval.
    // Each timer is a self-contained sub-component.
    // ============================================

    import { onMount } from 'svelte';
    import BurnTimer from './kvk_timers/BurnTimer.svelte';
    import ShieldTimer from './kvk_timers/ShieldTimer.svelte';
    import HealTimer from './kvk_timers/HealTimer.svelte';
    import BuffTimer from './kvk_timers/BuffTimer.svelte';

    type TimerTab = 'burn' | 'shield' | 'heal' | 'buff';
    let activeTab: TimerTab = 'burn';

    // Tick counter for live relative time updates
    let tick = 0;
    let tickInterval: ReturnType<typeof setInterval>;

    onMount(() => {
        tickInterval = setInterval(() => {
            tick++;
        }, 1000);
        return () => clearInterval(tickInterval);
    });
</script>

<div class="timers-container">
    <!-- Tab Navigation -->
    <div class="timer-tabs">
        <button
            class="timer-tab"
            class:active={activeTab === 'burn'}
            on:click={() => {
                activeTab = 'burn';
            }}
        >
            <i class="fas fa-fire"></i>
            <span>Burn</span>
        </button>
        <button
            class="timer-tab"
            class:active={activeTab === 'shield'}
            on:click={() => {
                activeTab = 'shield';
            }}
        >
            <i class="fas fa-shield-halved"></i>
            <span>Shield</span>
        </button>
        <button
            class="timer-tab"
            class:active={activeTab === 'heal'}
            on:click={() => {
                activeTab = 'heal';
            }}
        >
            <i class="fas fa-heart-pulse"></i>
            <span>Heal</span>
        </button>
        <button
            class="timer-tab"
            class:active={activeTab === 'buff'}
            on:click={() => {
                activeTab = 'buff';
            }}
        >
            <i class="fas fa-bolt"></i>
            <span>Buff</span>
        </button>
    </div>

    <!-- Tab Content -->
    <div class="timer-content">
        {#if activeTab === 'burn'}
            <BurnTimer {tick} />
        {:else if activeTab === 'shield'}
            <ShieldTimer {tick} />
        {:else if activeTab === 'heal'}
            <HealTimer {tick} />
        {:else if activeTab === 'buff'}
            <BuffTimer {tick} />
        {/if}
    </div>
</div>

<style>
    /* ================================================
       CONTAINER
       ================================================ */
    .timers-container {
        width: 100%;
        max-width: 700px;
        margin: 0 auto;
        padding: var(--spacing-4);
    }

    /* ================================================
       TABS
       ================================================ */
    .timer-tabs {
        display: flex;
        gap: var(--spacing-2);
        background: rgba(20, 21, 24, 0.65);
        padding: var(--spacing-2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-lg);
        margin-bottom: var(--spacing-6);
    }

    .timer-tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-2);
        padding: var(--spacing-3) var(--spacing-4);
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        font-weight: 600;
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .timer-tab:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
    }

    .timer-tab.active {
        background: var(--accent-blue-light);
        border-color: var(--accent-blue);
        color: var(--text-primary);
    }

    .timer-tab i {
        font-size: 0.9rem;
    }

    /* ================================================
       MOBILE RESPONSIVE
       ================================================ */
    @media (max-width: 768px) {
        .timers-container {
            padding: var(--spacing-2);
        }

        .timer-tabs {
            gap: var(--spacing-1);
            padding: var(--spacing-1);
        }

        .timer-tab {
            padding: var(--spacing-2) var(--spacing-2);
            font-size: var(--font-size-xs);
        }

        .timer-tab span {
            display: none;
        }

        .timer-tab i {
            font-size: 1rem;
        }
    }
</style>
