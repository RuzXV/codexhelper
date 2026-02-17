<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { SimulatorMessage } from '../../../lib/tech-simulator/techRequirements';

    export let message: SimulatorMessage | null;

    const dispatch = createEventDispatcher<{
        navigateToTech: { techKey: string };
        clearMessage: void;
    }>();

    function handleNavigate(techKey: string) {
        dispatch('navigateToTech', { techKey });
        dispatch('clearMessage');
    }

    function handleClose() {
        dispatch('clearMessage');
    }
</script>

{#if message}
    <div
        class="simulator-message"
        class:error={message.type === 'error'}
        class:warning={message.type === 'warning'}
    >
        <div class="message-content">
            <i
                class="fas {message.type === 'error'
                    ? 'fa-exclamation-circle'
                    : 'fa-exclamation-triangle'}"
            ></i>
            <span class="message-text">
                {#if message.multiTechLinks && message.multiTechLinks.length > 0}
                    {#if message.text}{message.text}
                    {/if}{message.prefix}
                    {#each message.multiTechLinks as link, i}<span
                            class="message-tech-link"
                            on:click={() => handleNavigate(link.techKey)}
                            on:keydown={(e) => {
                                if (e.key === 'Enter') handleNavigate(link.techKey);
                            }}
                            role="button"
                            tabindex="0">{link.techName}</span
                        >{#if i < (message.multiTechLinks?.length || 0) - 1},&nbsp;{/if}{/each}
                    <span class="req-arrow">-></span>
                    <span class="req-tech-level">Lvl {message.requiredLevel}</span>
                {:else if message.techLink}
                    Requires <span
                        class="message-tech-link"
                        on:click={() => {
                            if (message?.techLink) handleNavigate(message.techLink.techKey);
                        }}
                        on:keydown={(e) => {
                            if (e.key === 'Enter' && message?.techLink) handleNavigate(message.techLink.techKey);
                        }}
                        role="button"
                        tabindex="0">{message.techLink.techName}</span
                    > <span class="req-arrow">-></span>
                    <span class="req-tech-level">Lvl {message.techLink.requiredLevel}</span>
                    to {message.type === 'warning' ? 'finish' : 'continue'}.
                {:else if message.rcRequirement}
                    Requires <span class="rc-req-name">Research Center</span> <span class="req-arrow">-></span>
                    <span class="req-tech-level">Lvl {message.rcRequirement}</span>
                    to {message.type === 'warning' ? 'finish' : 'continue'}.
                {:else}
                    {message.text}
                {/if}
            </span>
            <button class="message-close" on:click={handleClose} aria-label="Close message">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>
{/if}

<style>
    @import '../../../styles/tech-simulator-shared.css';
</style>
