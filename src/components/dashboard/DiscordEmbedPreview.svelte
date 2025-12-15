<script>
    import { createEventDispatcher } from 'svelte';
    export let embedData = {};
    export let components = [];
    
    const dispatch = createEventDispatcher();

    function intToHex(intColor) {
        if (!intColor && intColor !== 0) return '#202225';
        return '#' + intColor.toString(16).padStart(6, '0');
    }

    function processMarkdown(text) {
        if (!text) return '';
        let processed = text
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
            .replace(/\n/g, '<br>');
        
        processed = processed.replace(/&lt;:(\w+):(\d+)&gt;/g, (match, name, id) => {
            return `<img src="https://cdn.discordapp.com/emojis/${id}.png" class="emoji" alt="${name}">`;
        });
        
        return processed;
    }

    function handleButtonClick(customId) {
        if (!customId) return;
        dispatch('action', { customId });
    }
</script>

<div class="discord-message-group">
    <div class="message-header">
        <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="Bot" class="bot-avatar">
        <span class="bot-username">Codex Keeper</span>
        <span class="bot-tag">BOT</span>
        <span class="timestamp">Today at 12:00 PM</span>
    </div>

    <div class="message-content">
        {#if embedData}
            <div class="discord-embed" style="border-left-color: {intToHex(embedData.color)};">
                <div class="embed-grid">
                    <div class="embed-content-col">
                        {#if embedData.author}
                            <div class="embed-author">
                                {#if embedData.author.icon_url}
                                    <img src={embedData.author.icon_url} alt="" class="author-icon">
                                {/if}
                                <span>{embedData.author.name}</span>
                            </div>
                        {/if}

                        {#if embedData.title}
                            <div class="embed-title">{embedData.title}</div>
                        {/if}

                        {#if embedData.description}
                            <div class="embed-description">{@html processMarkdown(embedData.description)}</div>
                        {/if}

                        {#if embedData.fields}
                            <div class="embed-fields">
                                {#each embedData.fields as field}
                                    <div class="embed-field" class:inline={field.inline}>
                                        <div class="field-name">{@html processMarkdown(field.name)}</div>
                                        <div class="field-value">{@html processMarkdown(field.value)}</div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    {#if embedData.thumbnail}
                        <img src={embedData.thumbnail.url} alt="Thumbnail" class="embed-thumbnail">
                    {/if}
                </div>

                {#if embedData.image}
                    <img src={embedData.image.url} alt="Main Image" class="embed-image">
                {/if}

                {#if embedData.footer}
                    <div class="embed-footer">
                        {#if embedData.footer.icon_url}
                            <img src={embedData.footer.icon_url} alt="" class="footer-icon">
                        {/if}
                        <span>{embedData.footer.text}</span>
                    </div>
                {/if}
            </div>
        {/if}

        {#if components && components.length > 0}
            <div class="action-rows">
                {#each components as row}
                    <div class="action-row">
                        {#each row.components as btn}
                            {#if btn.type === 2} <button 
                                    class="discord-btn style-{btn.style}" 
                                    on:click={() => handleButtonClick(btn.custom_id)}
                                    disabled={!btn.custom_id && !btn.url}
                                >
                                    {#if btn.emoji}
                                        <img src={`https://cdn.discordapp.com/emojis/${btn.emoji.id}.png`} alt="" class="btn-emoji">
                                    {/if}
                                    {#if btn.label}{btn.label}{/if}
                                    {#if btn.style === 5}
                                        <i class="fas fa-external-link-alt link-icon"></i>
                                    {/if}
                                </button>
                            {/if}
                        {/each}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .discord-message-group {
        font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background: #313338;
        padding: 1rem;
        border-radius: 8px;
        color: #dbdee1;
        max-width: 600px;
        margin: 0 auto;
        border: 1px solid #1e1f22;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }

    .message-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .bot-avatar { width: 40px; height: 40px; border-radius: 50%; }
    .bot-username { font-weight: 500; color: #f2f3f5; font-size: 16px; }
    .bot-tag { background: #5865f2; color: white; font-size: 10px; padding: 2px 4px; border-radius: 4px; font-weight: 500; line-height: 1.1; margin-top: 1px;}
    .timestamp { font-size: 12px; color: #949ba4; margin-left: 4px; }

    .message-content { padding-left: 48px; }

    .discord-embed {
        background: #2b2d31;
        border-left: 4px solid #202225;
        border-radius: 4px;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 520px;
    }

    .embed-grid { display: flex; gap: 16px; }
    .embed-content-col { flex: 1; min-width: 0; }

    .embed-author { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: white; margin-bottom: 8px; }
    .author-icon { width: 24px; height: 24px; border-radius: 50%; }

    .embed-title { font-size: 16px; font-weight: 600; color: white; margin-bottom: 8px; }
    .embed-description { font-size: 14px; color: #dbdee1; line-height: 1.375; white-space: pre-wrap; }

    .embed-fields { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .embed-field { min-width: 100%; }
    .embed-field.inline { min-width: fit-content; flex-basis: 30%; }
    .field-name { font-weight: 600; color: white; font-size: 14px; margin-bottom: 2px; }
    .field-value { font-size: 14px; color: #dbdee1; white-space: pre-wrap; line-height: 1.375; }

    .embed-thumbnail { max-width: 80px; max-height: 80px; border-radius: 4px; object-fit: contain; }
    .embed-image { width: 100%; max-height: 300px; border-radius: 4px; object-fit: cover; margin-top: 8px; }

    .embed-footer { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #949ba4; margin-top: 8px; }
    .footer-icon { width: 20px; height: 20px; border-radius: 50%; }

    .action-rows { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
    .action-row { display: flex; flex-wrap: wrap; gap: 8px; }

    .discord-btn {
        height: 32px;
        min-width: 60px;
        padding: 2px 16px;
        border-radius: 3px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: none;
        transition: background-color 0.17s ease;
        color: white;
    }
    .discord-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-emoji { width: 1.2em; height: 1.2em; }

    .style-1 { background-color: #5865f2; }
    .style-1:hover { background-color: #4752c4; }
    
    .style-2 { background-color: #4e5058; }
    .style-2:hover { background-color: #6d6f78; }

    .style-3 { background-color: #248046; }
    .style-3:hover { background-color: #1a6334; }

    .style-4 { background-color: #da373c; }
    .style-4:hover { background-color: #a1282c; }

    .style-5 { background-color: #4e5058; }
    .style-5:hover { background-color: #6d6f78; }
    .link-icon { font-size: 12px; }

    :global(.inline-code) {
        background: #1e1f22;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
        font-size: 0.9em;
    }
    :global(.emoji) {
        width: 1.3em;
        height: 1.3em;
        vertical-align: bottom;
    }
</style>