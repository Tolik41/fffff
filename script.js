// ===== TELEGRAM INTEGRATION =====
const tg = window.Telegram?.WebApp;

function initTelegram() {
    if (tg) {
        tg.ready();
        tg.expand();
        applyTelegramTheme();
        setupBackButton();
    }
}

function applyTelegramTheme() {
    if (tg && tg.themeParams) {
        const root = document.documentElement;
        const params = tg.themeParams;
        
        if (params.bg_color) root.style.setProperty('--tg-theme-bg-color', params.bg_color);
        if (params.text_color) root.style.setProperty('--tg-theme-text-color', params.text_color);
        if (params.hint_color) root.style.setProperty('--tg-theme-hint-color', params.hint_color);
        if (params.button_color) root.style.setProperty('--tg-theme-button-color', params.button_color);
        if (params.button_text_color) root.style.setProperty('--tg-theme-button-text-color', params.button_text_color);
        if (params.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', params.secondary_bg_color);
    }
}

function setupBackButton() {
    if (tg) {
        tg.BackButton.onClick(() => {
            const currentScreen = document.querySelector('.screen:not(.hidden)');
            if (currentScreen && currentScreen.id !== 'menuScreen') {
                showScreen('menuScreen');
            } else {
                tg.close();
            }
        });
    }
}

function hapticFeedback(type = 'light') {
    if (tg && tg.HapticFeedback) {
        if (type === 'success' || type === 'error' || type === 'warning') {
            tg.HapticFeedback.notificationOccurred(type);
        } else {
            tg.HapticFeedback.impactOccurred(type);
        }
    }
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screenId) {
    hapticFeedback('light');
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show selected screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }
    
    // Show/hide Telegram back button
    if (tg) {
        if (screenId === 'menuScreen') {
            tg.BackButton.hide();
        } else {
            tg.BackButton.show();
        }
    }
    
    // Load screen data
    if (screenId === 'leaderboardScreen') {
        loadLeaderboard();
    } else if (screenId === 'shopScreen') {
        loadShop();
    } else if (screenId === 'gameScreen') {
        startNewGame();
    }
}

function returnToMenu() {
    gameRunning = false;
    document.getElementById('gameOverOverlay').classList.remove('show');
    showScreen('menuScreen');
    updateMenuStats();
}

// ===== GAME VARIABLES =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.getElementById('canvasWrapper');

let score = 0;
let coins = parseInt(localStorage.getItem('towerBlocksCoins') || '0');
let bestScore = parseInt(localStorage.getItem('towerBlocksBestScore') || '0');
let gameRunning = false;
let blocks = [];
let currentBlock = null;
let direction = 1;
let speed = 2;
let blockHeight = 0;
let baseWidth = 0;

// ===== CANVAS SETUP =====
function resizeCanvas() {
    const container = document.querySelector('.canvas-wrapper');
    if (!container) return;
    const size = Math.min(container.clientWidth, window.innerHeight * 0.7);
    canvas.width = size;
    canvas.height = size * 1.5;
}

// ===== BLOCK CLASS =====
class Block {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x + this.width, this.y + this.height
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// ===== HELPER FUNCTIONS =====
function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
        '#F8B739', '#52B788', '#E74C3C', '#9B59B6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function updateCoinsDisplay() {
    document.getElementById('gameCoins').textContent = coins;
    document.getElementById('menuCoins').textContent = coins;
    document.getElementById('shopCoins').textContent = coins;
    document.getElementById('yourCoins').textContent = coins;
    localStorage.setItem('towerBlocksCoins', coins.toString());
}

function updateMenuStats() {
    document.getElementById('menuBestScore').textContent = bestScore;
    document.getElementById('menuCoins').textContent = coins;
}

function startNewGame() {
    resizeCanvas();
    init();
}

function init() {
    blocks = [];
    score = 0;
    direction = 1;
    speed = canvas.width * 0.005;
    blockHeight = canvas.height * 0.04;
    baseWidth = canvas.width * 0.4;
    gameRunning = true;

    document.getElementById('score').textContent = '0';
    updateCoinsDisplay();

    const baseBlock = new Block(
        canvas.width / 2 - baseWidth / 2,
        canvas.height - blockHeight,
        baseWidth,
        blockHeight,
        getRandomColor()
    );
    blocks.push(baseBlock);

    createNewBlock();
}

function createNewBlock() {
    const lastBlock = blocks[blocks.length - 1];
    currentBlock = new Block(
        0,
        lastBlock.y - blockHeight,
        lastBlock.width,
        blockHeight,
        getRandomColor()
    );
}

function update() {
    if (!gameRunning || !currentBlock) return;

    currentBlock.x += speed * direction;

    if (currentBlock.x <= 0 || currentBlock.x + currentBlock.width >= canvas.width) {
        direction *= -1;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let block of blocks) {
        block.draw();
    }

    if (currentBlock && gameRunning) {
        currentBlock.draw();
    }
}

function dropBlock() {
    if (!gameRunning || !currentBlock) return;

    hapticFeedback('light');

    const lastBlock = blocks[blocks.length - 1];
    const overlapStart = Math.max(currentBlock.x, lastBlock.x);
    const overlapEnd = Math.min(
        currentBlock.x + currentBlock.width,
        lastBlock.x + lastBlock.width
    );
    const overlapWidth = overlapEnd - overlapStart;

    if (overlapWidth <= 0) {
        endGame();
        return;
    }

    const accuracy = overlapWidth / currentBlock.width;
    if (accuracy > 0.95) {
        hapticFeedback('success');
    }

    currentBlock.x = overlapStart;
    currentBlock.width = overlapWidth;
    blocks.push(currentBlock);

    score++;
    document.getElementById('score').textContent = score;

    if (score % 5 === 0) {
        speed += canvas.width * 0.001;
    }

    if (blocks.length > 12) {
        blocks.shift();
        for (let block of blocks) {
            block.y += blockHeight;
        }
    }

    createNewBlock();
}

function endGame() {
    gameRunning = false;
    hapticFeedback('error');

    const earnedCoins = Math.floor(score / 2);
    coins += earnedCoins;
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('coinsEarned').textContent = earnedCoins;
    document.getElementById('bestScore').textContent = bestScore;

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('towerBlocksBestScore', bestScore.toString());
        hapticFeedback('success');
    }

    updateCoinsDisplay();
    document.getElementById('gameOverOverlay').classList.add('show');
}

function restartGame() {
    document.getElementById('gameOverOverlay').classList.remove('show');
    hapticFeedback('medium');
    init();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ===== LEADERBOARD =====
let currentLeaderboardTab = 'global';

function switchTab(tab) {
    currentLeaderboardTab = tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadLeaderboard();
    hapticFeedback('light');
}

function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';

    // Mock data - replace with real API call
    const mockData = [
        { name: 'Player 1', score: 150, coins: 500 },
        { name: 'Player 2', score: 120, coins: 400 },
        { name: 'Player 3', score: 100, coins: 350 },
        { name: 'Player 4', score: 85, coins: 280 },
        { name: 'Player 5', score: 70, coins: 220 },
        { name: 'Player 6', score: 65, coins: 200 },
        { name: 'Player 7', score: 55, coins: 180 },
        { name: 'Player 8', score: 45, coins: 150 },
    ];

    mockData.forEach((player, index) => {
        const rankClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';
        
        const item = document.createElement('div');
        item.className = 'rank-item';
        item.innerHTML = `
            <div class="rank-position ${rankClass}">#${index + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${player.name}</div>
                <div class="rank-coins">💰 ${player.coins}</div>
            </div>
            <div class="rank-score">${player.score}</div>
        `;
        leaderboardList.appendChild(item);
    });

    // Update your rank
    document.getElementById('yourRank').textContent = '15';
    document.getElementById('yourScore').textContent = bestScore;
    updateCoinsDisplay();
}

// ===== SHOP =====
let currentCategory = 'blocks';

const shopData = {
    blocks: [
        { id: 1, name: 'Classic', icon: '🟦', price: 0, owned: true },
        { id: 2, name: 'Rainbow', icon: '🌈', price: 100, owned: false },
        { id: 3, name: 'Gold', icon: '🟨', price: 200, owned: false },
        { id: 4, name: 'Diamond', icon: '💎', price: 500, owned: false },
        { id: 5, name: 'Fire', icon: '🔥', price: 300, owned: false },
        { id: 6, name: 'Ice', icon: '❄️', price: 300, owned: false },
    ],
    backgrounds: [
        { id: 7, name: 'Sky', icon: '🌤️', price: 0, owned: true },
        { id: 8, name: 'Sunset', icon: '🌅', price: 150, owned: false },
        { id: 9, name: 'Night', icon: '🌃', price: 200, owned: false },
        { id: 10, name: 'Space', icon: '🌌', price: 400, owned: false },
    ],
    'power-ups': [
        { id: 11, name: 'Slow Motion', icon: '⏱️', price: 50, owned: false },
        { id: 12, name: 'Wider Base', icon: '↔️', price: 100, owned: false },
        { id: 13, name: 'Double Coins', icon: '💰', price: 200, owned: false },
        { id: 14, name: 'Perfect Drop', icon: '🎯', price: 300, owned: false },
    ]
};

function switchCategory(category) {
    currentCategory = category;
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadShop();
    hapticFeedback('light');
}

function loadShop() {
    const shopItems = document.getElementById('shopItems');
    shopItems.innerHTML = '';
    
    updateCoinsDisplay();

    const items = shopData[currentCategory] || [];
    
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `shop-item ${item.owned ? 'owned' : ''}`;
        itemDiv.onclick = () => buyItem(item);
        
        itemDiv.innerHTML = `
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${item.name}</div>
            ${item.owned 
                ? '<div class="item-owned">✓ Owned</div>' 
                : `<div class="item-price">💰 ${item.price}</div>`
            }
        `;
        
        shopItems.appendChild(itemDiv);
    });
}

function buyItem(item) {
    if (item.owned) {
        hapticFeedback('warning');
        return;
    }
    
    if (coins >= item.price) {
        coins -= item.price;
        item.owned = true;
        
        updateCoinsDisplay();
        loadShop();
        
        hapticFeedback('success');
        
        // Save to localStorage
        localStorage.setItem('towerBlocksCoins', coins.toString());
        localStorage.setItem(`shopItem_${item.id}`, 'true');
    } else {
        hapticFeedback('error');
        alert('Not enough coins! 💰');
    }
}

// Load owned items from localStorage
function loadOwnedItems() {
    Object.values(shopData).flat().forEach(item => {
        const owned = localStorage.getItem(`shopItem_${item.id}`);
        if (owned === 'true') {
            item.owned = true;
        }
    });
}

// ===== EVENT LISTENERS =====
canvasWrapper.addEventListener('click', dropBlock);
canvasWrapper.addEventListener('touchstart', (e) => {
    e.preventDefault();
    dropBlock();
});

document.getElementById('restartButton').addEventListener('click', restartGame);

window.addEventListener('resize', () => {
    if (gameRunning) {
        resizeCanvas();
    }
});

// ===== INITIALIZATION =====
initTelegram();
loadOwnedItems();
updateMenuStats();
updateCoinsDisplay();
gameLoop();
