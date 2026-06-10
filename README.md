# Space Cargo Runner

Playable MVP prototype for a legal-safe, skill-based endless runner designed for Telegram Mini App and regular web play.

## Play on Telegram (24/7 Live)

The game is deployed to GitHub Pages and integrated with a Telegram Bot:
* **Live Web App Link**: [https://krrish41.github.io/Void-Velocity/](https://krrish41.github.io/Void-Velocity/)

To play, search for `@voidvelocity_bot` in Telegram on your phone or laptop, open the chat, and click the **Play Game** button in the bottom-left menu area.

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

## Gameplay Mechanics

### Pickups & Economy
- **Cargo (📦 Crate):** Earns **+6 Coins** and **+5 XP** at the end of the run.
- **Crystal (💎 Cyan Diamond):** Earns **+10 Coins**, **+8 XP**, and **+1 Material**.
- **Rare Upgrade Tech (⚙️ Gold Component):** Earns **+18 Coins**, **+12 XP**, and **+3 Materials** (rare component for upgrading).
- **Fuel Tank (⛽ Green Canister):** Restores **+24%** of your ship's fuel tank capacity. Does not occupy cargo space.
- **Repair Kit (🔧 Red Medkit):** Restores **+25%** of your ship's hull integrity. Does not occupy cargo space.

### Cargo Bay Capacity Limit
- Your ship starts with a Cargo Bay capacity (e.g., **`8/8`**).
- All scoring items (Cargo, Crystals, and Tech) occupy 1 slot in your Cargo Bay.
- **Once your Cargo Bay is full, you cannot pick up any more score-bearing items** for the rest of the run. Fuel and Repair Kits can still be collected.
- Upgrade the **Cargo Bay** in the upgrades menu using coins to increase your capacity by **+1** per level.

### Hazards & Obstacles
- **Asteroids (🪨 Grey Rock):** Basic obstacle. Deals **-20 Hull** damage on collision.
- **Satellites (🛰️ Central pod with purple panels):** Advanced obstacle with box collision. Deals **-20 Hull** damage and drains **-18 Fuel**.
- **Space Mines (💥 Red Spiked Orb):** High-damage hazard. Detonates for **-35 Hull** damage on contact.
- **Laser Grids (⚡ Glowing Red Line):** Horizontal barrier with box collision. Deals **-25 Hull** damage.


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
