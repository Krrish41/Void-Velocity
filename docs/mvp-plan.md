# Void Velocity MVP Plan

## Product Position

Void Velocity is a fast, skill-based endless runner for Telegram Mini App and web. The legal-safe launch scope avoids gambling mechanics entirely: no wagers, betting pools, paid random rewards, loot boxes, or chance-based monetization. Player value comes from dexterity, route reading, resource management, and fixed progression rewards.

## Core Loop

1. Start a run with the player's current ship stats.
2. Move horizontally while the ship auto-accelerates through space.
3. Dodge hazards, collect cargo, recover fuel, and decide when to boost or shield.
4. Run ends when fuel reaches zero or hull reaches zero.
5. Convert delivered resources into coins, XP, and upgrade materials.
6. Spend coins on permanent ship upgrades.
7. Return daily for missions, streaks, cosmetics, and leaderboard attempts.

## Launch MVP

- Guest and Telegram Mini App profile detection.
- Single endless runner mode with deterministic local physics.
- Four hazard classes: asteroids, broken satellites, laser barriers, and space mines.
- Four pickup classes: cargo boxes, energy crystals, rare tech items, and fuel tanks.
- Fuel, hull, distance, cargo limit, boost, shield, and magnet systems.
- Persistent upgrades: Engine, Shield, Fuel Tank, Magnet, Booster, and Cargo Bay.
- Daily missions with fixed rewards.
- Weekly leaderboard ingestion after server validation.
- Admin-editable balance values for spawn rates, mission targets, conversion rates, and upgrade costs.

## Recommended Production Architecture

### Frontend

- React with TypeScript for app shell, panels, shop, missions, profile, and routing.
- Phaser for the gameplay scene, collision loop, sprite batching, camera shake, particles, and object pooling.
- Telegram Mini App SDK for user context, theme params, viewport expansion, haptics, and launch params.
- Socket.IO client for live leaderboard updates and friend challenge events.

### Backend

- Node.js and Express.js REST API.
- Socket.IO gateway for leaderboard and challenge sync.
- PostgreSQL for durable user, economy, session, mission, and leaderboard data.
- Redis or in-memory cache for weekly leaderboard pages and player rank lookups.
- Admin API with role-gated configuration, telemetry, and moderation tools.

## Database Tables

### users

- id
- telegram_id
- username
- display_name
- xp
- level
- coins
- materials
- login_streak
- last_login_at
- created_at
- updated_at

### player_upgrades

- user_id
- engine_level
- shield_level
- fuel_tank_level
- magnet_level
- booster_level
- cargo_bay_level
- updated_at

### game_sessions

- id
- user_id
- started_at
- ended_at
- distance_m
- max_speed
- cargo_collected
- fuel_collected
- hazards_hit
- boost_uses
- shield_uses
- client_seed
- input_hash
- validation_status
- reward_coins
- reward_xp
- reward_materials

### missions

- id
- type
- target_value
- reward_type
- reward_amount
- active_date
- config_json

### user_missions

- user_id
- mission_id
- progress
- completed_at
- claimed_at

### leaderboard_entries

- id
- user_id
- period
- period_start
- distance_m
- session_id
- rank_snapshot
- created_at

### friend_races

- id
- challenger_id
- opponent_id
- target_distance
- challenger_session_id
- opponent_session_id
- status
- expires_at
- resolved_at

## Anti-Cheat Approach

- Server generates a run seed and expected config version before play.
- Client submits session summary, sampled input timeline, pickup counts, collision counts, and hash.
- Server replays or statistically validates distance, fuel usage, cargo totals, boost timing, and hazard collisions.
- Reject impossible sessions before rewards or leaderboard updates.
- Track device/session anomalies such as excessive perfect runs, impossible acceleration, or mismatched config versions.

## Monetization

- Seasonal progression pass with fixed milestone rewards.
- VIP access with premium daily missions and known fixed rewards.
- Cosmetic ship trails, skins, badges, and profile frames.
- No paid random drops, no stake-based entry, no cash-out, no betting, and no prize pools.

## Milestones

### Week 1: Vertical Slice

- Phaser runner scene.
- Telegram launch and guest fallback.
- Local upgrades and missions.
- Basic responsive shell.

### Week 2: Backend Foundation

- User persistence.
- Upgrade purchases.
- Session submission.
- Server-side score validation prototype.

### Week 3: Retention

- Daily missions.
- Login streaks.
- Achievements.
- Weekly leaderboard pages.

### Week 4: Operations

- Admin balance panel.
- Telemetry dashboard.
- Ban and session review tools.
- Production deploy pipeline.
