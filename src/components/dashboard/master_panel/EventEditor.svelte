<script>
    import { createEventDispatcher, onMount, tick } from 'svelte';
    import { fly, fade, scale } from 'svelte/transition';

    export let eventId;
    export let eventData;
    export let user;
    const dispatch = createEventDispatcher();
    const AUTHOR_ICON = "https://i.postimg.cc/Jn4zn7sy/Kings-Codex-Logo-No-URL-No-Glow.png";
    const AUTHOR_NAME = "The King's Codex";
    const BOT_ICON = "https://cdn.discordapp.com/avatars/1289603576104091679/aaa1f4a186484a62377665c086a40f24.webp?size=80";
    const BOT_NAME = "Codex Helper";
    
    const LIMITS = {
        TITLE: 256,
        DESCRIPTION: 4096,
        FIELD_NAME: 256,
        FIELD_VALUE: 1024,
        AUTHOR_NAME: 256,
        TOTAL: 6000
    };

    let title = "";
    let color = "#313338";
    let imageUrl = "";
    let thumbnailUrl = "";
    let fields = [];
    let saveState = 'idle';
    let showDiscardModal = false;

    let lightboxImage = null;

    $: userAvatar = user?.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` 
        : "https://cdn.discordapp.com/embed/avatars/0.png";
    $: userName = user?.display_name || user?.username || "User";
    
    let initialJSON = "";
    $: currentSnapshot = JSON.stringify({ title, color, imageUrl, thumbnailUrl, fields });
    $: hasUnsavedChanges = initialJSON && currentSnapshot && initialJSON !== currentSnapshot;

    $: totalEmbedChars = (title?.length || 0) + 
                         (AUTHOR_NAME.length) + 
                         fields.reduce((acc, f) => acc + (f.name?.length || 0) + (f.value?.length || 0), 0);

    $: isTotalOverLimit = totalEmbedChars > LIMITS.TOTAL;

    function portal(node) {
        let owner = document.body;
        owner.appendChild(node);
        return {
            destroy() { if (node.parentNode) node.parentNode.removeChild(node); }
        };
    }

    function formatDiscordText(text) {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/&lt;:([^:]+):(\d+)&gt;/g, '<img src="https://cdn.discordapp.com/emojis/$2.png" class="emoji-preview" alt="$1">')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/(\*|_)(.*?)\1/g, '<em>$2</em>')
            .replace(/\n/g, '<br>');
    }

    onMount(async () => {
        title = eventData.title || "";
        color = typeof eventData.color === 'number' 
            ? '#' + eventData.color.toString(16).padStart(6, '0') 
            : eventData.color || "#3066993"; 
        
        imageUrl = eventData.image?.url || "";
        thumbnailUrl = eventData.thumbnail?.url || "";

        if (eventData.fields) {
            fields = eventData.fields.map(f => ({
                id: Math.random().toString(36),
                name: f.name,
                value: f.value 
            }));
        } else {
            fields = [{ id: '1', name: 'Details', value: '' }];
        }

        await tick();
        initialJSON = currentSnapshot;
    });

    function addField() {
        fields = [...fields, { id: Math.random().toString(36), name: "New Field", value: "" }];
    }

    function removeField(index) {
        fields = fields.filter((_, i) => i !== index);
    }

    function save() {
        if (isTotalOverLimit) {
            alert("Cannot save: Embed exceeds Discord's 6000 character limit.");
            return;
        }

        const newData = {
            ...eventData,
            title,
            color: parseInt(color.replace('#', ''), 16),
            image: { url: imageUrl },
            thumbnail: { url: thumbnailUrl },
            fields: fields.map(f => ({
                name: f.name,
                value: f.value,
                inline: false
            }))
        };
        saveState = 'saving';

        dispatch('save', { 
            id: eventId, 
            data: newData,
            callback: (success) => {
                if (success) {
                    saveState = 'success';
                    initialJSON = currentSnapshot;
                    setTimeout(() => {
                        saveState = 'idle';
                    }, 2000);
                } else {
                    saveState = 'idle';
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
</script>

<div 
    class="editor-overlay" 
    use:portal 
    role="button" 
    tabindex="0" 
    on:click|self={attemptClose} 
    on:keydown={handleKeydown}
>
    <div class="editor-modal">
        <div class="editor-header">
            <h2>Edit Event: {title || eventId}</h2>
            <button class="close-btn" aria-label="Close Editor" on:click={attemptClose}><i class="fas fa-times"></i></button>
        </div>

        <div class="editor-body">
            <div class="form-column">
                <div class="section-box">
                    <h3>General Info</h3>
                    <label class="form-group">
                        <div class="label-row">
                            <span class="label-text">Event Title</span>
                            <span class="char-count" class:error={title.length > LIMITS.TITLE}>
                                {title.length}/{LIMITS.TITLE}
                            </span>
                        </div>
                        <input type="text" bind:value={title} maxlength={LIMITS.TITLE} />
                    </label>
                    
                    <div class="row" style="align-items: flex-end;">
                        <label class="form-group" style="flex: 2;">
                            <span class="label-text">Image URL (Large)</span>
                            <input type="text" bind:value={imageUrl} placeholder="https://..." />
                        </label>
                        <label class="form-group" style="flex: 1;">
                            <span class="label-text">Thumbnail URL (Icon)</span>
                            <input type="text" bind:value={thumbnailUrl} placeholder="https://..." />
                        </label>
                        <label class="form-group" style="width: 80px;">
                            <span class="label-text">Color</span>
                            <div class="color-picker-wrapper">
                                <input type="color" bind:value={color} title="Choose Embed Color" style="height: 38px; padding: 2px;"/>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="section-box" style="flex: 1;">
                    <h3>Fields</h3>
                    <div class="fields-container">
                        {#each fields as field, idx (field.id)}
                            <div class="field-item">
                                <div class="field-header">
                                    <div class="field-name-wrapper" style="flex: 1;">
                                        <input type="text" class="field-name-input" bind:value={field.name} placeholder="Field Name" aria-label="Field Name" maxlength={LIMITS.FIELD_NAME} />
                                        <span class="char-mini" class:error={field.name.length >= LIMITS.FIELD_NAME}>{field.name.length}/{LIMITS.FIELD_NAME}</span>
                                    </div>
                                    <button class="btn-icon danger" aria-label="Delete Field" on:click={() => removeField(idx)}><i class="fas fa-trash"></i></button>
                                </div>
                                <div class="field-value-wrapper">
                                    <textarea 
                                        class="field-value-input" 
                                        bind:value={field.value} 
                                        placeholder="Enter field text here. Use \n for new lines."
                                        rows="4"
                                        aria-label="Field Value"
                                    ></textarea>
                                    <div class="field-footer-info">
                                        <span class="char-count" 
                                            class:warning={field.value.length > LIMITS.FIELD_VALUE * 0.9} 
                                            class:error={field.value.length > LIMITS.FIELD_VALUE}>
                                            {field.value.length} / {LIMITS.FIELD_VALUE}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        {/each}
                        <button class="add-btn-modern" on:click={addField}>+ Add Field</button>
                    </div>

                    <div class="total-count-bar" class:error={isTotalOverLimit}>
                        <span>Total Embed Size</span>
                        <span>{totalEmbedChars} / {LIMITS.TOTAL}</span>
                    </div>
                </div>
            </div>

            <div class="preview-column">
                <h3>Preview</h3>
                <div class="discord-preview">
                    <div class="interaction-header">
                        <img src={userAvatar} alt="User" class="user-avatar-mini">
                        <span class="username">{userName}</span>
                        <span class="command-text">used <span class="command-name">/event</span></span>
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
                        <div class="preview-content">
                            <div class="preview-author">
                                <img src={AUTHOR_ICON} alt="" /> {AUTHOR_NAME}
                            </div>
                            <div class="preview-title">{title}</div>
                            
                            {#if thumbnailUrl}
                                <img src={thumbnailUrl} class="preview-thumb" alt="thumb" />
                            {/if}

                            {#each fields as field}
                                <div class="preview-field">
                                    <div class="preview-field-name">{field.name}</div>
                                    <div class="preview-field-value">{@html formatDiscordText(field.value)}</div>
                                </div>
                            {/each}

                            {#if imageUrl}
                                <button 
                                    class="preview-image-wrapper" 
                                    on:click={() => openLightbox(imageUrl)}
                                    on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { openLightbox(imageUrl); } }}
                                    aria-label="Zoom in on main image"
                                >
                                    <img 
                                        src={imageUrl} 
                                        class="preview-image" 
                                        alt="" 
                                    />
                                </button>
                            {/if}
                        </div>
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
                        <button class="btn-calculate" on:click={save} disabled={saveState === 'saving' || isTotalOverLimit}>
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
                alt="Zoomed" 
                class="lightbox-img" 
                transition:scale={{ start: 0.9, duration: 200 }} 
            />
            <button class="lightbox-close" aria-label="Close Lightbox" on:click={closeLightbox}>
                <i class="fas fa-times"></i>
            </button>
        </div>
    {/if}
</div>

<style>
    .editor-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; outline: none; }
    .editor-modal { background: var(--bg-secondary); width: 95%; max-width: 1600px; height: 90vh; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border-color); position: relative; }
    .editor-header { padding: 15px 20px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
    .editor-header h2 { margin: 0; color: var(--text-primary); font-size: 1.2rem; }
    .close-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem; }
    
    .editor-body { display: flex; flex: 1; overflow: hidden; }
    .form-column { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
    .preview-column { flex: 0 0 550px; background: #313338; padding: 20px; display: flex; flex-direction: column; border-left: 1px solid #000; }
    
    .section-box { background: var(--bg-primary); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 15px; }
    .section-box h3 { margin: 0; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
    
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group .label-text { font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; }
    .label-row { display: flex; justify-content: space-between; align-items: center; }
    
    input[type="text"], textarea { background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 8px; border-radius: 4px; color: var(--text-primary); width: 100%; }
    
    /* Field Items Styling */
    .field-item { background: rgba(0,0,0,0.1); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); margin-bottom: 10px; }
    .field-header { display: flex; gap: 10px; margin-bottom: 8px; align-items: center; }
    .field-name-wrapper { position: relative; }
    .field-name-input { font-weight: bold; }
    .field-value-wrapper { display: flex; flex-direction: column; }
    .field-value-input { font-family: monospace; font-size: 0.9rem; resize: vertical; margin-bottom: 4px; }
    
    .field-footer-info { display: flex; justify-content: flex-end; }
    
    /* Character Counters */
    .char-count { font-size: 0.7rem; color: var(--text-secondary); transition: color 0.2s; }
    .char-count.warning { color: #eab308; }
    .char-count.error { color: #ef4444; font-weight: bold; }
    
    .char-mini { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 0.7rem; color: var(--text-secondary); pointer-events: none; background: rgba(0,0,0,0.5); padding: 2px 4px; border-radius: 3px; }
    .char-mini.error { color: #ef4444; }

    /* Total Count Bar */
    .total-count-bar { background: var(--bg-tertiary); padding: 10px 15px; border-radius: 6px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-top: 10px; }
    .total-count-bar.error { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); color: #ef4444; }

    /* Discord Preview */
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

    .preview-embed { background: #2b2d31; border-left: 4px solid; padding: 12px; border-radius: 4px; position: relative; margin-left: 52px; margin-top: -2px; }
    
    .preview-content { display: flex; flex-direction: column; gap: 8px; }
    .preview-author { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; font-weight: 600; color: #f2f3f5; }
    .preview-author img { width: 24px; height: 24px; border-radius: 50%; }
    .preview-title { font-size: 1rem; font-weight: 700; color: #f2f3f5; }
    .preview-field-name { font-weight: 700; font-size: 0.875rem; color: #f2f3f5; margin-bottom: 2px; }
    .preview-field-value { font-size: 0.875rem; color: #dcddde; white-space: pre-wrap; line-height: 1.3; }
    
    :global(.emoji-preview) { width: 1.2em; height: 1.2em; vertical-align: -0.2em; object-fit: contain; }
    
    .preview-image-wrapper { display: block; padding: 0; border: none; background: none; cursor: zoom-in; margin-top: 8px; max-width: 100%; border-radius: 4px; overflow: hidden; transition: transform 0.2s; }
    .preview-image-wrapper:hover { transform: scale(1.01); }
    .preview-image { max-width: 100%; display: block; width: 100%; height: auto; border-radius: 4px; }
    .preview-thumb { position: absolute; top: 12px; right: 12px; width: 60px; height: 60px; border-radius: 4px; object-fit: cover; }

    .row { display: flex; gap: 10px; }
    .color-picker-wrapper { display: flex; align-items: center; gap: 10px; width: 100%; }
    .color-picker-wrapper input { width: 100%; cursor: pointer; background: var(--bg-tertiary); border: 1px solid var(--border-color); }
    
    .add-btn-modern { width: 100%; padding: 8px; background: var(--bg-tertiary); border: 1px dashed var(--border-color); color: var(--text-secondary); cursor: pointer; border-radius: 4px; }
    .add-btn-modern:hover { color: var(--accent-blue); border-color: var(--accent-blue); }
    .btn-icon { background: none; border: none; color: var(--text-secondary); cursor: pointer; }
    .btn-icon.danger:hover { color: #ef4444; }

    .save-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--bg-card); border: 1px solid var(--border-color); padding: 12px 24px; border-radius: 50px; box-shadow: 0 5px 25px rgba(0,0,0,0.2); z-index: 1000; min-width: 350px; }
    .save-bar-content { display: flex; justify-content: space-between; align-items: center; gap: 20px; width: 100%; }
    .save-bar span { font-weight: 500; color: white; }
    .save-actions { display: flex; gap: 10px; }
    
    .btn-calculate { background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple)); color: white; border: 2px solid #60a5fa; padding: 8px 24px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
    .btn-calculate:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }
    .btn-calculate:disabled { opacity: 0.7; cursor: not-allowed; box-shadow: none; }
    
    .btn-discard { background: transparent; color: #ef4444; border: 2px solid #ef4444; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-discard:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; }
    .modal { background: var(--bg-card); padding: 25px; border-radius: 8px; width: 400px; border: 1px solid var(--border-color); box-shadow: 0 4px 25px rgba(0,0,0,0.5); }
    .modal h3 { margin-top: 0; margin-bottom: 20px; color: var(--text-primary); }
    .modal p { color: var(--text-secondary); margin-bottom: 25px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .btn-danger { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .btn-cancel { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 4px; cursor: pointer; }

    .lightbox-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.9); z-index: 100000; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
    .lightbox-img { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 4px; box-shadow: 0 0 20px rgba(0,0,0,0.5); cursor: default; }
    .lightbox-close { position: absolute; top: 20px; right: 20px; background: none; border: none; color: white; font-size: 2rem; cursor: pointer; opacity: 0.7; }
    .lightbox-close:hover { opacity: 1; }
</style>