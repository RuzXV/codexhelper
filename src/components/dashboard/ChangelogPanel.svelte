<script>
    import { onMount } from 'svelte';

    export let user;

    let logs = [];
    let loading = true;
    let expandedRowId = null;

    onMount(async () => {
        try {
            const res = await window.auth.fetchWithAuth('/api/admin/logs');
            if (res) {
                logs = res.map((log, index) => {
                    let section = "Unknown";
                    if (log.action && log.action.includes('Updated')) {
                        section = log.action.replace('Updated ', '').replace(/_/g, ' ');
                        section = section.charAt(0).toUpperCase() + section.slice(1);
                    }

                    let parsedDetails = null;
                    try {
                        parsedDetails = JSON.parse(log.details);
                    } catch (e) {
                        parsedDetails = { raw: log.details }; 
                    }

                    return {
                        id: index,
                        user: log.user,
                        avatarUrl: log.userAvatar && log.userId 
                            ? `https://cdn.discordapp.com/avatars/${log.userId}/${log.userAvatar}.png` 
                            : null,
                        section: section,
                        key: parsedDetails.target_key || '—',
                        date: new Date(log.timestamp).toLocaleString(),
                        details: parsedDetails
                    };
                });
            }
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            loading = false;
        }
    });

    function toggleRow(id) {
        expandedRowId = expandedRowId === id ? null : id;
    }

    function prettyVal(val) {
        if (val === undefined) return 'undefined';
        if (typeof val === 'object') return JSON.stringify(val, null, 2);
        return val.toString();
    }
</script>

<div class="panel-container">
    <div class="dashboard-header">
        <div>
            <h1>System Changelog</h1>
            <p>Audit log of all master data modifications.</p>
        </div>
        <button class="refresh-btn" on:click={() => window.location.reload()}>
            <i class="fas fa-sync-alt"></i> Refresh
        </button>
    </div>

    <div class="panel-content">
        {#if loading}
            <div class="state-msg"><i class="fas fa-circle-notch fa-spin"></i><p>Loading logs...</p></div>
        {:else if logs.length === 0}
            <div class="state-msg"><i class="fas fa-clipboard-check"></i><p>No logs found.</p></div>
        {:else}
            <div class="table-wrapper">
                <table class="log-table">
                    <thead>
                        <tr>
                            <th style="width: 40px;"></th>
                            <th>Admin User</th>
                            <th>Section Edited</th>
                            <th>Key ID</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each logs as log (log.id)}
                            <tr class="log-row" class:expanded={expandedRowId === log.id} on:click={() => toggleRow(log.id)}>
                                <td class="icon-cell">
                                    <i class="fas fa-chevron-right {expandedRowId === log.id ? 'rotate' : ''}"></i>
                                </td>
                                <td class="user-cell">
                                    <div class="user-badge">
                                        {#if log.avatarUrl}
                                            <img src={log.avatarUrl} class="admin-avatar" alt="">
                                        {:else}
                                            <i class="fas fa-user-shield"></i>
                                        {/if}
                                        <span>{log.user}</span>
                                    </div>
                                </td>
                                <td class="section-cell">{log.section}</td>
                                <td class="key-cell"><code>{log.key}</code></td>
                                <td class="date-cell">{log.date}</td>
                            </tr>
                            
                            {#if expandedRowId === log.id}
                                <tr class="details-row">
                                    <td colspan="5">
                                        <div class="details-content">
                                            {#if log.details.changes}
                                                <div class="diff-header">
                                                    <strong>Modification Details for:</strong> {log.details.target_name || log.key}
                                                </div>
                                                <div class="diff-grid-header">
                                                    <span>Field</span>
                                                    <span>Previous Value</span>
                                                    <span>New Value</span>
                                                </div>
                                                {#each Object.entries(log.details.changes) as [field, change]}
                                                    <div class="diff-grid-row">
                                                        <div class="diff-field">{field}</div>
                                                        <div class="diff-old">
                                                            {#if change.old === undefined}
                                                                <span class="tag-new">New Entry</span>
                                                            {:else}
                                                                <pre>{prettyVal(change.old)}</pre>
                                                            {/if}
                                                        </div>
                                                        <div class="diff-new">
                                                            {#if change.new === undefined}
                                                                <span class="tag-deleted">Deleted</span>
                                                            {:else}
                                                                <pre>{prettyVal(change.new)}</pre>
                                                            {/if}
                                                        </div>
                                                    </div>
                                                {/each}
                                            {:else}
                                                <pre class="raw-log">{log.details.raw || JSON.stringify(log.details, null, 2)}</pre>
                                            {/if}
                                        </div>
                                    </td>
                                </tr>
                            {/if}
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>

<style>
    .panel-container { height: 100%; display: flex; flex-direction: column; }
    
    .refresh-btn { 
        background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-secondary);
        padding: 8px 16px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 8px;
    }
    .refresh-btn:hover { color: var(--text-primary); border-color: var(--accent-blue); }

    .table-wrapper { 
        background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;
    }

    .log-table { width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed; }
    
    .log-table th { 
        background: var(--bg-tertiary); padding: 12px 16px; color: var(--text-secondary); 
        font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;
        border-bottom: 1px solid var(--border-color);
    }

    .log-row { cursor: pointer; border-bottom: 1px solid var(--border-color); transition: background 0.2s; }
    .log-row:hover { background: var(--bg-tertiary); }
    .log-row.expanded { background: var(--bg-tertiary); border-bottom: none; }

    .log-table td { padding: 12px 16px; color: var(--text-primary); font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .icon-cell { 
        color: var(--text-secondary); 
        text-align: center; 
        padding: 0;
        width: 40px;
        overflow: visible;
        text-overflow: clip;
    }
    .icon-cell i { transition: transform 0.2s; }
    .icon-cell i.rotate { transform: rotate(90deg); }

    .admin-avatar {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        object-fit: cover;
    }
    .user-badge { 
        display: inline-flex; align-items: center; gap: 8px; 
        background: rgba(88, 101, 242, 0.1); color: #dbdee1;
        padding: 4px 8px 4px 4px;
        border-radius: 12px; font-size: 0.85rem; font-weight: 500;
        border: 1px solid rgba(88, 101, 242, 0.2);
    }

    .section-cell { font-weight: 600; color: var(--accent-blue); }
    .key-cell code { background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px; color: var(--text-secondary); }
    .date-cell { color: var(--text-secondary); font-family: monospace; font-size: 0.85rem; }

    .details-row td { padding: 0; background: var(--bg-primary); border-bottom: 1px solid var(--border-color); }
    
    .details-content { padding: 20px; border-left: 4px solid var(--accent-blue); background: rgba(0,0,0,0.1); }
    
    .diff-header { margin-bottom: 15px; color: var(--text-primary); font-size: 1rem; }
    
    .diff-grid-header { 
        display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; 
        font-weight: bold; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);
        padding-bottom: 8px; margin-bottom: 8px; font-size: 0.85rem; text-transform: uppercase;
    }
    
    .diff-grid-row { 
        display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; 
        padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: start;
    }
    
    .diff-field { font-family: monospace; color: var(--accent-blue); font-weight: 600; word-break: break-all; }
    
    .diff-old, .diff-new { font-size: 0.85rem; color: #dcddde; }
    .diff-old pre, .diff-new pre { 
        margin: 0; white-space: pre-wrap; word-break: break-word; font-family: monospace; 
        background: rgba(0,0,0,0.2); padding: 6px; border-radius: 4px; 
    }
    
    .diff-old pre { color: #ff9999; }
    .diff-new pre { color: #99ff99; }

    .tag-new { color: #4ade80; font-style: italic; opacity: 0.8; }
    .tag-deleted { color: #ef4444; font-style: italic; opacity: 0.8; }

    .raw-log { 
        background: #1e1f22; color: #dcddde; padding: 15px; border-radius: 4px; 
        overflow-x: auto; font-family: 'Consolas', monospace; font-size: 0.85rem; margin: 0;
    }

    .state-msg { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: var(--text-secondary); gap: 10px; font-size: 1.2rem; }
    .state-msg i { font-size: 2rem; opacity: 0.7; }
</style>