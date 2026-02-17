<script>
    import { createEventDispatcher } from 'svelte';
    import { fly } from 'svelte/transition';

    const dispatch = createEventDispatcher();

    export let hasUnsavedChanges = false;
    export let saving = false;
    export let message = 'You have unsaved changes.';
    export let saveLabel = 'Save Changes';
</script>

{#if hasUnsavedChanges}
    <div class="save-bar" transition:fly={{ y: 50, duration: 300 }}>
        <div class="save-bar-content">
            <span>{message}</span>
            <div class="save-actions">
                <button class="btn-discard" on:click={() => dispatch('discard')} disabled={saving}>Discard</button>
                <button class="btn-save" on:click={() => dispatch('save')} disabled={saving}>
                    {#if saving}<i class="fas fa-spinner fa-spin"></i>{:else}{saveLabel}{/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .save-bar {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        padding: 12px 24px;
        border-radius: 50px;
        box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        min-width: 350px;
    }
    .save-bar-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
    }
    .save-actions {
        display: flex;
        gap: 10px;
    }
    .btn-save {
        background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
        color: white;
        border: 2px solid #60a5fa;
        padding: 8px 24px;
        border-radius: 20px;
        font-weight: 600;
        cursor: pointer;
    }
    .btn-discard {
        background: transparent;
        color: #ef4444;
        border: 2px solid #ef4444;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        cursor: pointer;
    }

    @media (max-width: 768px) {
        .save-bar {
            width: 90%;
            bottom: 10px;
            border-radius: 12px;
        }
        .save-bar-content {
            flex-direction: column;
        }
    }
</style>
