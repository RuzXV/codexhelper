<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Technology } from '../../../lib/tech-simulator/techRequirements';

    export let slot: string;
    export let col: number;
    export let row: number;
    export let positionX: number;
    export let positionY: number;
    export let techKey: string | null;
    export let technology: Technology | null;
    export let currentLevel: number;
    export let maxLevel: number;
    export let highlighted: boolean;
    export let techIcon: ImageMetadata | null;
    export let textSizeClass: string;
    export let showTooltip: boolean;
    export let isTooltipTarget: boolean;

    const dispatch = createEventDispatcher<{
        techClick: { techKey: string };
        infoClick: { node: { slot: string; col: number; row: number; position: { x: number; y: number }; techKey: string | null; technology: Technology | null }; event: MouseEvent };
    }>();

    $: progress = (currentLevel / maxLevel) * 100;
    $: isMaxed = currentLevel >= maxLevel;

    function handleClick(e: MouseEvent) {
        if (techKey && !(e.target as HTMLElement).closest('.info-btn')) {
            dispatch('techClick', { techKey });
        }
    }

    function handleInfoClick(e: MouseEvent) {
        e.stopPropagation();
        if (!technology) return;
        dispatch('infoClick', {
            node: { slot, col, row, position: { x: positionX, y: positionY }, techKey, technology },
            event: e,
        });
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="tech-node"
    class:placeholder-tile={!techKey}
    class:unlocked={technology && currentLevel > 0}
    class:locked={!technology || currentLevel === 0}
    class:maxed={isMaxed}
    class:highlighted={highlighted}
    style="left: {positionX}px; top: {positionY}px;"
    data-slot={slot}
    data-col={col}
    data-row={row}
    on:click={handleClick}
    role="button"
    tabindex={techKey ? 0 : -1}
>
    <div class="tech-icon-frame">
        {#if techIcon}
            <img
                src={techIcon.src}
                alt={technology?.name || ''}
                class="tech-icon-img"
                width="64"
                height="64"
                loading="lazy"
            />
        {:else}
            <div class="tech-icon placeholder">
                <span class="icon-placeholder"
                    >{technology ? technology.name.charAt(0) : col}</span
                >
            </div>
        {/if}
    </div>
    <div class="tech-info">
        <span class="tech-name {textSizeClass}"
            >{technology?.name || slot}</span
        >
        <div class="tech-level" style="--progress: {progress}%">
            <span>{currentLevel}/{maxLevel}</span>
        </div>
    </div>
    {#if technology}
        <button
            class="info-btn"
            class:active={isTooltipTarget && showTooltip}
            on:click={handleInfoClick}
            aria-label="Show tech details"
        >
            <i class="fas fa-info"></i>
        </button>
    {/if}
</div>

<style>
    /* ================================================
       TECHNOLOGY NODE TILES
       ================================================ */

    .tech-node {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 8px;
        width: 230px;
        height: 80px;
        border-radius: 4px;
        padding: 8px;
        cursor: pointer;
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        background: radial-gradient(circle at 38% 50%, #d2f7fd 0%, #6bc9f0 70%);
        border: 2px solid #9fc2da;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 3px 6px rgba(0, 0, 0, 0.25);
        font-family: 'NotoSansHans', sans-serif;
        text-align: left;
        overflow: visible;
        user-select: none;
        -webkit-user-select: none;
    }

    .tech-node:hover {
        transform: translateY(-2px);
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 4px 8px rgba(0, 0, 0, 0.25);
        z-index: 10;
    }

    .tech-node.highlighted {
        animation: highlight-glow 2s ease-out;
        z-index: 100;
    }

    @keyframes highlight-glow {
        0% {
            border-color: transparent;
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                0 0 0 0 transparent,
                0 3px 6px rgba(0, 0, 0, 0.25);
        }
        20% {
            border-color: #4ade80;
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                0 0 25px 5px #4ade80,
                0 3px 6px rgba(0, 0, 0, 0.25);
        }
        100% {
            border-color: transparent;
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                0 0 25px 5px transparent,
                0 3px 6px rgba(0, 0, 0, 0.25);
        }
    }

    .tech-node.placeholder-tile {
        background: radial-gradient(circle at 30% 50%, #5a7a8a 0%, #3a5a6a 70%);
        border-color: #5a7b8c;
        opacity: 0.6;
    }

    .tech-node.placeholder-tile .tech-name {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.5rem;
    }

    .tech-node.placeholder-tile .icon-placeholder {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
    }

    .tech-node.placeholder-tile .tech-icon-frame {
        background: linear-gradient(to bottom, #5a7b8c, #4a6b7c);
        border-color: #6a8b9c;
    }

    .tech-node.maxed {
        border-color: #7ab8d6;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 0 6px rgba(100, 180, 220, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.15);
    }

    /* ================================================
       ICON CONTAINER
       ================================================ */

    .tech-icon-frame {
        width: 72px;
        height: 72px;
        border-radius: 8px;
        flex-shrink: 0;
        overflow: hidden;
    }

    .tech-icon {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .tech-icon.placeholder {
        background: rgba(0, 0, 0, 0.1);
    }

    .tech-icon-img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }

    .icon-placeholder {
        font-size: 1.5rem;
        font-weight: 700;
        color: rgba(44, 79, 102, 0.5);
    }

    .tech-node.unlocked .icon-placeholder,
    .tech-node.maxed .icon-placeholder {
        color: #8b6914;
    }

    /* ================================================
       TECHNOLOGY INFO
       ================================================ */

    .tech-info {
        display: flex;
        flex-direction: column;
        padding: 2px 6px 2px 10px;
        flex: 1;
        min-width: 0;
    }

    .tech-name {
        font-size: 0.95rem;
        font-weight: 900;
        font-family: 'NotoSansHans', sans-serif;
        color: #255273;
        line-height: 1.2;
        margin-bottom: 6px;
        white-space: normal;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    .tech-name.text-sm {
        font-size: 0.8rem;
    }

    .tech-name.text-xs {
        font-size: 0.7rem;
    }

    /* ================================================
       PROGRESS BAR
       ================================================ */

    .tech-level {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 16px;
        width: 100%;
        max-width: 85px;
        border-radius: 8px;
        overflow: hidden;
        background: #afc3d2;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .tech-level::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: var(--progress, 0%);
        border-radius: 7px;
        background: linear-gradient(to top, #014e80, #007cb0);
        box-shadow: 0 0 4px rgba(0, 124, 176, 0.4);
        transition: width 0.3s ease;
    }

    .tech-level span {
        position: relative;
        z-index: 1;
        font-size: 0.7rem;
        font-weight: 900;
        font-family: 'NotoSansHans', sans-serif;
        color: #ffffff;
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
    }

    .tech-node.locked .tech-level {
        background: #7a8d9e;
    }

    .tech-node.locked .tech-level::before {
        background: linear-gradient(to top, #4a5a66, #5a6a76);
        box-shadow: none;
    }

    /* ================================================
       INFO BUTTON
       ================================================ */

    .info-btn {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
        min-height: 28px !important;
        max-width: 28px !important;
        max-height: 28px !important;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(74, 222, 128, 0.9) 0%, rgba(34, 170, 90, 0.9) 100%);
        border: 2px solid rgba(255, 255, 255, 0.4);
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 5;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        padding: 0;
        font-size: 14px !important;
        line-height: 1;
    }

    .info-btn:hover {
        transform: scale(1.15);
        background: linear-gradient(135deg, rgba(100, 240, 160, 1) 0%, rgba(50, 200, 110, 1) 100%);
        box-shadow: 0 2px 4px rgba(74, 222, 128, 0.4);
    }

    .info-btn.active {
        background: linear-gradient(135deg, rgba(255, 200, 100, 1) 0%, rgba(220, 160, 60, 1) 100%);
        border-color: rgba(255, 255, 255, 0.4);
        transform: scale(1.1);
    }

    .info-btn :global(i) {
        font-size: 14px !important;
        line-height: 1;
    }

    /* ================================================
       MOBILE RESPONSIVE
       ================================================ */

    @media (max-width: 768px) {
        .tech-node {
            width: 190px;
            height: 70px;
            padding: 6px;
        }

        .tech-icon-frame {
            width: 56px;
            height: 56px;
        }

        .tech-icon {
            width: 46px;
            height: 46px;
        }

        .icon-placeholder {
            font-size: 1.2rem;
        }

        .tech-name {
            font-size: 0.75rem;
        }

        .tech-level {
            height: 16px;
            max-width: 85px;
        }

        .tech-level span {
            font-size: 0.7rem;
        }
    }

    @media (max-width: 480px) {
        .tech-node {
            width: 170px;
            height: 60px;
            padding: 5px;
        }

        .tech-icon-frame {
            width: 48px;
            height: 48px;
        }

        .tech-icon {
            width: 40px;
            height: 40px;
        }

        .tech-name {
            font-size: 0.65rem;
        }

        .tech-level {
            height: 14px;
            max-width: 75px;
        }

        .tech-level span {
            font-size: 0.6rem;
        }
    }
</style>
