<script>
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import ArkAlliancePanel from './ArkAlliancePanel.svelte';

    export let guildId;

    let loading = true;
    let alliances = {};
    let activeTab = null;
    let channels = [];
    let roles = [];

    let showCreateModal = false;
    let newAllianceTag = "";
    let creating = false;

    onMount(async () => {
        await loadData();
    });

    async function loadData() {
        loading = true;
        try {
            const [arkRes, chRes, rolesRes] = await Promise.all([
                window.auth.fetchWithAuth(`/api/guilds/${guildId}/ark/all`),
                window.auth.fetchWithAuth(`/api/guilds/${guildId}/channels`),
                window.auth.fetchWithAuth(`/api/guilds/${guildId}/roles`)
            ]);
            alliances = arkRes.alliances || {};
            channels = chRes.channels || [];
            roles = rolesRes.roles || [];

            const tags = Object.keys(alliances);
            if (tags.length > 0 && !activeTab) {
                activeTab = tags[0];
            }
        } catch (e) {
            console.error("Failed to load Ark data", e);
        } finally {
            loading = false;
        }
    }

    async function createAlliance() {
        if (!newAllianceTag.trim()) return alert("Please enter an alliance tag.");
        creating = true;
        try {
            await window.auth.fetchWithAuth(`/api/guilds/${guildId}/ark/alliance`, {
                method: 'POST',
                body: JSON.stringify({
                    alliance_tag: newAllianceTag.trim(),
                    reminder_interval: 3600
                })
            });
            await loadData();
            activeTab = newAllianceTag.trim();
            showCreateModal = false;
            newAllianceTag = "";
        } catch (e) {
            alert("Failed to create alliance. Tag might already exist.");
        } finally {
            creating = false;
        }
    }

    function handleAllianceDeleted(e) {
        const deletedTag = e.detail.tag;
        delete alliances[deletedTag];
        alliances = { ...alliances };
        
        const tags = Object.keys(alliances);
        activeTab = tags.length > 0 ? tags[0] : null;
    }

    function refreshData() {
        loadData();
    }
</script>

<div class="ark-container" transition:fade={{ duration: 200 }}>
    <div class="section-header">
        {#if loading}
            <div class="header-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
        {:else}
            <div class="tabs-container">
                {#each Object.keys(alliances) as tag}
                    <button 
                        class="tab-btn" 
                        class:active={activeTab === tag}
                        on:click={() => activeTab = tag}
                    >
                        {tag}
                    </button>
                {/each}
                
                <button class="tab-btn add-btn" on:click={() => showCreateModal = true}>
                    <i class="fas fa-plus"></i> <span>New Alliance</span>
                </button>
            </div>
        {/if}
    </div>

    {#if !loading}
        {#if showCreateModal}
            <div class="create-panel" transition:slide>
                <h4>Setup New Alliance</h4>
                <div class="create-row">
                    <input type="text" placeholder="Alliance Tag (e.g. 60GT)" bind:value={newAllianceTag} />
                    <button class="btn-confirm" on:click={createAlliance} disabled={creating}>
                        {creating ? 'Creating...' : 'Create Setup'}
                    </button>
                    <button class="btn-cancel" on:click={() => showCreateModal = false}>Cancel</button>
                </div>
            </div>
        {/if}

        <div class="tab-content">
            {#if activeTab && alliances[activeTab]}
                {#key activeTab} 
                    <ArkAlliancePanel 
                        {guildId}
                        allianceTag={activeTab}
                        data={alliances[activeTab]}
                        {channels}
                        {roles}
                        on:deleted={handleAllianceDeleted}
                        on:updated={refreshData}
                    />
                {/key}
            {:else if Object.keys(alliances).length === 0 && !showCreateModal}
                <div class="empty-state">
                    <i class="fas fa-scroll"></i>
                    <h4>No Active Setups</h4>
                    <p>Click <strong>+ New Alliance</strong> above to get started.</p>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .ark-container { 
        display: flex;
        flex-direction: column; 
        gap: 0;
    }
    
    .section-header { 
        display: flex;
        align-items: center; 
        padding-bottom: 0; 
        border-bottom: 1px solid var(--border-color);
        min-height: 45px;
    }
    
    .header-loading { color: var(--text-secondary); padding: 10px; font-style: italic; }

    .tabs-container {
        display: flex; 
        gap: 0;
        overflow-x: auto;
        width: 100%;
        scrollbar-width: none; 
        -ms-overflow-style: none;
        padding-top: 1px;
        align-self: flex-end;
    }
    
    .tab-btn {
        position: relative;
        background: transparent;
        border: 1px solid transparent; 
        border-bottom: none;
        padding: 14px 20px;
        color: var(--text-secondary); 
        cursor: pointer; 
        font-weight: 600; 
        border-radius: 8px 8px 0 0;
        transition: all 0.2s;
        font-size: 1.1rem;
        white-space: nowrap;
        display: flex; 
        align-items: center; 
        justify-content: center;
        gap: 10px;
        flex-shrink: 0;
        min-width: 33%;
    }
    
    .tab-btn.add-btn {
        min-width: auto;
        width: auto;
    }
    
    .tab-btn:hover { 
        background: rgba(255,255,255,0.03); 
        color: var(--text-primary);
    }
    
    .tab-btn.active { 
        background: var(--bg-secondary);
        color: var(--accent-blue); 
        border: 1px solid var(--border-color); 
        border-bottom: 1px solid var(--bg-secondary); 
        margin-bottom: -1px; 
        z-index: 10; 
    }
    .tab-content {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-top: none;
        border-radius: 0 0 8px 8px;
        padding: 20px;
    }
    
    .tab-btn.add-btn { color: var(--accent-green, #10b981); opacity: 0.8; }
    .tab-btn.add-btn:hover { opacity: 1; background: rgba(16, 185, 129, 0.1); }

    .create-panel {
        background: var(--bg-secondary); border: 1px solid var(--border-color);
        padding: 20px; border-radius: 8px; margin-bottom: 20px;
    }
    .create-panel h4 { margin: 0 0 15px 0; color: var(--text-primary); }
    .create-row { display: flex; gap: 10px; }
    .create-row input {
        flex: 1; padding: 10px; background: var(--bg-primary);
        border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);
    }
    .btn-confirm { background: var(--accent-blue); color: white; border: none; padding: 0 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .btn-cancel { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); padding: 0 15px; border-radius: 6px; cursor: pointer; }

    .empty-state {
        text-align: center; padding: 40px; color: var(--text-secondary);
        background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);
    }
    .empty-state i { font-size: 2rem; margin-bottom: 15px; opacity: 0.5; }
</style>