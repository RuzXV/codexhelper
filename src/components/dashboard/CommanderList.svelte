<script>
    import { createEventDispatcher } from 'svelte';

    export let data = {};
    export let aliases = {};
    export let search = '';
    export let emojiMap = [];

    const dispatch = createEventDispatcher();

    let items = [];

    $: {
        const query = search.toLowerCase();
        items = Object.entries(data).map(([key, templates]) => {
            const aliasInfo = aliases[key] || {};
            const displayName = aliasInfo.display_name || key;
            const knownAliases = aliasInfo.aliases || [];
            
            const mainTemplate = templates.find(t => t.name === key) || templates[0];
            
            const tags = templates.map(t => {
                if (t.name === key) return "Main";
                if (t.name.startsWith(key + '_')) {
                    const type = t.name.slice(key.length + 1);
                    return type.charAt(0).toUpperCase() + type.slice(1);
                }
                return t.name;
            }).sort((a, b) => (a === "Main" ? -1 : b === "Main" ? 1 : 0));
            
            let avatarUrl = null;
            let emojiEntry = emojiMap.find(e => e.key === key);
            
            if (!emojiEntry) {
                emojiEntry = emojiMap.find(e => knownAliases.includes(e.key));
            }

            if (emojiEntry) {
                avatarUrl = `https://cdn.discordapp.com/emojis/${emojiEntry.emoji}.png`;
            } else {
                if (mainTemplate?.json?.embeds?.[0]?.author?.icon_url) {
                    avatarUrl = mainTemplate.json.embeds[0].author.icon_url;
                } else if (mainTemplate?.json?.embeds?.[0]?.image?.url) {
                    avatarUrl = mainTemplate.json.embeds[0].image.url;
                }
            }

            return {
                id: key,
                displayName,
                tags,
                mainTemplate,
                avatarUrl
            };
        }).filter(item => 
            item.displayName.toLowerCase().includes(query) || 
            item.id.toLowerCase().includes(query)
        ).sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
</script>

<div class="vertical-list">
    {#each items as item}
        <div class="list-item" style="border-left: 4px solid #004cff;">
            <div class="item-left">
                <div class="avatar-wrapper">
                    {#if item.avatarUrl}
                        <img src={item.avatarUrl} alt={item.displayName} loading="lazy" />
                    {:else}
                        <div class="avatar-placeholder"><i class="fas fa-user"></i></div>
                    {/if}
                </div>
                <div class="item-info">
                    <h3>{item.displayName}</h3>
                    <span class="code-badge">{item.id}</span>
                </div>
            </div>

            <div class="item-stats">
                {#each item.tags as tag}
                    <span class="stat-tag">{tag}</span>
                {/each}
            </div>

            <div class="item-actions">
                <button 
                    class="action-btn edit" 
                    aria-label="Edit {item.displayName}"
                    on:click={() => dispatch('edit', { id: item.id })} 
                >
                    <i class="fas fa-pen"></i> <span>Edit</span>
                </button>

                <button 
                    class="action-btn delete" 
                    aria-label="Delete {item.displayName}"
                    on:click={(e) => { e.stopPropagation(); dispatch('delete', { id: item.id, name: item.displayName }); }}
                >
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    {/each}
    
    {#if items.length === 0}
        <div class="no-results">No commanders found matching "{search}"</div>
    {/if}
</div>

<style>
    .action-btn.delete:hover {
        background: #ef4444;
        border-color: #ef4444;
        color: white;
    }
    
    .item-actions {
        display: flex;
        gap: 8px;
    }
    .vertical-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .list-item {
        display: flex;
        align-items: center;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 12px 20px;
        transition: all 0.2s ease;
        justify-content: space-between;
    }

    .list-item:hover {
        background: var(--bg-tertiary);
        border-color: var(--border-hover);
        transform: translateX(4px);
    }

    .item-left {
        display: flex;
        align-items: center;
        gap: 15px;
        flex: 1;
        min-width: 0;
    }

    .avatar-wrapper img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .avatar-placeholder {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
    }

    .item-info {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .item-info h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .code-badge {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-family: monospace;
    }

    .item-stats {
        margin: 0 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .stat-tag {
        font-size: 0.85rem;
        color: var(--text-secondary);
        background: rgba(255,255,255,0.05);
        padding: 4px 10px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .action-btn {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 8px 16px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .action-btn:hover {
        background: var(--accent-blue);
        color: white;
        border-color: var(--accent-blue);
    }

    .no-results {
        text-align: center;
        padding: 40px;
        color: var(--text-secondary);
        font-style: italic;
    }

    @media (max-width: 600px) {
        .item-stats { display: none; }
        .list-item { padding: 10px; }
        .action-btn span { display: none; }
        .action-btn { padding: 8px; }
    }
</style>