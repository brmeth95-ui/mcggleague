-- MCGG LEAGUE 3.0 — additive schema draft for a SEPARATE test D1 database.
-- Do NOT run on production until backup, validation and staging tests are completed.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS league_seasons (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, starts_at TEXT, ends_at TEXT,
 status TEXT NOT NULL DEFAULT 'archived' CHECK(status IN ('planned','active','archived'))
);
CREATE TABLE IF NOT EXISTS league_players (
 id TEXT PRIMARY KEY, display_name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 claimed_by_user_id TEXT UNIQUE, merged_into_id TEXT REFERENCES league_players(id)
);
CREATE TABLE IF NOT EXISTS league_player_aliases (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 player_id TEXT NOT NULL REFERENCES league_players(id),
 nickname TEXT NOT NULL, normalized_nickname TEXT NOT NULL,
 valid_from TEXT, valid_to TEXT, source TEXT,
 UNIQUE(player_id,normalized_nickname,valid_from)
);
CREATE INDEX IF NOT EXISTS idx_player_aliases_lookup ON league_player_aliases(normalized_nickname);
CREATE TABLE IF NOT EXISTS league_clans (
 id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS league_clan_memberships (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 player_id TEXT NOT NULL REFERENCES league_players(id),
 clan_id TEXT NOT NULL REFERENCES league_clans(id),
 joined_at TEXT NOT NULL, left_at TEXT,
 CHECK(left_at IS NULL OR left_at>=joined_at)
);
CREATE INDEX IF NOT EXISTS idx_membership_player ON league_clan_memberships(player_id,joined_at);
CREATE TABLE IF NOT EXISTS league_formats (
 id TEXT PRIMARY KEY, label TEXT NOT NULL,
 participant_kind TEXT NOT NULL CHECK(participant_kind IN ('solo','team')),
 min_participants INTEGER NOT NULL CHECK(min_participants>0),
 points_rules_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS league_tournaments (
 id TEXT PRIMARY KEY, season_id TEXT NOT NULL REFERENCES league_seasons(id),
 format_id TEXT NOT NULL REFERENCES league_formats(id),
 format_version INTEGER NOT NULL,
 format_rules_snapshot TEXT NOT NULL,
 starts_at TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','registration','pending_review','confirmed','cancelled')),
 source TEXT NOT NULL CHECK(source IN ('manual','telegram','import')),
 registration_message_chat_id TEXT, registration_message_id TEXT,
 results_message_chat_id TEXT, results_message_id TEXT,
 created_by TEXT, confirmed_by TEXT, confirmed_at TEXT,
 version INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(registration_message_chat_id,registration_message_id)
);
CREATE INDEX IF NOT EXISTS idx_tournaments_season_date ON league_tournaments(season_id,starts_at DESC);
CREATE TABLE IF NOT EXISTS league_entries (
 id TEXT PRIMARY KEY, tournament_id TEXT NOT NULL REFERENCES league_tournaments(id),
 player_id TEXT NOT NULL REFERENCES league_players(id),
 nickname_snapshot TEXT NOT NULL,
 clan_id_snapshot TEXT REFERENCES league_clans(id),
 entry_position INTEGER NOT NULL CHECK(entry_position>0),
 played INTEGER NOT NULL DEFAULT 0 CHECK(played IN (0,1)),
 replaced_by_entry_id TEXT REFERENCES league_entries(id),
 UNIQUE(tournament_id,player_id), UNIQUE(tournament_id,entry_position)
);
CREATE TABLE IF NOT EXISTS league_results (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 tournament_id TEXT NOT NULL REFERENCES league_tournaments(id),
 entry_id TEXT NOT NULL REFERENCES league_entries(id),
 place INTEGER CHECK(place IS NULL OR place>0),
 games_played INTEGER NOT NULL DEFAULT 0 CHECK(games_played>=0),
 top3 INTEGER NOT NULL DEFAULT 0 CHECK(top3 IN (0,1)),
 top1 INTEGER NOT NULL DEFAULT 0 CHECK(top1 IN (0,1)),
 pts INTEGER NOT NULL DEFAULT 0,
 rule_version INTEGER NOT NULL,
 UNIQUE(tournament_id,entry_id)
);
CREATE INDEX IF NOT EXISTS idx_results_entry ON league_results(entry_id);
CREATE TABLE IF NOT EXISTS league_telegram_messages (
 chat_id TEXT NOT NULL, message_id TEXT NOT NULL,
 tournament_id TEXT REFERENCES league_tournaments(id),
 purpose TEXT NOT NULL CHECK(purpose IN ('registration','results')),
 raw_text TEXT, detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(chat_id,message_id)
);
CREATE TABLE IF NOT EXISTS league_review_events (
 id TEXT PRIMARY KEY, tournament_id TEXT NOT NULL REFERENCES league_tournaments(id),
 action TEXT NOT NULL, actor_user_id TEXT NOT NULL,
 before_json TEXT, after_json TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS league_users (
 id TEXT PRIMARY KEY,
 telegram_user_id TEXT UNIQUE, display_name TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'player' CHECK(role IN ('player','helper','organizer','owner')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Leave the existing tournament_state / tournament_map_stats / tournament_admin
-- and analytics tables completely unchanged.
