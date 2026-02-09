<script>
    import { onMount } from 'svelte';
    import { slide, fade } from 'svelte/transition';

    export let guildId;

    let loading = true;
    let mgeName = null;
    let placementPoints = '';
    let applications = [];
    let questions = [];
    let rankings = [];
    let statusFilter = 'ALL';
    let expandedId = null;
    let acceptingId = null;
    let acceptRankInput = '';
    let actionLoading = null;

    onMount(() => loadData());

    async function loadData() {
        loading = true;
        try {
            const res = await window.auth.fetchWithAuth(`/api/guilds/${guildId}/mge/applications`);
            mgeName = res.mge_name;
            placementPoints = res.placement_points || '';
            applications = res.applications || [];
            questions = res.questions || [];
            rankings = res.rankings || [];
        } catch (e) {
            console.error("Failed to load MGE applications", e);
        } finally {
            loading = false;
        }
    }

    $: filteredApps = statusFilter === 'ALL'
        ? applications.filter(a => a.application_status !== 'IN_PROGRESS')
        : applications.filter(a => a.application_status === statusFilter);

    $: counts = {
        ALL: applications.filter(a => a.application_status !== 'IN_PROGRESS').length,
        PENDING: applications.filter(a => a.application_status === 'PENDING').length,
        ACCEPTED: applications.filter(a => a.application_status === 'ACCEPTED').length,
        REJECTED: applications.filter(a => a.application_status === 'REJECTED').length
    };

    function toggleExpand(appId) {
        expandedId = expandedId === appId ? null : appId;
        acceptingId = null;
    }

    function startAccept(appId, event) {
        event.stopPropagation();
        acceptingId = appId;
        acceptRankInput = '';
    }

    function cancelAccept(event) {
        event.stopPropagation();
        acceptingId = null;
    }

    async function confirmAccept(app, event) {
        event.stopPropagation();
        const rank = parseInt(acceptRankInput);
        if (!rank || rank < 1) return;

        actionLoading = app.application_id;
        try {
            const res = await window.auth.fetchWithAuth(`/api/guilds/${guildId}/mge/applications/${app.application_id}/accept`, {
                method: 'POST',
                body: JSON.stringify({ rank_spot: rank })
            });
            if (res.error) {
                alert(res.error);
            } else {
                acceptingId = null;
                await loadData();
            }
        } catch (e) {
            alert("Failed to accept application.");
        } finally {
            actionLoading = null;
        }
    }

    async function rejectApp(app, event) {
        event.stopPropagation();
        if (!confirm(`Reject application from ${app.ingame_name}?`)) return;

        actionLoading = app.application_id;
        try {
            await window.auth.fetchWithAuth(`/api/guilds/${guildId}/mge/applications/${app.application_id}/reject`, {
                method: 'POST'
            });
            await loadData();
        } catch (e) {
            alert("Failed to reject application.");
        } finally {
            actionLoading = null;
        }
    }

    async function restoreApp(app, event) {
        event.stopPropagation();
        actionLoading = app.application_id;
        try {
            await window.auth.fetchWithAuth(`/api/guilds/${guildId}/mge/applications/${app.application_id}/restore`, {
                method: 'POST'
            });
            await loadData();
        } catch (e) {
            alert("Failed to restore application.");
        } finally {
            actionLoading = null;
        }
    }

    function parseAppData(jsonStr) {
        try { return JSON.parse(jsonStr); }
        catch { return {}; }
    }

    function getQuestionLabel(key) {
        const q = questions.find(q => q.question_key === key);
        return q ? q.question_text : key;
    }

    function isImageField(key, value) {
        const imageKeys = ['img', 'image', 'screenshot', 'attachment', 'upload', 'photo'];
        const keyLower = key.toLowerCase();
        const keyMatch = imageKeys.some(k => keyLower.includes(k));
        if (typeof value === 'string' && value.startsWith('http') && keyMatch) return true;
        if (Array.isArray(value) && value.some(v => typeof v === 'string' && v.startsWith('http'))) return true;
        return false;
    }

    function handleImageError(event) {
        const img = event.target;
        img.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'img-expired';
        placeholder.innerHTML = '<i class="fas fa-image"></i><span>Image Expired</span>';
        img.parentElement.appendChild(placeholder);
    }

    function formatTimestamp(ts) {
        if (!ts) return 'N/A';
        return new Date(ts * 1000).toLocaleString();
    }

    function getPointsForRank(rank) {
        if (!placementPoints) return '?';
        const pts = placementPoints.split(',').map(s => s.trim()).filter(Boolean);
        return rank > 0 && rank <= pts.length ? pts[rank - 1] : '?';
    }

    function getRankingForApp(appId) {
        return rankings.find(r => r.application_id === appId);
    }
</script>

<div class="apps-container">
    {#if loading}
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading applications...</div>
    {:else if !mgeName}
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 15px;"></i>
            <h3>No Active MGE</h3>
            <p>No active MGE cycle found. Run <code>/mge setup</code> in Discord to create one.</p>
        </div>
    {:else}
        <div class="apps-header">
            <div class="mge-info">
                <h3><i class="fas fa-crown"></i> {mgeName}</h3>
                <span class="app-count">{counts.ALL} application{counts.ALL !== 1 ? 's' : ''}</span>
            </div>
            <button class="btn-refresh" on:click={loadData} title="Refresh">
                <i class="fas fa-sync-alt"></i>
            </button>
        </div>

        <div class="filter-bar">
            {#each [['ALL', 'All'], ['PENDING', 'Pending'], ['ACCEPTED', 'Accepted'], ['REJECTED', 'Rejected']] as [key, label]}
                <button
                    class="filter-chip"
                    class:active={statusFilter === key}
                    class:pending={key === 'PENDING'}
                    class:accepted={key === 'ACCEPTED'}
                    class:rejected={key === 'REJECTED'}
                    on:click={() => statusFilter = key}
                >
                    {label}
                    <span class="chip-count">{counts[key]}</span>
                </button>
            {/each}
        </div>

        {#if rankings.length > 0}
            <div class="rankings-card">
                <div class="card-header">
                    <h4><i class="fas fa-trophy"></i> Current Rankings</h4>
                </div>
                <div class="rankings-table">
                    <div class="rankings-row header-row">
                        <span class="rank-col">Rank</span>
                        <span class="name-col">Player</span>
                        <span class="points-col">Points (M)</span>
                        <span class="status-col">Status</span>
                    </div>
                    {#each rankings as r}
                        <div class="rankings-row">
                            <span class="rank-col">#{r.rank_spot}</span>
                            <span class="name-col">{r.ingame_name}</span>
                            <span class="points-col">{r.custom_score ?? getPointsForRank(r.rank_spot)}</span>
                            <span class="status-col">
                                {#if r.is_published}
                                    <span class="badge published">Published</span>
                                {:else}
                                    <span class="badge draft">Draft</span>
                                {/if}
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <div class="apps-list">
            {#if filteredApps.length === 0}
                <div class="empty-state small">
                    <p>No {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} applications found.</p>
                </div>
            {/if}

            {#each filteredApps as app (app.application_id)}
                <div class="app-card" class:expanded={expandedId === app.application_id}>
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="app-card-header" on:click={() => toggleExpand(app.application_id)}>
                        <div class="app-main-info">
                            <span class="app-name">{app.ingame_name}</span>
                            <span class="app-gov-id">ID: {app.governor_id}</span>
                            <span class="app-username">@{app.discord_username}</span>
                        </div>
                        <div class="app-meta">
                            {#if app.rank_spot}
                                <span class="rank-badge">#{app.rank_spot}</span>
                            {/if}
                            <span class="status-badge"
                                class:pending={app.application_status === 'PENDING'}
                                class:accepted={app.application_status === 'ACCEPTED'}
                                class:rejected={app.application_status === 'REJECTED'}
                            >
                                {app.application_status}
                            </span>
                            <span class="app-time">{formatTimestamp(app.submitted_at)}</span>
                            <i class="fas fa-chevron-down expand-icon" class:rotated={expandedId === app.application_id}></i>
                        </div>
                    </div>

                    {#if expandedId === app.application_id}
                        <div class="app-card-body" transition:slide={{ duration: 200 }}>
                            <div class="app-details">
                                <div class="detail-row">
                                    <span class="detail-label">VIP Level</span>
                                    <span class="detail-value">{app.vip_level || 'N/A'}</span>
                                </div>

                                {#each Object.entries(parseAppData(app.application_data_json)) as [key, value]}
                                    {#if key !== 'ingame_name' && key !== 'governor_id' && key !== 'vip_level'}
                                        <div class="detail-row" class:image-row={isImageField(key, value)}>
                                            <span class="detail-label">{getQuestionLabel(key)}</span>
                                            <span class="detail-value">
                                                {#if isImageField(key, value)}
                                                    <div class="image-grid">
                                                        {#if Array.isArray(value)}
                                                            {#each value.filter(v => typeof v === 'string' && v.startsWith('http')) as url}
                                                                <a href={url} target="_blank" rel="noopener" class="thumb-link">
                                                                    <img src={url} alt="Screenshot" class="thumb-img" loading="lazy" on:error={handleImageError} />
                                                                </a>
                                                            {/each}
                                                        {:else if typeof value === 'string' && value.startsWith('http')}
                                                            <a href={value} target="_blank" rel="noopener" class="thumb-link">
                                                                <img src={value} alt="Screenshot" class="thumb-img" loading="lazy" on:error={handleImageError} />
                                                            </a>
                                                        {/if}
                                                    </div>
                                                {:else if Array.isArray(value)}
                                                    {value.join(', ')}
                                                {:else}
                                                    {value}
                                                {/if}
                                            </span>
                                        </div>
                                    {/if}
                                {/each}
                            </div>

                            <div class="app-actions">
                                {#if actionLoading === app.application_id}
                                    <div class="action-loading"><i class="fas fa-spinner fa-spin"></i></div>
                                {:else if app.application_status === 'PENDING'}
                                    {#if acceptingId === app.application_id}
                                        <div class="accept-flow" on:click|stopPropagation>
                                            <input
                                                type="number"
                                                class="rank-input"
                                                placeholder="Rank #"
                                                bind:value={acceptRankInput}
                                                min="1"
                                                on:keydown={(e) => e.key === 'Enter' && confirmAccept(app, e)}
                                            />
                                            <button class="btn-sm accept" on:click={(e) => confirmAccept(app, e)} disabled={!acceptRankInput}>
                                                <i class="fas fa-check"></i> Confirm
                                            </button>
                                            <button class="btn-sm cancel" on:click={(e) => cancelAccept(e)}>
                                                Cancel
                                            </button>
                                        </div>
                                    {:else}
                                        <button class="btn-sm accept" on:click={(e) => startAccept(app.application_id, e)}>
                                            <i class="fas fa-check"></i> Accept
                                        </button>
                                        <button class="btn-sm reject" on:click={(e) => rejectApp(app, e)}>
                                            <i class="fas fa-times"></i> Reject
                                        </button>
                                    {/if}
                                {:else if app.application_status === 'ACCEPTED'}
                                    <button class="btn-sm reject" on:click={(e) => rejectApp(app, e)}>
                                        <i class="fas fa-times"></i> Reject
                                    </button>
                                {:else if app.application_status === 'REJECTED'}
                                    <button class="btn-sm restore" on:click={(e) => restoreApp(app, e)}>
                                        <i class="fas fa-undo"></i> Restore to Pending
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .apps-container { display: flex; flex-direction: column; gap: 16px; }
    .loading-state { padding: 40px; text-align: center; color: var(--text-secondary); }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; color: var(--text-muted); }
    .empty-state.small { padding: 30px; }
    .empty-state h3 { margin: 0 0 8px 0; color: var(--text-primary); }
    .empty-state p { margin: 0; }
    .empty-state code { background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; font-size: 0.9rem; }

    .apps-header { display: flex; justify-content: space-between; align-items: center; }
    .mge-info { display: flex; align-items: center; gap: 12px; }
    .mge-info h3 { margin: 0; font-size: 1.2rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
    .app-count { color: var(--text-muted); font-size: 0.85rem; }
    .btn-refresh { background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
    .btn-refresh:hover { color: var(--text-primary); border-color: var(--accent-blue); }

    .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-chip {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 6px 14px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
    }
    .filter-chip:hover { color: var(--text-primary); border-color: var(--text-muted); }
    .filter-chip.active { border-color: var(--accent-blue); color: var(--accent-blue); background: rgba(59, 130, 246, 0.1); }
    .filter-chip.active.pending { border-color: #f59e0b; color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
    .filter-chip.active.accepted { border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.1); }
    .filter-chip.active.rejected { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    .chip-count { background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 10px; font-size: 0.75rem; }

    .rankings-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
    .card-header { padding: 12px 16px; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.1); }
    .card-header h4 { margin: 0; font-size: 0.95rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
    .rankings-table { display: flex; flex-direction: column; }
    .rankings-row { display: flex; align-items: center; padding: 8px 16px; border-bottom: 1px solid var(--border-color); font-size: 0.85rem; }
    .rankings-row:last-child { border-bottom: none; }
    .rankings-row.header-row { font-weight: 600; color: var(--text-secondary); background: var(--bg-tertiary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .rank-col { width: 60px; font-weight: 600; }
    .name-col { flex: 1; }
    .points-col { width: 100px; text-align: center; }
    .status-col { width: 90px; text-align: right; }
    .badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; text-transform: uppercase; }
    .badge.published { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .badge.draft { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

    .apps-list { display: flex; flex-direction: column; gap: 8px; }
    .app-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; transition: border-color 0.2s; }
    .app-card:hover { border-color: var(--text-muted); }
    .app-card.expanded { border-color: var(--accent-blue); }

    .app-card-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; cursor: pointer; transition: background 0.15s; }
    .app-card-header:hover { background: var(--bg-tertiary); }
    .app-main-info { display: flex; align-items: center; gap: 12px; }
    .app-name { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; }
    .app-gov-id { color: var(--text-muted); font-size: 0.8rem; font-family: monospace; }
    .app-username { color: var(--text-secondary); font-size: 0.8rem; }
    .app-meta { display: flex; align-items: center; gap: 10px; }
    .rank-badge { background: var(--accent-blue); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
    .status-badge { font-size: 0.7rem; padding: 3px 10px; border-radius: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge.pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .status-badge.accepted { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .status-badge.rejected { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .app-time { color: var(--text-muted); font-size: 0.75rem; }
    .expand-icon { color: var(--text-muted); font-size: 0.8rem; transition: transform 0.2s; }
    .expand-icon.rotated { transform: rotate(180deg); }

    .app-card-body { border-top: 1px solid var(--border-color); }
    .app-details { padding: 16px; display: flex; flex-direction: column; gap: 0; }
    .detail-row { display: flex; gap: 12px; align-items: baseline; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .detail-row:first-child { padding-top: 0; }
    .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
    .detail-row.image-row { flex-direction: column; align-items: flex-start; }
    .detail-label { color: var(--text-secondary); font-size: 0.8rem; font-weight: 600; min-width: 200px; flex-shrink: 0; line-height: 1.4; }
    .detail-value { color: var(--text-primary); font-size: 0.85rem; word-break: break-word; line-height: 1.4; }

    .image-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
    .thumb-link { display: block; border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; transition: border-color 0.2s; }
    .thumb-link:hover { border-color: var(--accent-blue); }
    .thumb-img { width: 120px; height: 120px; object-fit: cover; display: block; }
    :global(.img-expired) { width: 120px; height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: var(--bg-tertiary); color: var(--text-muted); font-size: 0.7rem; border-radius: 4px; }
    :global(.img-expired i) { font-size: 1.4rem; opacity: 0.5; }

    .app-actions { padding: 12px 16px; background: var(--bg-tertiary); display: flex; align-items: center; gap: 8px; }
    .action-loading { padding: 4px; color: var(--text-muted); }
    .accept-flow { display: flex; align-items: center; gap: 8px; }
    .rank-input {
        width: 70px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        padding: 6px 10px;
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 0.85rem;
        text-align: center;
    }
    .rank-input:focus { border-color: var(--accent-blue); outline: none; }

    .btn-sm {
        border: none;
        padding: 6px 14px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.15s;
    }
    .btn-sm.accept { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .btn-sm.accept:hover { background: #10b981; color: white; }
    .btn-sm.reject { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .btn-sm.reject:hover { background: #ef4444; color: white; }
    .btn-sm.restore { background: rgba(59, 130, 246, 0.15); color: var(--accent-blue); }
    .btn-sm.restore:hover { background: var(--accent-blue); color: white; }
    .btn-sm.cancel { background: transparent; color: var(--text-muted); }
    .btn-sm.cancel:hover { color: var(--text-primary); }
    .btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 768px) {
        .app-card-header { flex-direction: column; align-items: flex-start; gap: 8px; }
        .app-meta { flex-wrap: wrap; }
        .detail-row { flex-direction: column; }
        .detail-label { min-width: unset; }
    }
</style>
