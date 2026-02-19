-- ============================================
-- Database Indexes for Performance
-- ============================================
-- Apply via: wrangler d1 execute <DB_NAME> --file=migrations/001_indexes.sql
-- Run separately for BOT_DB and DB as noted below.

-- ============================================
-- BOT_DB indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_allowed_channels_guild ON allowed_channels(guild_id);
CREATE INDEX IF NOT EXISTS idx_ark_setups_guild ON ark_of_osiris_setups(guild_id);
CREATE INDEX IF NOT EXISTS idx_ark_teams_guild ON ark_of_osiris_teams(guild_id);
CREATE INDEX IF NOT EXISTS idx_ark_signups_guild ON ark_of_osiris_signups(guild_id);
CREATE INDEX IF NOT EXISTS idx_mge_settings_guild ON mge_settings(guild_id);
CREATE INDEX IF NOT EXISTS idx_mge_apps_guild ON mge_applications(guild_id);
CREATE INDEX IF NOT EXISTS idx_reminder_setups_guild ON reminder_setups(guild_id);
CREATE INDEX IF NOT EXISTS idx_event_calendar_guild ON event_calendar_setups(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_auth_guild ON guild_authorizations(guild_id);

-- ============================================
-- DB indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON user_sessions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_templates_user ON user_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user ON user_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_series ON events(series_id);
