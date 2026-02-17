/**
 * Shared calendar event icon modules — loaded once and reused by all calendar components.
 * Prevents duplicate import.meta.glob bundles across Calendar, EventModal, ShiftModal,
 * RemoveModal, and CycleConfigModal.
 */
const iconModules = import.meta.glob('../../assets/images/calendar/event_icons/*.{png,jpg,jpeg,webp,svg}', {
    eager: true,
}) as Record<string, any>;

export function getIconSrc(filename: string | null | undefined): string | null {
    if (!filename) return null;
    const path = `../../assets/images/calendar/event_icons/${filename}`;
    return iconModules[path]?.default?.src || iconModules[path]?.default || null;
}

export { iconModules };
