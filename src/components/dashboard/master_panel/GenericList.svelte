<script>
    import { createEventDispatcher } from 'svelte';

    export let data = {};
    export let type = 'events'; 
    export let search = '';
    export let getEmbedColor;
    export let COLOR_MAP;

    const dispatch = createEventDispatcher();

    let items = [];
    $: TYPE_CONFIG = {
        events: { color: COLOR_MAP.event, label: 'Event' },
        bundles: { color: COLOR_MAP.bundle, label: 'Bundle' },
        meta_lineups: { color: COLOR_MAP.meta, label: 'Lineup' }
    };

    $: {
        const query = search.toLowerCase();
        const config = TYPE_CONFIG[type] || { color: '#ffffff', label: 'Item' };

        items = Object.entries(data).map(([key, content]) => {
            const title = content.title || key;
            const imageUrl = content.image?.url || content.thumbnail?.url || null;
            const itemColor = content.color ? getEmbedColor(content.color) : config.color;

            return {
                id: key,
                title,
                imageUrl,
                color: itemColor,
                label: config.label,
                fieldCount: content.fields ? content.fields.length : (content.description ? content.description.length : 0)
            };
        }).filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.id.toLowerCase().includes(query)
        ).sort((a, b) => a.title.localeCompare(b.title));
    }
</script>

<div class="vertical-list">
    {#each items as item}
        <div class="list-item" style="border-left: 4px solid {item.color};">
            <div class="item-left">
                <div class="thumb-wrapper">
                    {#if item.imageUrl}
                        <img src={item.imageUrl} alt={item.title} loading="lazy" />
                    {:else}
                        <div class="thumb-placeholder"><i class="fas fa-image"></i></div>
                    {/if}
                </div>
                <div class="item-info">
                    <h3>{item.title}</h3>
                    <span class="code-badge">{item.id}</span>
                </div>
            </div>

            <div class="item-stats">
                <span class="stat-tag">
                    {item.fieldCount} {type === 'bundles' ? 'Lines' : 'Fields'}
                </span>
            </div>

            <div class="item-actions">
                <button 
                    class="action-btn edit" 
                    aria-label="Edit {item.title}"
                    on:click={() => dispatch('edit', { id: item.id })}
                >
                    <i class="fas fa-pen"></i> <span>Edit</span>
                </button>

                <button 
                    class="action-btn delete" 
                    aria-label="Delete {item.title}"
                    on:click={(e) => { 
                        e.stopPropagation();
                        if(confirm(`Are you sure you want to delete "${item.title}"?`)) {
                            dispatch('delete', { id: item.id }); 
                        }
                    }}
                >
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    {/each}

    {#if items.length === 0}
        <div class="no-results">No items found matching "{search}"</div>
    {/if}
</div>

<style>
    .vertical-list { display: flex; flex-direction: column; gap: 8px; }
    .list-item { display: flex; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 20px; transition: all 0.2s ease; justify-content: space-between; }
    .list-item:hover { background: var(--bg-tertiary); transform: translateX(4px); }
    
    .item-left { display: flex; align-items: center; gap: 15px; flex: 1; min-width: 0; }
    .thumb-wrapper img { width: 50px; height: 34px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1); }
    .thumb-placeholder { width: 50px; height: 34px; border-radius: 4px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 0.8rem; }
    
    .item-info { display: flex; flex-direction: column; min-width: 0; }
    .item-info h3 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .code-badge { font-size: 0.75rem; color: var(--text-secondary); font-family: monospace; }
    
    .item-stats { margin: 0 20px; display: flex; align-items: center; }
    .stat-tag { font-size: 0.85rem; color: var(--text-secondary); background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 12px; }
    
    .item-actions { display: flex; gap: 8px; }
    .action-btn { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); padding: 8px 16px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; font-size: 0.9rem; font-weight: 500; }
    .action-btn:hover { background: var(--accent-blue); color: white; border-color: var(--accent-blue); }
    .action-btn.delete:hover { background: #ef4444; border-color: #ef4444; }

    .no-results { text-align: center; padding: 40px; color: var(--text-secondary); font-style: italic; }

    @media (max-width: 600px) {
        .item-stats { display: none; }
        .list-item { padding: 10px; }
        .action-btn span { display: none; }
        .action-btn { padding: 8px; }
    }
</style>