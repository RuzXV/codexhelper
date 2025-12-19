<script>
    import { createEventDispatcher, onMount, tick } from 'svelte';
    import { fly, fade, scale } from 'svelte/transition';

    export let metaId;
    export let metaData;
    export let user;
    export let emojiData;

    const dispatch = createEventDispatcher();
    const AUTHOR_ICON = "https://i.postimg.cc/Jn4zn7sy/Kings-Codex-Logo-No-URL-No-Glow.png";
    const AUTHOR_NAME = "The King's Codex";
    const BOT_ICON = "https://cdn.discordapp.com/avatars/1289603576104091679/aaa1f4a186484a62377665c086a40f24.webp?size=80";
    const BOT_NAME = "Codex Helper";

    const BULLET_ID = "1366755663056867389";
    const BULLET_STRING = `<:bullet_point3:${BULLET_ID}>`;
    const BULLET_IMG_URL = `https://cdn.discordapp.com/emojis/${BULLET_ID}.png`;

    const SEPARATOR = '\u3021';

    let title = "";
    let imageUrl = "";
    let color = "#00c6ff";
    let fields = [];
    let openDropdownId = null;
    let saveState = 'idle';
    let showDiscardModal = false;

    let dropdownSearch = "";
    let lightboxImage = null;

    $: sortedCommanders = (emojiData?.commanders || []).sort((a,b) => a.name.localeCompare(b.name));
    $: userAvatar = user?.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` 
        : "https://cdn.discordapp.com/embed/avatars/0.png";
    $: userName = user?.display_name || user?.username || "User";
    let initialJSON = "";
    $: currentJSON = JSON.stringify({ title, imageUrl, color, fields });
    $: hasUnsavedChanges = initialJSON && currentJSON && initialJSON !== currentJSON;
    
    function portal(node) {
        let owner = document.body;
        owner.appendChild(node);
        return {
            destroy() { if (node.parentNode) node.parentNode.removeChild(node); }
        };
    }

    function formatRowString(row) {
        const c1 = sortedCommanders.find(c => c.key === row.cmd1);
        const c2 = sortedCommanders.find(c => c.key === row.cmd2);
        
        let text = "";
        if (c1) text += `${c1.name} <:${c1.key}:${c1.emoji}>`;
        if (c2) text += ` ${SEPARATOR} ${c2.name} <:${c2.key}:${c2.emoji}>`;
        
        return text || "Empty Row";
    }

    function formatDiscordText(text) {
        if (!text) return "";
        return text
            .replace(/<:([^:]+):(\d+)>/g, '<img src="https://cdn.discordapp.com/emojis/$2.png" class="emoji-preview" alt="$1">')
            .replace(/\n/g, '<br>');
    }

    onMount(async () => {
        title = metaData.title || "";
        imageUrl = metaData.image?.url || "";
        color = metaData.color || "#00c6ff";

        if (metaData.fields) {
            fields = metaData.fields.map(f => ({
                id: Math.random().toString(36),
                name: f.name.replace(/`/g, '').trim(),
                rows: (Array.isArray(f.value) ? f.value : f.value.split('\n')).map(line => {
                    const allEmojiIds = [...line.matchAll(/:(\d+)>/g)].map(m => m[1]);
                    
                    let foundKeys = allEmojiIds
                        .map(id => sortedCommanders.find(c => c.emoji === id))
                        .filter(c => c)
                        .map(c => c.key);

                    if (foundKeys.length === 0) {
                        const cleanLine = line.replace(BULLET_STRING, '').trim();
                        const parts = cleanLine.includes(SEPARATOR) ? cleanLine.split(SEPARATOR) : cleanLine.split('|');
                        parts.forEach(p => {
                            const pTrim = p.trim().toLowerCase();
                            if(!pTrim) return;
                            const match = sortedCommanders.find(c => c.name.toLowerCase() === pTrim);
                            if (match) foundKeys.push(match.key);
                        });
                    }

                    return {
                        id: Math.random(),
                        cmd1: foundKeys[0] || null,
                        cmd2: foundKeys[1] || null
                    };
                })
            }));
        } else {
            fields = [{ id: '1', name: 'Lane Pairings', rows: [{ id: 1, cmd1: null, cmd2: null }] }];
        }
        
        await tick();
        initialJSON = currentJSON;
    });

    function addField() {
        fields = [...fields, { id: Math.random().toString(36), name: "New Category", rows: [{ id: Date.now(), cmd1: null, cmd2: null }] }];
    }

    function removeField(idx) {
        fields = fields.filter((_, i) => i !== idx);
    }

    function addRow(fieldIdx) {
        fields[fieldIdx].rows = [...fields[fieldIdx].rows, { id: Date.now(), cmd1: null, cmd2: null }];
    }

    function removeRow(fieldIdx, rowIdx) {
        fields[fieldIdx].rows = fields[fieldIdx].rows.filter((_, i) => i !== rowIdx);
    }

    function save() {
        const newData = {
            ...metaData,
            title,
            color,
            image: { url: imageUrl },
            author: { name: AUTHOR_NAME, icon_url: AUTHOR_ICON },
            fields: fields.map(f => ({
                name: `\` ${f.name} \``, 
                value: f.rows.map(row => `${BULLET_STRING} ${formatRowString(row)}`), 
                inline: false
            }))
        };
        saveState = 'saving';

        dispatch('save', { 
            id: metaId, 
            data: newData,
            callback: (success) => {
                if (success) {
                    saveState = 'success';
                    initialJSON = currentJSON;
                    setTimeout(() => {
                        saveState = 'idle';
                    }, 2000);
                } else {
                    saveState = 'idle';
                    alert("Save failed.");
                }
            }
        });
    }

    function attemptClose() {
        if (hasUnsavedChanges) {
             showDiscardModal = true;
        } else {
            dispatch('close');
        }
    }

    function openLightbox(url) {
        if (url) lightboxImage = url;
    }
    function closeLightbox() {
        lightboxImage = null;
    }

    function handleKeydown(e) {
        if (e.key === 'Escape') {
            if (lightboxImage) {
                closeLightbox();
                e.stopPropagation();
            } else {
                attemptClose();
            }
        }
    }

    function toggleDropdown(id, event) {
        event.stopPropagation();
        dropdownSearch = "";
        openDropdownId = openDropdownId === id ? null : id;
        
        if (openDropdownId) {
            setTimeout(() => {
                const input = document.querySelector('.dropdown-search-input');
                if (input) input.focus();
            }, 50);
        }
    }
    
    function handleSearchClick(event) {
        event.stopPropagation();
    }

    function handleWindowClick() { openDropdownId = null; }
    
    function handleEnter(event, callback) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            callback(event);
        }
    }

    function getCmdIcon(key) {
        const c = sortedCommanders.find(e => e.key === key);
        return c ? `https://cdn.discordapp.com/emojis/${c.emoji}.png` : null;
    }
    function getCmdName(key) {
        const c = sortedCommanders.find(e => e.key === key);
        return c ? c.name : 'Select...';
    }
</script>

<svelte:window on:click={handleWindowClick} />

<div 
    class="editor-overlay" 
    use:portal 
    role="button" 
    tabindex="0" 
    on:click|self={attemptClose} 
    on:keydown={handleKeydown}
>
    <div class="editor-modal" role="dialog" aria-modal="true">
        <div class="editor-header">
            <h2>Edit Meta Lineup: {title || "New"}</h2>
            <button class="close-btn" aria-label="Close Editor" on:click={attemptClose}><i class="fas fa-times"></i></button>
        </div>

        <div class="editor-body">
            <div class="form-column">
                <div class="section-box">
                    <h3>Header Info</h3>
                    <label class="form-group">
                        <span class="label-text">Title</span>
                        <input type="text" bind:value={title} />
                    </label>
                    <label class="form-group">
                        <span class="label-text">Image URL</span>
                        <input type="text" bind:value={imageUrl} />
                    </label>
                </div>

                <div class="section-box" style="flex: 1;">
                    <h3>Pairing Groups</h3>
                    {#each fields as field, fIdx (field.id)}
                        <div class="pairing-group">
                            <div class="group-header">
                                <input type="text" class="group-title-input" bind:value={field.name} aria-label="Category Name" placeholder="Category Name" />
                                <button class="btn-icon danger" aria-label="Delete Category" on:click={() => removeField(fIdx)}><i class="fas fa-trash"></i></button>
                            </div>
                            <div class="rows-container">
                                {#each field.rows as row, rIdx}
                                    <div class="pairing-row">
                                        <div class="bullet-wrapper">
                                            <img src={BULLET_IMG_URL} class="bullet-icon-static" alt="•">
                                        </div>
                                        
                                        <div class="custom-select">
                                            <div class="select-trigger" role="button" tabindex="0"
                                                 on:click={(e) => toggleDropdown(`f${fIdx}r${rIdx}c1`, e)}
                                                 on:keydown={(e) => handleEnter(e, () => toggleDropdown(`f${fIdx}r${rIdx}c1`, e))}>
                                                {#if row.cmd1}
                                                    <div class="trigger-content">
                                                        <img src={getCmdIcon(row.cmd1)} alt="" class="select-icon">
                                                        <span>{getCmdName(row.cmd1)}</span>
                                                    </div>
                                                {:else}
                                                    <span class="placeholder">Select...</span>
                                                {/if}
                                            </div>

                                            {#if openDropdownId === `f${fIdx}r${rIdx}c1`}
                                                <div class="select-options">
                                                    <div class="search-container" role="button" tabindex="0" on:click={handleSearchClick} on:keydown={handleSearchClick}>
                                                        <input type="text" class="dropdown-search-input" placeholder="Search..." bind:value={dropdownSearch} on:keydown|stopPropagation />
                                                    </div>

                                                    {#each sortedCommanders.filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as c}
                                                        <div class="option" role="button" tabindex="0"
                                                             on:click|stopPropagation={() => { row.cmd1 = c.key; openDropdownId = null; }}
                                                             on:keydown|stopPropagation={(e) => handleEnter(e, () => { row.cmd1 = c.key; openDropdownId = null; })}>
                                                            <img src={`https://cdn.discordapp.com/emojis/${c.emoji}.png`} alt="" class="select-icon"> {c.name}
                                                        </div>
                                                    {/each}
                                                    
                                                    {#if sortedCommanders.filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase())).length === 0}
                                                        <div class="option disabled" style="opacity: 0.5; cursor: default;">No results</div>
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>

                                        <span class="sep">|</span>

                                        <div class="custom-select">
                                            <div class="select-trigger" role="button" tabindex="0"
                                                 on:click={(e) => toggleDropdown(`f${fIdx}r${rIdx}c2`, e)}
                                                 on:keydown={(e) => handleEnter(e, () => toggleDropdown(`f${fIdx}r${rIdx}c2`, e))}>
                                                {#if row.cmd2}
                                                    <div class="trigger-content">
                                                        <img src={getCmdIcon(row.cmd2)} alt="" class="select-icon">
                                                        <span>{getCmdName(row.cmd2)}</span>
                                                    </div>
                                                {:else}
                                                    <span class="placeholder">Select...</span>
                                                {/if}
                                            </div>

                                            {#if openDropdownId === `f${fIdx}r${rIdx}c2`}
                                                <div class="select-options">
                                                    <div class="search-container" role="button" tabindex="0" on:click={handleSearchClick} on:keydown={handleSearchClick}>
                                                        <input type="text" class="dropdown-search-input" placeholder="Search..." bind:value={dropdownSearch} on:keydown|stopPropagation />
                                                    </div>

                                                    {#each sortedCommanders.filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as c}
                                                        <div class="option" role="button" tabindex="0"
                                                             on:click|stopPropagation={() => { row.cmd2 = c.key; openDropdownId = null; }}
                                                             on:keydown|stopPropagation={(e) => handleEnter(e, () => { row.cmd2 = c.key; openDropdownId = null; })}>
                                                            <img src={`https://cdn.discordapp.com/emojis/${c.emoji}.png`} alt="" class="select-icon"> {c.name}
                                                        </div>
                                                    {/each}

                                                    {#if sortedCommanders.filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase())).length === 0}
                                                        <div class="option disabled" style="opacity: 0.5; cursor: default;">No results</div>
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>

                                        <button class="btn-icon" aria-label="Delete Row" on:click={() => removeRow(fIdx, rIdx)}><i class="fas fa-minus"></i></button>
                                    </div>
                                {/each}
                                <button class="add-btn-modern" on:click={() => addRow(fIdx)}>+ Add Row</button>
                            </div>
                        </div>
                    {/each}
                    <button class="add-btn-modern group-add" on:click={addField}>+ Add Category</button>
                </div>
            </div>

            <div class="preview-column">
                <h3>Preview</h3>
                <div class="discord-preview">
                    
                    <div class="interaction-header">
                        <img src={userAvatar} alt="User" class="user-avatar-mini">
                        <span class="username">{userName}</span>
                        <span class="command-text">used <span class="command-name">/meta</span></span>
                    </div>

                    <div class="message-header">
                        <img src={BOT_ICON} alt="Bot" class="bot-avatar">
                        <div class="header-info">
                            <span class="bot-name">{BOT_NAME}</span>
                            <span class="bot-tag"><span class="bot-tag-check">✔</span>APP</span>
                            <span class="timestamp">Today at 10:30 AM</span>
                        </div>
                    </div>

                    <div class="preview-embed" style="border-left-color: {color}">
                        <div class="preview-author">
                            <img src={AUTHOR_ICON} alt="" /> {AUTHOR_NAME}
                        </div>
                        <div class="preview-title">{title}</div>
                        
                        <div class="preview-fields">
                            {#each fields as field}
                                <div class="preview-field">
                                    <div class="preview-field-name"><code> {field.name} </code></div>
                                    <div class="preview-field-value">
                                        {#each field.rows as row}
                                            <div class="preview-row">
                                                {@html formatDiscordText(BULLET_STRING + ' ' + formatRowString(row))}
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/each}
                        </div>

                        {#if imageUrl}
                            <button 
                                class="preview-image-wrapper" 
                                on:click={() => openLightbox(imageUrl)}
                                on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { openLightbox(imageUrl); } }}
                                aria-label="Zoom in on meta image"
                            >
                                <img 
                                    src={imageUrl} 
                                    class="preview-image" 
                                    alt="Meta Lineup Banner" 
                                />
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    {#if hasUnsavedChanges || saveState === 'saving' || saveState === 'success'}
        <div class="save-bar" transition:fly={{ y: 50, duration: 300 }}>
            <div class="save-bar-content">
                {#if saveState === 'success'}
                    <span style="color: #4ade80;"><i class="fas fa-check-circle"></i> Saved Successfully!</span>
                {:else}
                    <span>You have unsaved changes.</span>
                    <div class="save-actions">
                        <button class="btn-discard" on:click={attemptClose} disabled={saveState === 'saving'}>Discard</button>
                        <button class="btn-calculate" on:click={save} disabled={saveState === 'saving'}>
                            {#if saveState === 'saving'}
                                <i class="fas fa-spinner fa-spin"></i>
                            {:else}
                                Save Changes
                            {/if}
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    {#if showDiscardModal}
        <div class="modal-backdrop" 
            role="button" 
            tabindex="0" 
            on:click|self={() => showDiscardModal = false} 
            on:keydown|stopPropagation={() => {}}
        >
            <div class="modal" role="dialog" aria-modal="true">
                <h3>Discard Changes?</h3>
                <p>You have unsaved changes. Are you sure you want to discard them?</p>
                <div class="modal-actions">
                    <button class="btn-cancel" on:click={() => showDiscardModal = false}>Cancel</button>
                    <button class="btn-danger" on:click={() => dispatch('close')}>Discard</button>
                </div>
            </div>
        </div>
    {/if}

    {#if lightboxImage}
        <div 
            class="lightbox-overlay" 
            role="button" 
            tabindex="0" 
            on:click|self={closeLightbox} 
            on:keydown={(e) => e.key === 'Escape' && closeLightbox()}
            transition:fade={{ duration: 200 }}
        >
        <img 
            src={lightboxImage} 
            alt="" class="lightbox-img" 
            transition:scale={{ start: 0.9, duration: 200 }} 
        />
            <button class="lightbox-close" aria-label="Close Lightbox" on:click={closeLightbox}><i class="fas fa-times"></i></button>
        </div>
    {/if}
</div>

<style>
    .editor-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; outline: none; }
    .editor-modal { background: var(--bg-secondary); width: 95%; max-width: 1200px; height: 90vh; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border-color); position: relative; }
    .editor-header { padding: 15px 20px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
    .editor-header h2 { margin: 0; color: var(--text-primary); font-size: 1.2rem; }
    .close-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem; }
    
    .editor-body { display: flex; flex: 1; overflow: hidden; }
    .form-column { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; min-width: 500px; }
    .preview-column { flex: 0 0 550px; background: #313338; padding: 20px; display: flex; flex-direction: column; border-left: 1px solid #000; }
    
    .section-box { background: var(--bg-primary); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 15px; }
    .section-box h3 { margin: 0; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
    
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group .label-text { font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; }
    input[type="text"] { background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 8px; border-radius: 4px; color: var(--text-primary); width: 100%; }

    .discord-preview { flex: 1; padding: 20px; padding-right: 30px; overflow-y: auto; overflow-x: hidden; font-family: 'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; }

    .interaction-header { display: flex; align-items: center; font-size: 0.85rem; color: #949ba4; margin-bottom: 4px; gap: 8px; position: relative; left: 18px; margin-top: -4px; }
    .interaction-header::before { content: ""; position: absolute; top: 14px; left: -11px; width: 22px; height: 12px; border-top: 2px solid #4e5058; border-left: 2px solid #4e5058; border-top-left-radius: 6px; margin-top: -3px; }
    .user-avatar-mini { width: 16px; height: 16px; border-radius: 50%; }
    .username { font-weight: 600; color: #f2f3f5; cursor: pointer; }
    .username:hover { text-decoration: underline; }
    .command-text { margin-left: 2px; }
    .command-name { color: #5865f2; background: rgba(88, 101, 242, 0.1); font-weight: 500; padding: 0 2px; border-radius: 3px; cursor: pointer; }
    .command-name:hover { background: #5865f2; color: #fff; }

    .message-header { display: flex; align-items: center; margin-bottom: 4px; }
    .bot-avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; cursor: pointer; }
    .bot-avatar:hover { opacity: 0.8; }
    .header-info { display: flex; align-items: center; }
    .bot-name { font-weight: 500; color: #f2f3f5; margin-right: 4px; cursor: pointer; font-size: 1rem; }
    .bot-name:hover { text-decoration: underline; }
    .bot-tag { background: #5865f2; color: #fff; font-size: 0.625rem; padding: 0 4px; border-radius: 3px; margin-right: 8px; line-height: 1.3; display: flex; align-items: center; height: 15px; vertical-align: middle; margin-top: 1px; }
    .bot-tag-check { font-size: 0.6rem; margin-right: 2px; }
    .timestamp { font-size: 0.75rem; color: #949ba4; margin-left: 4px; }

    .preview-embed { background: #2b2d31; border-left: 4px solid; padding: 12px; border-radius: 4px; margin-left: 52px; margin-top: -2px; }
    
    .preview-author { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; font-weight: 600; color: #f2f3f5; margin-bottom: 4px; }
    .preview-author img { width: 24px; height: 24px; border-radius: 50%; }
    .preview-title { font-size: 1rem; font-weight: 700; color: #f2f3f5; margin-bottom: 8px; }
    .preview-fields { display: flex; flex-direction: column; gap: 10px; }
    .preview-field-name code { background-color: #1e1f22; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-weight: 600; color: #dbdee1; font-size: 0.875rem; }
    .preview-field-value { font-size: 0.875rem; color: #dcddde; margin-top: 4px; }
    :global(.emoji-preview) { width: 1.2em; height: 1.2em; vertical-align: -0.2em; object-fit: contain; }
    .preview-image-wrapper {
        display: block;
        padding: 0;
        border: none;
        background: none;
        cursor: zoom-in;
        margin-top: 12px;
        max-width: 100%;
        border-radius: 4px; 
        overflow: hidden; 
        transition: transform 0.2s;
    }
    .preview-image-wrapper:hover { 
        transform: scale(1.01);
    }

    .preview-image { 
        max-width: 100%; 
        display: block; 
        width: 100%;
        height: auto;
        border-radius: 4px;
    }
    .preview-image:hover { transform: scale(1.01); }

    .pairing-group { background: rgba(0,0,0,0.1); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; margin-bottom: 10px; }
    .group-header { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
    .group-title-input { flex: 1; font-weight: bold; background: transparent; border: none; border-bottom: 1px dashed var(--border-color); border-radius: 0; padding-left: 0; }
    
    .pairing-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; background: var(--bg-primary); padding: 5px; border-radius: 4px; border: 1px solid var(--border-color); }
    .bullet-wrapper { display: flex; align-items: center; justify-content: center; width: 24px; }
    .bullet-icon-static { width: 18px; height: 18px; opacity: 0.5; filter: grayscale(100%); }
    
    .custom-select { position: relative; flex: 1; min-width: 0; }
    .select-trigger { display: flex; align-items: center; justify-content: space-between; gap: 8px; background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 6px 10px; border-radius: 4px; cursor: pointer; color: var(--text-primary); font-size: 0.9rem; }
    .select-trigger:focus { border-color: var(--accent-blue); outline: none; }
    .select-options { position: absolute; top: 100%; left: 0; right: 0; z-index: 50; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.5); margin-top: 4px; }
    .option { display: flex; align-items: center; gap: 8px; padding: 8px; cursor: pointer; color: var(--text-secondary); font-size: 0.9rem; }
    .option:hover, .option:focus { background: var(--accent-blue-light); color: white; outline: none; }
    .select-icon { width: 20px; height: 20px; object-fit: contain; }
    .trigger-content { display: flex; align-items: center; gap: 8px; overflow: hidden; white-space: nowrap; }
    .placeholder { color: var(--text-muted); font-size: 0.85rem; }
    .sep { color: var(--text-secondary); opacity: 0.5; margin: 0 5px; }

    .add-btn-modern { width: 100%; background: var(--bg-tertiary); border: 1px dashed var(--border-color); color: var(--text-secondary); padding: 8px; border-radius: 4px; cursor: pointer; }
    .add-btn-modern:hover { color: var(--accent-blue); border-color: var(--accent-blue); }
    .group-add { margin-top: 10px; }
    
    .btn-icon { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; }
    .btn-icon:hover { color: #ef4444; }

    .save-bar {
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: var(--bg-card); border: 1px solid var(--border-color);
        padding: 12px 24px; border-radius: 50px; box-shadow: 0 5px 25px rgba(0,0,0,0.2);
        z-index: 1000; min-width: 350px;
    }
    .save-bar-content { display: flex; justify-content: space-between; align-items: center; gap: 20px; width: 100%; }
    .save-bar span { font-weight: 500; color: white; }
    .save-actions { display: flex; gap: 10px; }
    
    .btn-calculate {
        background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
        color: white;
        border: 2px solid #60a5fa; 
        padding: 8px 24px;
        border-radius: 20px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    }
    
    .btn-calculate:hover { 
        transform: translateY(-1px);
        box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); 
    }

    .btn-calculate:disabled { 
        opacity: 0.7; 
        cursor: not-allowed;
        box-shadow: none;
    }
    
    .btn-discard {
        background: transparent;
        color: #ef4444; 
        border: 2px solid #ef4444;
        padding: 8px 16px; 
        border-radius: 20px; 
        font-weight: 600; 
        cursor: pointer; 
        transition: all 0.2s;
    }
    
    .btn-discard:hover { 
        background: rgba(239, 68, 68, 0.15); 
        color: #ef4444;
    }
    
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; }
    .modal { background: var(--bg-card); padding: 25px; border-radius: 8px; width: 400px; border: 1px solid var(--border-color); box-shadow: 0 4px 25px rgba(0,0,0,0.5); }
    .modal h3 { margin-top: 0; margin-bottom: 20px; color: var(--text-primary); }
    .modal p { color: var(--text-secondary); margin-bottom: 25px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .btn-danger { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .btn-cancel { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 4px; cursor: pointer; }

    .search-container {
        padding: 8px;
        background: var(--bg-secondary);
        position: sticky;
        top: 0;
        z-index: 10;
        border-bottom: 1px solid var(--border-color);
    }
    .dropdown-search-input {
        width: 100%;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        padding: 6px 8px;
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 0.85rem;
    }
    .dropdown-search-input:focus {
        outline: none;
        border-color: var(--accent-blue);
    }
    
    .lightbox-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: zoom-out;
    }
    .lightbox-img {
        max-width: 90vw;
        max-height: 90vh;
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 0 20px rgba(0,0,0,0.5);
        cursor: default;
    }
    .lightbox-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: none;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
        opacity: 0.7;
    }
    .lightbox-close:hover { opacity: 1; }
</style>