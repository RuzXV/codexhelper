<script>
    export let images = {};
    let healingSpeed = 90;
    let counts = {
        t4: { infantry: '', cavalry: '', archer: '', siege: '' }
    };
    function handleInput(e, type) {}
</script>

<div class="island-content">
    <div class="form-group" style="margin-bottom: 20px;">
        <label for="heal-speed">Healing Speed (%)</label>
        <input type="number" id="heal-speed" bind:value={healingSpeed}>
    </div>

    <div class="form-group">
        <span class="label-text-small">Tier 4 Healed</span>
        <div class="troop-grid t4-group">
            <div class="troop-item">
                <label>Infantry</label>
                <div class="img-placeholder">IMG</div> 
                <input type="text" placeholder="0" />
            </div>
            <div class="troop-item">
                <label>Cavalry</label>
                <div class="img-placeholder">IMG</div>
                <input type="text" placeholder="0" />
            </div>
        </div>
    </div>
</div>

<style>
    /* --- Phase 1 Styles (Keep these) --- */
    .island-content { padding: 10px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    label { color: #9ca3af; font-size: 0.9rem; }
    input { 
        width: 100%; background: #0f1115; border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px; padding: 8px; color: white; text-align: center;
    }

    /* --- Phase 2.1 Styles (Sanitized) --- */
    .label-text-small {
        display: block;
        color: #9ca3af;
        margin-bottom: 5px;
    }

    .troop-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
        position: relative;
        padding: 4px;
        border-radius: 12px;
        background: #1a1d21; 
    }

    /* THE FIX: Using explicit positioning instead of 'inset' */
    .troop-grid::after {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        content: ''; /* Moved content here */
        border-radius: inherit;
        pointer-events: none;
        opacity: 0.35;
        /* THE FIX: Flat color instead of gradient for now */
        background: #ca62e6;
    }

    .troop-item {
        background: #1f2937;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        position: relative;
        z-index: 1;
    }

    .img-placeholder {
        width: 32px; height: 32px; background: #333; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; font-size: 8px; color: #fff;
    }

    @media (max-width: 600px) {
        .troop-grid { grid-template-columns: repeat(2, 1fr); }
    }
</style>