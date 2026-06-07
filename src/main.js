const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  distance: document.getElementById("distance"),
  fuel: document.getElementById("fuel"),
  hull: document.getElementById("hull"),
  cargo: document.getElementById("cargo"),
  coins: document.getElementById("coins"),
  level: document.getElementById("level"),
  xp: document.getElementById("xp"),
  bestDistance: document.getElementById("bestDistance"),
  materials: document.getElementById("materials"),
  upgrades: document.getElementById("upgrades"),
  missions: document.getElementById("missions"),
  leaderboard: document.getElementById("leaderboard"),
  streak: document.getElementById("streak"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayCopy: document.getElementById("overlayCopy"),
  startButton: document.getElementById("startButton"),
  howToButton: document.getElementById("howToButton"),
  helpButton: document.getElementById("helpButton"),
  boostButton: document.getElementById("boostButton"),
  shieldButton: document.getElementById("shieldButton"),
  leftLane: document.getElementById("leftLane"),
  rightLane: document.getElementById("rightLane"),
  playerName: document.getElementById("playerName")
};

const upgradeCatalog = [
  ["engine", "Engine", "Base speed and lane response"],
  ["shield", "Shield", "Collision protection and recharge"],
  ["fuel", "Fuel Tank", "Maximum fuel capacity"],
  ["magnet", "Magnet", "Cargo and fuel attraction range"],
  ["booster", "Booster", "Boost strength and duration"],
  ["cargoBay", "Cargo Bay", "Run cargo storage capacity"]
];

const pickupValues = {
  cargo: { coins: 6, xp: 5, materials: 0 },
  crystal: { coins: 10, xp: 8, materials: 1 },
  tech: { coins: 18, xp: 12, materials: 3 }
};

const storageKey = "void-velocity-state-v1";
const todayKey = new Date().toISOString().slice(0, 10);
const baseState = {
  coins: 120,
  xp: 0,
  level: 1,
  materials: 0,
  bestDistance: 0,
  runs: 0,
  streak: 1,
  lastLogin: todayKey,
  upgrades: {
    engine: 1,
    shield: 1,
    fuel: 1,
    magnet: 1,
    booster: 1,
    cargoBay: 1
  },
  missions: createDailyMissions(todayKey),
  leaderboard: [
    { name: "Orion", distance: 12520 },
    { name: "Vega", distance: 10240 },
    { name: "Nova", distance: 8710 },
    { name: "Pulse", distance: 7460 }
  ]
};

let state = loadState();
let input = { direction: 0, boost: false };
let lastTime = performance.now();
let activePanel = "ship";
let helpOpen = false;
let resumeAfterHelp = false;
let game = createRun();

function createRun() {
  const stats = getStats();
  return {
    active: false,
    ended: false,
    paused: false,
    distance: 0,
    speed: stats.speed,
    fuel: stats.maxFuel,
    hull: 100,
    cargo: 0,
    cargoLimit: stats.cargoLimit,
    boostTimer: 0,
    shieldTimer: 0,
    shieldCooldown: 0,
    boostCooldown: 0,
    spawnTimer: 0.75,
    pickupTimer: 0,
    hitFlash: 0,
    collected: { cargo: 0, crystal: 0, tech: 0, fuel: 0 },
    boostUses: 0,
    hazardsHit: 0,
    ship: { x: 0.5, y: 0.8, vx: 0 },
    hazards: [],
    pickups: [],
    stars: makeStars(96)
  };
}

function getStats() {
  const u = state.upgrades;
  return {
    speed: 245 + u.engine * 16,
    acceleration: 10.5 + u.engine * 0.9,
    maxFuel: 100 + u.fuel * 16,
    magnetRange: 42 + u.magnet * 18,
    boostDuration: 1.05 + u.booster * 0.18,
    boostPower: 1.52 + u.booster * 0.08,
    shieldDuration: 1.0 + u.shield * 0.18,
    shieldCooldown: Math.max(4.5, 7 - u.shield * 0.35),
    cargoLimit: 7 + u.cargoBay
  };
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    const merged = { ...baseState, ...stored };
    merged.upgrades = { ...baseState.upgrades, ...(stored && stored.upgrades) };
    if (merged.lastLogin !== todayKey) {
      merged.streak = daysBetween(merged.lastLogin, todayKey) === 1 ? merged.streak + 1 : 1;
      merged.lastLogin = todayKey;
      merged.missions = createDailyMissions(todayKey);
    }
    return merged;
  } catch (error) {
    return structuredClone(baseState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function daysBetween(a, b) {
  const oneDay = 86400000;
  return Math.round((new Date(b) - new Date(a)) / oneDay);
}

function createDailyMissions(key) {
  const seed = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const distanceGoal = 2500 + (seed % 5) * 700;
  return [
    { id: "distance", title: "Long Haul", text: `Travel ${distanceGoal} m in a single run`, target: distanceGoal, progress: 0, reward: 90, claimed: false },
    { id: "cargo", title: "Clean Manifest", text: "Collect 16 cargo items", target: 16, progress: 0, reward: 70, claimed: false },
    { id: "boost", title: "Hot Burn", text: "Use boost 4 times", target: 4, progress: 0, reward: 55, claimed: false }
  ];
}

function makeStars(count) {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: 0.7 + Math.random() * 2.2,
    speed: 0.25 + Math.random() * 1.5
  }));
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(320, Math.floor(rect.width * ratio));
  canvas.height = Math.max(480, Math.floor(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function startRun() {
  game = createRun();
  game.active = true;
  game.paused = false;
  helpOpen = false;
  resumeAfterHelp = false;
  ui.overlay.classList.add("hidden");
  
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.MainButton.hide();
  }
}

function resumeRun() {
  helpOpen = false;
  resumeAfterHelp = false;
  game.paused = false;
  ui.overlay.classList.add("hidden");
}

function showIntro() {
  helpOpen = false;
  resumeAfterHelp = false;
  ui.overlayTitle.textContent = "Void Velocity";
  ui.overlayCopy.textContent = "Pilot the cargo vessel, dodge hazards, collect resources, and stretch every drop of fuel.";
  ui.startButton.textContent = "Start Run";
  ui.howToButton.textContent = "How to Play";
  ui.overlay.classList.remove("hidden");
}

function showHowTo() {
  resumeAfterHelp = game.active && !game.ended && !game.paused;
  if (game.active && !game.ended) game.paused = true;
  helpOpen = true;
  ui.overlayTitle.textContent = "How to Play";
  ui.overlayCopy.innerHTML = `
    <ul>
      <li>Hold the left or right side of the screen to slide the ship.</li>
      <li>Collect cargo, crystals, tech, and fuel tanks.</li>
      <li>Dodge asteroids, satellites, mines, and laser barriers.</li>
      <li>Boost only when there is space ahead because it burns fuel faster.</li>
      <li>Use Shield before a tight gap to absorb one bad hit.</li>
    </ul>
  `;
  ui.startButton.textContent = resumeAfterHelp ? "Resume Run" : "Start Run";
  ui.howToButton.textContent = "Back";
  ui.overlay.classList.remove("hidden");
}

function handlePrimaryButton() {
  if (helpOpen && resumeAfterHelp) {
    resumeRun();
    return;
  }
  startRun();
}

function handleSecondaryButton() {
  if (helpOpen) {
    if (resumeAfterHelp) resumeRun();
    else showIntro();
    return;
  }
  showHowTo();
}

function endRun(reason) {
  if (game.ended) return;
  game.active = false;
  game.ended = true;

  const cargoScore = Object.entries(game.collected).reduce((total, [type, count]) => {
    const value = pickupValues[type];
    return total + (value ? value.coins * count : 0);
  }, 0);
  const materialGain = game.collected.crystal + game.collected.tech * 3;
  const coinGain = Math.floor(game.distance / 95) + cargoScore;
  const xpGain = Math.floor(game.distance / 120) + game.cargo * 4;

  state.coins += coinGain;
  state.xp += xpGain;
  state.materials += materialGain;
  state.runs += 1;
  state.bestDistance = Math.max(state.bestDistance, Math.floor(game.distance));
  state.level = Math.max(1, Math.floor(state.xp / 220) + 1);
  updateMissions(game);
  updateLeaderboard();
  saveState();
  renderMeta();

  helpOpen = false;
  resumeAfterHelp = false;
  ui.overlayTitle.textContent = "Run Complete";
  ui.overlayCopy.textContent = `${reason} Delivered ${game.cargo} cargo, earned ${coinGain} coins and ${xpGain} XP.`;
  ui.startButton.textContent = "Run Again";
  ui.howToButton.textContent = "How to Play";
  ui.overlay.classList.remove("hidden");

  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.MainButton.setText("Run Again");
    tg.MainButton.show();
  }
}

function updateMissions(run) {
  for (const mission of state.missions) {
    if (mission.claimed) continue;
    if (mission.id === "distance") mission.progress = Math.max(mission.progress, Math.floor(run.distance));
    if (mission.id === "cargo") mission.progress += run.collected.cargo + run.collected.crystal + run.collected.tech;
    if (mission.id === "boost") mission.progress += run.boostUses;
    if (mission.progress >= mission.target) {
      mission.claimed = true;
      state.coins += mission.reward;
    }
  }
}

function updateLeaderboard() {
  const playerName = getTelegramName();
  const rows = state.leaderboard.filter((row) => row.name !== playerName);
  rows.push({ name: playerName, distance: state.bestDistance });
  state.leaderboard = rows.sort((a, b) => b.distance - a.distance).slice(0, 8);
}

function getTelegramName() {
  const tg = window.Telegram && window.Telegram.WebApp;
  const user = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  return user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "Guest Pilot";
}

function spawnHazard() {
  const types = ["asteroid", "satellite", "laser", "mine"];
  const type = types[Math.floor(Math.random() * types.length)];
  game.hazards.push({
    type,
    x: 0.08 + Math.random() * 0.84,
    y: -0.12,
    r: type === "laser" ? 23 : 14 + Math.random() * 13,
    rot: Math.random() * Math.PI,
    drift: (Math.random() - 0.5) * 0.05
  });
}

function spawnPickup() {
  const roll = Math.random();
  const type = roll > 0.91 ? "fuel" : roll > 0.78 ? "tech" : roll > 0.56 ? "crystal" : "cargo";
  game.pickups.push({
    type,
    x: 0.08 + Math.random() * 0.84,
    y: -0.08,
    r: type === "fuel" ? 17 : 13,
    phase: Math.random() * Math.PI * 2
  });
}

function update(dt) {
  if (!game.active || game.paused) return;
  const stats = getStats();
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  game.boostTimer = Math.max(0, game.boostTimer - dt);
  game.shieldTimer = Math.max(0, game.shieldTimer - dt);
  game.boostCooldown = Math.max(0, game.boostCooldown - dt);
  game.shieldCooldown = Math.max(0, game.shieldCooldown - dt);
  game.hitFlash = Math.max(0, game.hitFlash - dt);

  const boostMultiplier = game.boostTimer > 0 ? stats.boostPower : 1;
  game.speed += (stats.speed * boostMultiplier - game.speed) * Math.min(1, dt * 2.4);
  game.distance += game.speed * dt * 0.9;
  game.fuel -= dt * (3.8 + game.speed / 220 + (game.boostTimer > 0 ? 6.2 : 0));

  game.ship.vx += input.direction * stats.acceleration * dt;
  game.ship.vx *= Math.pow(0.0015, dt);
  game.ship.x = clamp(game.ship.x + game.ship.vx * dt, 0.07, 0.93);

  game.spawnTimer -= dt;
  game.pickupTimer -= dt;
  if (game.spawnTimer <= 0) {
    spawnHazard();
    game.spawnTimer = Math.max(0.48, 1.32 - game.distance / 16000 - Math.random() * 0.2);
  }
  if (game.pickupTimer <= 0) {
    spawnPickup();
    game.pickupTimer = 0.42 + Math.random() * 0.8;
  }

  for (const hazard of game.hazards) {
    hazard.y += dt * (0.18 + game.speed / 1500);
    hazard.x += hazard.drift * dt;
    hazard.rot += dt * 1.2;
  }
  for (const pickup of game.pickups) {
    pickup.y += dt * (0.16 + game.speed / 1800);
    pickup.phase += dt * 3;
    const dx = game.ship.x * width - pickup.x * width;
    const dy = game.ship.y * height - pickup.y * height;
    const d = Math.hypot(dx, dy);
    if (d < stats.magnetRange && pickup.type !== "fuel") {
      pickup.x += (dx / width) * dt * 2.8;
      pickup.y += (dy / height) * dt * 2.8;
    }
  }

  const shipX = game.ship.x * width;
  const shipY = game.ship.y * height;
  const scale = gameScale(width);
  const shipHitRadius = 14 * scale;
  game.hazards = game.hazards.filter((hazard) => {
    const hx = hazard.x * width;
    const hy = hazard.y * height;
    if (hy > height + 80) return false;
    if (Math.hypot(hx - shipX, hy - shipY) < hazard.r * scale * 0.72 + shipHitRadius) {
      collideHazard(hazard);
      return false;
    }
    return true;
  });

  game.pickups = game.pickups.filter((pickup) => {
    const px = pickup.x * width;
    const py = pickup.y * height;
    if (py > height + 60) return false;
    if (Math.hypot(px - shipX, py - shipY) < pickup.r * scale + 20 * scale) {
      collectPickup(pickup);
      return false;
    }
    return true;
  });

  if (game.fuel <= 0) endRun("Fuel depleted.");
  if (game.hull <= 0) endRun("Hull integrity failed.");
}

function collideHazard(hazard) {
  if (game.shieldTimer > 0) {
    game.shieldTimer = Math.max(0, game.shieldTimer - 0.24);
    return;
  }
  game.hazardsHit += 1;
  game.hitFlash = 0.18;
  game.hull -= hazard.type === "mine" ? 35 : hazard.type === "laser" ? 25 : 20;
  game.fuel -= hazard.type === "satellite" ? 18 : 12;
  game.cargo = Math.max(0, game.cargo - 1);
}

function collectPickup(pickup) {
  if (pickup.type === "fuel") {
    game.collected.fuel += 1;
    game.fuel = Math.min(getStats().maxFuel, game.fuel + 24);
    return;
  }
  if (game.cargo >= game.cargoLimit) return;
  game.collected[pickup.type] += 1;
  game.cargo += 1;
}

function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);
  drawSpace(width, height);
  drawRoute(width, height);
  for (const pickup of game.pickups) drawPickup(pickup, width, height);
  for (const hazard of game.hazards) drawHazard(hazard, width, height);
  drawShip(width, height);
  drawHudBars(width, height);
}

function drawSpace(width, height) {
  const scroll = game.distance * 0.00025;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#031018");
  gradient.addColorStop(0.54, "#071621");
  gradient.addColorStop(1, "#120d18");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (const star of game.stars) {
    const y = ((star.y + scroll * star.speed) % 1) * height;
    ctx.fillStyle = star.speed > 1.1 ? "rgba(126, 224, 129, 0.78)" : "rgba(237, 246, 251, 0.68)";
    ctx.beginPath();
    ctx.arc(star.x * width, y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRoute(width, height) {
  ctx.strokeStyle = "rgba(56, 214, 232, 0.16)";
  ctx.lineWidth = 1;
  for (const lane of [0.25, 0.5, 0.75]) {
    ctx.setLineDash([10, 18]);
    ctx.beginPath();
    ctx.moveTo(width * lane, 0);
    ctx.lineTo(width * lane, height);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawShip(width, height) {
  const x = game.ship.x * width;
  const y = game.ship.y * height;
  const shielded = game.shieldTimer > 0;
  const scale = gameScale(width);

  if (shielded) {
    ctx.strokeStyle = "rgba(56, 214, 232, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, (34 + Math.sin(performance.now() / 80) * 2) * scale, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = game.hitFlash > 0 ? "#ff6b7a" : "#edf6fb";
  ctx.strokeStyle = "#38d6e8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(22, 26);
  ctx.lineTo(0, 15);
  ctx.lineTo(-22, 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffc857";
  ctx.beginPath();
  ctx.moveTo(-8, 28);
  ctx.lineTo(0, 48 + Math.random() * 8);
  ctx.lineTo(8, 28);
  ctx.fill();
  ctx.restore();
}

function drawHazard(hazard, width, height) {
  const x = hazard.x * width;
  const y = hazard.y * height;
  const scale = gameScale(width);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(hazard.rot);
  if (hazard.type === "laser") {
    ctx.fillStyle = "rgba(255, 107, 122, 0.86)";
    ctx.fillRect(-76, -6, 152, 12);
    ctx.fillStyle = "#edf6fb";
    ctx.fillRect(-76, -2, 152, 4);
  } else if (hazard.type === "mine") {
    ctx.fillStyle = "#ff6b7a";
    for (let i = 0; i < 8; i += 1) {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -hazard.r - 8, 8, 12);
    }
    ctx.beginPath();
    ctx.arc(0, 0, hazard.r, 0, Math.PI * 2);
    ctx.fill();
  } else if (hazard.type === "satellite") {
    ctx.fillStyle = "#91a6b5";
    ctx.fillRect(-18, -12, 36, 24);
    ctx.fillStyle = "#8a7dff";
    ctx.fillRect(-54, -8, 28, 16);
    ctx.fillRect(26, -8, 28, 16);
  } else {
    ctx.fillStyle = "#6e7781";
    ctx.beginPath();
    for (let i = 0; i < 9; i += 1) {
      const angle = (Math.PI * 2 * i) / 9;
      const r = hazard.r * (0.72 + Math.random() * 0.34);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawPickup(pickup, width, height) {
  const x = pickup.x * width;
  const y = pickup.y * height + Math.sin(pickup.phase) * 4;
  const scale = gameScale(width);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (pickup.type === "fuel") {
    ctx.fillStyle = "#7ee081";
    roundRect(-12, -18, 24, 36, 5);
    ctx.fill();
    ctx.fillStyle = "#031116";
    ctx.fillRect(-6, -8, 12, 16);
  } else if (pickup.type === "crystal") {
    ctx.fillStyle = "#38d6e8";
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(15, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(-15, 0);
    ctx.closePath();
    ctx.fill();
  } else if (pickup.type === "tech") {
    ctx.fillStyle = "#ffc857";
    ctx.rotate(pickup.phase);
    ctx.fillRect(-13, -13, 26, 26);
    ctx.fillStyle = "#061018";
    ctx.fillRect(-5, -5, 10, 10);
  } else {
    ctx.fillStyle = "#c7925b";
    roundRect(-15, -12, 30, 24, 4);
    ctx.fill();
    ctx.strokeStyle = "#ffc857";
    ctx.strokeRect(-10, -7, 20, 14);
  }
  ctx.restore();
}

function drawHudBars(width, height) {
  const fuelPct = clamp(game.fuel / getStats().maxFuel, 0, 1);
  const hullPct = clamp(game.hull / 100, 0, 1);
  drawBar(18, height - 78, width * 0.38, 8, fuelPct, "#7ee081");
  drawBar(18, height - 62, width * 0.38, 8, hullPct, "#ff6b7a");
}

function drawBar(x, y, width, height, value, color) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  roundRect(x, y, width, height, 4);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(x, y, width * value, height, 4);
  ctx.fill();
}

function roundRect(x, y, width, height, radius) {
  if (!ctx.roundRect) {
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    return;
  }
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function renderGameUi() {
  ui.distance.textContent = `${Math.floor(game.distance)} m`;
  ui.fuel.textContent = `${Math.max(0, Math.floor((game.fuel / getStats().maxFuel) * 100))}%`;
  ui.hull.textContent = `${Math.max(0, Math.floor(game.hull))}%`;
  ui.cargo.textContent = `${game.cargo}/${game.cargoLimit}`;
  ui.boostButton.disabled = !game.active || game.paused || game.boostCooldown > 0;
  ui.shieldButton.disabled = !game.active || game.paused || game.shieldCooldown > 0;
}

function renderMeta() {
  ui.playerName.textContent = getTelegramName();
  ui.coins.textContent = state.coins.toLocaleString();
  ui.level.textContent = state.level;
  ui.xp.textContent = state.xp.toLocaleString();
  ui.bestDistance.textContent = `${state.bestDistance.toLocaleString()} m`;
  ui.materials.textContent = state.materials.toLocaleString();
  ui.streak.textContent = `${state.streak} ${state.streak === 1 ? "day" : "days"}`;
  renderUpgrades();
  renderMissions();
  renderLeaderboard();
}

function renderUpgrades() {
  ui.upgrades.innerHTML = "";
  for (const [id, title, text] of upgradeCatalog) {
    const level = state.upgrades[id];
    const cost = upgradeCost(id);
    const row = document.createElement("article");
    row.className = "upgrade";
    row.innerHTML = `
      <div>
        <h3>${title} Lv.${level}</h3>
        <p>${text}</p>
      </div>
      <button type="button" ${state.coins < cost ? "disabled" : ""}>${cost}</button>
    `;
    row.querySelector("button").addEventListener("click", () => buyUpgrade(id));
    ui.upgrades.append(row);
  }
}

function renderMissions() {
  ui.missions.innerHTML = "";
  for (const mission of state.missions) {
    const pct = Math.min(100, Math.floor((mission.progress / mission.target) * 100));
    const row = document.createElement("article");
    row.className = "mission";
    row.innerHTML = `
      <h3>${mission.title}</h3>
      <p>${mission.text}</p>
      <div class="progress"><span style="width: ${pct}%"></span></div>
      <p>${Math.min(mission.progress, mission.target).toLocaleString()} / ${mission.target.toLocaleString()} - ${mission.claimed ? "claimed" : `${mission.reward} coins`}</p>
    `;
    ui.missions.append(row);
  }
}

function renderLeaderboard() {
  ui.leaderboard.innerHTML = "";
  state.leaderboard.forEach((row, index) => {
    const item = document.createElement("li");
    item.className = "rank-row";
    item.innerHTML = `<b>#${index + 1}</b><span>${row.name}</span><strong>${row.distance.toLocaleString()} m</strong>`;
    ui.leaderboard.append(item);
  });
}

function buyUpgrade(id) {
  const cost = upgradeCost(id);
  if (state.coins < cost) return;
  state.coins -= cost;
  state.upgrades[id] += 1;
  saveState();
  renderMeta();
}

function upgradeCost(id) {
  const level = state.upgrades[id];
  const premium = id === "fuel" || id === "cargoBay" ? 18 : 0;
  return 70 + premium + level * level * 42;
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  renderGameUi();
  requestAnimationFrame(loop);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function gameScale(width) {
  return clamp(width / 560, 0.58, 1);
}

function setDirection(value) {
  input.direction = value;
}

function activateBoost() {
  if (!game.active || game.boostCooldown > 0) return;
  const stats = getStats();
  game.boostTimer = stats.boostDuration;
  game.boostCooldown = stats.boostDuration + 1.2;
  game.boostUses += 1;
}

function activateShield() {
  if (!game.active || game.shieldCooldown > 0) return;
  const stats = getStats();
  game.shieldTimer = stats.shieldDuration;
  game.shieldCooldown = stats.shieldCooldown;
}

function bindControls() {
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") setDirection(-1);
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") setDirection(1);
    if (event.key === " " || event.key.toLowerCase() === "w") activateBoost();
    if (event.key.toLowerCase() === "s") activateShield();
  });
  window.addEventListener("keyup", (event) => {
    if (["arrowleft", "arrowright", "a", "d"].includes(event.key.toLowerCase())) setDirection(0);
  });

  const hold = (element, value) => {
    element.addEventListener("pointerdown", () => setDirection(value));
    element.addEventListener("pointerup", () => setDirection(0));
    element.addEventListener("pointercancel", () => setDirection(0));
    element.addEventListener("pointerleave", () => setDirection(0));
  };
  hold(ui.leftLane, -1);
  hold(ui.rightLane, 1);
  ui.boostButton.addEventListener("click", activateBoost);
  ui.shieldButton.addEventListener("click", activateShield);
  ui.startButton.addEventListener("click", handlePrimaryButton);
  ui.howToButton.addEventListener("click", handleSecondaryButton);
  ui.helpButton.addEventListener("click", showHowTo);

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      activePanel = button.dataset.panel;
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab === button));
      document.querySelectorAll(".panel-section").forEach((panel) => {
        panel.classList.toggle("active", panel.id === `${activePanel}Panel`);
      });
    });
  });
}

function initTelegram() {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.MainButton.setText("Start Run");
  tg.MainButton.onClick(startRun);
  tg.MainButton.show();
}

window.addEventListener("resize", resize);
resize();
bindControls();
initTelegram();
renderMeta();
requestAnimationFrame(loop);
