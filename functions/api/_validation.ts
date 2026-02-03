import { z } from 'zod';

// ============================================
// Event Validation Schemas
// ============================================

export const CreateEventSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
    type: z.string().max(50).optional(),
    troop_type: z.enum(['Infantry', 'Archer', 'Leadership', 'Cavalry']).optional().nullable(),
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    duration: z.number().int().positive('Duration must be positive').max(365, 'Duration cannot exceed 365 days'),
    repeat_count: z.number().int().positive().max(52, 'Repeat count cannot exceed 52').optional(),
    repeat_interval: z.number().int().nonnegative().max(365, 'Repeat interval cannot exceed 365 days').optional(),
});

export const ShiftEventsSchema = z.object({
    series_id: z.string().uuid('Invalid series ID format'),
    shift_days: z.number().int().min(-365, 'Cannot shift more than 365 days back').max(365, 'Cannot shift more than 365 days forward'),
});

export const UpdateEventSchema = z.object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
    type: z.string().max(50).optional(),
    duration: z.number().int().positive('Duration must be positive').max(365, 'Duration cannot exceed 365 days'),
});

// ============================================
// Guild Settings Validation Schemas
// ============================================

export const ChannelSettingsSchema = z.object({
    channel_id: z.string().regex(/^\d{17,20}$/, 'Invalid Discord channel ID').nullable().optional(),
    is_active: z.boolean().optional(),
});

export const ReminderSettingsSchema = z.object({
    reminder_type: z.enum(['ruins', 'altar', 'custom']),
    channel_id: z.string().regex(/^\d{17,20}$/, 'Invalid Discord channel ID').nullable().optional(),
    is_active: z.boolean().optional(),
    message: z.string().max(2000, 'Message cannot exceed 2000 characters').optional(),
});

// ============================================
// Template Validation Schemas
// ============================================

export const TemplateSchema = z.object({
    template_name: z.string().min(1, 'Template name is required').max(100, 'Template name must be 100 characters or less'),
    template_data: z.string().max(100000, 'Template data is too large'),
});

// ============================================
// Validation Helper
// ============================================

export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): ValidationResult<T> {
    const result = schema.safeParse(body);
    if (!result.success) {
        const errors = result.error.errors.map(e => {
            const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
            return `${path}${e.message}`;
        });
        return { success: false, error: errors.join(', ') };
    }
    return { success: true, data: result.data };
}
