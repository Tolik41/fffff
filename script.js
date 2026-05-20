// ================= TELEGRAM =================

const tg = window.Telegram?.WebApp;

function initTelegram() {
    if (!tg) return;

    tg.ready();
    tg.expand();

    applyTelegramTheme();
    setupBackButton();
}

function applyTelegramTheme() {
    if (!tg || !tg.themeParams) return;

    const root = document.documentElement;
    const params = tg.themeParams;

    if (params.bg_color)
        root.style.setProperty('--bg', params.bg_color);

    if (params.text_color)
        root.style.setProperty('--text', params.text_color);
}

function setupBackButton() {
    if (!tg) return;

    tg.BackButton.onClick(() => {
        const currentScreen =
            document.querySelector('.screen:not(.hidden)');

        if (
            currentScreen &&
            currentScreen.id !== 'menuScreen'
        ) {
            showScreen('menuScreen');
        } else {
            tg.close();
        }
    });
}

function hapticFeedback(type = 'light') {
    if (!tg || !tg.HapticFeedback) return;

    if (
        type === 'success' ||
        type === 'error' ||
        type === 'warning'
    ) {
        tg.HapticFeedback.notificationOccurred(type);
    } else {
        tg.HapticFeedback.impactOccurred(type);
    }
}

// ================= SCREEN SYSTEM =================

function showScreen(screenId) {

    hapticFeedback('light');

    document
        .querySelectorAll('.screen')
        .forEach(screen => {
            screen.classList.add('hidden');
        });

    const target =
        document.getElementById(screenId);

    if (target) {
        target.classList.remove('hidden');
    }

    if (tg) {
        if (screenId === 'menuScreen') {
            tg.BackButton.hide();
        } else {
            tg.BackButton.show();
        }
    }

    if (screenId === 'gameScreen') {
        startNewGame();
    }

    if (screenId === 'leaderboardScreen') {
        loadLeaderboard();
    }

    if (screenId === 'shopScreen') {
        loadShop();
    }
}

function returnToMenu() {
    gameRunning = false;

    document
        .getElementById('gameOverOverlay')
        .classList.remove('show');

    showScreen('menuScreen');

    updateMenuStats();
}

// ================= GAME VARIABLES =================

const canvas =
    document.getElementById('gameCanvas');

const ctx =
    canvas.getContext('2d');

let score = 0;

let coins =
    parseInt(
        localStorage.getItem('towerBlocksCoins')
    ) || 0;

let bestScore =
    parseInt(
        localStorage.getItem('towerBlocksBestScore')
    ) || 0;

let gameRunning = false;

let blocks = [];
let currentBlock = null;

let direction = 1;

let speed = 2;

let blockHeight = 0;
let baseWidth = 0;

// ================= CANVAS =================

function resizeCanvas() {

    const size =
        Math.min(
            window.innerWidth * 0.92,
            window.innerHeight * 0.65
        );

    canvas.width = size;
    canvas.height = size * 1.45;
}

resizeCanvas();

// ================= BLOCK CLASS =================

class Block {

    constructor(
        x,
        y,
        width,
        height,
        color
    ) {

        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;

        this.color = color;
    }

    draw() {

        const gradient =
            ctx.createLinearGradient(
                this.x,
                this.y,
                this.x + this.width,
                this.y + this.height
            );

        gradient.addColorStop(
            0,
            this.color
        );

        gradient.addColorStop(
            1,
            '#ffffff22'
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.roundRect(
            this.x,
            this.y,
            this.width,
            this.height,
            10
        );

        ctx.fill();

        ctx.strokeStyle =
            'rgba(255,255,255,.15)';

        ctx.lineWidth = 2;

        ctx.stroke();

        // glossy effect

        ctx.fillStyle =
            'rgba(255,255,255,.12)';

        ctx.beginPath();

        ctx.roundRect(
            this.x + 4,
            this.y + 4,
            this.width - 8,
            this.height / 3,
            6
        );

        ctx.fill();
    }
}

// ================= HELPERS =================

function getRandomColor() {

    const colors = [
        '#4ea1ff',
        '#7c4dff',
        '#ff6b81',
        '#ffd166',
        '#57ff8a',
        '#00d4ff',
        '#ff9f43'
    ];

    return colors[
        Math.floor(
            Math.random() * colors.length
        )
    ];
}

function updateCoinsDisplay() {

    const ids = [
        'gameCoins',
        'menuCoins',
        'shopCoins',
        'yourCoins'
    ];

    ids.forEach(id => {

        const el =
            document.getElementById(id);

        if (el) {
            el.textContent = coins;
        }
    });

    localStorage.setItem(
        'towerBlocksCoins',
        coins.toString()
    );
}

function updateMenuStats() {

    document.getElementById(
        'menuBestScore'
    ).textContent = bestScore;

    document.getElementById(
        'menuCoins'
    ).textContent = coins;
}

// ================= GAME INIT =================

function startNewGame() {

    resizeCanvas();

    init();
}

function init() {

    blocks = [];

    score = 0;

    direction = 1;

    speed =
        canvas.width * 0.005;

    blockHeight =
        canvas.height * 0.04;

    baseWidth =
        canvas.width * 0.4;

    gameRunning = true;

    document.getElementById(
        'score'
    ).textContent = '0';

    updateCoinsDisplay();

    const baseBlock =
        new Block(
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

    const lastBlock =
        blocks[blocks.length - 1];

    currentBlock =
        new Block(
            0,
            lastBlock.y - blockHeight,
            lastBlock.width,
            blockHeight,
            getRandomColor()
        );

    canvas.animate(
        [
            { transform: 'scale(1)' },
            { transform: 'scale(1.01)' },
            { transform: 'scale(1)' }
        ],
        {
            duration: 180
        }
    );
}

// ================= GAME LOOP =================

function update() {

    if (!gameRunning || !currentBlock)
        return;

    currentBlock.x +=
        speed * direction;

    if (
        currentBlock.x <= 0 ||
        currentBlock.x +
        currentBlock.width >=
        canvas.width
    ) {
        direction *= -1;
    }
}

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    blocks.forEach(block => {
        block.draw();
    });

    if (
        currentBlock &&
        gameRunning
    ) {
        currentBlock.draw();
    }
}

// ================= DROP =================

function dropBlock() {

    if (
        !gameRunning ||
        !currentBlock
    ) return;

    hapticFeedback('light');

    spawnParticles();

    const lastBlock =
        blocks[blocks.length - 1];

    const overlapStart =
        Math.max(
            currentBlock.x,
            lastBlock.x
        );

    const overlapEnd =
        Math.min(
            currentBlock.x +
            currentBlock.width,

            lastBlock.x +
            lastBlock.width
        );

    const overlapWidth =
        overlapEnd - overlapStart;

    if (overlapWidth <= 0) {
        endGame();
        return;
    }

    const accuracy =
        overlapWidth /
        currentBlock.width;

    if (accuracy > 0.95) {
        hapticFeedback('success');
        perfectEffect();
    }

    currentBlock.x =
        overlapStart;

    currentBlock.width =
        overlapWidth;

    blocks.push(currentBlock);

    score++;

    const scoreEl =
        document.getElementById('score');

    scoreEl.textContent = score;

    scoreEl.classList.remove(
        'score-pop'
    );

    void scoreEl.offsetWidth;

    scoreEl.classList.add(
        'score-pop'
    );

    if (score % 5 === 0) {
        speed +=
            canvas.width * 0.001;
    }

    if (blocks.length > 12) {

        blocks.shift();

        blocks.forEach(block => {
            block.y += blockHeight;
        });
    }

    createNewBlock();
}

// ================= GAME OVER =================

function endGame() {

    gameRunning = false;

    hapticFeedback('error');

    const earnedCoins =
        Math.floor(score / 2);

    coins += earnedCoins;

    document.getElementById(
        'finalScore'
    ).textContent = score;

    document.getElementById(
        'coinsEarned'
    ).textContent = earnedCoins;

    if (score > bestScore) {

        bestScore = score;

        localStorage.setItem(
            'towerBlocksBestScore',
            bestScore.toString()
        );

        hapticFeedback('success');
    }

    document.getElementById(
        'bestScore'
    ).textContent = bestScore;

    updateCoinsDisplay();

    document
        .getElementById(
            'gameOverOverlay'
        )
        .classList.add('show');
}

function restartGame() {

    document
        .getElementById(
            'gameOverOverlay'
        )
        .classList.remove('show');

    hapticFeedback('medium');

    init();
}

// ================= LOOP =================

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );
}

// ================= PARTICLES =================

function spawnParticles() {

    for (let i = 0; i < 10; i++) {

        const p =
            document.createElement('div');

        p.className = 'particle';

        p.style.left =
            Math.random() *
            window.innerWidth + 'px';

        p.style.top =
            (window.innerHeight - 120) + 'px';

        const colors = [
            '#4ea1ff',
            '#ffd166',
            '#ffffff',
            '#57ff8a'
        ];

        p.style.background =
            colors[
                Math.floor(
                    Math.random() *
                    colors.length
                )
            ];

        document.body.appendChild(p);

        setTimeout(() => {
            p.remove();
        }, 800);
    }
}

function perfectEffect() {

    canvas.classList.add(
        'perfect-flash'
    );

    setTimeout(() => {
        canvas.classList.remove(
            'perfect-flash'
        );
    }, 350);
}

// ================= LEADERBOARD =================

let currentLeaderboardTab =
    'global';

function switchTab(tab) {

    currentLeaderboardTab = tab;

    document
        .querySelectorAll('.tab-btn')
        .forEach(btn => {
            btn.classList.remove('active');
        });

    event.target.classList.add(
        'active'
    );

    loadLeaderboard();

    hapticFeedback('light');
}

function loadLeaderboard() {

    const list =
        document.getElementById(
            'leaderboardList'
        );

    list.innerHTML = '';

    const mockData = [
        { name:'Alpha', score:250, coins:500 },
        { name:'Nova', score:220, coins:430 },
        { name:'Ghost', score:180, coins:400 },
        { name:'Pixel', score:160, coins:310 },
        { name:'Sky', score:130, coins:280 },
        { name:'Zen', score:100, coins:240 }
    ];

    mockData.forEach(
        (player, index) => {

        const item =
            document.createElement('div');

        item.className =
            'rank-item';

        item.innerHTML = `
            <div class="rank-position">
                #${index + 1}
            </div>

            <div class="rank-info">

                <div class="rank-name">
                    ${player.name}
                </div>

                <div class="rank-coins">
                    💰 ${player.coins}
                </div>

            </div>

            <div class="rank-score">
                ${player.score}
            </div>
        `;

        list.appendChild(item);
    });

    document.getElementById(
        'yourRank'
    ).textContent = 15;

    document.getElementById(
        'yourScore'
    ).textContent = bestScore;

    updateCoinsDisplay();
}

// ================= SHOP =================

let currentCategory = 'blocks';

const shopData = {

    blocks: [

        {
            id:1,
            name:'Classic',
            icon:'🟦',
            price:0,
            owned:true
        },

        {
            id:2,
            name:'Rainbow',
            icon:'🌈',
            price:100,
            owned:false
        },

        {
            id:3,
            name:'Gold',
            icon:'🟨',
            price:200,
            owned:false
        },

        {
            id:4,
            name:'Fire',
            icon:'🔥',
            price:350,
            owned:false
        }
    ],

    backgrounds: [

        {
            id:5,
            name:'Sunset',
            icon:'🌅',
            price:150,
            owned:false
        },

        {
            id:6,
            name:'Space',
            icon:'🌌',
            price:400,
            owned:false
        }
    ],

    'power-ups': [

        {
            id:7,
            name:'Slow Motion',
            icon:'⏱️',
            price:200,
            owned:false
        },

        {
            id:8,
            name:'Perfect Drop',
            icon:'🎯',
            price:500,
            owned:false
        }
    ]
};

function switchCategory(category) {

    currentCategory = category;

    document
        .querySelectorAll('.category-btn')
        .forEach(btn => {
            btn.classList.remove('active');
        });

    event.target.classList.add(
        'active'
    );

    loadShop();

    hapticFeedback('light');
}

function loadShop() {

    const shopItems =
        document.getElementById(
            'shopItems'
        );

    shopItems.innerHTML = '';

    updateCoinsDisplay();

    const items =
        shopData[currentCategory];

    items.forEach(item => {

        const div =
            document.createElement('div');

        div.className =
            `shop-item ${
                item.owned
                ? 'owned'
                : ''
            }`;

        div.onclick =
            () => buyItem(item);

        div.innerHTML = `

            <div class="item-icon">
                ${item.icon}
            </div>

            <div class="item-name">
                ${item.name}
            </div>

            ${
                item.owned

                ? '<div class="item-owned">OWNED</div>'

                : `<div class="item-price">
                    💰 ${item.price}
                   </div>`
            }
        `;

        shopItems.appendChild(div);
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

        localStorage.setItem(
            `shopItem_${item.id}`,
            'true'
        );

        updateCoinsDisplay();

        loadShop();

        hapticFeedback('success');

    } else {

        hapticFeedback('error');

        alert(
            'Not enough coins 💰'
        );
    }
}

function loadOwnedItems() {

    Object.values(shopData)
        .flat()
        .forEach(item => {

        const owned =
            localStorage.getItem(
                `shopItem_${item.id}`
            );

        if (owned === 'true') {
            item.owned = true;
        }
    });
}

// ================= EVENTS =================

// TAP ANYWHERE

document.addEventListener(
    'pointerdown',
    () => {

    const currentScreen =
        document.querySelector(
            '.screen:not(.hidden)'
        );

    if (
        currentScreen &&
        currentScreen.id ===
        'gameScreen' &&

        !document
            .getElementById(
                'gameOverOverlay'
            )
            .classList.contains('show')
    ) {
        dropBlock();
    }
});

document
    .getElementById(
        'restartButton'
    )
    .addEventListener(
        'click',
        restartGame
    );

window.addEventListener(
    'resize',
    resizeCanvas
);

// ================= INIT =================

initTelegram();

loadOwnedItems();

updateMenuStats();

updateCoinsDisplay();

gameLoop();
