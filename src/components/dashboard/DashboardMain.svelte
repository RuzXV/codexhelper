<script>
    import CommanderEditor from './CommanderEditor.svelte';
    import GenericJsonEditor from './GenericJsonEditor.svelte';
    import { onMount } from 'svelte';

    let activeTab = 'commanders';
    let isAuthorized = false;
    let loading = true;

    onMount(async () => {
        try {
            const user = await window.auth.fetchWithAuth('/api/users/@me');
            const ALLOWED = ['285201373266575361', '1121488445836103820'];
            if (user && ALLOWED.includes(user.id)) {
                isAuthorized = true;
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    });
</script>

{#if loading}
    <div class="loading">Verifying Access...</div>
{:else if !isAuthorized}
    <div class="error">⛔ Unauthorized Access. Master Admins Only.</div>
{:else}
    <div class="tabs">
        <button class:active={activeTab === 'commanders'} on:click={() => activeTab = 'commanders'}>Commanders</button>
        <button class:active={activeTab === 'bundles'} on:click={() => activeTab = 'bundles'}>Bundles</button>
        <button class:active={activeTab === 'events'} on:click={() => activeTab = 'events'}>Events</button>
        <button class:active={activeTab === 'meta'} on:click={() => activeTab = 'meta'}>Meta Lineups</button>
    </div>

    <div class="content">
        {#if activeTab === 'commanders'}
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

<style>
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #333; }
    button { background: none; border: none; padding: 10px 20px; color: #888; cursor: pointer; font-size: 1.1rem; }
    button.active { color: white; border-bottom: 2px solid #3b82f6; }
    .loading, .error { text-align: center; margin-top: 50px; font-size: 1.5rem; }
    .error { color: #ef4444; }
</style>