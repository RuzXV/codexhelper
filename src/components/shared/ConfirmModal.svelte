<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';

    const dispatch = createEventDispatcher();

    export let show = false;
    export let title = 'Are you sure?';
    export let message = 'This action cannot be undone.';
    export let confirmText = 'Confirm';
    export let cancelText = 'Cancel';
    export let confirmClass = 'danger';
    export let icon = 'fa-exclamation-triangle';
</script>

{#if show}
    <div class="modal-overlay" transition:fade={{ duration: 150 }} on:click={() => dispatch('cancel')}>
        <div
            class="modal-card"
            transition:scale={{ start: 0.95, duration: 200 }}
            on:click|stopPropagation
        >
            {#if icon}
                <div class="modal-icon" class:danger={confirmClass === 'danger'} class:warning={confirmClass === 'warning'}>
                    <i class="fas {icon}"></i>
                </div>
            {/if}
            <h3 class="modal-title">{title}</h3>
            <p class="modal-message">{message}</p>
            <div class="modal-actions">
                <button class="btn-cancel" on:click={() => dispatch('cancel')}>{cancelText}</button>
                <button
                    class="btn-confirm"
                    class:danger={confirmClass === 'danger'}
                    class:warning={confirmClass === 'warning'}
                    on:click={() => dispatch('confirm')}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        backdrop-filter: blur(4px);
    }
    .modal-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 28px;
        max-width: 400px;
        width: 90%;
        text-align: center;
    }
    .modal-icon {
        font-size: 2rem;
        margin-bottom: 12px;
    }
    .modal-icon.danger {
        color: #ef4444;
    }
    .modal-icon.warning {
        color: #f59e0b;
    }
    .modal-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 8px;
    }
    .modal-message {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        line-height: 1.5;
        margin-bottom: 20px;
    }
    .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
    }
    .btn-cancel {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        padding: 8px 20px;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-cancel:hover {
        color: var(--text-primary);
        border-color: var(--border-hover);
    }
    .btn-confirm {
        padding: 8px 20px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
    }
    .btn-confirm.danger {
        background: #ef4444;
        color: white;
    }
    .btn-confirm.danger:hover {
        background: #dc2626;
    }
    .btn-confirm.warning {
        background: #f59e0b;
        color: white;
    }
    .btn-confirm.warning:hover {
        background: #d97706;
    }
</style>
