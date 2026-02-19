<script>
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';

    let visible = false;

    onMount(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            visible = true;
        }
    });

    function accept() {
        localStorage.setItem('cookie_consent', 'accepted');
        visible = false;
        // Enable GA if it was deferred
        if (window.gtag) {
            window.gtag('consent', 'update', {
                analytics_storage: 'granted',
            });
        }
    }

    function decline() {
        localStorage.setItem('cookie_consent', 'declined');
        visible = false;
        // Disable GA
        if (window.gtag) {
            window.gtag('consent', 'update', {
                analytics_storage: 'denied',
            });
        }
    }
</script>

{#if visible}
    <div class="cookie-banner" transition:fly={{ y: 100, duration: 300 }}>
        <div class="cookie-content">
            <p>We use cookies for analytics to improve your experience. No personal data is shared with third parties.</p>
            <div class="cookie-actions">
                <button class="btn-decline" on:click={decline}>Decline</button>
                <button class="btn-accept" on:click={accept}>Accept</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .cookie-banner {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg-card, #1a1b1e);
        border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
        padding: 16px 24px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        z-index: 9999;
        max-width: 520px;
        width: 90%;
    }
    .cookie-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
        text-align: center;
    }
    .cookie-content p {
        color: var(--text-secondary, #a0a0a0);
        font-size: 0.85rem;
        line-height: 1.5;
        margin: 0;
    }
    .cookie-actions {
        display: flex;
        gap: 10px;
    }
    .btn-accept {
        background: var(--accent-blue, #3b82f6);
        color: white;
        border: none;
        padding: 8px 20px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: background 0.2s ease;
    }
    .btn-accept:hover {
        background: #2563eb;
    }
    .btn-decline {
        background: transparent;
        color: var(--text-secondary, #a0a0a0);
        border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 500;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .btn-decline:hover {
        color: var(--text-primary, #fff);
        border-color: var(--text-secondary, #a0a0a0);
    }
</style>
