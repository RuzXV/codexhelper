<script>
    import { createEventDispatcher } from 'svelte';
    import { fetchWithAuth } from '../../../stores/auth.js';
    export let guildId;
    export let allianceTag;
    export let teamNumber;
    export let teamData;
    export let signups = [];
    export let roles = [];

    const dispatch = createEventDispatcher();
    let saving = false;
    let matchDateObj = new Date(teamData.match_timestamp * 1000);
    const offset = matchDateObj.getTimezoneOffset() * 60000;
    let localDateStr = new Date(matchDateObj.getTime() - offset).toISOString().slice(0, 16);

    let editName = teamData.name;
    let editCap = teamData.cap;
    let newSignupName = '';

    $: utcTimeStr = (() => {
        const d = new Date(localDateStr);
        return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    })();
    $: roleName =
        teamData.role_id && teamData.role_id !== '0' && teamData.role_id !== 0
            ? roles.find((r) => r.id === String(teamData.role_id))?.name || null
            : null;

    async function saveTeam() {
        saving = true;
        const d = new Date(localDateStr);
        const utcTimestamp = Math.floor(d.getTime() / 1000);

        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/team`, {
                method: 'POST',
                body: JSON.stringify({
                    alliance_tag: allianceTag,
                    team_number: teamNumber,
                    team_name: editName,
                    match_timestamp: utcTimestamp,
                    signup_cap: editCap ? parseInt(editCap) : null,
                }),
            });
            dispatch('updated');
        } catch (e) {
            alert('Failed to update team: ' + e.message);
        } finally {
            saving = false;
        }
    }

    async function removeSignup(ign) {
        if (!confirm(`Remove ${ign}?`)) return;
        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/signup`, {
                method: 'DELETE',
                body: JSON.stringify({ alliance_tag: allianceTag, in_game_name: ign }),
            });
            dispatch('updated');
        } catch (e) {
            alert('Failed to remove signup.');
        }
    }

    async function addManualSignup() {
        if (!newSignupName.trim()) return;
        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/signup`, {
                method: 'POST',
                body: JSON.stringify({
                    alliance_tag: allianceTag,
                    team_number: teamNumber,
                    in_game_name: newSignupName,
                }),
            });
            newSignupName = '';
            dispatch('updated');
        } catch (e) {
            alert('Failed to add signup: ' + (e.message || 'Manual add not supported by API.'));
        }
    }

    async function deleteTeam() {
        if (!confirm(`Delete ${editName}? This will remove the team and all its signups.`)) return;

        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/team/${allianceTag}/${teamNumber}`, {
                method: 'DELETE',
            });
            dispatch('updated');
        } catch (e) {
            alert('Failed to delete team: ' + e.message);
        }
    }
</script>

<div class="team-card">
    <div class="team-header">
        <div class="header-main">
            <span class="team-badge">#{teamNumber}</span>
            <input class="team-name-input" bind:value={editName} on:blur={saveTeam} />
        </div>
        <button class="btn-icon danger" on:click={deleteTeam} title="Delete Team"><i class="fas fa-trash"></i></button>
    </div>

    <div class="team-body">
        <div class="settings-row">
            <div class="field">
                <label for="time-{allianceTag}-{teamNumber}"><i class="far fa-clock"></i> Local Match Time</label>
                <input
                    id="time-{allianceTag}-{teamNumber}"
                    type="datetime-local"
                    class="modern-input"
                    bind:value={localDateStr}
                    on:change={saveTeam}
                />
                <span class="utc-time"><i class="fas fa-globe"></i> {utcTimeStr}</span>
            </div>
            <div class="field cap">
                <label for="cap-{allianceTag}-{teamNumber}"><i class="fas fa-users"></i> Cap</label>
                <input
                    id="cap-{allianceTag}-{teamNumber}"
                    type="number"
                    class="modern-input center-text"
                    bind:value={editCap}
                    placeholder="∞"
                    on:change={saveTeam}
                />
            </div>
        </div>

        {#if roleName}
            <div class="role-info">
                <i class="fas fa-at"></i> Assigned Role: <strong>{roleName}</strong>
            </div>
        {/if}

        <div class="signup-container">
            <div class="list-header">
                <span><i class="fas fa-clipboard-list"></i> Signups</span>
                <span class="count-badge" class:full={editCap && signups.length >= editCap}>
                    {signups.length} / {editCap || '∞'}
                </span>
            </div>
            <ul class="signup-list">
                {#if signups.length === 0}
                    <li class="empty-list">No signups yet</li>
                {/if}
                {#each signups as s}
                    <li>
                        <span class="ign">{s.in_game_name}</span>
                        <button class="btn-remove" on:click={() => removeSignup(s.in_game_name)} title="Remove Player">
                            <i class="fas fa-times"></i>
                        </button>
                    </li>
                {/each}
            </ul>
            <div class="add-signup-row">
                <input
                    type="text"
                    placeholder="Manually add player..."
                    bind:value={newSignupName}
                    on:keydown={(e) => e.key === 'Enter' && addManualSignup()}
                />
                <button on:click={addManualSignup} disabled={!newSignupName} aria-label="Add Player"
                    ><i class="fas fa-plus"></i></button
                >
            </div>
        </div>
    </div>
</div>

<style>
    .team-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
    }
    .team-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        border-color: var(--accent-blue-light, #60a5fa);
    }

    .team-header {
        background: rgba(0, 0, 0, 0.2);
        padding: 12px 15px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .header-main {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
    }
    .team-badge {
        background: var(--accent-blue);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
    }

    .team-name-input {
        background: transparent;
        border: 1px solid transparent;
        color: var(--text-primary);
        font-weight: 700;
        font-size: 1rem;
        width: 100%;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
    }
    .team-name-input:hover {
        border-color: var(--border-color);
        background: var(--bg-primary);
    }
    .team-name-input:focus {
        outline: none;
        border-color: var(--accent-blue);
        background: var(--bg-primary);
    }

    .btn-icon.danger {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        transition: color 0.2s;
    }
    .btn-icon.danger:hover {
        color: #ef4444;
    }

    .team-body {
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        flex: 1;
    }

    .settings-row {
        display: flex;
        gap: 10px;
    }
    .field {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .field.cap {
        flex: 0 0 70px;
    }
    .field label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-weight: 600;
        display: flex;
        gap: 5px;
        align-items: center;
    }

    .modern-input {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        padding: 8px;
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 0.85rem;
        width: 100%;
    }
    .modern-input.center-text {
        text-align: center;
    }
    .modern-input:focus {
        border-color: var(--accent-blue);
        outline: none;
    }

    .utc-time {
        font-size: 0.7rem;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 2px;
    }
    .role-info {
        font-size: 0.8rem;
        color: var(--text-secondary);
        background: rgba(59, 130, 246, 0.08);
        padding: 6px 10px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .role-info i {
        color: var(--accent-blue);
        font-size: 0.75rem;
    }

    .signup-container {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        flex: 1;
    }
    .list-header {
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.1);
        border-bottom: 1px solid var(--border-color);
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-secondary);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .count-badge {
        background: var(--bg-tertiary);
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 0.7rem;
    }
    .count-badge.full {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
    }

    .signup-list {
        list-style: none;
        padding: 0;
        margin: 0;
        flex: 1;
    }
    .signup-list li {
        padding: 0px 12px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
        transition: background 0.1s;
    }
    .signup-list li:hover {
        background: var(--bg-tertiary);
    }
    .signup-list li:last-child {
        border-bottom: none;
    }
    .empty-list {
        font-style: italic;
        color: var(--text-muted);
        justify-content: center;
        padding: 20px;
    }

    .btn-remove {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 0.8rem;
        padding: 2px 4px;
        border-radius: 4px;
    }
    .btn-remove:hover {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
    }

    .add-signup-row {
        display: flex;
        border-top: 1px solid var(--border-color);
        background: rgba(0, 0, 0, 0.05);
    }
    .add-signup-row input {
        flex: 1;
        background: transparent;
        border: none;
        padding: 10px 12px;
        color: var(--text-primary);
        font-size: 0.85rem;
        outline: none;
    }
    .add-signup-row button {
        background: transparent;
        border: none;
        border-left: 1px solid var(--border-color);
        width: 40px;
        color: var(--accent-blue);
        cursor: pointer;
        transition: background 0.2s;
    }
    .add-signup-row button:hover {
        background: rgba(59, 130, 246, 0.1);
    }
    .add-signup-row button:disabled {
        color: var(--text-muted);
        cursor: not-allowed;
    }
</style>
