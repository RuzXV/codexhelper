<script>
    export let images = {};
    let healingSpeed = 90;
    let resourceBuff = 10;
</script>

<div class="island-content">
    <div class="buff-inputs-grid">
        <div class="form-group">
            <label for="heal-speed">Healing Speed (%)</label>
            <input type="number" id="heal-speed" placeholder="90" bind:value={healingSpeed}>
        </div>

        <div class="form-group">
            <label for="res-buff">Cost Reduction (%)</label>
            <input type="number" id="res-buff" placeholder="10" bind:value={resourceBuff}>
        </div>
    </div>
</div>

<style>
    /* BASIC LAYOUT - If this loads, the CSS connection is working */
    .island-content {
        padding: 10px;
    }

    .buff-inputs-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-bottom: 20px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    label {
        color: #9ca3af; /* var(--text-secondary) */
        font-size: 0.9rem;
        font-weight: 500;
    }

    input {
        width: 100%;
        background: #0f1115; /* var(--bg-primary) */
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px;
        padding: 8px;
        color: white;
        text-align: center;
        font-size: 1rem;
    }

    input:focus {
        border-color: #3b82f6;
        outline: none;
    }
</style>