<script lang="ts">
    import '../../../styles/kvk-timer-shared.css';
    import {
        formatDateUTC,
        formatDateLocal,
        formatRelative,
        parseHP,
        formatHPInput,
    } from '../../../lib/kvk-timers/timerUtils';

    export let tick: number;

    // ── State ──
    let healCurrentHP: string = '';
    let healMaxHP: string = '';

    type HealResult = {
        healUTC: string;
        healLocal: Date;
    } | null;

    let healResult: HealResult = null;
    let healError: string = '';

    // ── Calculation ──
    function calculateHeal() {
        healError = '';
        healResult = null;

        const currentHP = parseHP(healCurrentHP);
        const maxHP = parseHP(healMaxHP);

        if (isNaN(currentHP) || isNaN(maxHP)) {
            healError = 'Please enter valid HP values.';
            return;
        }
        if (currentHP < 0 || maxHP < 0) {
            healError = 'HP values cannot be negative.';
            return;
        }
        if (maxHP < currentHP) {
            healError = 'Max HP must be greater than or equal to current HP.';
            return;
        }

        const hpNeeded = maxHP - currentHP;
        const secondsNeeded = hpNeeded * 2; // 0.5 HP per second = 2 seconds per HP

        const now = new Date();
        const healingTime = new Date(now.getTime() + secondsNeeded * 1000);

        healResult = {
            healUTC: formatDateUTC(healingTime),
            healLocal: healingTime,
        };
    }

    function clearHeal() {
        healResult = null;
        healError = '';
        healCurrentHP = '';
        healMaxHP = '';
    }
</script>

<div class="timer-panel">
    <div class="panel-header">
        <i class="fas fa-heart-pulse panel-icon heal"></i>
        <div>
            <h3>Structure Heal Timer</h3>
            <p>Calculate when a structure will be fully healed.</p>
        </div>
    </div>

    <div class="input-grid">
        <div class="input-group">
            <label for="heal-current">Current HP</label>
            <input
                id="heal-current"
                type="text"
                inputmode="numeric"
                bind:value={healCurrentHP}
                placeholder="Example: 10,000"
                on:input={() => {
                    healCurrentHP = formatHPInput(healCurrentHP);
                }}
            />
        </div>
        <div class="input-group">
            <label for="heal-max">Max HP</label>
            <input
                id="heal-max"
                type="text"
                inputmode="numeric"
                bind:value={healMaxHP}
                placeholder="Example: 50,000"
                on:input={() => {
                    healMaxHP = formatHPInput(healMaxHP);
                }}
            />
        </div>
    </div>

    <div class="action-row">
        <button class="btn-calculate" on:click={calculateHeal}>
            <span>Calculate</span>
        </button>
        {#if healResult || healError}
            <button class="btn-clear" on:click={clearHeal}>
                <i class="fas fa-times"></i> Clear
            </button>
        {/if}
    </div>

    {#if healError}
        <div class="result-card error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{healError}</span>
        </div>
    {/if}

    {#if healResult}
        <div class="result-card">
            <div class="result-title">
                <i class="fas fa-heart-pulse heal-icon"></i>
                Structure Heal Status
            </div>
            <div class="result-section">
                <div class="result-label">The structure will be <strong>fully healed</strong> at:</div>
                <div class="time-rows">
                    <div class="time-row">
                        <span class="time-tag">UTC</span><span class="time-value">{healResult.healUTC}</span>
                    </div>
                    <div class="time-row">
                        <span class="time-tag">Local</span><span class="time-value"
                            >{formatDateLocal(healResult.healLocal)}</span
                        >
                    </div>
                    <div class="time-row">
                        <span class="time-tag">Relative</span><span class="time-value relative"
                            >{(void tick, formatRelative(healResult.healLocal))}</span
                        >
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
