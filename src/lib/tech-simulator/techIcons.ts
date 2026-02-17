// Tech Icons module
// Icon imports must remain in the Svelte component (Vite asset imports).
// This module exports helper functions and a factory for the techIcons map.

/**
 * Builds the techIcons record from icon imports provided by the caller.
 * The Svelte component passes in its Vite-resolved image imports.
 */
export function buildTechIconsMap(icons: {
    iconQuenchedBladesI: ImageMetadata;
    iconQuenchedBladesII: ImageMetadata;
    iconSwiftMarchingI: ImageMetadata;
    iconSwiftMarchingII: ImageMetadata;
    iconSwiftMarchingIII: ImageMetadata;
    iconImprovedBowsI: ImageMetadata;
    iconImprovedBowsII: ImageMetadata;
    iconFleetOfFootI: ImageMetadata;
    iconFleetOfFootII: ImageMetadata;
    iconFleetOfFootIII: ImageMetadata;
    iconMountedCombatTechniquesI: ImageMetadata;
    iconMountedCombatTechniquesII: ImageMetadata;
    iconSwiftSteedsI: ImageMetadata;
    iconSwiftSteedsII: ImageMetadata;
    iconSwiftSteedsIII: ImageMetadata;
    iconImprovedProjectilesI: ImageMetadata;
    iconImprovedProjectilesII: ImageMetadata;
    iconReinforcedAxlesI: ImageMetadata;
    iconReinforcedAxlesII: ImageMetadata;
    iconReinforcedAxlesIII: ImageMetadata;
    iconCallToArmsI: ImageMetadata;
    iconCallToArmsII: ImageMetadata;
    iconCuttingCornersI: ImageMetadata;
    iconCuttingCornersII: ImageMetadata;
    iconLeadershipI: ImageMetadata;
    iconLeadershipII: ImageMetadata;
    iconCulturalExchange: ImageMetadata;
    iconBarbarianBounties: ImageMetadata;
    iconKarakuReports: ImageMetadata;
    iconStarmetalShields: ImageMetadata;
    iconStarmetalBracers: ImageMetadata;
    iconStarmetalHarnesses: ImageMetadata;
    iconStarmetalAxles: ImageMetadata;
    iconLargerCamps: ImageMetadata;
    iconSpecialConcoctionsI: ImageMetadata;
    iconSpecialConcoctionsII: ImageMetadata;
    iconRunecraft: ImageMetadata;
    iconEmergencySupport: ImageMetadata;
    iconExpandedFormationI: ImageMetadata;
    iconExpandedFormationII: ImageMetadata;
    iconRapidRetreat: ImageMetadata;
    iconIronInfantry: ImageMetadata;
    iconArchersFocus: ImageMetadata;
    iconRidersResilience: ImageMetadata;
    iconSiegeProvisions: ImageMetadata;
    iconCelestialGuidance: ImageMetadata;
    iconInfantryExpert: ImageMetadata;
    iconArcherExpert: ImageMetadata;
    iconCavalryExpert: ImageMetadata;
    iconSiegeExpert: ImageMetadata;
    iconSurpriseStrike: ImageMetadata;
}): Record<string, ImageMetadata> {
    return {
        quenchedBladesI: icons.iconQuenchedBladesI,
        quenchedBladesII: icons.iconQuenchedBladesII,
        swiftMarchingI: icons.iconSwiftMarchingI,
        swiftMarchingII: icons.iconSwiftMarchingII,
        swiftMarchingIII: icons.iconSwiftMarchingIII,
        improvedBowsI: icons.iconImprovedBowsI,
        improvedBowsII: icons.iconImprovedBowsII,
        fleetOfFootI: icons.iconFleetOfFootI,
        fleetOfFootII: icons.iconFleetOfFootII,
        fleetOfFootIII: icons.iconFleetOfFootIII,
        mountedCombatTechniquesI: icons.iconMountedCombatTechniquesI,
        mountedCombatTechniquesII: icons.iconMountedCombatTechniquesII,
        swiftSteedsI: icons.iconSwiftSteedsI,
        swiftSteedsII: icons.iconSwiftSteedsII,
        swiftSteedsIII: icons.iconSwiftSteedsIII,
        improvedProjectilesI: icons.iconImprovedProjectilesI,
        improvedProjectilesII: icons.iconImprovedProjectilesII,
        reinforcedAxlesI: icons.iconReinforcedAxlesI,
        reinforcedAxlesII: icons.iconReinforcedAxlesII,
        reinforcedAxlesIII: icons.iconReinforcedAxlesIII,
        callToArmsI: icons.iconCallToArmsI,
        callToArmsII: icons.iconCallToArmsII,
        cuttingCornersI: icons.iconCuttingCornersI,
        cuttingCornersII: icons.iconCuttingCornersII,
        leadershipI: icons.iconLeadershipI,
        leadershipII: icons.iconLeadershipII,
        culturalExchange: icons.iconCulturalExchange,
        barbarianBounties: icons.iconBarbarianBounties,
        karakuReports: icons.iconKarakuReports,
        starmetalShields: icons.iconStarmetalShields,
        starmetalBracers: icons.iconStarmetalBracers,
        starmetalBarding: icons.iconStarmetalHarnesses,
        starmetalAxles: icons.iconStarmetalAxles,
        largerCamps: icons.iconLargerCamps,
        specialConcoctionsI: icons.iconSpecialConcoctionsI,
        specialConcoctionsII: icons.iconSpecialConcoctionsII,
        runecraft: icons.iconRunecraft,
        emergencySupport: icons.iconEmergencySupport,
        expandedFormationsI: icons.iconExpandedFormationI,
        expandedFormationsII: icons.iconExpandedFormationII,
        rapidRetreat: icons.iconRapidRetreat,
        ironInfantry: icons.iconIronInfantry,
        archersFocus: icons.iconArchersFocus,
        ridersResilience: icons.iconRidersResilience,
        siegeProvisions: icons.iconSiegeProvisions,
        celestialGuidance: icons.iconCelestialGuidance,
        infantryExpert: icons.iconInfantryExpert,
        archerExpert: icons.iconArcherExpert,
        cavalryExpert: icons.iconCavalryExpert,
        siegeExpert: icons.iconSiegeExpert,
        surpriseStrike: icons.iconSurpriseStrike,
    };
}

/**
 * Look up a tech icon by its key from a pre-built icons map.
 */
export function getTechIcon(techIcons: Record<string, ImageMetadata>, techKey: string | null): ImageMetadata | null {
    if (!techKey) return null;
    return techIcons[techKey] || null;
}

/**
 * Determine the CSS text-size class for a tech name based on string length.
 */
export function getTextSizeClass(name: string | undefined): string {
    if (!name) return '';
    if (name === 'Reinforced Axles II' || name === 'Reinforced Axles III') return '';
    const len = name.length;
    if (len > 24) return 'text-xs';
    if (len > 18) return 'text-sm';
    return '';
}
