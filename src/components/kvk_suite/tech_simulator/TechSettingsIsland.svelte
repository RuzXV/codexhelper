<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let selectedVersion: string;
    export let researchCenterLevel: number;
    export let includeRCCrystalCost: boolean;
    export let availableVersions: { id: string; name: string }[];
    export let ccReduction: number;
    export let versionIcon: ImageMetadata;
    export let researchCenterIcon: ImageMetadata;

    const dispatch = createEventDispatcher<{
        versionChange: { version: string };
        rcLevelChange: { level: number };
        rcCostToggle: { checked: boolean };
        scrollToTotalCrystals: void;
    }>();

    let isVersionDropdownOpen = false;
    let isRCDropdownOpen = false;

    function toggleVersionDropdown() {
        isVersionDropdownOpen = !isVersionDropdownOpen;
        isRCDropdownOpen = false;
    }

    function toggleRCDropdown() {
        isRCDropdownOpen = !isRCDropdownOpen;
        isVersionDropdownOpen = false;
    }

    function selectVersion(version: string) {
        dispatch('versionChange', { version });
        isVersionDropdownOpen = false;
    }

    function selectRCLevel(level: number) {
        dispatch('rcLevelChange', { level });
        isRCDropdownOpen = false;
    }

    function handleSettingsOutsideClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.settings-dropdown')) {
            isVersionDropdownOpen = false;
            isRCDropdownOpen = false;
        }
    }

    function handleToggle() {
        dispatch('rcCostToggle', { checked: !includeRCCrystalCost });
    }

    function handleScrollToTotalCrystals() {
        dispatch('scrollToTotalCrystals');
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="settings-island" on:click={handleSettingsOutsideClick}>
    <div class="settings-info">
        <p class="settings-info-text">
            Currently <strong>ALL</strong> KvK modes feature the "New" Crystal Tech changes (v5) including kingdoms entering
            KvK 4. When new, major crystal tech adjustments occur in-game, they are not always immediately accessible
            in every KvK mode, therefore please choose the version that matches your situation.
        </p>
    </div>
    <div class="settings-controls">
        <div class="settings-dropdown">
            <span class="settings-label">
                <img src={versionIcon.src} alt="Version" class="settings-icon" />
                <span>Crystal Tech Version</span>
            </span>
            <div class="custom-select-container">
                <button
                    class="select-trigger"
                    class:active={isVersionDropdownOpen}
                    on:click={toggleVersionDropdown}
                >
                    <span>{availableVersions.find((v) => v.id === selectedVersion)?.name || selectedVersion}</span>
                    <span class="select-arrow"></span>
                </button>
                {#if isVersionDropdownOpen}
                    <div class="select-dropdown">
                        {#each availableVersions as version}
                            <button
                                class="select-option"
                                class:selected={selectedVersion === version.id}
                                on:click={() => selectVersion(version.id)}
                            >
                                {version.name}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <div class="settings-dropdown">
            <span class="settings-label">
                <img src={researchCenterIcon.src} alt="Research Center" class="settings-icon" />
                <span>Research Center Level</span>
            </span>
            <div class="custom-select-container">
                <button class="select-trigger" class:active={isRCDropdownOpen} on:click={toggleRCDropdown}>
                    <span>Level {researchCenterLevel}</span>
                    <span class="select-arrow"></span>
                </button>
                {#if isRCDropdownOpen}
                    <div class="select-dropdown rc-dropdown">
                        {#each Array.from({ length: 25 }, (_, i) => i + 1) as level}
                            <button
                                class="select-option"
                                class:selected={researchCenterLevel === level}
                                on:click={() => selectRCLevel(level)}
                            >
                                Level {level}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <div class="settings-toggle vertical centered">
            <span class="settings-label rc-toggle-label">
                <span
                    >Include Research Center Crystal Cost <span
                        class="here-link"
                        on:click={handleScrollToTotalCrystals}
                        on:keydown={(e) => e.key === 'Enter' && handleScrollToTotalCrystals()}
                        role="button"
                        tabindex="0">Here</span
                    ></span
                >
            </span>
            <label class="toggle-switch modern small">
                <input type="checkbox" checked={includeRCCrystalCost} on:change={handleToggle} />
                <span class="toggle-slider"></span>
            </label>
        </div>
    </div>
</div>

<style>
    @import '../../../styles/tech-simulator-shared.css';
</style>
