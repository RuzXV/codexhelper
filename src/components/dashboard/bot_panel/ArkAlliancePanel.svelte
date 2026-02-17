<script>
    import { createEventDispatcher, tick } from 'svelte';
    import { slide, fly, fade } from 'svelte/transition';
    // xlsx is dynamically imported in exportToExcel() to avoid 880KB in the initial bundle
    import ArkTeamCard from './ArkTeamCard.svelte';

    export let guildId;
    export let allianceTag;
    export let data;
    export let channels = [];
    export let roles = [];

    const dispatch = createEventDispatcher();
    
    let currentConfig = { ...data.config };
    let originalConfig = JSON.parse(JSON.stringify(data.config));
    let hasUnsavedChanges = false;
    let saving = false;
    let openDropdownId = null;
    let dropdownSearch = "";
    let refreshingEmbed = false;
    let postingSignup = false;

    function secondsToTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    function timeToSeconds(timeStr) {
        if (!timeStr) return 3600;
        const [h, m] = timeStr.split(':').map(Number);
        return (h * 3600) + (m * 60);
    }

    let reminderTime = secondsToTime(currentConfig.reminder_interval || 3600);
    $: {
        const timeSec = timeToSeconds(reminderTime);
        const configChanged = JSON.stringify({ ...currentConfig, reminder_interval: timeSec }) !== JSON.stringify(originalConfig);
        hasUnsavedChanges = configChanged;
    }

    async function saveAllSettings() {
        saving = true;
        try {
            await window.auth.fetchWithAuth(`/api/guilds/${guildId}/ark/alliance`, {
                method: 'POST',
                body: JSON.stringify({
                    alliance_tag: allianceTag,
                    channel_id: currentConfig.channel_id,
                    admin_role_id: currentConfig.admin_role_id,
                    notification_role_id: currentConfig.notification_role_id,
                    reminder_interval: timeToSeconds(reminderTime)
                })
            });
            originalConfig = JSON.parse(JSON.stringify({ ...currentConfig, reminder_interval: timeToSeconds(reminderTime) }));
            hasUnsavedChanges = false;
            dispatch('updated');
        } catch (e) {
            alert('Failed to save settings.');
            console.error(e);
        } finally {
            saving = false;
        }
    }

    async function deleteAlliance() {
        if (!confirm(`Are you sure you want to delete the ENTIRE setup for [${allianceTag}]?\n\nThis will remove all teams and signups.`)) return;
        try {
            await window.auth.fetchWithAuth(`/api/guilds/${guildId}/ark/alliance/${allianceTag}`, { method: 'DELETE' });
            dispatch('deleted', { tag: allianceTag });
        } catch (e) {
            alert('Failed to delete alliance.');
        }
    }

    async function refreshEmbed() {
        refreshingEmbed = true;
        try {
            await window.auth.fetchWithAuth(`/api/guilds/${guildId}/ark/refresh-embed`, {
                method: 'POST',
                body: JSON.stringify({ alliance_tag: allianceTag })
            });
        } catch (e) {
            alert('Failed to refresh embed.');
            console.error(e);
        } finally {
            refreshingEmbed = false;
        }
    }

    async function postNewSignup() {
        if (!confirm(`Post a new signup embed for [${allianceTag}] to the configured channel?`)) return;
        postingSignup = true;
        try {
            await window.auth.fetchWithAuth(`/api/guilds/${guildId}/ark/post-signup`, {
                method: 'POST',
                body: JSON.stringify({ alliance_tag: allianceTag })
            });
            dispatch('updated');
        } catch (e) {
            alert('Failed to post signup.');
            console.error(e);
        } finally {
            postingSignup = false;
        }
    }

    async function addTeam() {
        const existingNums = Object.keys(data.teams).map(Number);
        if (existingNums.length >= 3) {
            alert("Maximum of 3 teams allowed per alliance.");
            return;
        }
        const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
        try {
            await window.auth.fetchWithAuth(`/api/guilds/${guildId}/ark/team`, {
                method: 'POST',
                body: JSON.stringify({
                    alliance_tag: allianceTag,
                    team_number: nextNum,
                    team_name: `Team ${nextNum}`,
                    match_timestamp: Math.floor(Date.now()/1000) + 86400,
                    signup_cap: 30
                })
            });
            dispatch('updated');
        } catch (e) {
            alert("Failed to add team.");
        }
    }

    async function exportToExcel() {
        const teamNums = Object.keys(data.teams).sort();
        const rows = [];
        teamNums.forEach(num => {
            const team = data.teams[num];
            const teamSignups = data.signups.filter(s => s.team_number == num);
            rows.push([`${team.name} (${allianceTag})`]);
            rows.push(['Match Time (UTC)', new Date(team.match_timestamp * 1000).toUTCString()]);
            rows.push(['In-Game Name', 'Signup Time (UTC)']);
            teamSignups.forEach(s => {
                rows.push([
                    s.in_game_name, 
                    new Date(s.signup_timestamp * 1000).toISOString().replace('T', ' ').substring(0, 19)
                ]);
            });
            rows.push(['']); 
        });
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Signups");
        XLSX.writeFile(wb, `Ark_${allianceTag}.xlsx`);
    }

    function toggleDropdown(id, event) {
        event.stopPropagation();
        dropdownSearch = "";
        openDropdownId = openDropdownId === id ? null : id;
        if (openDropdownId) {
            tick().then(() => document.getElementById(`search-${id}`)?.focus());
        }
    }
    
    function getName(id, type) {
        if (!id || id === 'none') return "Not Set";
        if (type === 'channel') {
            const ch = channels.find(c => c.id === id);
            return ch ? `# ${ch.name}` : "Unknown Channel";
        }
        const r = roles.find(r => r.id === id);
        return r ? `@${r.name}` : "Unknown Role";
    }
    
    function selectItem(key, val) {
        currentConfig[key] = val;
        openDropdownId = null;
    }
</script>

<svelte:window on:click={() => openDropdownId = null} />

<div class="alliance-panel" transition:fade>
    <div class="panel-header">
        <div class="header-info">
            <h2 class="tag-title">Alliance: <span class="highlight">{allianceTag}</span></h2>
            <span class="status-badge" class:active={currentConfig.is_active}>
                {currentConfig.is_active ? 'Active' : 'Inactive'}
            </span>
        </div>
        <div class="header-actions">
            <button class="btn-action" on:click={refreshEmbed} disabled={refreshingEmbed} title="Refresh Discord Embed">
                <i class="fas fa-sync-alt" class:fa-spin={refreshingEmbed}></i> <span>{refreshingEmbed ? 'Refreshing...' : 'Refresh Embed'}</span>
            </button>
            <button class="btn-action primary" on:click={postNewSignup} disabled={postingSignup} title="Post New Signup Embed">
                <i class="fas fa-paper-plane"></i> <span>{postingSignup ? 'Posting...' : 'Post Signup'}</span>
            </button>
            <button class="btn-action success" on:click={exportToExcel} title="Download Excel">
                <i class="fas fa-file-excel"></i> <span>Export Signup List</span>
            </button>
            <button class="btn-action danger" on:click={deleteAlliance} title="Delete Alliance">
                <i class="fas fa-trash-alt"></i> <span>Delete Setup</span>
            </button>
        </div>
    </div>

    <div class="panel-content-split">
        
        <div class="config-column">
            <div class="info-card sticky-card">
                <div class="card-header">
                    <h3><i class="fas fa-cogs"></i> Configuration</h3>
                </div>
                <div class="card-content">
                    <div class="settings-list">
                        <div class="setting-group">
                            <label for="ch-{allianceTag}"><i class="fas fa-hashtag"></i> Signup Channel</label>
                            <div class="custom-select-container">
                                <button type="button" class="custom-select-trigger" on:click={(e) => toggleDropdown('channel', e)}>
                                    <span class:placeholder={!currentConfig.channel_id || currentConfig.channel_id === 'none'}>
                                        {getName(currentConfig.channel_id, 'channel')}
                                    </span>
                                    <i class="fas fa-chevron-down arrow"></i>
                                </button>
                                {#if openDropdownId === 'channel'}
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div class="custom-dropdown-menu" on:click|stopPropagation>
                                        <input id="search-channel" class="dropdown-search" bind:value={dropdownSearch} placeholder="Search channels..." />
                                        <div class="options-list">
                                            <button class="dropdown-option danger" on:click={() => selectItem('channel_id', 'none')}>⛔ Disabled</button>
                                            {#each channels.filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as ch}
                                                <button class="dropdown-option" on:click={() => selectItem('channel_id', ch.id)}>
                                                    <i class="fas fa-hashtag text-muted"></i> {ch.name}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <div class="setting-group">
                            <label for="rem-{allianceTag}"><i class="fas fa-hourglass-half"></i> Reminder Interval</label>
                            <input id="rem-{allianceTag}" type="time" class="modern-input" bind:value={reminderTime} />
                        </div>

                        <div class="setting-group">
                            <label for="admin-{allianceTag}"><i class="fas fa-user-shield"></i> Admin Role</label>
                            <div class="custom-select-container">
                                <button type="button" class="custom-select-trigger" on:click={(e) => toggleDropdown('admin', e)}>
                                    <span class:placeholder={!currentConfig.admin_role_id}>
                                        {getName(currentConfig.admin_role_id, 'role')}
                                    </span>
                                    <i class="fas fa-chevron-down arrow"></i>
                                </button>
                                {#if openDropdownId === 'admin'}
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div class="custom-dropdown-menu" on:click|stopPropagation>
                                        <input id="search-admin" class="dropdown-search" bind:value={dropdownSearch} placeholder="Search roles..." />
                                        <div class="options-list">
                                            <button class="dropdown-option danger" on:click={() => selectItem('admin_role_id', null)}>None</button>
                                            {#each roles.filter(r => r.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as r}
                                                <button class="dropdown-option" on:click={() => selectItem('admin_role_id', r.id)}>
                                                    <span class="role-dot" style="background-color: #{r.color?.toString(16) || '999'}"></span> {r.name}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <div class="setting-group">
                            <label for="not-{allianceTag}"><i class="fas fa-bell"></i> Notification Role</label>
                            <div class="custom-select-container">
                                <button type="button" class="custom-select-trigger" on:click={(e) => toggleDropdown('notify', e)}>
                                    <span class:placeholder={!currentConfig.notification_role_id}>
                                        {getName(currentConfig.notification_role_id, 'role')}
                                    </span>
                                    <i class="fas fa-chevron-down arrow"></i>
                                </button>
                                {#if openDropdownId === 'notify'}
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div class="custom-dropdown-menu" on:click|stopPropagation>
                                        <input id="search-notify" class="dropdown-search" bind:value={dropdownSearch} placeholder="Search roles..." />
                                        <div class="options-list">
                                            <button class="dropdown-option danger" on:click={() => selectItem('notification_role_id', null)}>None</button>
                                            {#each roles.filter(r => r.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as r}
                                                <button class="dropdown-option" on:click={() => selectItem('notification_role_id', r.id)}>
                                                    <span class="role-dot" style="background-color: #{r.color?.toString(16) || '999'}"></span> {r.name}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="teams-column">
            <div class="info-card">
                <div class="card-header">
                    <h3><i class="fas fa-users"></i> Signups & Teams</h3>
                </div>
                
                <div class="card-content">
                    <div class="teams-grid">
                        {#each Object.keys(data.teams).sort() as num}
                            <ArkTeamCard
                                {guildId}
                                {allianceTag}
                                teamNumber={num}
                                teamData={data.teams[num]}
                                signups={data.signups.filter(s => s.team_number == num)}
                                {roles}
                                on:updated={() => dispatch('updated')}
                            />
                        {/each}
                        
                        {#if Object.keys(data.teams).length < 3}
                            <button class="add-team-card" on:click={addTeam}>
                                <div class="add-icon-circle">
                                    <i class="fas fa-plus"></i>
                                </div>
                                <span>Create New Team</span>
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>

    {#if hasUnsavedChanges}
        <div class="save-bar" transition:fly={{ y: 50 }}>
            <div class="save-bar-content">
                <div class="save-text">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>You have unsaved changes.</span>
                </div>
                <div class="save-actions">
                    <button class="btn-discard" on:click={() => { 
                        currentConfig = JSON.parse(JSON.stringify(originalConfig));
                        reminderTime = secondsToTime(currentConfig.reminder_interval); 
                    }}>Discard</button>
                    <button class="btn-save" on:click={saveAllSettings} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .alliance-panel { display: flex; flex-direction: column; gap: 20px; padding-bottom: 80px; }

    .panel-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--border-color); }
    .header-info { display: flex; align-items: center; gap: 15px; }
    .tag-title { margin: 0; color: var(--text-primary); font-size: 1.5rem; font-weight: 700; }
    .highlight { color: var(--accent-blue); }
    
    .status-badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; background: var(--bg-tertiary); color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
    .status-badge.active { background: rgba(16, 185, 129, 0.15); color: #10b981; }

    .header-actions { display: flex; gap: 10px; }
    .btn-action { 
        background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-secondary);
        padding: 8px 16px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 500; transition: all 0.2s;
    }
    .btn-action:hover { background: var(--bg-secondary); color: var(--text-primary); }
    
    .btn-action.primary { background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); border-color: rgba(59, 130, 246, 0.3); }
    .btn-action.primary:hover { background: var(--accent-blue); color: white; }

    .btn-action.success { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
    .btn-action.success:hover { background: #10b981; color: white; }
    
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-action:disabled:hover { background: var(--bg-tertiary); color: var(--text-secondary); }

    .btn-action.danger { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
    .btn-action.danger:hover { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }

    .panel-content-split { display: flex; gap: 24px; align-items: flex-start; }
    .config-column { flex: 0 0 320px; }
    .teams-column { flex: 1; display: flex; flex-direction: column; gap: 15px; }
    
    @media (max-width: 900px) {
        .panel-content-split { flex-direction: column; }
        .config-column { width: 100%; flex: auto; }
    }

    .info-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; }
    .sticky-card { position: sticky; top: 20px; }
    .card-header { padding: 15px 20px; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.1); border-radius: 8px 8px 0 0; }
    .card-header h3 { margin: 0; font-size: 1.1rem; color: var(--text-primary); display: flex; gap: 10px; align-items: center; }
    .card-content { padding: 20px; }

    .settings-list { display: flex; flex-direction: column; gap: 20px; }
    .setting-group { display: flex; flex-direction: column; gap: 8px; position: relative; }
    .setting-group label { font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; display: flex; align-items: center; gap: 8px; }
    
    .modern-input { background: var(--bg-primary); border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; color: var(--text-primary); width: 100%; transition: border-color 0.2s; box-sizing: border-box; }
    .modern-input:focus { border-color: var(--accent-blue); outline: none; }

    .custom-select-container { position: relative; width: 100%; }
    .custom-select-trigger { 
        width: 100%; height: 42px;
        display: flex; justify-content: space-between; align-items: center;
        padding: 0 12px; background: var(--bg-primary); border: 1px solid var(--border-color);
        border-radius: 6px; color: var(--text-primary); cursor: pointer; text-align: left; 
        box-sizing: border-box;
    }
    .custom-select-trigger:focus { border-color: var(--accent-blue); outline: none; }
    .placeholder { color: var(--text-muted); font-style: italic; }
    
    .custom-dropdown-menu { 
        position: absolute; top: 100%; left: 0; width: 100%; background: var(--bg-card, #1f2937);
        border: 1px solid var(--border-color); border-radius: 6px; z-index: 100; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.5); margin-top: 4px;
    }
    .dropdown-search { width: 100%; border: none; border-bottom: 1px solid var(--border-color); background: var(--bg-tertiary); padding: 10px; color: var(--text-primary); outline: none; box-sizing: border-box; }
    .options-list { max-height: 250px; overflow-y: auto; }
    .dropdown-option { width: 100%; text-align: left; background: transparent; border: none; padding: 10px 14px; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.1s; }
    .dropdown-option:hover { background: var(--bg-primary); color: var(--text-primary); }
    .dropdown-option.danger { color: #ef4444; border-bottom: 1px solid var(--border-color); }

    .teams-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
        gap: 20px; 
        align-items: stretch;
    }
    
    .add-team-card {
        border: 2px dashed var(--border-color); 
        background: rgba(255,255,255,0.02); 
        border-radius: 8px;
        display: flex; 
        flex-direction: column;
        align-items: center; 
        justify-content: center;
        gap: 15px; 
        color: var(--text-muted); 
        cursor: pointer; 
        min-height: 250px;
        transition: all 0.2s;
    }

    .add-team-card:hover { 
        border-color: var(--accent-blue); 
        color: var(--accent-blue); 
        background: rgba(59, 130, 246, 0.05); 
    }
    
    .add-icon-circle { 
        width: 50px;
        height: 50px; 
        border-radius: 50%; 
        background: var(--bg-tertiary); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 1.5rem; 
        transition: transform 0.2s;
    }
    
    .add-team-card:hover .add-icon-circle { 
        transform: scale(1.1); 
        background: rgba(59, 130, 246, 0.2); 
    }

    .save-bar { 
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        background: #1f2937; border: 1px solid var(--accent-blue);
        padding: 12px 24px; border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6); z-index: 1000; min-width: 400px;
    }
    .save-bar-content { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
    .save-text { display: flex; gap: 10px; align-items: center; color: white; font-weight: 500; }
    .save-text i { color: #f59e0b; }
    .save-actions { display: flex; gap: 10px; }
    .btn-save { background: var(--accent-blue); color: white; border: none; padding: 8px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-save:hover { background: #2563eb; }
    .btn-discard { background: transparent; color: #ef4444; border: 1px solid transparent; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-discard:hover { text-decoration: underline; }
</style>