<script>
    import { fade, scale } from 'svelte/transition';
    export let displayName;
    export let embedColor;
    export let imageUrl;
    export let pairingGroups;
    export let isMainTemplate;
    export let emojiData;
    export let user;
    export let suffixLabel = '';
    export let buttons = [];

    const AUTHOR_ICON = 'https://i.postimg.cc/Jn4zn7sy/Kings-Codex-Logo-No-URL-No-Glow.png';
    const AUTHOR_NAME = "The King's Codex";
    const BOT_ICON =
        'https://cdn.discordapp.com/avatars/1289603576104091679/aaa1f4a186484a62377665c086a40f24.webp?size=80';
    const BOT_NAME = 'Codex Helper';
    const MAIN_FOOTER = 'Check out talents & gear recommendations by clicking the buttons below!';

    $: allEmojis = Array.isArray(emojiData)
        ? emojiData
        : [
              ...(emojiData.commanders || []),
              ...(emojiData.utility || []),
              ...(emojiData.accessories || []),
              ...(emojiData.formations || []),
              ...(emojiData.buttons || []),
          ];

    $: userAvatar = getUserAvatar(user);
    $: userName = user ? user.display_name || user.global_name || user.username : 'User';

    let lightboxImage = null;

    function openLightbox(url) {
        if (url) lightboxImage = url;
    }

    function closeLightbox() {
        lightboxImage = null;
    }

    function handleKeydown(e) {
        if (e.key === 'Escape') closeLightbox();
    }

    function getUserAvatar(user) {
        if (!user) return 'https://cdn.discordapp.com/embed/avatars/0.png';
        if (user.avatar) return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
        const index =
            user.discriminator && user.discriminator !== '0'
                ? parseInt(user.discriminator) % 5
                : Number((BigInt(user.id) >> 22n) % 6n);
        return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    }

    function getEmojiUrl(emojiId) {
        return `https://cdn.discordapp.com/emojis/${emojiId}.png`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function formatRowHtml(row) {
        const bulletEntry = allEmojis.find((e) => e.key === 'bullet_point');
        const bulletHtml = bulletEntry ? `<img src="${getEmojiUrl(bulletEntry.emoji)}" class="emoji bullet">` : '•';

        if (row.type === 'custom') {
            // Sanitize custom text: escape first, then convert Discord emoji syntax back to img tags
            const safeText = escapeHtml(row.customText).replace(
                /&lt;:([^:]+):(\d+)&gt;/g,
                '<img src="https://cdn.discordapp.com/emojis/$2.png" class="emoji inline" alt="$1">',
            );
            return `<div class="embed-line">${bulletHtml}<span class="content-text">${safeText}</span></div>`;
        }

        let html = `<div class="embed-line">${bulletHtml}`;
        if (row.cmd1) {
            const c1 = allEmojis.find((e) => e.key === row.cmd1);
            if (c1)
                html += `<span class="content-text">${c1.name}</span> <img src="${getEmojiUrl(c1.emoji)}" class="emoji inline">`;
            else html += `<span class="content-text">Unknown</span>`;
        }

        if (row.cmd2) {
            const c2 = allEmojis.find((e) => e.key === row.cmd2);
            if (c2)
                html += `<span class="separator">|</span><span class="content-text">${c2.name}</span> <img src="${getEmojiUrl(c2.emoji)}" class="emoji inline">`;
        }

        html += `</div>`;
        return html;
    }
</script>

<div class="discord-container">
    <div class="interaction-header">
        <img src={userAvatar} alt="User" class="user-avatar-mini" />
        <span class="username">{userName}</span>
        <span class="command-text">used <span class="command-name">/commander</span></span>
    </div>

    <div class="message-header">
        <img src={BOT_ICON} alt="Bot" class="bot-avatar" />
        <div class="header-info">
            <span class="bot-name">{BOT_NAME}</span>
            <span class="bot-tag"><span class="bot-tag-check">✔</span>APP</span>
            <span class="timestamp">Today at 10:30 AM</span>
        </div>
    </div>

    <div class="embed-wrapper" style="border-left-color: {embedColor};">
        <div class="embed-grid">
            {#if isMainTemplate}
                <div class="embed-author">
                    <img src={AUTHOR_ICON} alt="Author" class="author-icon" />
                    <span>{AUTHOR_NAME}</span>
                </div>
            {/if}

            {#if displayName}
                <div class="embed-title">
                    {displayName}{!isMainTemplate && suffixLabel ? ' ' + suffixLabel : ''}
                </div>
            {/if}

            {#if pairingGroups && pairingGroups.length > 0}
                <div class="embed-fields">
                    {#each pairingGroups as group}
                        <div class="embed-field">
                            <div class="field-name"><code>{group.title}</code></div>
                            <div class="field-value">
                                {#each group.rows as row}
                                    {@html formatRowHtml(row)}
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}

            {#if imageUrl}
                <button
                    type="button"
                    on:click={() => openLightbox(imageUrl)}
                    style="background: none; border: none; padding: 0; cursor: zoom-in; display: block; max-width: 100%;"
                >
                    <img
                        src={imageUrl}
                        alt="Embed Content"
                        class="clickable-image"
                        style="display: block; max-width: 100%; border-radius: 4px;"
                    />
                </button>
            {/if}

            {#if isMainTemplate}
                <div class="embed-footer">
                    <img src={AUTHOR_ICON} alt="Footer Icon" class="footer-icon" />
                    <span>{MAIN_FOOTER}</span>
                </div>
            {/if}
        </div>
    </div>

    <div class="component-row">
        {#if isMainTemplate}
            {#each buttons as btn}
                <div class="discord-btn">
                    {#if btn.emoji}
                        <img src={`https://cdn.discordapp.com/emojis/${btn.emoji.id}.png`} alt="" class="btn-emoji" />
                    {/if}
                    {btn.label}
                </div>
            {/each}
        {/if}
    </div>
</div>

{#if lightboxImage}
    <div
        class="lightbox-overlay"
        role="button"
        tabindex="0"
        on:click={closeLightbox}
        on:keydown={(e) => e.key === 'Escape' && closeLightbox()}
        transition:fade={{ duration: 200 }}
    >
        <button class="lightbox-close" aria-label="Close Lightbox" on:click={closeLightbox}>
            <i class="fas fa-times"></i>
        </button>
        <img src={lightboxImage} alt="Fullscreen" class="lightbox-img" />
    </div>
{/if}

<svelte:window on:keydown={handleKeydown} />

<style>
    .discord-container {
        font-family: 'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        padding: 16px;
        background-color: #313338;
        color: #dcddde;
        border-radius: 8px;
    }
    .interaction-header {
        display: flex;
        align-items: center;
        font-size: 0.85rem;
        color: #949ba4;
        margin-bottom: 2px;
        gap: 5px;
        position: relative;
        left: 16px;
    }
    .interaction-header::before {
        content: '';
        position: absolute;
        top: 14px;
        left: -11px;
        width: 24px;
        height: 12px;
        border-top: 2px solid #4e5058;
        border-left: 2px solid #4e5058;
        border-top-left-radius: 6px;
        margin-top: -3px;
    }
    .user-avatar-mini {
        width: 16px;
        height: 16px;
        border-radius: 50%;
    }
    .username {
        font-weight: 600;
        color: #f2f3f5;
        cursor: pointer;
    }
    .command-text {
        margin-left: 2px;
    }
    .command-name {
        color: #5865f2;
        background: rgba(88, 101, 242, 0.1);
        font-weight: 500;
        padding: 0 2px;
        border-radius: 3px;
        cursor: pointer;
    }
    .command-name:hover {
        background: #5865f2;
        color: #fff;
    }
    .message-header {
        display: flex;
        align-items: center;
        margin-top: 4px;
        margin-bottom: 4px;
        position: relative;
    }
    .bot-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 12px;
        cursor: pointer;
    }
    .bot-avatar:hover {
        opacity: 0.8;
    }
    .header-info {
        display: flex;
        align-items: center;
    }
    .bot-name {
        font-weight: 500;
        color: #f2f3f5;
        margin-right: 4px;
        cursor: pointer;
        font-size: 1rem;
    }
    .bot-name:hover {
        text-decoration: underline;
    }
    .bot-tag {
        background: #5865f2;
        color: #fff;
        font-size: 0.625rem;
        padding: 0 4px;
        border-radius: 3px;
        margin-right: 8px;
        line-height: 1.3;
        display: flex;
        align-items: center;
        height: 15px;
        vertical-align: middle;
        margin-top: 1px;
    }
    .bot-tag-check {
        font-size: 0.6rem;
        margin-right: 2px;
    }
    .timestamp {
        font-size: 0.75rem;
        color: #949ba4;
        margin-left: 4px;
    }
    .embed-wrapper {
        border-left-style: solid;
        border-left-width: 4px;
        background: #2b2d31;
        border-radius: 4px;
        padding: 12px 16px;
        max-width: 520px;
        display: flex;
        margin-left: 52px;
        margin-top: -6px;
    }
    .embed-grid {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .embed-author {
        display: flex;
        align-items: center;
        font-size: 0.875rem;
        font-weight: 600;
        color: #f2f3f5;
        gap: 8px;
        margin-bottom: 2px;
    }
    .author-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
    }
    .embed-title {
        font-size: 1rem;
        font-weight: 700;
        color: #f2f3f5;
        margin-bottom: 2px;
        line-height: 1.375rem;
    }
    .embed-fields {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .embed-field {
        margin-bottom: 0;
    }
    .field-name {
        font-weight: 700;
        font-size: 0.875rem;
        color: #f2f3f5;
        margin-bottom: 4px;
    }
    .field-name code {
        background-color: #1e1f22;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
        font-weight: 600;
        color: #dbdee1;
    }
    .field-value {
        font-size: 0.875rem;
        color: #dcddde;
        line-height: 1.375rem;
        white-space: pre-wrap;
        font-weight: 400;
    }
    :global(.embed-line) {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 2px;
    }
    :global(.emoji) {
        width: 1.35em;
        height: 1.35em;
        vertical-align: text-bottom;
        object-fit: contain;
    }
    :global(.emoji.bullet) {
        width: 1.1em;
        height: 1.1em;
        margin-right: 0;
    }
    :global(.separator) {
        font-weight: bold;
        margin: 0 4px;
        color: #dcddde;
    }
    :global(.content-text) {
        display: inline-block;
        color: #dcddde;
    }
    .embed-footer {
        font-size: 0.75rem;
        color: #dcddde;
        display: flex;
        align-items: center;
        margin-top: 8px;
        gap: 6px;
        font-weight: 500;
    }
    .footer-icon {
        width: 20px;
        height: 20px;
        border-radius: 50%;
    }
    .component-row {
        margin-left: 52px;
        margin-top: 8px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    .discord-btn {
        background-color: #43464d;
        color: #f2f3f5;
        padding: 4px 16px;
        border-radius: 3px;
        font-size: 0.875rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: not-allowed;
        height: 32px;
        transition: background-color 0.17s ease;
    }
    .discord-btn:hover {
        background-color: #4f545c;
    }
    .btn-emoji {
        width: 18px;
        height: 18px;
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
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
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
    .lightbox-close:hover {
        opacity: 1;
    }
</style>
