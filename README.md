# Void Velocity

Playable MVP prototype for a legal-safe, skill-based endless runner designed for Telegram Mini App and regular web play.

## Run Locally

```powershell
npm start
```

Open `http://localhost:4173`.

## Controls

- `A` / `Left Arrow`: move left
- `D` / `Right Arrow`: move right
- `Space` / `W`: boost
- `S`: shield
- Mobile: hold the left or right half of the playfield, then use the Boost and Shield buttons.
- Tap `?` or `How to Play` for the in-game guide.

## MVP Scope

- Endless canvas runner with automatic forward acceleration
- Fuel depletion survival clock and fuel pickups
- Hazard collisions that damage hull, drain fuel, and lose cargo
- Cargo, crystal, tech, and fuel pickups
- Persistent local coins, XP, materials, best distance, login streak, upgrades, and daily missions
- Upgrade shop for Engine, Shield, Fuel Tank, Magnet, Booster, and Cargo Bay
- Local leaderboard simulation and Telegram Web App readiness hooks

## Production Direction

The current prototype is dependency-free to keep the first slice easy to run. The production build should move the gameplay scene into Phaser with React/TypeScript for the shell, connect Telegram auth, and validate sessions server-side before leaderboard ingestion.
