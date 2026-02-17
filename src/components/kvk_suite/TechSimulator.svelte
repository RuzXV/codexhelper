<script lang="ts">
    import { onMount } from 'svelte';
    import techTreeData from '../../data/crystalTechTree.json';

    // Import sub-components
    import TechSettingsIsland from './tech_simulator/TechSettingsIsland.svelte';
    import TechModeSelector from './tech_simulator/TechModeSelector.svelte';
    import TechNode from './tech_simulator/TechNode.svelte';
    import TechTooltip from './tech_simulator/TechTooltip.svelte';
    import TechFooter from './tech_simulator/TechFooter.svelte';
    import TechMessage from './tech_simulator/TechMessage.svelte';

    // Import TS modules
    import { buildTechIconsMap, getTechIcon, getTextSizeClass } from '../../lib/tech-simulator/techIcons';
    import {
        NODE_WIDTH, NODE_HEIGHT, H_GAP, LINE_SPACING,
        PADDING_LEFT, PADDING_TOP, PADDING_BOTTOM,
        generatedPositions, techAssignments, techPositions,
        connections, passThroughConnections, slotPositionMap,
        canvasWidth, canvasHeight, categoryColors,
    } from '../../lib/tech-simulator/techLayout';
    import type { Technology, TechLevel, PlaceholderNode, SimulatorMessage } from '../../lib/tech-simulator/techRequirements';
    import {
        buildLinePrerequisites, linePrerequisites,
        checkLinePrerequisites, checkPrerequisites,
        canUpgradeToLevel, findMaxUpgradeableLevel,
        checkRemovalDependencies, getRCCostReduction,
        getTotalRCCrystalCost, meetsRCRequirement,
    } from '../../lib/tech-simulator/techRequirements';
    import {
        getCuttingCornersReduction, getReducedCost,
        getCostReductionAtLevel, calculateActualCrystalCostFromHistory,
        parseTimeToSeconds, formatSpeedups, formatNumber,
    } from '../../lib/tech-simulator/techCosts';
    import type { ResearchOrderEntry } from '../../lib/tech-simulator/techCosts';

    // Import tech icons (Vite asset imports MUST stay in parent)
    import iconQuenchedBladesI from '../../assets/images/kvk_suite/tech_icons/Quenched Blades I.webp';
    import iconQuenchedBladesII from '../../assets/images/kvk_suite/tech_icons/Quenched Blades II.webp';
    import iconSwiftMarchingI from '../../assets/images/kvk_suite/tech_icons/Swift Marching I.webp';
    import iconSwiftMarchingII from '../../assets/images/kvk_suite/tech_icons/Swift Marching II.webp';
    import iconSwiftMarchingIII from '../../assets/images/kvk_suite/tech_icons/Swift Marching III.webp';
    import iconImprovedBowsI from '../../assets/images/kvk_suite/tech_icons/Improved Bows I.webp';
    import iconImprovedBowsII from '../../assets/images/kvk_suite/tech_icons/Improved Bows II.webp';
    import iconFleetOfFootI from '../../assets/images/kvk_suite/tech_icons/Fleet of Foot I.webp';
    import iconFleetOfFootII from '../../assets/images/kvk_suite/tech_icons/Fleet of Foot II.webp';
    import iconFleetOfFootIII from '../../assets/images/kvk_suite/tech_icons/Fleet of Foot III.webp';
    import iconMountedCombatTechniquesI from '../../assets/images/kvk_suite/tech_icons/Mounted Combat Techniques I.webp';
    import iconMountedCombatTechniquesII from '../../assets/images/kvk_suite/tech_icons/Mounted Combat Techniques II.webp';
    import iconSwiftSteedsI from '../../assets/images/kvk_suite/tech_icons/Swift Steeds I.webp';
    import iconSwiftSteedsII from '../../assets/images/kvk_suite/tech_icons/Swift Steeds II.webp';
    import iconSwiftSteedsIII from '../../assets/images/kvk_suite/tech_icons/Swift Steeds III.webp';
    import iconImprovedProjectilesI from '../../assets/images/kvk_suite/tech_icons/Improved Projectiles I.webp';
    import iconImprovedProjectilesII from '../../assets/images/kvk_suite/tech_icons/Improved Projectiles II.webp';
    import iconReinforcedAxlesI from '../../assets/images/kvk_suite/tech_icons/Reinforced Axles I.webp';
    import iconReinforcedAxlesII from '../../assets/images/kvk_suite/tech_icons/Reinforced Axles II.webp';
    import iconReinforcedAxlesIII from '../../assets/images/kvk_suite/tech_icons/Reinforced Axles III.webp';
    import iconCallToArmsI from '../../assets/images/kvk_suite/tech_icons/Call To Arms I.webp';
    import iconCallToArmsII from '../../assets/images/kvk_suite/tech_icons/Call To Arms II.webp';
    import iconCuttingCornersI from '../../assets/images/kvk_suite/tech_icons/Cutting Corners I.webp';
    import iconCuttingCornersII from '../../assets/images/kvk_suite/tech_icons/Cutting Corners II.webp';
    import iconLeadershipI from '../../assets/images/kvk_suite/tech_icons/Leadership I.webp';
    import iconLeadershipII from '../../assets/images/kvk_suite/tech_icons/Leadership II.webp';
    import iconCulturalExchange from '../../assets/images/kvk_suite/tech_icons/Cultural Exchange.webp';
    import iconBarbarianBounties from '../../assets/images/kvk_suite/tech_icons/Barbarian Bounties.webp';
    import iconKarakuReports from '../../assets/images/kvk_suite/tech_icons/Karaku Reports.webp';
    import iconStarmetalShields from '../../assets/images/kvk_suite/tech_icons/Starmetal Shields.webp';
    import iconStarmetalBracers from '../../assets/images/kvk_suite/tech_icons/Starmetal Bracers.webp';
    import iconStarmetalHarnesses from '../../assets/images/kvk_suite/tech_icons/Starmetal Barding.webp';
    import iconStarmetalAxles from '../../assets/images/kvk_suite/tech_icons/Starmetal Axles.webp';
    import iconLargerCamps from '../../assets/images/kvk_suite/tech_icons/Larger Camps.webp';
    import iconSpecialConcoctionsI from '../../assets/images/kvk_suite/tech_icons/Special Concoctions I.webp';
    import iconSpecialConcoctionsII from '../../assets/images/kvk_suite/tech_icons/Special Concoctions II.webp';
    import iconRunecraft from '../../assets/images/kvk_suite/tech_icons/Runecraft.webp';
    import iconEmergencySupport from '../../assets/images/kvk_suite/tech_icons/Emergency Support.webp';
    import iconExpandedFormationI from '../../assets/images/kvk_suite/tech_icons/Expanded Formation I.webp';
    import iconExpandedFormationII from '../../assets/images/kvk_suite/tech_icons/Expanded Formation II.webp';
    import iconRapidRetreat from '../../assets/images/kvk_suite/tech_icons/Rapid Retreat.webp';
    import iconIronInfantry from '../../assets/images/kvk_suite/tech_icons/Iron Infantry.webp';
    import iconArchersFocus from "../../assets/images/kvk_suite/tech_icons/Archer's Focus.webp";
    import iconRidersResilience from "../../assets/images/kvk_suite/tech_icons/Rider's Resilience.webp";
    import iconSiegeProvisions from '../../assets/images/kvk_suite/tech_icons/Siege Provisions.webp';
    import iconCelestialGuidance from '../../assets/images/kvk_suite/tech_icons/Celestial Guidance.webp';
    import iconInfantryExpert from '../../assets/images/kvk_suite/tech_icons/Infantry Expert.webp';
    import iconArcherExpert from '../../assets/images/kvk_suite/tech_icons/Archer Expert.webp';
    import iconCavalryExpert from '../../assets/images/kvk_suite/tech_icons/Cavalry Expert.webp';
    import iconSiegeExpert from '../../assets/images/kvk_suite/tech_icons/Siege Expert.webp';
    import iconSurpriseStrike from '../../assets/images/kvk_suite/tech_icons/Surprise Strike.webp';

    // Import counter/settings icons
    import crystalIcon from '../../assets/images/kvk_suite/crystal.webp';
    import researchSpeedupIcon from '../../assets/images/kvk_suite/research_speedup.webp';
    import seasonCoinIcon from '../../assets/images/kvk_suite/season_coin.webp';
    import versionIcon from '../../assets/images/kvk_suite/version.webp';
    import researchCenterIcon from '../../assets/images/kvk_suite/research_center.webp';

    // Build tech icons map from Vite imports
    const techIcons = buildTechIconsMap({
        iconQuenchedBladesI, iconQuenchedBladesII,
        iconSwiftMarchingI, iconSwiftMarchingII, iconSwiftMarchingIII,
        iconImprovedBowsI, iconImprovedBowsII,
        iconFleetOfFootI, iconFleetOfFootII, iconFleetOfFootIII,
        iconMountedCombatTechniquesI, iconMountedCombatTechniquesII,
        iconSwiftSteedsI, iconSwiftSteedsII, iconSwiftSteedsIII,
        iconImprovedProjectilesI, iconImprovedProjectilesII,
        iconReinforcedAxlesI, iconReinforcedAxlesII, iconReinforcedAxlesIII,
        iconCallToArmsI, iconCallToArmsII,
        iconCuttingCornersI, iconCuttingCornersII,
        iconLeadershipI, iconLeadershipII,
        iconCulturalExchange, iconBarbarianBounties, iconKarakuReports,
        iconStarmetalShields, iconStarmetalBracers, iconStarmetalHarnesses, iconStarmetalAxles,
        iconLargerCamps,
        iconSpecialConcoctionsI, iconSpecialConcoctionsII,
        iconRunecraft, iconEmergencySupport,
        iconExpandedFormationI, iconExpandedFormationII,
        iconRapidRetreat, iconIronInfantry, iconArchersFocus,
        iconRidersResilience, iconSiegeProvisions, iconCelestialGuidance,
        iconInfantryExpert, iconArcherExpert, iconCavalryExpert, iconSiegeExpert,
        iconSurpriseStrike,
    });

    // Storage cache key for saving/loading progress
    const TECH_SIMULATOR_CACHE_KEY = 'crystalTechSimulatorState';

    // Type for the window with our custom functions
    interface WindowWithStorage extends Window {
        saveUserData?: (key: string, data: unknown) => void;
        loadUserData?: (key: string) => {
            userTechLevels?: Record<string, number>;
            researchCenterLevel?: number;
            selectedVersion?: string;
            researchOrder?: ResearchOrderEntry[];
            includeRCCrystalCost?: boolean;
            helpsPerResearch?: number;
            researchSpeedBonus?: number;
        } | null;
    }

    // Get all techs for lookup
    const allTechs: Record<string, Technology> = techTreeData.technologies as Record<string, Technology>;

    // Available versions
    const availableVersions = [{ id: 'v5', name: 'Version 5 (Current)' }];

    // ============================================================
    // STATE
    // ============================================================

    let userTechLevels: Record<string, number> = {};
    let researchOrder: ResearchOrderEntry[] = [];
    let selectedVersion = 'v5';
    let researchCenterLevel = 25;
    let includeRCCrystalCost = false;
    let helpsPerResearch = 30;
    let researchSpeedBonus = 0;

    // Mobile detection
    let isMobile = false;

    // Tooltip state
    let hoveredNode: PlaceholderNode | null = null;
    let tooltipX = 0;
    let tooltipY = 0;
    let tooltipOriginX = 0;
    let tooltipOriginY = 0;
    let showTooltip = false;

    // Highlighted tech state
    let highlightedTechKey: string | null = null;

    // Mode selector state
    type SimulatorMode = 'single' | 'max' | 'remove';
    let currentMode: SimulatorMode = 'single';

    // Error/warning message state
    let simulatorMessage: SimulatorMessage | null = null;
    let messageTimeout: ReturnType<typeof setTimeout> | null = null;

    // Clear confirmation modal state
    let showClearModal = false;

    // Viewport and dragging state
    let viewport: HTMLElement;
    let canvas: HTMLElement;
    let svg: SVGSVGElement;
    let containerEl: HTMLElement;

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    let currentTranslateX = 0;

    // Flag to prevent saving during initial load
    let isInitialLoad = true;

    // ============================================================
    // COMPUTED / REACTIVE
    // ============================================================

    // Build placeholder nodes for visualization
    let placeholderNodes: PlaceholderNode[] = generatedPositions.map((pos) => {
        const techKey = techAssignments[pos.slot] || null;
        const tech = techKey ? allTechs[techKey] : null;
        return {
            slot: pos.slot,
            col: pos.col,
            row: pos.row,
            position: {
                x: PADDING_LEFT + pos.col * (NODE_WIDTH + H_GAP),
                y: PADDING_TOP + pos.row * LINE_SPACING,
            },
            techKey,
            technology: tech,
        };
    });

    // Cutting corners display value
    $: ccReduction = getCuttingCornersReduction(
        userTechLevels['cuttingCornersI'] || 0,
        userTechLevels['cuttingCornersII'] || 0,
    );

    // Auto-save when state changes
    $: if (userTechLevels || researchCenterLevel || selectedVersion || helpsPerResearch || researchSpeedBonus) {
        debouncedSave();
    }

    // Tech tree crystal cost (with cost reduction based on research order)
    $: techTreeCrystalCost = Object.entries(userTechLevels).reduce((total, [techKey, level]) => {
        const tech = allTechs[techKey];
        if (!tech || level <= 0) return total;
        let crystalsSum = 0;
        for (let i = 0; i < level; i++) {
            const baseCost = tech.levels[i].crystals;
            const actualCost = calculateActualCrystalCostFromHistory(
                techKey, i + 1, baseCost, researchOrder, researchCenterLevel, userTechLevels,
            );
            crystalsSum += actualCost;
        }
        return total + crystalsSum;
    }, 0);

    // Total crystals including optional RC cost
    $: totalCrystalsUsed =
        techTreeCrystalCost + (includeRCCrystalCost ? getTotalRCCrystalCost(researchCenterLevel) : 0);

    // Raw crystal cost (no CC/RC reduction)
    $: rawCrystalCost =
        Object.entries(userTechLevels).reduce((total, [techKey, level]) => {
            const tech = allTechs[techKey];
            if (!tech || level <= 0) return total;
            const rawSum = tech.levels.slice(0, level).reduce((sum: number, lvl: TechLevel) => sum + lvl.crystals, 0);
            return total + rawSum;
        }, 0) + (includeRCCrystalCost ? getTotalRCCrystalCost(researchCenterLevel) : 0);

    // Savings from cost reduction
    $: crystalSavings = rawCrystalCost - totalCrystalsUsed;

    // Base time in seconds
    $: baseTimeSeconds = Object.entries(userTechLevels).reduce((total, [techKey, level]) => {
        const tech = allTechs[techKey];
        if (!tech || level <= 0) return total;
        const timeForLevels = tech.levels.slice(0, level).reduce((sum: number, lvl: TechLevel) => {
            return sum + parseTimeToSeconds(lvl.time);
        }, 0);
        return total + timeForLevels;
    }, 0);

    // After research speed bonus
    $: timeAfterSpeedBonus =
        researchSpeedBonus > 0 ? baseTimeSeconds / (1 + researchSpeedBonus / 100) : baseTimeSeconds;

    // After helps
    $: timeAfterHelps = (() => {
        let remaining = timeAfterSpeedBonus;
        const helpCount = Math.min(Math.max(helpsPerResearch, 0), 30);
        for (let i = 0; i < helpCount; i++) {
            if (remaining <= 0) break;
            const reduction = Math.max(180, remaining * 0.01);
            remaining = Math.max(0, remaining - reduction);
        }
        return remaining;
    })();

    // Final speedup value (in days)
    $: totalSpeedupsUsed = timeAfterHelps / 86400;
    $: baseTimeDays = baseTimeSeconds / 86400;
    $: timeAfterSpeedBonusDays = timeAfterSpeedBonus / 86400;

    // Season coins total
    $: totalSeasonCoinsUsed = Object.entries(userTechLevels).reduce((total, [techKey, level]) => {
        const tech = allTechs[techKey];
        if (!tech || level <= 0) return total;
        const coinsForLevels = tech.levels.slice(0, level).reduce((sum: number, lvl: TechLevel) => {
            return sum + (lvl.seasonCoins || 0);
        }, 0);
        return total + coinsForLevels;
    }, 0);

    // ============================================================
    // SAVE / LOAD
    // ============================================================

    function saveProgress() {
        if (isInitialLoad) return;
        if (typeof window !== 'undefined') {
            const win = window as WindowWithStorage;
            if (win.saveUserData) {
                const state = {
                    userTechLevels,
                    researchCenterLevel,
                    selectedVersion,
                    researchOrder,
                    includeRCCrystalCost,
                    helpsPerResearch,
                    researchSpeedBonus,
                };
                win.saveUserData(TECH_SIMULATOR_CACHE_KEY, state);
            }
        }
    }

    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    function debouncedSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveProgress, 500);
    }

    function loadProgress() {
        if (typeof window !== 'undefined') {
            const win = window as WindowWithStorage;
            if (win.loadUserData) {
                const savedState = win.loadUserData(TECH_SIMULATOR_CACHE_KEY);
                if (savedState) {
                    if (savedState.userTechLevels) userTechLevels = savedState.userTechLevels;
                    if (savedState.researchCenterLevel) researchCenterLevel = savedState.researchCenterLevel;
                    if (savedState.selectedVersion) selectedVersion = savedState.selectedVersion;
                    if (savedState.researchOrder) researchOrder = savedState.researchOrder;
                    if (savedState.includeRCCrystalCost !== undefined) includeRCCrystalCost = savedState.includeRCCrystalCost;
                    if (savedState.helpsPerResearch !== undefined) helpsPerResearch = savedState.helpsPerResearch;
                    if (savedState.researchSpeedBonus !== undefined) researchSpeedBonus = savedState.researchSpeedBonus;
                }
            }
        }
        isInitialLoad = false;
    }

    // ============================================================
    // RESEARCH ORDER TRACKING
    // ============================================================

    function recordResearch(techKey: string, level: number) {
        const cc1AtTime = userTechLevels['cuttingCornersI'] || 0;
        const cc2AtTime = userTechLevels['cuttingCornersII'] || 0;
        researchOrder = [...researchOrder, { techKey, level, cc1AtTime, cc2AtTime }];
    }

    function removeResearchRecord(techKey: string, level: number) {
        researchOrder = researchOrder.filter((e) => !(e.techKey === techKey && e.level === level));
    }

    // ============================================================
    // MESSAGE HANDLING
    // ============================================================

    function showMessage(message: SimulatorMessage, duration: number = 5000) {
        if (messageTimeout) clearTimeout(messageTimeout);
        simulatorMessage = message;
        messageTimeout = setTimeout(() => {
            simulatorMessage = null;
        }, duration);
    }

    function clearMessage() {
        if (messageTimeout) clearTimeout(messageTimeout);
        simulatorMessage = null;
    }

    // ============================================================
    // CLEAR MODAL
    // ============================================================

    function openClearModal() {
        const techCount = Object.keys(userTechLevels).filter((k) => userTechLevels[k] > 0).length;
        if (techCount === 0) {
            showMessage({ type: 'warning', text: 'All technologies are already at Level 0.' });
            currentMode = 'single';
            return;
        }
        showClearModal = true;
    }

    function confirmClear() {
        const techCount = Object.keys(userTechLevels).filter((k) => userTechLevels[k] > 0).length;
        for (const key in userTechLevels) {
            userTechLevels[key] = 0;
        }
        userTechLevels = { ...userTechLevels };
        researchOrder = [];
        showClearModal = false;
        currentMode = 'single';
        showMessage({ type: 'warning', text: `Cleared all progress. ${techCount} technologies reset to Level 0.` });
    }

    function cancelClear() {
        showClearModal = false;
        currentMode = 'single';
    }

    // ============================================================
    // SCROLL TO CRYSTALS
    // ============================================================

    function scrollToTotalCrystals() {
        const valueEl = document.getElementById('total-crystals-value');
        if (valueEl) {
            valueEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            valueEl.classList.add('glow-highlight');
            setTimeout(() => {
                valueEl.classList.remove('glow-highlight');
            }, 2500);
        }
    }

    // ============================================================
    // TECH CLICK HANDLING
    // ============================================================

    function handleTechClick(techKey: string) {
        const tech = allTechs[techKey];
        if (!tech) return;

        const currentLevel = userTechLevels[techKey] || 0;
        clearMessage();

        if (currentMode === 'single') {
            if (currentLevel >= tech.maxLevel) {
                showMessage({ type: 'warning', text: `${tech.name} is already at max level.` });
                return;
            }
            const targetLevel = currentLevel + 1;
            const check = canUpgradeToLevel(techKey, targetLevel, userTechLevels, researchCenterLevel, allTechs);

            if (!check.canUpgrade) {
                handleUpgradeError(check, tech.name);
                return;
            }

            recordResearch(techKey, targetLevel);
            userTechLevels[techKey] = targetLevel;
            userTechLevels = { ...userTechLevels };
        } else if (currentMode === 'max') {
            if (currentLevel >= tech.maxLevel) {
                showMessage({ type: 'warning', text: `${tech.name} is already at max level.` });
                return;
            }

            const maxPossible = findMaxUpgradeableLevel(techKey, userTechLevels, researchCenterLevel, allTechs);

            if (maxPossible <= currentLevel) {
                const check = canUpgradeToLevel(techKey, currentLevel + 1, userTechLevels, researchCenterLevel, allTechs);
                handleUpgradeError(check, tech.name);
                return;
            }

            for (let lvl = currentLevel + 1; lvl <= maxPossible; lvl++) {
                recordResearch(techKey, lvl);
            }
            userTechLevels[techKey] = maxPossible;
            userTechLevels = { ...userTechLevels };

            if (maxPossible < tech.maxLevel) {
                const check = canUpgradeToLevel(techKey, maxPossible + 1, userTechLevels, researchCenterLevel, allTechs);
                handleUpgradeWarning(check, maxPossible);
            }
        } else if (currentMode === 'remove') {
            if (currentLevel <= 0) {
                showMessage({ type: 'warning', text: `${tech.name} is already at Level 0.` });
                return;
            }

            const depCheck = checkRemovalDependencies(techKey, currentLevel - 1, userTechLevels, allTechs);
            if (!depCheck.canRemove) {
                if (depCheck.isAnyOf && depCheck.otherOptions && depCheck.otherOptions.length > 0) {
                    const altTechLinks = depCheck.otherOptions.map((key) => ({
                        techKey: key,
                        techName: allTechs[key]?.name || key,
                    }));
                    showMessage({
                        type: 'error',
                        text: `${depCheck.blockingTechName} Lvl ${depCheck.blockingTechLevel} requires this. Upgrade any of:`,
                        prefix: '',
                        multiTechLinks: altTechLinks,
                        requiredLevel: depCheck.requiredLevel,
                    });
                } else {
                    showMessage({
                        type: 'error',
                        text: `Cannot remove. ${depCheck.blockingTechName} Lvl ${depCheck.blockingTechLevel} requires ${tech.name} → Lvl ${depCheck.requiredLevel}.`,
                        techLink: {
                            techKey: depCheck.blockingTech!,
                            techName: depCheck.blockingTechName!,
                            requiredLevel: depCheck.blockingTechLevel!,
                        },
                    });
                }
                return;
            }

            removeResearchRecord(techKey, currentLevel);
            userTechLevels[techKey] = currentLevel - 1;
            userTechLevels = { ...userTechLevels };
        }
    }

    // Helper for upgrade error messages
    function handleUpgradeError(check: ReturnType<typeof canUpgradeToLevel>, _techName: string) {
        if (check.missingPrereqs && check.missingPrereqs.length > 0) {
            const prereqNames = check.missingPrereqs.map((key) => allTechs[key]?.name || key);
            const prereqList = prereqNames.join(', ');
            const prefix = check.isPrereqAnyOf ? 'Requires any of' : 'Requires at least 1 point in each of';
            showMessage({
                type: 'error',
                text: `${prefix}: ${prereqList} to unlock.`,
                techLink: { techKey: check.missingPrereqs[0], techName: prereqNames[0], requiredLevel: 1 },
            });
        } else if (check.rcRequired) {
            showMessage({
                type: 'error',
                text: `Requires Research Center Level ${check.rcRequired} to continue.`,
                rcRequirement: check.rcRequired,
            });
        } else if (check.failedTech && check.requiredLevel) {
            if (check.isAnyOf && check.failedTechs && Array.isArray(check.failedTechs) && check.failedTechs.length > 0) {
                const techLinks = check.failedTechs.map((key) => ({ techKey: key, techName: allTechs[key]?.name || key }));
                showMessage({ type: 'error', text: '', prefix: 'Requires any of:', multiTechLinks: techLinks, requiredLevel: check.requiredLevel });
            } else if (check.failedTechs && Array.isArray(check.failedTechs) && check.failedTechs.length > 1) {
                const techLinks = check.failedTechs.map((key) => ({ techKey: key, techName: allTechs[key]?.name || key }));
                showMessage({ type: 'error', text: '', prefix: 'Requires all of:', multiTechLinks: techLinks, requiredLevel: check.requiredLevel });
            } else {
                const failedTechName = allTechs[check.failedTech]?.name || check.failedTech;
                showMessage({
                    type: 'error',
                    text: `Requires ${failedTechName} → Lvl ${check.requiredLevel}`,
                    techLink: { techKey: check.failedTech, techName: failedTechName, requiredLevel: check.requiredLevel },
                });
            }
        }
    }

    // Helper for max-mode partial upgrade warnings
    function handleUpgradeWarning(check: ReturnType<typeof canUpgradeToLevel>, maxPossible: number) {
        if (check.rcRequired) {
            showMessage({
                type: 'warning',
                text: `Upgraded to Level ${maxPossible}. Requires Research Center Level ${check.rcRequired} to continue.`,
                rcRequirement: check.rcRequired,
            });
        } else if (check.failedTech && check.requiredLevel) {
            if (check.isAnyOf && check.failedTechs && Array.isArray(check.failedTechs) && check.failedTechs.length > 0) {
                const techLinks = check.failedTechs.map((key) => ({ techKey: key, techName: allTechs[key]?.name || key }));
                showMessage({ type: 'warning', text: `Upgraded to Level ${maxPossible}.`, prefix: 'Requires any of:', multiTechLinks: techLinks, requiredLevel: check.requiredLevel });
            } else if (check.failedTechs && Array.isArray(check.failedTechs) && check.failedTechs.length > 1) {
                const techLinks = check.failedTechs.map((key) => ({ techKey: key, techName: allTechs[key]?.name || key }));
                showMessage({ type: 'warning', text: `Upgraded to Level ${maxPossible}.`, prefix: 'Requires all of:', multiTechLinks: techLinks, requiredLevel: check.requiredLevel });
            } else {
                const failedTechName = allTechs[check.failedTech]?.name || check.failedTech;
                showMessage({
                    type: 'warning',
                    text: `Upgraded to Level ${maxPossible}. Requires ${failedTechName} Level ${check.requiredLevel} to finish.`,
                    techLink: { techKey: check.failedTech, techName: failedTechName, requiredLevel: check.requiredLevel },
                });
            }
        }
    }

    // ============================================================
    // VIEWPORT / CANVAS DRAG LOGIC
    // ============================================================

    function getMaxScroll(): number {
        if (!viewport || !canvas) return 0;
        const viewportWidth = viewport.clientWidth;
        const cw = canvas.scrollWidth;
        return Math.max(0, cw - viewportWidth);
    }

    function setTransform(x: number): void {
        const maxScroll = getMaxScroll();
        currentTranslateX = Math.max(-maxScroll, Math.min(0, x));
        if (canvas) {
            canvas.style.transform = `translateX(${currentTranslateX}px)`;
        }
    }

    function handleMouseDown(e: MouseEvent): void {
        if ((e.target as HTMLElement).closest('.tech-node')) return;
        isDragging = true;
        startX = e.pageX;
        scrollLeft = currentTranslateX;
        if (viewport) viewport.style.cursor = 'grabbing';
        if (canvas) canvas.style.transition = 'none';
    }

    function handleMouseMove(e: MouseEvent): void {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX;
        const walk = x - startX;
        setTransform(scrollLeft + walk);
    }

    function handleMouseUp(): void {
        if (isDragging) {
            isDragging = false;
            if (viewport) viewport.style.cursor = 'grab';
            if (canvas) canvas.style.transition = 'transform 0.1s ease-out';
        }
    }

    function handleTouchStart(e: TouchEvent): void {
        if ((e.target as HTMLElement).closest('.tech-node')) return;
        isDragging = true;
        startX = e.touches[0].pageX;
        scrollLeft = currentTranslateX;
        if (canvas) canvas.style.transition = 'none';
    }

    function handleTouchMove(e: TouchEvent): void {
        if (!isDragging) return;
        const x = e.touches[0].pageX;
        const walk = x - startX;
        setTransform(scrollLeft + walk);
    }

    function handleTouchEnd(): void {
        isDragging = false;
        if (canvas) canvas.style.transition = 'transform 0.1s ease-out';
    }

    function handleWheel(e: WheelEvent): void {
        e.preventDefault();
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        setTransform(currentTranslateX - delta);
    }

    // ============================================================
    // SVG CONNECTION DRAWING
    // ============================================================

    function createRoundedPath(points: { x: number; y: number }[], radius: number = 12): string {
        if (points.length < 2) return '';
        if (points.length === 2) {
            return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
        }

        let d = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];

            const dx1 = curr.x - prev.x;
            const dy1 = curr.y - prev.y;
            const dx2 = next.x - curr.x;
            const dy2 = next.y - curr.y;

            const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

            const r = Math.min(radius, dist1 / 2, dist2 / 2);

            const sx = curr.x - (dx1 / dist1) * r;
            const sy = curr.y - (dy1 / dist1) * r;
            const ex = curr.x + (dx2 / dist2) * r;
            const ey = curr.y + (dy2 / dist2) * r;

            d += ` L ${sx} ${sy} Q ${curr.x} ${curr.y} ${ex} ${ey}`;
        }

        d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
        return d;
    }

    function drawConnections(): void {
        if (!svg) return;
        svg.innerHTML = '';

        const cornerRadius = 10;

        connections.forEach(([fromSlot, toSlot]) => {
            const fromPos = slotPositionMap[fromSlot];
            const toPos = slotPositionMap[toSlot];
            if (!fromPos || !toPos) return;

            const x1 = fromPos.x + NODE_WIDTH;
            const y1 = fromPos.y + NODE_HEIGHT / 2;
            const x2 = toPos.x;
            const y2 = toPos.y + NODE_HEIGHT / 2;

            const midX = (x1 + x2) / 2;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            if (y1 === y2) {
                path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
            } else {
                const points = [
                    { x: x1, y: y1 },
                    { x: midX, y: y1 },
                    { x: midX, y: y2 },
                    { x: x2, y: y2 },
                ];
                path.setAttribute('d', createRoundedPath(points, cornerRadius));
            }
            path.classList.add('connection-line');
            svg.appendChild(path);
        });

        passThroughConnections.forEach(({ fromCol, fromSlot, throughCol, toCol }) => {
            const fromPos = slotPositionMap[`col${fromCol}_slot${fromSlot}`];
            if (!fromPos) return;

            const convergenceX = PADDING_LEFT + throughCol * (NODE_WIDTH + H_GAP) + NODE_WIDTH + H_GAP / 2;
            const convergenceY = PADDING_TOP + 1.5 * LINE_SPACING + NODE_HEIGHT / 2;

            const x1 = fromPos.x + NODE_WIDTH;
            const y1 = fromPos.y + NODE_HEIGHT / 2;

            const pathToConverge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pointsToConverge = [
                { x: x1, y: y1 },
                { x: convergenceX, y: y1 },
                { x: convergenceX, y: convergenceY },
            ];
            pathToConverge.setAttribute('d', createRoundedPath(pointsToConverge, cornerRadius));
            pathToConverge.classList.add('connection-line');
            svg.appendChild(pathToConverge);

            for (let i = 0; i < 4; i++) {
                const toPos = slotPositionMap[`col${toCol}_slot${i}`];
                if (!toPos) continue;

                const x2 = toPos.x;
                const y2 = toPos.y + NODE_HEIGHT / 2;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const points = [
                    { x: convergenceX, y: convergenceY },
                    { x: convergenceX, y: y2 },
                    { x: x2, y: y2 },
                ];
                path.setAttribute('d', createRoundedPath(points, cornerRadius));
                path.classList.add('connection-line');
                svg.appendChild(path);
            }
        });
    }

    // ============================================================
    // TOOLTIP
    // ============================================================

    const TOOLTIP_ROW_ANCHORS: Record<number, { y: number; openDown: boolean }> = {
        0: { y: 0, openDown: true },
        0.5: { y: 30, openDown: true },
        1: { y: 70, openDown: true },
        1.5: { y: 430, openDown: false },
        2: { y: 400, openDown: false },
        2.5: { y: 440, openDown: false },
        3: { y: 480, openDown: false },
    };

    function handleInfoClick(detail: { node: PlaceholderNode; event: MouseEvent }): void {
        const { node, event } = detail;
        if (!node.technology) return;

        if (hoveredNode && hoveredNode.slot === node.slot && showTooltip) {
            closeTooltip();
            return;
        }

        hoveredNode = node;
        calculateTooltipPosition(event, node);
        showTooltip = true;
    }

    function closeTooltip(): void {
        showTooltip = false;
        setTimeout(() => {
            if (!showTooltip) {
                hoveredNode = null;
            }
        }, 200);
    }

    function handleOutsideClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (target.closest('.tech-tooltip') || target.closest('.info-btn')) {
            return;
        }
        if (showTooltip) {
            closeTooltip();
        }
    }

    function calculateTooltipPosition(event: MouseEvent, node: PlaceholderNode): void {
        const mainContainer = containerEl?.getBoundingClientRect();
        const viewportRect = viewport?.getBoundingClientRect();
        if (!mainContainer || !viewportRect) return;

        const tooltipWidth = 420;
        const tooltipHeight = 400;

        const buttonRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const techNode = (event.currentTarget as HTMLElement).closest('.tech-node');
        const nodeRect = techNode?.getBoundingClientRect() ?? buttonRect;

        const row = node.row;
        const rowAnchor = TOOLTIP_ROW_ANCHORS[row] || { y: 150, openDown: true };

        tooltipOriginX = buttonRect.left + buttonRect.width / 2 - mainContainer.left;
        tooltipOriginY = buttonRect.top + buttonRect.height / 2 - mainContainer.top;

        let x: number;
        let y: number;

        x = nodeRect.right - mainContainer.left + 10;

        const screenWidth = window.innerWidth;
        if (mainContainer.left + x + tooltipWidth > screenWidth - 20) {
            x = nodeRect.left - mainContainer.left - tooltipWidth - 10;
        }

        x = Math.max(10, Math.min(x, mainContainer.width - tooltipWidth - 10));

        const headerHeight = viewportRect.top - mainContainer.top;

        if (rowAnchor.openDown) {
            y = headerHeight + rowAnchor.y;
        } else {
            y = headerHeight + rowAnchor.y - tooltipHeight;
        }

        const maxY = mainContainer.height - tooltipHeight - 10;
        y = Math.max(10, Math.min(y, maxY));

        tooltipX = x;
        tooltipY = y;
    }

    // Navigate to and highlight a specific tech
    function navigateToTech(techKey: string): void {
        closeTooltip();
        clearMessage();

        const targetNode = placeholderNodes.find((n) => n.techKey === techKey);
        if (!targetNode) return;

        const nodeX = targetNode.position.x;
        const viewportWidth = viewport?.clientWidth || 800;
        const targetScroll = Math.max(0, nodeX - viewportWidth / 2 + NODE_WIDTH / 2);
        const maxScroll = getMaxScroll();
        const clampedScroll = Math.min(targetScroll, maxScroll);

        currentTranslateX = -clampedScroll;
        if (canvas) {
            canvas.style.transform = `translateX(${currentTranslateX}px)`;
        }

        highlightedTechKey = techKey;
        setTimeout(() => {
            highlightedTechKey = null;
        }, 2000);
    }

    // Global click handler
    function handleGlobalClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.settings-dropdown')) {
            // Settings dropdowns are handled by the TechSettingsIsland sub-component
        }
        if (!target.closest('.tech-tooltip') && !target.closest('.info-btn')) {
            showTooltip = false;
            hoveredNode = null;
        }
    }

    // ============================================================
    // SETTINGS EVENT HANDLERS
    // ============================================================

    function handleVersionChange(e: CustomEvent<{ version: string }>) {
        selectedVersion = e.detail.version;
    }

    function handleRCLevelChange(e: CustomEvent<{ level: number }>) {
        researchCenterLevel = e.detail.level;
    }

    function handleRCCostToggle(e: CustomEvent<{ checked: boolean }>) {
        includeRCCrystalCost = e.detail.checked;
    }

    function handleModeChange(e: CustomEvent<{ mode: SimulatorMode }>) {
        currentMode = e.detail.mode;
    }

    function handleClearRequest() {
        openClearModal();
    }

    function handleHelpsChange(e: CustomEvent<{ value: number }>) {
        helpsPerResearch = e.detail.value;
    }

    function handleSpeedBonusChange(e: CustomEvent<{ value: number }>) {
        researchSpeedBonus = e.detail.value;
    }

    function handleMessageNavigate(e: CustomEvent<{ techKey: string }>) {
        navigateToTech(e.detail.techKey);
    }

    function handleTooltipNavigate(e: CustomEvent<{ techKey: string }>) {
        navigateToTech(e.detail.techKey);
    }

    // ============================================================
    // LIFECYCLE
    // ============================================================

    onMount(() => {
        loadProgress();

        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor;
            const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 768;
            isMobile = mobileRegex.test(userAgent) || (isTouchDevice && isSmallScreen);
        };
        checkMobile();

        if (isMobile) return;

        setTimeout(drawConnections, 100);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('click', handleGlobalClick);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('click', handleGlobalClick);
            if (saveTimeout) clearTimeout(saveTimeout);
        };
    });
</script>

{#if isMobile}
    <!-- Mobile Warning Message -->
    <div class="mobile-warning">
        <div class="mobile-warning-content">
            <div class="mobile-warning-icon">
                <i class="fas fa-desktop"></i>
            </div>
            <h2 class="mobile-warning-title">Desktop Required</h2>
            <p class="mobile-warning-text">
                The Crystal Tech Simulator is not optimized for mobile devices due to its complex interactive interface.
            </p>
            <p class="mobile-warning-text">
                For the best experience, please visit this page on a <strong>desktop computer</strong>,
                <strong>laptop</strong>, or <strong>tablet in landscape mode</strong>.
            </p>
        </div>
    </div>
{:else}
    <!-- Settings Island -->
    <TechSettingsIsland
        {selectedVersion}
        {researchCenterLevel}
        {includeRCCrystalCost}
        {availableVersions}
        {ccReduction}
        {versionIcon}
        {researchCenterIcon}
        on:versionChange={handleVersionChange}
        on:rcLevelChange={handleRCLevelChange}
        on:rcCostToggle={handleRCCostToggle}
        on:scrollToTotalCrystals={scrollToTotalCrystals}
    />

    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="crystal-tech-container" bind:this={containerEl} on:click={handleOutsideClick}>
        <!-- Header Bar -->
        <div class="crystal-tech-header">
            <div class="greek-key-border left"></div>
            <h2 class="crystal-tech-title">CRYSTAL TECHNOLOGIES</h2>
            <div class="greek-key-border right"></div>
        </div>

        <!-- Tech Tree Viewport -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_no_noninteractive_tabindex -->
        <div
            class="tech-tree-viewport"
            bind:this={viewport}
            on:mousedown={handleMouseDown}
            on:touchstart={handleTouchStart}
            on:touchmove={handleTouchMove}
            on:touchend={handleTouchEnd}
            on:wheel={handleWheel}
            role="application"
            tabindex="0"
            aria-label="Crystal Technology Tree - drag to scroll"
            style="height: {canvasHeight}px;"
        >
            <!-- Mode Selector -->
            <TechModeSelector
                {currentMode}
                on:modeChange={handleModeChange}
                on:clearRequest={handleClearRequest}
            />

            <div class="tech-tree-canvas" bind:this={canvas} style="width: {canvasWidth}px; height: {canvasHeight}px;">
                <!-- SVG for connection lines -->
                <svg class="tech-connections" bind:this={svg}></svg>

                <!-- Tech nodes -->
                <div class="tech-nodes">
                    {#each placeholderNodes as node (node.slot)}
                        {@const currentLevel = node.techKey ? userTechLevels[node.techKey] || 0 : 0}
                        {@const maxLevel = node.technology?.maxLevel || 10}
                        {@const nodeIcon = getTechIcon(techIcons, node.techKey)}
                        <TechNode
                            slot={node.slot}
                            col={node.col}
                            row={node.row}
                            positionX={node.position.x}
                            positionY={node.position.y}
                            techKey={node.techKey}
                            technology={node.technology}
                            {currentLevel}
                            {maxLevel}
                            highlighted={highlightedTechKey === node.techKey}
                            techIcon={nodeIcon}
                            textSizeClass={getTextSizeClass(node.technology?.name)}
                            {showTooltip}
                            isTooltipTarget={hoveredNode?.slot === node.slot}
                            on:techClick={(e) => handleTechClick(e.detail.techKey)}
                            on:infoClick={(e) => handleInfoClick(e.detail)}
                        />
                    {/each}
                </div>
            </div>
            <div class="viewport-scroll-hint">
                <i class="fas fa-arrows-alt-h"></i>
                <span>Drag to scroll</span>
            </div>
        </div>

        <!-- Click Tooltip -->
        <TechTooltip
            techKey={hoveredNode?.techKey ?? null}
            technology={hoveredNode?.technology ?? null}
            show={showTooltip && hoveredNode !== null}
            {tooltipX}
            {tooltipY}
            {tooltipOriginX}
            {tooltipOriginY}
            currentLevel={hoveredNode?.techKey ? userTechLevels[hoveredNode.techKey] || 0 : 0}
            {userTechLevels}
            {researchCenterLevel}
            {allTechs}
            techIcon={hoveredNode?.techKey ? getTechIcon(techIcons, hoveredNode.techKey) : null}
            crystalIconSrc={crystalIcon.src}
            seasonCoinIconSrc={seasonCoinIcon.src}
            on:navigateToTech={handleTooltipNavigate}
        />

        <!-- Message Display -->
        <TechMessage
            message={simulatorMessage}
            on:navigateToTech={handleMessageNavigate}
            on:clearMessage={clearMessage}
        />

        <!-- Footer Bar with Counters -->
        <TechFooter
            {totalSpeedupsUsed}
            {totalSeasonCoinsUsed}
            {totalCrystalsUsed}
            {rawCrystalCost}
            {crystalSavings}
            {baseTimeDays}
            {timeAfterSpeedBonusDays}
            {helpsPerResearch}
            {researchSpeedBonus}
            crystalIconSrc={crystalIcon.src}
            researchSpeedupIconSrc={researchSpeedupIcon.src}
            seasonCoinIconSrc={seasonCoinIcon.src}
            on:helpsChange={handleHelpsChange}
            on:speedBonusChange={handleSpeedBonusChange}
        />
    </div>
{/if}

<!-- Clear Confirmation Modal -->
{#if showClearModal}
    <div
        class="modal-overlay"
        on:click={cancelClear}
        on:keydown={(e) => e.key === 'Escape' && cancelClear()}
        role="button"
        tabindex="-1"
        aria-label="Close modal"
    >
        <div
            class="modal-content"
            on:click|stopPropagation
            on:keydown|stopPropagation
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-modal-title"
            tabindex="-1"
        >
            <div class="modal-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 id="clear-modal-title">Clear All Progress?</h3>
            <p>This will reset all technologies to Level 0. This action cannot be undone.</p>
            <div class="modal-buttons">
                <button class="modal-btn cancel" on:click={cancelClear}> Cancel </button>
                <button class="modal-btn confirm" on:click={confirmClear}> Clear All </button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* ================================================
       CLEAR CONFIRMATION MODAL
       ================================================ */

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
    }

    .modal-content {
        background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
        border: 1px solid rgba(100, 180, 220, 0.3);
        border-radius: 12px;
        padding: 28px 32px;
        max-width: 380px;
        width: 90%;
        text-align: center;
        box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 40px rgba(100, 180, 220, 0.1);
    }

    .modal-icon {
        width: 60px;
        height: 60px;
        margin: 0 auto 16px;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-icon i {
        font-size: 1.75rem;
        color: #ef4444;
    }

    .modal-content h3 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #fff;
        margin: 0 0 12px 0;
    }

    .modal-content p {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
        margin: 0 0 24px 0;
        line-height: 1.5;
    }

    .modal-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
    }

    .modal-btn {
        padding: 10px 24px;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
    }

    .modal-btn.cancel {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.9);
    }

    .modal-btn.cancel:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
    }

    .modal-btn.confirm {
        background: rgba(239, 68, 68, 0.8);
        border-color: rgba(239, 68, 68, 1);
        color: #fff;
    }

    .modal-btn.confirm:hover {
        background: rgba(239, 68, 68, 1);
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
    }

    /* ================================================
       MOBILE WARNING STYLES
       ================================================ */

    .mobile-warning {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: 40px 20px;
    }

    .mobile-warning-content {
        text-align: center;
        max-width: 400px;
        padding: 30px;
        background: var(--bg-secondary, #1e293b);
        border: 1px solid var(--border-color, rgba(100, 180, 220, 0.2));
        border-radius: var(--radius-lg, 12px);
    }

    .mobile-warning-icon {
        font-size: 3rem;
        color: #64b4dc;
        margin-bottom: 20px;
    }

    .mobile-warning-title {
        font-family: 'Cinzel', serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 15px;
    }

    .mobile-warning-text {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.6;
        margin-bottom: 15px;
    }

    .mobile-warning-text strong {
        color: #64b4dc;
    }

    /* ================================================
       CRYSTAL TECH SIMULATOR STYLES
       ================================================ */

    @font-face {
        font-family: 'NotoSansHans';
        src:
            url('/fonts/NotoSansHans-Black.woff2') format('woff2'),
            url('/fonts/NotoSansHans-Black.otf') format('opentype');
        font-weight: 900;
        font-style: normal;
        font-display: swap;
    }

    @font-face {
        font-family: 'NotoSansHans';
        src:
            url('/fonts/NotoSansHans-Bold.woff2') format('woff2'),
            url('/fonts/NotoSansHans-Bold.otf') format('opentype');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
    }

    @font-face {
        font-family: 'NotoSansHans';
        src:
            url('/fonts/NotoSansHans-DemiLight.woff2') format('woff2'),
            url('/fonts/NotoSansHans-DemiLight.otf') format('opentype');
        font-weight: 300;
        font-style: normal;
        font-display: swap;
    }

    .crystal-tech-container {
        width: 100%;
        border-radius: 8px;
        overflow: visible;
        position: relative;
        border: 4px solid;
        border-color: #a8a498 #b0a89c #9c9488 #a4a094;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 4px 12px rgba(0, 0, 0, 0.35);
    }

    /* Header Bar */
    .crystal-tech-header {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 36px;
        background: linear-gradient(to bottom, #c4c0b5, #b8b4a9);
        border-bottom: 1px solid #9a968b;
        position: relative;
        z-index: 2;
    }

    .crystal-tech-title {
        font-size: 1rem;
        font-weight: 900;
        color: #4a4a4a;
        letter-spacing: 0.1em;
        margin: 0;
        font-family: 'NotoSansHans', sans-serif;
        text-transform: uppercase;
    }

    /* Greek Key Border Pattern */
    .greek-key-border {
        flex: 1;
        height: 24px;
        max-width: 120px;
        opacity: 0.5;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'%3E%3Cpath fill='none' stroke='%238A867C' stroke-width='2' d='M0 10h10v-10h10v10h10v10h-10v-10h-10v10h-10z'/%3E%3C/svg%3E");
        background-repeat: repeat-x;
        background-position: center;
    }

    .greek-key-border.left {
        margin-right: 20px;
        mask-image: linear-gradient(to right, transparent, black);
        -webkit-mask-image: linear-gradient(to right, transparent, black);
    }

    .greek-key-border.right {
        margin-left: 20px;
        mask-image: linear-gradient(to left, transparent, black);
        -webkit-mask-image: linear-gradient(to left, transparent, black);
    }

    /* Glow highlight animation for total crystals value */
    @keyframes crystalGlow {
        0%,
        100% {
            text-shadow: 0 0 5px rgba(74, 222, 128, 0.5);
        }
        50% {
            text-shadow:
                0 0 15px rgba(74, 222, 128, 1),
                0 0 25px rgba(74, 222, 128, 0.7),
                0 0 35px rgba(74, 222, 128, 0.4);
        }
    }

    :global(.counter-value.glow-highlight) {
        animation: crystalGlow 0.8s ease-in-out 3;
        color: #4ade80;
    }

    /* Main Panel - Tech Tree Viewport */
    .tech-tree-viewport {
        width: 100%;
        overflow: hidden;
        position: relative;
        cursor: grab;
        background: radial-gradient(ellipse at center, #0872a0 0%, #044560 100%);
    }

    .tech-tree-viewport:active {
        cursor: grabbing;
    }

    .viewport-scroll-hint {
        position: absolute;
        bottom: 6px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: rgba(255, 255, 255, 0.45);
        font-size: 0.7rem;
        font-family: 'NotoSansHans', sans-serif;
        pointer-events: none;
        z-index: 5;
    }

    .tech-tree-canvas {
        position: absolute;
        top: 0;
        left: 0;
        padding: 0;
        box-sizing: border-box;
        transition: transform 0.1s ease-out;
    }

    /* SVG Connection Lines */
    .tech-connections {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    }

    :global(.tech-connections .connection-line) {
        fill: none;
        stroke: #84dfff;
        stroke-width: 5;
        stroke-linecap: round;
    }

    :global(.tech-connections .connection-line.unlocked) {
        stroke: #84dfff;
        stroke-width: 5;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
    }

    /* Tech Nodes Container */
    .tech-nodes {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2;
    }

    /* ================================================
       MOBILE RESPONSIVE
       ================================================ */

    @media (max-width: 768px) {
        .crystal-tech-container {
            border-width: 4px;
        }

        .crystal-tech-header {
            height: 46px;
        }

        .crystal-tech-title {
            font-size: 0.95rem;
            letter-spacing: 0.08em;
        }

        .greek-key-border {
            display: none;
        }

        .viewport-scroll-hint {
            font-size: 0.65rem;
        }
    }

    @media (max-width: 480px) {
        .viewport-scroll-hint {
            font-size: 0.6rem;
            bottom: 4px;
        }
    }
</style>
