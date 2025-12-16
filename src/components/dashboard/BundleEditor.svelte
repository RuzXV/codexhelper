<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fly } from 'svelte/transition';

    export let bundleId;
    export let bundleData;
    export let user;
    const dispatch = createEventDispatcher();
    const AUTHOR_ICON = "https://i.postimg.cc/Jn4zn7sy/Kings-Codex-Logo-No-URL-No-Glow.png";
    const AUTHOR_NAME = "The King's Codex";

    const BOT_ICON = "https://cdn.discordapp.com/avatars/1289603576104091679/aaa1f4a186484a62377665c086a40f24.webp?size=80";
    const BOT_NAME = "Codex Helper";

    const EMOJI = {
        available: "<:available:1366505884955447346>",
        cost: "<:cost:1366505572379267193>",
        gem: "<:gem:1366506904846860420>",
        speedup: "<:speedup:1366757302564294676>",
        gold_chest: "<:gold_chest:1372809875947524146>",
        tiers: "<:tiers:1366505580109238332>",
        bullet: "<:bullet_point2:1366755670304624732>"
    };
    let title = "";
    let imageUrl = "";
    let color = "#e9be74";

    let inputAvailability = "Daily";
    let inputCost = "";
    let inputGems = "";
    let inputSpeedups = "";
    let inputGoldChests = "";
    let inputTiers = ""; 
    let extraContents = [];
    let saveState = 'idle';

    $: userAvatar = user?.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` 
        : "https://cdn.discordapp.com/embed/avatars/0.png";
    $: userName = user?.display_name || user?.username || "User";
    $: description = [
        `**${EMOJI.available} Availability:** ${inputAvailability}`,
        "",
        `**${EMOJI.cost} Total Cost:** ${formatCurrency(inputCost)}`,
        `**${EMOJI.gem} Total Gems:** ${inputGems}`,
        `**${EMOJI.speedup} Total Speedups:** ${inputSpeedups}`,
        `**${EMOJI.gold_chest} Gold Chests:** ${inputGoldChests}`,
        `**${EMOJI.tiers} Bundle Tiers:** ${formatTiers(inputTiers)}`,
        "",
        "**Extra Contents:**",
        ...extraContents.map(line => `${EMOJI.bullet} ${line}`),
        "",
        "*All $ prices are listed in USD*"
    ];

    let initialJSON = "";
    $: currentJSON = JSON.stringify({ 
        title, imageUrl, color, inputAvailability, inputCost, 
        inputGems, inputSpeedups, inputGoldChests, inputTiers, extraContents 
    });
    $: hasUnsavedChanges = initialJSON !== currentJSON;

    function portal(node) {
        let owner = document.body;
        owner.appendChild(node);
        return {
            destroy() { if (node.parentNode) node.parentNode.removeChild(node);
            }
        };
    }

    function formatDiscordText(text) {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/&lt;:([^:]+):(\d+)&gt;/g, '<img src="https://cdn.discordapp.com/emojis/$2.png" class="emoji-preview" alt="$1">')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
    }

    onMount(() => {
        title = bundleData.title || "";
        imageUrl = bundleData.image?.url || "";
        color = bundleData.color || "#e9be74";

        const desc = bundleData.description || [];
        const strDesc = desc.join('\n');

        const availMatch = strDesc.match(/Availability:\*\* (.*)/);
        if(availMatch) inputAvailability = availMatch[1].trim();

        const costMatch = strDesc.match(/Total Cost:\*\* (.*)/);
        if(costMatch) inputCost = costMatch[1].replace('$', '').replace(',', '').trim();

        const gemMatch = strDesc.match(/Total Gems:\*\* (.*)/);
        if(gemMatch) inputGems = gemMatch[1].trim();

        const speedMatch = strDesc.match(/Total Speedups:\*\* (.*)/);
        if(speedMatch) inputSpeedups = speedMatch[1].trim();
        
        const chestMatch = strDesc.match(/Gold Chests:\*\* (.*)/);
        if(chestMatch) inputGoldChests = chestMatch[1].trim();

        const tierMatch = strDesc.match(/Bundle Tiers:\*\* (.*)/);
        if(tierMatch) inputTiers = tierMatch[1].replace(/\$/g, '').trim();
        extraContents = desc
            .filter(line => line.includes(EMOJI.bullet))
            .map(line => line.replace(EMOJI.bullet, '').trim());
            
        initialJSON = JSON.stringify({ 
            title, imageUrl, color, inputAvailability, inputCost, 
            inputGems, inputSpeedups, inputGoldChests, inputTiers, extraContents 
        });
    });

    function formatCurrency(val) {
        if (!val) return "$0";
        return "$" + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function formatTiers(val) {
        if (!val) return "";
        return val.split(',').map(s => {
            const clean = s.trim().replace('$', '');
            return clean ? `$${clean}` : '';
        }).filter(s => s).join(', ');
    }

    function addContent() {
        extraContents = [...extraContents, "New Item"];
    }
    
    function removeContent(idx) {
        extraContents = extraContents.filter((_, i) => i !== idx);
    }

    function save() {
        const newData = {
            ...bundleData,
            title,
            color,
            image: { url: imageUrl },
            description, 
            author: { name: AUTHOR_NAME, icon_url: AUTHOR_ICON 
            }
        };

        saveState = 'saving';

        dispatch('save', { 
            id: bundleId, 
            data: newData,
            callback: (success) => {
                if (success) {
                    saveState = 'success';
                    initialJSON = JSON.stringify({ 
                        title, imageUrl, color, inputAvailability, inputCost, 
                        inputGems, inputSpeedups, inputGoldChests, inputTiers, extraContents 
                    });
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

    function close() {
        if (hasUnsavedChanges && !confirm("Discard unsaved changes?")) return;
        dispatch('close');
    }

    function handleKeydown(e) {
        if (e.key === 'Escape') close();
    }
</script>

<div 
    class="editor-overlay" 
    use:portal 
    role="button" 
    tabindex="0" 
    on:click|self={close} 
    on:keydown={handleKeydown}
>
    <div class="editor-modal">
        <div class="editor-header">
            <h2>Edit Bundle: {title || "New Bundle"}</h2>
            <button class="close-btn" aria-label="Close Editor" on:click={close}><i class="fas fa-times"></i></button>
        </div>

        <div class="editor-body">
            <div class="form-column">
                <div class="section-box">
                    <h3>Header Info</h3>
                    <label class="form-group">
                        <span class="label-text">Bundle Name</span>
                        <input type="text" bind:value={title} />
                    </label>
                   <label class="form-group">
                        <span class="label-text">Image URL</span>
                        <input type="text" bind:value={imageUrl} />
                    </label>
                </div>

                 <div class="section-box">
                    <h3>Bundle Stats</h3>
                    <div class="row">
                        <label class="form-group">
                            <span class="label-text">Availability</span>
                            <input type="text" bind:value={inputAvailability} />
                        </label>
                        <label class="form-group">
                            <span class="label-text">Total Cost (USD number only)</span>
                            <input type="number" bind:value={inputCost} placeholder="e.g. 1085" />
                        </label>
                    </div>
                    <div class="row">
                        <label class="form-group">
                            <span class="label-text">Total Gems (e.g. 269,850)</span>
                            <input type="text" bind:value={inputGems} />
                        </label>
                        <label class="form-group">
                            <span class="label-text">Gold Chests (e.g. x10)</span>
                            <input type="text" bind:value={inputGoldChests} />
                        </label>
                    </div>
                    <label class="form-group">
                        <span class="label-text">Total Speedups (e.g. 68 Days Universal...)</span>
                        <input type="text" bind:value={inputSpeedups} />
                    </label>
                    <label class="form-group">
                        <span class="label-text">Tiers (Comma separated, e.g. 5, 10, 20)</span>
                        <input type="text" bind:value={inputTiers} />
                    </label>
                </div>

                <div class="section-box" style="flex: 1;">
                    <h3>Extra Contents</h3>
                    <div class="fields-container">
                        {#each extraContents as content, idx}
                            <div class="pairing-row">
                                <input type="text" aria-label="Content Item" class="custom-text-input" bind:value={extraContents[idx]} />
                                <button class="btn-icon danger" aria-label="Delete Item" on:click={() => removeContent(idx)}><i class="fas fa-trash"></i></button>
                            </div>
                         {/each}
                        <button class="add-btn-modern" on:click={addContent}>+ Add Item</button>
                    </div>
                </div>
            </div>

             <div class="preview-column">
                <h3>Preview</h3>
                <div class="discord-preview">
                    
                    <div class="interaction-header">
                        <img src={userAvatar} alt="User" class="user-avatar-mini">
                        <span class="username">{userName}</span>
                        <span class="command-text">used <span class="command-name">/bundle</span></span>
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
                        <div class="preview-description">
                            {#each description as line}
                               {#if line === ""}
                                    <div class="empty-line"></div>
                                {:else}
                                    <div class="desc-line">{@html formatDiscordText(line)}</div>
                                {/if}
                            {/each}
                        </div>
                        {#if imageUrl}
                            <img src={imageUrl} class="preview-image" alt="bundle" />
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    {#if hasUnsavedChanges || saveState === 'success' || saveState === 'saving'}
        <div class="save-bar" transition:fly={{ y: 50, duration: 300 }}>
            <div class="save-bar-content">
                {#if saveState === 'saving'}
                    <span class="status-msg"><i class="fas fa-circle-notch fa-spin"></i> Saving changes...</span>
                {:else if saveState === 'success'}
                    <span class="status-msg success"><i class="fas fa-check-circle"></i> Saved!</span>
                {:else}
                    <span class="dirty-msg">You have unsaved changes.</span>
                    <div class="bar-actions">
                        <button class="btn-bar-cancel" on:click={close}>Discard</button>
                        <button class="btn-bar-save" on:click={save}>Save Changes</button>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .editor-overlay { position: fixed;
    inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; outline: none;
    }
    .editor-modal { background: var(--bg-secondary); width: 95%; max-width: 1200px; height: 90vh; border-radius: 12px; display: flex; flex-direction: column;
    overflow: hidden; border: 1px solid var(--border-color); position: relative; }
    .editor-header { padding: 15px 20px; background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
    .editor-header h2 { margin: 0;
    color: var(--text-primary); font-size: 1.2rem; }
    .close-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem;
    }
    
    .editor-body { display: flex; flex: 1; overflow: hidden;
    }
    .form-column { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;
    }
    .preview-column { flex: 0 0 550px; background: #313338; padding: 20px; display: flex; flex-direction: column;
    border-left: 1px solid #000; }
    .section-box { background: var(--bg-primary); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);
    display: flex; flex-direction: column; gap: 15px; }
    .section-box h3 { margin: 0; font-size: 0.85rem; color: var(--text-secondary);
    text-transform: uppercase; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
    
    .form-group { display: flex;
    flex-direction: column; gap: 5px; }
    .form-group .label-text { font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;
    }
    input[type="text"], input[type="number"] { background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 8px; border-radius: 4px; color: var(--text-primary);
    width: 100%; }

    .discord-preview { 
        flex: 1; 
        padding: 20px;
        padding-right: 30px;
        overflow-y: auto; 
        overflow-x: hidden;
        font-family: 'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }

    .interaction-header { 
        display: flex; align-items: center; font-size: 0.85rem;
        color: #949ba4; 
        margin-bottom: 4px; gap: 8px; position: relative; 
        left: 18px; 
        margin-top: -4px;
    }
    .interaction-header::before { 
        content: ""; position: absolute; top: 14px;
        left: -11px; width: 22px; height: 12px; 
        border-top: 2px solid #4e5058; border-left: 2px solid #4e5058; border-top-left-radius: 6px; margin-top: -3px;
    }
    .user-avatar-mini { width: 16px; height: 16px; border-radius: 50%; }
    .username { font-weight: 600;
    color: #f2f3f5; cursor: pointer; }
    .username:hover { text-decoration: underline; }
    .command-text { margin-left: 2px;
    }
    .command-name { color: #5865f2; background: rgba(88, 101, 242, 0.1); font-weight: 500; padding: 0 2px; border-radius: 3px;
    cursor: pointer; }
    .command-name:hover { background: #5865f2; color: #fff; }

    .message-header { display: flex;
    align-items: center; margin-bottom: 4px; }
    .bot-avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; cursor: pointer;
    }
    .bot-avatar:hover { opacity: 0.8; }
    .header-info { display: flex; align-items: center;
    }
    .bot-name { font-weight: 500; color: #f2f3f5; margin-right: 4px; cursor: pointer; font-size: 1rem;
    }
    .bot-name:hover { text-decoration: underline; }
    .bot-tag { background: #5865f2; color: #fff; font-size: 0.625rem;
    padding: 0 4px; border-radius: 3px; margin-right: 8px; line-height: 1.3; display: flex; align-items: center; height: 15px; vertical-align: middle; margin-top: 1px;
    }
    .bot-tag-check { font-size: 0.6rem; margin-right: 2px; }
    .timestamp { font-size: 0.75rem; color: #949ba4;
    margin-left: 4px; }

    .preview-embed { 
        background: #2b2d31;
        border-left: 4px solid; 
        padding: 12px; 
        border-radius: 4px; 
        margin-left: 52px; 
        margin-top: -2px; 
    }

    .preview-author { display: flex;
    align-items: center; gap: 8px; font-size: 0.875rem; font-weight: 600; color: #f2f3f5; margin-bottom: 4px;
    }
    .preview-author img { width: 24px; height: 24px; border-radius: 50%;
    }
    .preview-title { font-size: 1rem; font-weight: 700; color: #f2f3f5; margin-bottom: 8px;
    }
    .preview-description { font-size: 0.875rem; color: #dcddde; }
    :global(.emoji-preview) { width: 1.2em; height: 1.2em;
    vertical-align: -0.2em; object-fit: contain; }
    .empty-line { height: 1em; }
    .desc-line { margin-bottom: 2px;
    }
    .preview-image { max-width: 100%; border-radius: 4px; margin-top: 12px; }

    .row { display: flex;
    gap: 10px; }
    .pairing-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .custom-text-input { flex: 1; }
    .add-btn-modern { width: 100%; padding: 8px; background: var(--bg-tertiary);
    border: 1px dashed var(--border-color); color: var(--text-secondary); cursor: pointer; border-radius: 4px; }
    .add-btn-modern:hover { color: var(--accent-blue); border-color: var(--accent-blue);
    }
    .btn-icon { background: none; border: none; color: var(--text-secondary); cursor: pointer;
    }
    .btn-icon:hover { color: #ef4444; }

    .save-bar {
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #111214;
        border: 1px solid #00c6ff;
        padding: 15px 30px;
        border-radius: 50px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        z-index: 1000;
        min-width: 300px;
        display: flex;
        justify-content: center;
    }
    .save-bar-content {
        display: flex;
        align-items: center;
        gap: 20px;
        width: 100%;
        justify-content: space-between;
    }
    .status-msg { font-size: 1.1rem; color: var(--text-primary); display: flex; align-items: center; gap: 10px; margin: 0 auto;}
    .status-msg.success { color: #4ade80; }
    .dirty-msg { font-weight: 600; color: var(--text-primary); }
    .bar-actions { display: flex; gap: 10px; }
    
    .btn-bar-cancel {
        background: transparent;
        color: #ef4444;
        border: none;
        font-weight: 600;
        cursor: pointer;
        padding: 8px 16px;
    }
    .btn-bar-cancel:hover { text-decoration: underline; }

    .btn-bar-save {
        background: #00c6ff;
        color: #000;
        border: none;
        padding: 8px 24px;
        border-radius: 20px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.1s;
    }
    .btn-bar-save:hover { transform: scale(1.05); filter: brightness(1.1); }
</style>