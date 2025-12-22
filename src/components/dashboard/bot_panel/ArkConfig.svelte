<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';

    export let guildId;
    
    let loading = true;
    let saving = false;
    let settings = {};
    let originalSettings = {};
    let channels = [];
    let roles = [];
    
    let openDropdownId = null;
    let dropdownSearch = "";

    $: hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

    const FIELDS = [
        { id: 'channel_id', label: 'Registration Channel', icon: 'fa-scroll', type: 'channel' },
        { id: 'announcement_channel_id', label: 'Announcement Channel', icon: 'fa-bullhorn', type: 'channel' },
        { id: 'admin_role_id', label: 'Ark Admin Role', icon: 'fa-user-shield', type: 'role' },
        { id: 'signup_role_id', label: 'Signup Role (Given to users)', icon: 'fa-user-tag', type: 'role' }
    ];

    onMount(async () => {
        try {
            const [settingsRes, channelsRes, rolesRes] = await Promise.all([
                window.auth.fetchWithAuth(`/api/guilds/${guildId}/ark`),
                window.auth.fetchWithAuth(`/api/guilds/${guildId}/channels`),
                window.auth.fetchWithAuth(`/api/guilds/${guildId}/roles`)
            ]);
            
            settings = settingsRes?.config || {};
            originalSettings = { ...settings };
            channels = channelsRes?.channels || [];
            roles = rolesRes?.roles || [];
        } catch (e) {
            console.error("Failed to load Ark settings", e);
        } finally {
            loading = false;
        }
    });

    async function saveSettings() {
        saving = true;
        try {
            await window.auth.fetchWithAuth(`/api/guilds/${guildId}/ark`, {
                method: 'POST',
                body: JSON.stringify(settings)
            });
            originalSettings = { ...settings };
        } catch (e) {
            alert("Failed to save settings.");
        } finally {
            saving = false;
        }
    }

    function discardChanges() {
        settings = { ...originalSettings };
    }

    function toggleDropdown(id, event) {
        event.stopPropagation();
        dropdownSearch = "";
        openDropdownId = openDropdownId === id ? null : id;
        if (openDropdownId) {
            setTimeout(() => document.getElementById(`search-${id}`)?.focus(), 50);
        }
    }

    function selectItem(fieldId, value) {
        settings[fieldId] = value;
        openDropdownId = null;
    }

    function getItemName(id, type) {
        if (!id || id === 'none') return "⛔ Disabled / Not Set";
        if (type === 'channel') {
            const ch = channels.find(c => c.id === id);
            return ch ? `# ${ch.name}` : "Unknown Channel";
        } else {
            const r = roles.find(r => r.id === id);
            return r ? `@${r.name}` : "Unknown Role";
        }
    }

    function handleWindowClick() {
        openDropdownId = null;
    }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="section-card" transition:fade={{ duration: 200 }}>
    <div class="section-header">
        <h3><i class="fas fa-dungeon"></i> Ark of Osiris Configuration</h3>
        <p class="section-desc">Manage signups, announcements, and role permissions for Ark.</p>
    </div>

    {#if loading}
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading settings...</div>
    {:else}
        <div class="settings-grid">
            {#each FIELDS as field}
                <div class="setting-row">
                    <div class="group-info">
                        <div class="group-title-row">
                            <i class="fas {field.icon} group-icon"></i>
                            <span class="group-name">{field.label}</span>
                        </div>
                    </div>
                    
                    <div class="control-wrapper">
                        <div class="custom-select-container">
                            <button type="button" class="custom-select-trigger" on:click={(e) => toggleDropdown(field.id, e)} disabled={saving}>
                                <span class="selected-text">{getItemName(settings[field.id], field.type)}</span>
                                <i class="fas fa-chevron-down arrow" class:rotated={openDropdownId === field.id}></i>
                            </button>

                            {#if openDropdownId === field.id}
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div class="custom-dropdown-menu" on:click|stopPropagation>
                                    <div class="dropdown-search">
                                        <input id="search-{field.id}" type="text" placeholder="Search..." bind:value={dropdownSearch} />
                                    </div>
                                    <div class="dropdown-options-list">
                                        <button type="button" class="dropdown-option danger" 
                                            class:selected={!settings[field.id]} 
                                            on:click={() => selectItem(field.id, null)}>
                                            ⛔ Disabled / Not Set
                                        </button>

                                        {#if field.type === 'channel'}
                                            {#each channels.filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as item}
                                                <button type="button" class="dropdown-option" 
                                                    class:selected={settings[field.id] === item.id} 
                                                    on:click={() => selectItem(field.id, item.id)}>
                                                    <span class="channel-hash">#</span> {item.name}
                                                </button>
                                            {/each}
                                        {:else}
                                            {#each roles.filter(r => r.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as item}
                                                <button type="button" class="dropdown-option" 
                                                    class:selected={settings[field.id] === item.id} 
                                                    on:click={() => selectItem(field.id, item.id)}>
                                                    <span class="role-dot" style="background-color: #{item.color ? item.color.toString(16) : '99aab5'}"></span> {item.name}
                                                </button>
                                            {/each}
                                        {/if}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

{#if hasUnsavedChanges}
    <div class="save-bar" transition:fly={{ y: 50, duration: 300 }}>
        <div class="save-bar-content">
            <span>You have unsaved changes.</span>
            <div class="save-actions">
                <button class="btn-discard" on:click={discardChanges} disabled={saving}>Discard</button>
                <button class="btn-calculate" on:click={saveSettings} disabled={saving}>
                    {#if saving}<i class="fas fa-spinner fa-spin"></i>{:else}Save Changes{/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .section-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; overflow: visible; margin-bottom: 20px; }
    .section-header { padding: 20px; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.1); }
    .section-header h3 { margin: 0; display: flex; align-items: center; gap: 10px; font-size: 1.1rem; }
    .section-desc { color: var(--text-secondary); font-size: 0.9rem; margin-top: 5px; margin-left: 28px; }
    .loading-state { padding: 40px; text-align: center; color: var(--text-secondary); }
    .settings-grid { display: flex; flex-direction: column; }
    .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid var(--border-color); transition: background 0.2s; }
    .setting-row:hover { background: var(--bg-tertiary); }
    .group-title-row { display: flex; align-items: center; gap: 10px; }
    .group-icon { color: var(--accent-blue); width: 20px; text-align: center; }
    .group-name { font-weight: 600; color: var(--text-primary); }
    .control-wrapper { width: 300px; }
    
    .custom-select-container { position: relative; width: 100%; }
    .custom-select-trigger { width: 100%; display: flex; align-items: center; justify-content: center; padding: 10px 14px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); cursor: pointer; font-size: 0.95rem; position: relative; }
    .selected-text { text-align: center; flex-grow: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .arrow { font-size: 0.8rem; opacity: 0.7; transition: transform 0.2s; position: absolute; right: 14px; }
    .arrow.rotated { transform: rotate(180deg); }
    .custom-dropdown-menu { position: absolute; top: calc(100% + 5px); right: 0; width: 100%; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; z-index: 50; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
    .dropdown-search { padding: 8px; border-bottom: 1px solid var(--border-color); background: var(--bg-tertiary); }
    .dropdown-search input { width: 100%; background: var(--bg-primary); border: 1px solid var(--border-color); padding: 6px 10px; border-radius: 4px; color: var(--text-primary); font-size: 0.9rem; }
    .dropdown-options-list { max-height: 250px; overflow-y: auto; }
    .dropdown-option { width: 100%; text-align: left; background: transparent; border: none; display: flex; padding: 8px 12px; color: var(--text-secondary); cursor: pointer; align-items: center; gap: 8px; font-size: 0.9rem; }
    .dropdown-option:hover { background: var(--accent-blue); color: white; }
    .dropdown-option.selected { background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); font-weight: 600; }
    .dropdown-option.danger { color: #ef4444; }
    .role-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

    .save-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--bg-card, #1f2937); border: 1px solid var(--border-color); padding: 12px 24px; border-radius: 50px; box-shadow: 0 5px 25px rgba(0,0,0,0.5); z-index: 1000; min-width: 350px; }
    .save-bar-content { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
    .save-actions { display: flex; gap: 10px; }
    .btn-calculate { background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple, #8b5cf6)); color: white; border: none; padding: 8px 24px; border-radius: 20px; font-weight: 600; cursor: pointer; }
    .btn-discard { background: transparent; color: #ef4444; border: 1px solid #ef4444; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; }
    
    @media (max-width: 768px) {
        .setting-row { flex-direction: column; align-items: flex-start; gap: 15px; }
        .control-wrapper { width: 100%; }
        .save-bar { width: 90%; }
    }
</style>