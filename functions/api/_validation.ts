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
    shift_days: z
        .number()
        .int()
        .min(-365, 'Cannot shift more than 365 days back')
        .max(365, 'Cannot shift more than 365 days forward'),
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
    channel_id: z
        .string()
        .regex(/^\d{17,20}$/, 'Invalid Discord channel ID')
        .nullable()
        .optional(),
    is_active: z.boolean().optional(),
});

export const ReminderSettingsSchema = z.object({
    reminder_type: z.enum(['ruins', 'altar', 'custom']),
    channel_id: z
        .string()
        .regex(/^\d{17,20}$/, 'Invalid Discord channel ID')
        .nullable()
        .optional(),
    is_active: z.boolean().optional(),
    message: z.string().max(2000, 'Message cannot exceed 2000 characters').optional(),
});

// ============================================
// Template Validation Schemas
// ============================================

export const TemplateSchema = z.object({
    template_name: z
        .string()
        .min(1, 'Template name is required')
        .max(100, 'Template name must be 100 characters or less'),
    template_data: z.string().max(100000, 'Template data is too large'),
});

export const TemplateCreateSchema = z.object({
    template_name: z.string().min(1, 'Template name is required').max(100, 'Template name must be 100 characters or less'),
    content: z.string().max(100000, 'Template content is too large'),
    char_count: z.number().int().nonnegative().max(100000, 'Character count too large'),
});

// ============================================
// Ark of Osiris Validation Schemas
// ============================================

const discordSnowflake = z.string().regex(/^\d{17,20}$/, 'Invalid Discord snowflake ID');

export const ArkAllianceSchema = z.object({
    alliance_tag: z.string().min(1, 'Alliance tag is required').max(10, 'Alliance tag must be 10 characters or less'),
    channel_id: discordSnowflake.nullable().optional(),
    admin_role_id: discordSnowflake.nullable().optional(),
    notification_role_id: discordSnowflake.nullable().optional(),
    reminder_interval: z.number().int().nonnegative().optional(),
});

export const ArkTeamSchema = z.object({
    alliance_tag: z.string().min(1),
    team_number: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
    team_name: z.string().min(1, 'Team name is required').max(50, 'Team name must be 50 characters or less'),
    match_timestamp: z.number().nullable().optional(),
    signup_cap: z.union([z.number().int().positive(), z.string().regex(/^\d+$/), z.null()]).optional(),
});

export const ArkSignupSchema = z.object({
    alliance_tag: z.string().min(1, 'Alliance tag is required'),
    team_number: z.number().int(),
    in_game_name: z.string().min(1, 'In-game name is required').max(50, 'In-game name must be 50 characters or less'),
});

// ============================================
// MGE Validation Schemas
// ============================================

export const MgeSettingsSchema = z.object({
    signup_channel_id: discordSnowflake.nullable().optional(),
    posted_signups_channel_id: discordSnowflake.nullable().optional(),
    ping_role_id: discordSnowflake.nullable().optional(),
    coordinator_role_id: discordSnowflake.nullable().optional(),
});

export const MgeAcceptSchema = z.object({
    rank_spot: z.number().int().positive('Rank spot must be a positive integer'),
});

// ============================================
// Calendar & Reminder Bulk Schemas
// ============================================

export const CalendarSettingsSchema = z.object({
    channel_id: z.string().max(20).optional(),
    create_discord_events: z.boolean().optional(),
    is_personalized: z.boolean().optional(),
    reference_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Reference date must be YYYY-MM-DD')
        .optional()
        .nullable(),
    reference_type: z.enum(['egg', 'hammer']).optional().nullable(),
    reference_cycle_id: z
        .union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
        .optional()
        .nullable(),
});

export const ChannelActionSchema = z.object({
    command_group: z.string().min(1, 'Command group is required'),
    channel_id: discordSnowflake.optional().nullable(),
    action: z.string().optional(),
});

export const ReminderBulkSchema = z.object({
    reminders: z.array(
        z.object({
            reminder_type: z.string().min(1),
            channel_id: z.string().nullable().optional(),
            is_active: z.boolean().optional(),
            first_instance_ts: z.number().nullable().optional(),
            last_instance_ts: z.number().nullable().optional(),
            create_discord_event: z.boolean().optional(),
            reminder_intervals_seconds: z.string().optional(),
            is_new_setup: z.boolean().optional(),
        }),
    ),
    customReminders: z
        .array(
            z.object({
                reminder_id: z.number().int().optional(),
                channel_id: z.string().nullable().optional(),
                title: z.string().max(200).optional(),
                message: z.string().max(2000).optional(),
                role_id: z.string().nullable().optional(),
                repeat_interval_seconds: z.number().optional(),
                first_instance_ts: z.number().optional(),
            }),
        )
        .optional()
        .default([]),
    deletedCustomIds: z.array(z.number().int()).optional().default([]),
});

export const ArkTagSchema = z.object({
    alliance_tag: z.string().min(1, 'Alliance tag is required'),
});

// ============================================
// Bot Validation Schemas
// ============================================

export const BotBatchSchema = z.object({
    batch: z.array(
        z.object({
            sql: z.string().min(1),
            params: z.array(z.unknown()).optional(),
        }),
    ),
});

export const BotQuerySchema = z.object({
    sql: z.string().min(1, 'SQL statement is required'),
    params: z.array(z.unknown()).optional(),
    method: z.enum(['execute', 'one', 'all']).optional(),
});

// ============================================
// Score Validation Schemas
// ============================================

export const ScoreCreateSchema = z.object({
    pairing: z.string().min(1, 'Pairing is required').max(200, 'Pairing must be 200 characters or less'),
    formation: z.string().min(1, 'Formation is required').max(50, 'Formation must be 50 characters or less'),
    inscriptions: z.array(z.unknown()).max(50, 'Too many inscriptions'),
    stats: z.record(z.string(), z.unknown()),
    total_score: z.number().nonnegative('Score must be non-negative').max(1000000, 'Score too large'),
});

// ============================================
// Ark Signup Delete Schema
// ============================================

export const ArkSignupDeleteSchema = z.object({
    alliance_tag: z.string().min(1, 'Alliance tag is required').max(10, 'Alliance tag must be 10 characters or less'),
    in_game_name: z.string().min(1, 'In-game name is required').max(50, 'In-game name must be 50 characters or less'),
});

// ============================================
// Review Validation Schemas
// ============================================

export const SubmitReviewSchema = z.object({
    discord_user_id: z.string().regex(/^\d{17,20}$/, 'Invalid Discord user ID'),
    discord_username: z.string().min(1, 'Username is required').max(100, 'Username must be 100 characters or less'),
    discord_avatar: z.string().max(200, 'Avatar URL too long').nullable().optional(),
    review_text: z.string().min(1, 'Review text is required').max(2000, 'Review must be 2000 characters or less'),
});

export const ApproveReviewSchema = z.object({
    review_id: z.number().int().positive('Review ID must be a positive integer'),
    action: z.enum(['approved', 'rejected']),
});

// ============================================
// Admin Validation Schemas
// ============================================

export const AdminHeartbeatSchema = z.object({
    username: z.string().max(50, 'Username too long').optional(),
    avatar: z.string().max(200, 'Avatar hash too long').nullable().optional(),
});

export const GcalResetSchema = z.object({
    phase: z.enum(['cleanup', 'create']).default('cleanup'),
    offset: z.number().int().nonnegative('Offset must be non-negative').default(0),
});

export const AdminRestoreSchema = z.object({
    targetKey: z.string().min(1, 'Target key is required'),
    backupKey: z.string().min(1, 'Backup key is required').regex(/^backup_history:/, 'Invalid backup key format'),
});

export const UpdateCacheSchema = z.object({
    top_servers: z.array(z.object({
        name: z.string(),
        icon_url: z.string(),
        member_count: z.number(),
    })).optional(),
    bot_stats: z.record(z.string(), z.unknown()).optional(),
    active_patrons: z.array(z.string().regex(/^\d{17,20}$/)).optional(),
    approved_reviews: z.array(z.object({
        username: z.string(),
        avatar_url: z.string().nullable(),
        review_text: z.string(),
        submitted_at: z.number(),
    })).optional(),
});

// ============================================
// User Settings Validation Schemas
// ============================================

export const UserSettingsSchema = z
    .record(z.string().max(50), z.unknown())
    .refine((obj) => Object.keys(obj).length <= 50, {
        message: 'Settings cannot have more than 50 keys',
    });

// ============================================
// Validation Helper
// ============================================

export type ValidationResult<T> = { success: true; data: T } | { success: false; error: string };

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): ValidationResult<T> {
    const result = schema.safeParse(body);
    if (!result.success) {
        const errors = result.error.errors.map((e) => {
            const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
            return `${path}${e.message}`;
        });
        return { success: false, error: errors.join(', ') };
    }
    return { success: true, data: result.data };
}
