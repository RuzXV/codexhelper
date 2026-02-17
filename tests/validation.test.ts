import { describe, it, expect } from 'vitest';
import {
    validateBody,
    CreateEventSchema,
    ShiftEventsSchema,
    UpdateEventSchema,
    ChannelSettingsSchema,
    ReminderSettingsSchema,
    TemplateSchema,
    ArkAllianceSchema,
    ArkTeamSchema,
    ArkSignupSchema,
    MgeSettingsSchema,
    MgeAcceptSchema,
    CalendarSettingsSchema,
    ChannelActionSchema,
    ReminderBulkSchema,
    ArkTagSchema,
    BotBatchSchema,
    BotQuerySchema,
    UserSettingsSchema,
} from '../functions/api/_validation';

// ─── validateBody helper ───────────────────────────────────────────

describe('validateBody', () => {
    it('returns success with parsed data for valid input', () => {
        const result = validateBody(ArkTagSchema, { alliance_tag: 'ABC' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.alliance_tag).toBe('ABC');
        }
    });

    it('returns error string for invalid input', () => {
        const result = validateBody(ArkTagSchema, { alliance_tag: '' });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('Alliance tag is required');
        }
    });

    it('includes field path in error messages', () => {
        const result = validateBody(CreateEventSchema, { title: '', start: 'bad', duration: -1 });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('title');
        }
    });
});

// ─── CreateEventSchema ─────────────────────────────────────────────

describe('CreateEventSchema', () => {
    const valid = {
        title: 'MGE Week',
        start: '2025-01-15',
        duration: 3,
    };

    it('accepts a minimal valid event', () => {
        const r = validateBody(CreateEventSchema, valid);
        expect(r.success).toBe(true);
    });

    it('accepts full optional fields', () => {
        const r = validateBody(CreateEventSchema, {
            ...valid,
            type: 'mge',
            troop_type: 'Infantry',
            repeat_count: 4,
            repeat_interval: 14,
        });
        expect(r.success).toBe(true);
    });

    it('rejects missing title', () => {
        const r = validateBody(CreateEventSchema, { ...valid, title: '' });
        expect(r.success).toBe(false);
    });

    it('rejects bad date format', () => {
        const r = validateBody(CreateEventSchema, { ...valid, start: '15-01-2025' });
        expect(r.success).toBe(false);
    });

    it('rejects negative duration', () => {
        const r = validateBody(CreateEventSchema, { ...valid, duration: -1 });
        expect(r.success).toBe(false);
    });

    it('rejects duration over 365', () => {
        const r = validateBody(CreateEventSchema, { ...valid, duration: 400 });
        expect(r.success).toBe(false);
    });

    it('rejects invalid troop_type enum value', () => {
        const r = validateBody(CreateEventSchema, { ...valid, troop_type: 'Mage' });
        expect(r.success).toBe(false);
    });

    it('allows null troop_type', () => {
        const r = validateBody(CreateEventSchema, { ...valid, troop_type: null });
        expect(r.success).toBe(true);
    });
});

// ─── ShiftEventsSchema ─────────────────────────────────────────────

describe('ShiftEventsSchema', () => {
    it('accepts valid shift', () => {
        const r = validateBody(ShiftEventsSchema, {
            series_id: '550e8400-e29b-41d4-a716-446655440000',
            shift_days: 7,
        });
        expect(r.success).toBe(true);
    });

    it('rejects non-UUID series_id', () => {
        const r = validateBody(ShiftEventsSchema, { series_id: 'not-a-uuid', shift_days: 1 });
        expect(r.success).toBe(false);
    });

    it('rejects shift beyond 365', () => {
        const r = validateBody(ShiftEventsSchema, {
            series_id: '550e8400-e29b-41d4-a716-446655440000',
            shift_days: 400,
        });
        expect(r.success).toBe(false);
    });

    it('allows negative shifts', () => {
        const r = validateBody(ShiftEventsSchema, {
            series_id: '550e8400-e29b-41d4-a716-446655440000',
            shift_days: -30,
        });
        expect(r.success).toBe(true);
    });
});

// ─── UpdateEventSchema ─────────────────────────────────────────────

describe('UpdateEventSchema', () => {
    it('accepts valid update', () => {
        const r = validateBody(UpdateEventSchema, {
            start_date: '2025-03-01',
            title: 'Updated Event',
            duration: 5,
        });
        expect(r.success).toBe(true);
    });

    it('rejects title over 100 chars', () => {
        const r = validateBody(UpdateEventSchema, {
            start_date: '2025-03-01',
            title: 'x'.repeat(101),
            duration: 1,
        });
        expect(r.success).toBe(false);
    });
});

// ─── ChannelSettingsSchema ─────────────────────────────────────────

describe('ChannelSettingsSchema', () => {
    it('accepts valid Discord channel ID', () => {
        const r = validateBody(ChannelSettingsSchema, { channel_id: '123456789012345678' });
        expect(r.success).toBe(true);
    });

    it('accepts null channel_id', () => {
        const r = validateBody(ChannelSettingsSchema, { channel_id: null });
        expect(r.success).toBe(true);
    });

    it('rejects short channel_id', () => {
        const r = validateBody(ChannelSettingsSchema, { channel_id: '12345' });
        expect(r.success).toBe(false);
    });

    it('accepts empty object', () => {
        const r = validateBody(ChannelSettingsSchema, {});
        expect(r.success).toBe(true);
    });
});

// ─── ReminderSettingsSchema ────────────────────────────────────────

describe('ReminderSettingsSchema', () => {
    it('accepts valid reminder', () => {
        const r = validateBody(ReminderSettingsSchema, {
            reminder_type: 'ruins',
            channel_id: '123456789012345678',
            is_active: true,
        });
        expect(r.success).toBe(true);
    });

    it('rejects invalid reminder_type enum', () => {
        const r = validateBody(ReminderSettingsSchema, { reminder_type: 'invalid' });
        expect(r.success).toBe(false);
    });

    it('rejects message over 2000 chars', () => {
        const r = validateBody(ReminderSettingsSchema, {
            reminder_type: 'custom',
            message: 'x'.repeat(2001),
        });
        expect(r.success).toBe(false);
    });
});

// ─── TemplateSchema ────────────────────────────────────────────────

describe('TemplateSchema', () => {
    it('accepts valid template', () => {
        const r = validateBody(TemplateSchema, {
            template_name: 'My Template',
            template_data: '{"key":"value"}',
        });
        expect(r.success).toBe(true);
    });

    it('rejects empty template_name', () => {
        const r = validateBody(TemplateSchema, { template_name: '', template_data: '{}' });
        expect(r.success).toBe(false);
    });

    it('rejects oversized template_data', () => {
        const r = validateBody(TemplateSchema, {
            template_name: 'Big',
            template_data: 'x'.repeat(100001),
        });
        expect(r.success).toBe(false);
    });
});

// ─── ArkAllianceSchema ─────────────────────────────────────────────

describe('ArkAllianceSchema', () => {
    it('accepts valid alliance config', () => {
        const r = validateBody(ArkAllianceSchema, {
            alliance_tag: 'ABCD',
            channel_id: '123456789012345678',
            admin_role_id: '123456789012345678',
            notification_role_id: null,
            reminder_interval: 3600,
        });
        expect(r.success).toBe(true);
    });

    it('rejects alliance_tag over 10 chars', () => {
        const r = validateBody(ArkAllianceSchema, { alliance_tag: 'TOOLONGTAG!!' });
        expect(r.success).toBe(false);
    });

    it('rejects invalid snowflake for channel_id', () => {
        const r = validateBody(ArkAllianceSchema, { alliance_tag: 'AB', channel_id: 'abc' });
        expect(r.success).toBe(false);
    });
});

// ─── ArkTeamSchema ─────────────────────────────────────────────────

describe('ArkTeamSchema', () => {
    it('accepts numeric team_number', () => {
        const r = validateBody(ArkTeamSchema, {
            alliance_tag: 'AB',
            team_number: 1,
            team_name: 'Alpha',
        });
        expect(r.success).toBe(true);
    });

    it('accepts string team_number', () => {
        const r = validateBody(ArkTeamSchema, {
            alliance_tag: 'AB',
            team_number: '2',
            team_name: 'Beta',
        });
        expect(r.success).toBe(true);
    });

    it('rejects non-numeric string team_number', () => {
        const r = validateBody(ArkTeamSchema, {
            alliance_tag: 'AB',
            team_number: 'abc',
            team_name: 'Gamma',
        });
        expect(r.success).toBe(false);
    });

    it('rejects team_name over 50 chars', () => {
        const r = validateBody(ArkTeamSchema, {
            alliance_tag: 'AB',
            team_number: 1,
            team_name: 'x'.repeat(51),
        });
        expect(r.success).toBe(false);
    });

    it('accepts null signup_cap', () => {
        const r = validateBody(ArkTeamSchema, {
            alliance_tag: 'AB',
            team_number: 1,
            team_name: 'Test',
            signup_cap: null,
        });
        expect(r.success).toBe(true);
    });
});

// ─── ArkSignupSchema ───────────────────────────────────────────────

describe('ArkSignupSchema', () => {
    it('accepts valid signup', () => {
        const r = validateBody(ArkSignupSchema, {
            alliance_tag: 'AB',
            team_number: 1,
            in_game_name: 'Player1',
        });
        expect(r.success).toBe(true);
    });

    it('rejects empty in_game_name', () => {
        const r = validateBody(ArkSignupSchema, {
            alliance_tag: 'AB',
            team_number: 1,
            in_game_name: '',
        });
        expect(r.success).toBe(false);
    });

    it('rejects in_game_name over 50 chars', () => {
        const r = validateBody(ArkSignupSchema, {
            alliance_tag: 'AB',
            team_number: 1,
            in_game_name: 'x'.repeat(51),
        });
        expect(r.success).toBe(false);
    });
});

// ─── MgeSettingsSchema ─────────────────────────────────────────────

describe('MgeSettingsSchema', () => {
    it('accepts all valid snowflakes', () => {
        const r = validateBody(MgeSettingsSchema, {
            signup_channel_id: '123456789012345678',
            posted_signups_channel_id: '123456789012345679',
            ping_role_id: null,
            coordinator_role_id: null,
        });
        expect(r.success).toBe(true);
    });

    it('accepts empty object', () => {
        const r = validateBody(MgeSettingsSchema, {});
        expect(r.success).toBe(true);
    });

    it('rejects invalid snowflake', () => {
        const r = validateBody(MgeSettingsSchema, { signup_channel_id: 'invalid' });
        expect(r.success).toBe(false);
    });
});

// ─── MgeAcceptSchema ───────────────────────────────────────────────

describe('MgeAcceptSchema', () => {
    it('accepts positive rank_spot', () => {
        const r = validateBody(MgeAcceptSchema, { rank_spot: 1 });
        expect(r.success).toBe(true);
    });

    it('rejects zero rank_spot', () => {
        const r = validateBody(MgeAcceptSchema, { rank_spot: 0 });
        expect(r.success).toBe(false);
    });

    it('rejects negative rank_spot', () => {
        const r = validateBody(MgeAcceptSchema, { rank_spot: -1 });
        expect(r.success).toBe(false);
    });

    it('rejects float rank_spot', () => {
        const r = validateBody(MgeAcceptSchema, { rank_spot: 1.5 });
        expect(r.success).toBe(false);
    });
});

// ─── CalendarSettingsSchema ────────────────────────────────────────

describe('CalendarSettingsSchema', () => {
    it('accepts valid calendar settings', () => {
        const r = validateBody(CalendarSettingsSchema, {
            channel_id: '12345678901234567',
            create_discord_events: true,
            is_personalized: false,
            reference_date: '2025-06-01',
            reference_type: 'egg',
            reference_cycle_id: 5,
        });
        expect(r.success).toBe(true);
    });

    it('accepts string reference_cycle_id', () => {
        const r = validateBody(CalendarSettingsSchema, { reference_cycle_id: '10' });
        expect(r.success).toBe(true);
    });

    it('rejects bad reference_date format', () => {
        const r = validateBody(CalendarSettingsSchema, { reference_date: 'June 1st' });
        expect(r.success).toBe(false);
    });

    it('rejects invalid reference_type', () => {
        const r = validateBody(CalendarSettingsSchema, { reference_type: 'sword' });
        expect(r.success).toBe(false);
    });

    it('allows all nulls/optionals', () => {
        const r = validateBody(CalendarSettingsSchema, {});
        expect(r.success).toBe(true);
    });
});

// ─── ChannelActionSchema ───────────────────────────────────────────

describe('ChannelActionSchema', () => {
    it('accepts valid action', () => {
        const r = validateBody(ChannelActionSchema, {
            command_group: 'reminders',
            channel_id: '123456789012345678',
            action: 'set',
        });
        expect(r.success).toBe(true);
    });

    it('rejects empty command_group', () => {
        const r = validateBody(ChannelActionSchema, { command_group: '' });
        expect(r.success).toBe(false);
    });

    it('accepts null channel_id', () => {
        const r = validateBody(ChannelActionSchema, { command_group: 'ark', channel_id: null });
        expect(r.success).toBe(true);
    });
});

// ─── ReminderBulkSchema ────────────────────────────────────────────

describe('ReminderBulkSchema', () => {
    it('accepts valid bulk reminders', () => {
        const r = validateBody(ReminderBulkSchema, {
            reminders: [
                { reminder_type: 'ruins', is_active: true, channel_id: null },
                { reminder_type: 'altar', is_active: false },
            ],
            customReminders: [
                { title: 'My Reminder', message: 'Hello', first_instance_ts: 1700000000 },
            ],
            deletedCustomIds: [1, 2],
        });
        expect(r.success).toBe(true);
    });

    it('rejects empty reminder_type', () => {
        const r = validateBody(ReminderBulkSchema, {
            reminders: [{ reminder_type: '' }],
        });
        expect(r.success).toBe(false);
    });

    it('defaults customReminders and deletedCustomIds', () => {
        const r = validateBody(ReminderBulkSchema, {
            reminders: [{ reminder_type: 'ruins' }],
        });
        expect(r.success).toBe(true);
        if (r.success) {
            expect(r.data.customReminders).toEqual([]);
            expect(r.data.deletedCustomIds).toEqual([]);
        }
    });

    it('rejects non-integer deletedCustomIds', () => {
        const r = validateBody(ReminderBulkSchema, {
            reminders: [{ reminder_type: 'ruins' }],
            deletedCustomIds: [1.5],
        });
        expect(r.success).toBe(false);
    });
});

// ─── ArkTagSchema ──────────────────────────────────────────────────

describe('ArkTagSchema', () => {
    it('accepts valid tag', () => {
        const r = validateBody(ArkTagSchema, { alliance_tag: 'XYZ' });
        expect(r.success).toBe(true);
    });

    it('rejects empty tag', () => {
        const r = validateBody(ArkTagSchema, { alliance_tag: '' });
        expect(r.success).toBe(false);
    });

    it('rejects missing field', () => {
        const r = validateBody(ArkTagSchema, {});
        expect(r.success).toBe(false);
    });
});

// ─── BotQuerySchema ────────────────────────────────────────────────

describe('BotQuerySchema', () => {
    it('accepts valid query', () => {
        const r = validateBody(BotQuerySchema, {
            sql: 'SELECT * FROM users',
            params: ['test'],
            method: 'all',
        });
        expect(r.success).toBe(true);
    });

    it('rejects empty sql', () => {
        const r = validateBody(BotQuerySchema, { sql: '' });
        expect(r.success).toBe(false);
    });

    it('rejects invalid method', () => {
        const r = validateBody(BotQuerySchema, { sql: 'SELECT 1', method: 'invalid' });
        expect(r.success).toBe(false);
    });

    it('accepts without optional fields', () => {
        const r = validateBody(BotQuerySchema, { sql: 'SELECT 1' });
        expect(r.success).toBe(true);
    });
});

// ─── BotBatchSchema ────────────────────────────────────────────────

describe('BotBatchSchema', () => {
    it('accepts valid batch', () => {
        const r = validateBody(BotBatchSchema, {
            batch: [
                { sql: 'INSERT INTO x VALUES (?)', params: [1] },
                { sql: 'UPDATE x SET a=1' },
            ],
        });
        expect(r.success).toBe(true);
    });

    it('rejects empty batch sql', () => {
        const r = validateBody(BotBatchSchema, {
            batch: [{ sql: '' }],
        });
        expect(r.success).toBe(false);
    });

    it('rejects missing batch array', () => {
        const r = validateBody(BotBatchSchema, {});
        expect(r.success).toBe(false);
    });
});

// ─── UserSettingsSchema ────────────────────────────────────────────

describe('UserSettingsSchema', () => {
    it('accepts any key-value pairs', () => {
        const r = validateBody(UserSettingsSchema, { theme: 'dark', lang: 'en' });
        expect(r.success).toBe(true);
    });

    it('accepts empty object', () => {
        const r = validateBody(UserSettingsSchema, {});
        expect(r.success).toBe(true);
    });
});
