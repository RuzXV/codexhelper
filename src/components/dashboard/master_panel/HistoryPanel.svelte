<script>
    import { onMount } from 'svelte';
    
    export let user;
    
    const MASTER_ID = '285201373266575361';
    $: isMasterUser = user && user.id === MASTER_ID;

    const DATA_SOURCES = [
        { id: 'commanders', label: 'Commanders', icon: 'fa-chess-knight' },
        { id: 'bundles', label: 'Bundles', icon: 'fa-box-open' },
        { id: 'meta_lineups', label: 'Meta Pairings', icon: 'fa-users' },
        { id: 'aliases', label: 'Aliases', icon: 'fa-id-badge' }
    ];

    let activeSource = 'commanders';
    let backups = [];
    let loading = false;
    let restoring = false;
    let error = null;

    $: if (activeSource && isMasterUser) loadBackups(activeSource);

    async function loadBackups(source) {
        loading = true;
        error = null;
        backups = [];
        try {
            const res = await window.auth.fetchWithAuth(`/api/admin/backups/${source}`);
            backups = res || [];
        } catch (e) {
            console.error(e);
            error = "Failed to load backup history.";
        } finally {
            loading = false;
        }
    }

    async function handleRestore(backup) {
        if (!confirm(`🚨 DANGER: RESTORE ${backup.key}?\n\nThis will overwrite the CURRENT LIVE ${activeSource.toUpperCase()} data.\n\nThe current live state will be saved as a safety backup before this happens.`)) return;

        restoring = true;
        try {
            await window.auth.fetchWithAuth('/api/admin/restore', {
                method: 'POST',
                body: JSON.stringify({
                    targetKey: activeSource,
                    backupKey: backup.key
                })
            });
            alert("✅ Restoration successful.");
            loadBackups(activeSource);
        } catch (e) {
            alert("❌ Restore failed. Check console.");
            console.error(e);
        } finally {
            restoring = false;
        }
    }
</script>

<div class="panel-container">
    <div class="dashboard-header">
        <h1><i class="fas fa-history"></i> Data Recovery</h1>
        
        {#if !isMasterUser}
            <div class="locked-badge"><i class="fas fa-lock"></i> Master Admin Only</div>
        {/if}
    </div>

    {#if !isMasterUser}
        <div class="access-denied">
            <i class="fas fa-shield-alt"></i>
            <h2>Access Restricted</h2>
            <p>This panel allows rolling back the database to previous versions.</p>
            <p>Only the Master Admin ID ({MASTER_ID}) can access this tool.</p>
        </div>
    {:else}
        <div class="source-tabs">
            {#each DATA_SOURCES as source}
                <button 
                    class="tab-btn" 
                    class:active={activeSource === source.id}
                    on:click={() => activeSource = source.id}
                >
                    <i class="fas {source.icon}"></i> {source.label}
                </button>
            {/each}
        </div>

        <div class="panel-content">
            {#if loading}
                <div class="state-msg"><i class="fas fa-circle-notch fa-spin"></i><p>Scanning archives for {activeSource}...</p></div>
            {:else if error}
                <div class="state-msg error"><i class="fas fa-exclamation-triangle"></i><p>{error}</p></div>
            {:else if backups.length === 0}
                <div class="state-msg">
                    <i class="fas fa-folder-open"></i>
                    <p>No backup history found for {activeSource}.</p>
                    <span class="sub-text">Backups are created automatically when you modify data.</span>
                </div>
            {:else}
                <div class="table-wrapper">
                    <table class="backup-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Backup ID</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each backups as backup}
                                <tr>
                                    <td class="date-cell">
                                        <div class="date-wrapper">
                                            <span class="date-main">{backup.date.split(',')[0]}</span>
                                            <span class="date-sub">{backup.date.split(',')[1]}</span>
                                        </div>
                                    </td>
                                    <td class="key-cell">
                                        <code>{backup.key}</code>
                                        {#if backup.key.includes('autorescued')}
                                            <span class="tag-rescue">AUTOSAVE</span>
                                        {/if}
                                    </td>
                                    <td class="action-cell">
                                        <button 
                                            class="restore-btn" 
                                            disabled={restoring}
                                            on:click={() => handleRestore(backup)}
                                        >
                                            {#if restoring}
                                                <i class="fas fa-spinner fa-spin"></i>
                                            {:else}
                                                <i class="fas fa-undo-alt"></i> Restore
                                            {/if}
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .panel-container { height: 100%; display: flex; flex-direction: column; gap: 20px; }
    
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 15px; }
    .dashboard-header h1 { margin: 0; font-size: 1.8rem; color: var(--text-primary); display: flex; align-items: center; gap: 12px; }
    
    .locked-badge { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 0.85rem; border: 1px solid rgba(239, 68, 68, 0.2); }

    .access-denied { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); opacity: 0.7; }
    .access-denied i { font-size: 4rem; margin-bottom: 20px; color: #ef4444; }
    .access-denied h2 { margin: 0 0 10px 0; color: var(--text-primary); }

    .source-tabs { display: flex; gap: 10px; flex-wrap: wrap; }
    .tab-btn { background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; transition: all 0.2s; }
    .tab-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }
    .tab-btn.active { background: var(--accent-blue); color: white; border-color: var(--accent-blue); box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); }

    .table-wrapper { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
    .backup-table { width: 100%; border-collapse: collapse; text-align: left; }
    .backup-table th { background: var(--bg-tertiary); padding: 15px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; }
    .backup-table td { padding: 15px; border-top: 1px solid var(--border-color); color: var(--text-primary); }
    .backup-table tr:hover td { background: var(--bg-tertiary); }

    .date-wrapper { display: flex; flex-direction: column; }
    .date-main { font-weight: 600; }
    .date-sub { font-size: 0.8rem; color: var(--text-secondary); }

    .key-cell code { background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 4px; color: var(--text-secondary); font-size: 0.85rem; font-family: monospace; }
    .tag-rescue { background: #eab308; color: black; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 8px; }

    .restore-btn { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
    .restore-btn:hover { background: #ef4444; color: white; }
    .restore-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .state-msg { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: var(--text-secondary); gap: 15px; }
    .state-msg i { font-size: 3rem; opacity: 0.5; }
    .sub-text { font-size: 0.9rem; opacity: 0.7; }
</style>