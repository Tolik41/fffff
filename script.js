// ================= TELEGRAM =================

const tg = window.Telegram?.WebApp;

function initTelegram() {
  if (!tg) return;

  tg.ready();
  tg.expand();

  tg.BackButton.onClick(() => {
    const current = document.querySelector('.screen:not(.hidden)');
    if (current && current.id !== 'menuScreen') {
      showScreen('menuScreen');
    } else {
      tg.close();
    }
  });
}

function haptic(type = 'light') {
  if (!tg || !tg.HapticFeedback) return;

  if (type === 'success' || type === 'error') {
    tg.HapticFeedback.notificationOccurred(type);
  } else {
    tg.HapticFeedback.impactOccurred(type);
  }
}

// ================= SCREEN SYSTEM =================

let dropArmed = false;
let lastDropAt = 0;

function showScreen(id) {
  haptic('light');

  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.add('hidden');
  });

  const target = document.getElementById(id);
  if (target) target.classList.remove('hidden');

  if (tg) {
    if (id === 'menuScreen') tg.BackButton.hide();
    else tg.BackButton.show();
  }

  if (id === 'gameScreen') startGame();
  if (id === 'leaderboardScreen') loadLeaderboard();
  if (id === 'shopScreen') loadShop();
}

function returnToMenu() {
  gameRunning = false;
  document.getElementById('gameOverOverlay').classList.remove('show');
  updateStats();
  showScreen('menuScreen');
}

// ================= GAME VARIABLES =================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;

let bestScore =
  parseInt(localStorage.getItem('towerBest'), 10) || 0;

let coins =
  parseInt(localStorage.getItem('towerCoins'), 10) || 0;

let gameRunning = false;

let blocks = [];
let currentBlock = null;

let direction = 1;
let speed = 2;

let blockHeight = 34;
let baseWidth = 180;

let cameraOffset = 0;

let combo = 0;

let particles = [];

function resizeCanvas() {
  const size = Math.min(window.innerWidth * 0.92, 460);
  canvas.width = size;
  canvas.height = size * 1.55;
}

resizeCanvas();

const blockPalettes = [
  ['#7fd3ff', '#5ebeff'],
  ['#ffd57e', '#ffb84d'],
  ['#ff9db0', '#ff7290'],
  ['#8effc1', '#55f59a'],
  ['#d7b5ff', '#af7eff']
];

// ================= HELPERS =================

function roundRect(ctx2, x, y, width, height, radius) {
  ctx2.moveTo(x + radius, y);
  ctx2.arcTo(x + width, y, x + width, y + height, radius);
  ctx2.arcTo(x + width, y + height, x, y + height, radius);
  ctx2.arcTo(x, y + height, x, y, radius);
  ctx2.arcTo(x, y, x + width, y, radius);
  ctx2.closePath();
}

function getPalette() {
  return blockPalettes[
    Math.floor(Math.random() * blockPalettes.length)
  ];
}

function updateStats() {
  const ids = ['menuBestScore', 'menuCoins', 'gameCoins', 'shopCoins', 'yourCoins'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'menuBestScore') el.textContent = bestScore;
    if (id === 'menuCoins') el.textContent = coins;
    if (id === 'gameCoins') el.textContent = coins;
    if (id === 'shopCoins') el.textContent = coins;
    if (id === 'yourCoins') el.textContent = coins;
  });

  localStorage.setItem('towerCoins', String(coins));
}

// ================= BLOCK =================

class Block {
  constructor(x, y, width, height, palette) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.palette = palette;
    this.scale = 0;
  }

  update() {
    this.scale += (1 - this.scale) * 0.18;
  }

  draw() {
    this.update();

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-centerX, -centerY);

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    ctx.beginPath();
    roundRect(ctx, this.x + 6, this.y + 8, this.width, this.height, 12);
    ctx.fill();

    // main gradient
    const gradient = ctx.createLinearGradient(
      this.x, this.y,
      this.x, this.y + this.height
    );
    gradient.addColorStop(0, this.palette[0]);
    gradient.addColorStop(1, this.palette[1]);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    roundRect(ctx, this.x, this.y, this.width, this.height, 12);
    ctx.fill();

    // glossy top
    ctx.fillStyle = 'rgba(255,255,255,.20)';
    ctx.beginPath();
    roundRect(ctx, this.x + 4, this.y + 4, this.width - 8, this.height / 2.6, 10);
    ctx.fill();

    // subtle rim
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, this.x, this.y, this.width, this.height, 12);
    ctx.stroke();

    ctx.restore();
  }
}

// ================= PARTICLES =================

function spawnParticles(x, y) {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * -4 - 1.1,
      size: Math.random() * 8 + 3.5,
      alpha: 1,
      color: ['#ffffff', '#7fd3ff', '#ffd57e', '#ff9db0'][
        Math.floor(Math.random() * 4)
      ]
    });
  }
}

function drawParticles() {
  if (!particles.length) return;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;

    p.alpha -= 0.025;
    p.size *= 0.985;

    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;

    ctx.beginPath();
    ctx.arc(p.x, p.y + cameraOffset, p.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    if (p.alpha <= 0 || p.size < 0.3) particles.splice(i, 1);
  }
}

// ================= PERFECT EFFECT =================

function perfectEffect() {
  canvas.classList.add('perfect-flash');
  setTimeout(() => canvas.classList.remove('perfect-flash'), 350);
}

function animateScore() {
  const scoreEl = document.getElementById('score');
  scoreEl.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.22)' },
      { transform: 'scale(1)' }
    ],
    { duration: 180, easing: 'ease-out' }
  );
}

// ================= GAME INIT =================

function startGame() {
  resizeCanvas();

  score = 0;
  combo = 0;

  direction = 1;
  speed = canvas.width * 0.006;

  blockHeight = canvas.height * 0.045;
  baseWidth = canvas.width * 0.42;

  blocks = [];
  currentBlock = null;
  cameraOffset = 0;
  particles = [];

  document.getElementById('score').textContent = '0';
  document.getElementById('finalScore').textContent = '0';
  updateStats();

  // critical part: prevent immediate drop
  dropArmed = false;
  lastDropAt = 0;
  gameRunning = true;

  const base = new Block(
    canvas.width / 2 - baseWidth / 2,
    canvas.height - blockHeight - 40,
    baseWidth,
    blockHeight,
    getPalette()
  );

  blocks.push(base);
  createBlock();

  // arm after a short delay so the first tap can't instantly kill the block
  setTimeout(() => {
    dropArmed = true;
  }, 280);
}

function createBlock() {
  const last = blocks[blocks.length - 1];
  currentBlock = new Block(
    -last.width,
    last.y - blockHeight,
    last.width,
    blockHeight,
    getPalette()
  );

  // small “pop”
  canvas.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.01)' },
      { transform: 'scale(1)' }
    ],
    { duration: 180, easing: 'ease-out' }
  );
}

// ================= LOOP =================

function update() {
  if (!gameRunning || !currentBlock) return;

  currentBlock.x += speed * direction;

  if (currentBlock.x <= 0 || currentBlock.x + currentBlock.width >= canvas.width) {
    direction *= -1;
  }

  // smooth camera
  const targetOffset = Math.max(
    0,
    blocks.length * blockHeight - canvas.height * 0.55
  );
  cameraOffset += (targetOffset - cameraOffset) * 0.06;
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#9be7ff');
  gradient.addColorStop(1, '#f6fbff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw() {
  drawBackground();

  ctx.save();
  ctx.translate(0, cameraOffset);

  blocks.forEach(b => b.draw());
  if (currentBlock && gameRunning) currentBlock.draw();

  ctx.restore();

  drawParticles();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// ================= DROP =================

function dropBlock() {
  if (!gameRunning || !currentBlock) return;
  if (!dropArmed) return;

  const now = performance.now();
  if (now - lastDropAt < 90) return; // debounce
  lastDropAt = now;

  haptic('light');

  const last = blocks[blocks.length - 1];

  const overlapStart = Math.max(currentBlock.x, last.x);
  const overlapEnd = Math.min(
    currentBlock.x + currentBlock.width,
    last.x + last.width
  );

  const overlapWidth = overlapEnd - overlapStart;

  if (overlapWidth <= 0) {
    endGame();
    return;
  }

  const accuracy = overlapWidth / currentBlock.width;

  if (accuracy > 0.96) {
    combo++;
    perfectEffect();
    spawnParticles(
      currentBlock.x + currentBlock.width / 2,
      currentBlock.y
    );
    haptic('success');
  } else {
    combo = 0;
  }

  currentBlock.x = overlapStart;
  currentBlock.width = overlapWidth;

  blocks.push(currentBlock);

  score++;
  document.getElementById('score').textContent = String(score);

  animateScore();

  // difficulty scaling
  speed += canvas.width * 0.00008;

  // recycle
  if (blocks.length > 18) {
    blocks.shift();
    blocks.forEach(b => { b.y += blockHeight; });
  }

  spawnParticles(
    currentBlock.x + currentBlock.width / 2,
    currentBlock.y
  );

  createBlock();
}

// ================= GAME OVER =================

function endGame() {
  gameRunning = false;
  dropArmed = false;

  haptic('error');

  const earned = Math.floor(score / 2);
  coins += earned;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('towerBest', String(bestScore));
    haptic('success');
  }

  updateStats();

  document.getElementById('finalScore').textContent = String(score);
  document.getElementById('coinsEarned').textContent = String(earned);
  document.getElementById('bestScore').textContent = String(bestScore);

  document.getElementById('gameOverOverlay').classList.add('show');
}

function restartGame() {
  document.getElementById('gameOverOverlay').classList.remove('show');
  startGame();
}

// ================= LEADERBOARD =================

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
  // “event.target” безопаснее, но оставим как было:
  event.target.classList.add('active');
  loadLeaderboard();
}

function loadLeaderboard() {
  const list = document.getElementById('leaderboardList');
  list.innerHTML = '';

  const data = [
    { name: 'Oliver', score: 245, coins: 420 },
    { name: 'Emma', score: 220, coins: 390 },
    { name: 'Lucas', score: 198, coins: 360 },
    { name: 'Sophia', score: 176, coins: 310 },
    { name: 'Liam', score: 150, coins: 280 },
    { name: 'Mia', score: 132, coins: 250 },
    { name: 'Noah', score: 120, coins: 220 }
  ];

  data.forEach((p, idx) => {
    const item = document.createElement('div');
    item.className = 'leader-item';
    item.innerHTML = `
      <div class="leader-left">
        <div class="leader-rank">#${idx + 1}</div>
        <div>
          <div class="leader-name">${p.name}</div>
          <div class="leader-coins">💰 ${p.coins}</div>
        </div>
      </div>
      <div class="leader-score">${p.score}</div>
    `;
    list.appendChild(item);
  });

  document.getElementById('yourRank').textContent = '15';
  document.getElementById('yourScore').textContent = String(bestScore);
  updateStats();
}

// ================= SHOP =================

let currentCategory = 'blocks';

const shopItemsData = {
  blocks: [
    ['Classic', '🟦', 0, true],
    ['Candy', '🍬', 100, false],
    ['Sunset', '🌇', 250, false],
    ['Ice', '❄️', 350, false]
  ],
  backgrounds: [
    ['Clouds', '☁️', 120, false],
    ['Night', '🌙', 240, false],
    ['Space', '🌌', 500, false]
  ],
  effects: [
    ['Sparkles', '✨', 180, false],
    ['Rainbow', '🌈', 350, false]
  ]
};

function switchCategory(category) {
  currentCategory = category;

  document.querySelectorAll('.shop-tab').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  loadShop();
}

function loadShop() {
  const grid = document.getElementById('shopItems');
  grid.innerHTML = '';

  const items = shopItemsData[currentCategory] || [];

  updateStats();

  items.forEach((itemArr, i) => {
    const [name, icon, price, ownedDefault] = itemArr;

    const uniqueId = `shop_${currentCategory}_${name}`;
    const owned = localStorage.getItem(uniqueId) === 'true' || ownedDefault === true;

    const div = document.createElement('div');
    div.className = `shop-card ${owned ? 'owned' : ''}`;

    div.onclick = () => buyItem({ name, icon, price, owned, uniqueId });

    div.innerHTML = `
      <div class="shop-icon">${icon}</div>
      <div class="shop-name">${name}</div>
      <div class="shop-price">
        ${owned ? 'OWNED' : '💰 ' + price}
      </div>
    `;
    grid.appendChild(div);
  });
}

function buyItem({ name, icon, price, owned, uniqueId }) {
  if (owned) {
    haptic('error');
    return;
  }

  if (coins < price) {
    haptic('error');
    alert('Not enough coins 💰');
    return;
  }

  coins -= price;
  localStorage.setItem(uniqueId, 'true');
  updateStats();

  loadShop();
  haptic('success');
}

// ================= EVENTS =================

// IMPORTANT: allow drop anywhere on screen, but only when armed
document.addEventListener('pointerdown', () => {
  const current = document.querySelector('.screen:not(.hidden)');
  const gameOver = document.getElementById('gameOverOverlay');

  if (
    current &&
    current.id === 'gameScreen' &&
    gameRunning &&
    !gameOver.classList.contains('show')
  ) {
    dropBlock();
  }
});

document.getElementById('restartButton')
  ?.addEventListener('click', restartGame);

window.addEventListener('resize', () => {
  if (gameRunning) resizeCanvas();
});

// ================= INIT =================

initTelegram();
updateStats();
loadOwnedNoop();
requestAnimationFrame(gameLoop);

function loadOwnedNoop() {
  // no-op placeholder
  // (shop uses localStorage by keys when opened)
}
