// ================= TELEGRAM =================

const tg = window.Telegram?.WebApp;

function initTelegram() {

    if (!tg) return;

    tg.ready();

    tg.expand();

    tg.BackButton.onClick(() => {

        const current =
            document.querySelector(
                '.screen:not(.hidden)'
            );

        if (
            current &&
            current.id !== 'menuScreen'
        ) {

            showScreen('menuScreen');

        } else {

            tg.close();
        }
    });
}

function haptic(type = 'light') {

    if (!tg || !tg.HapticFeedback) return;

    if (
        type === 'success' ||
        type === 'error'
    ) {

        tg.HapticFeedback.notificationOccurred(type);

    } else {

        tg.HapticFeedback.impactOccurred(type);
    }
}

// ================= SCREENS =================

function showScreen(id) {

    haptic();

    document
        .querySelectorAll('.screen')
        .forEach(screen => {

            screen.classList.add('hidden');
        });

    const target =
        document.getElementById(id);

    target.classList.remove('hidden');

    if (tg) {

        if (id === 'menuScreen') {

            tg.BackButton.hide();

        } else {

            tg.BackButton.show();
        }
    }

    if (id === 'gameScreen') {

        startGame();
    }

    if (id === 'leaderboardScreen') {

        loadLeaderboard();
    }

    if (id === 'shopScreen') {

        loadShop();
    }
}

function returnToMenu() {

    gameRunning = false;

    inputEnabled = false;

    document
        .getElementById(
            'gameOverOverlay'
        )
        .classList.remove('show');

    showScreen('menuScreen');

    updateStats();
}

// ================= CANVAS =================

const canvas =
    document.getElementById('gameCanvas');

const ctx =
    canvas.getContext('2d');

function resizeCanvas() {

    const size =
        Math.min(
            window.innerWidth * 0.92,
            460
        );

    canvas.width = size;

    canvas.height = size * 1.55;
}

resizeCanvas();

// ================= VARIABLES =================

let score = 0;

let bestScore =
    parseInt(
        localStorage.getItem('towerBest')
    ) || 0;

let coins =
    parseInt(
        localStorage.getItem('towerCoins')
    ) || 0;

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

// ================= INPUT =================

let inputEnabled = false;

let lastInputTime = 0;

function enableGameInput() {

    inputEnabled = false;

    setTimeout(() => {

        inputEnabled = true;

    }, 450);
}

function handleGameTap(e) {

    if (!inputEnabled) return;

    if (!gameRunning) return;

    const now = Date.now();

    if (now - lastInputTime < 120) return;

    lastInputTime = now;

    const current =
        document.querySelector(
            '.screen:not(.hidden)'
        );

    if (
        !current ||
        current.id !== 'gameScreen'
    ) return;

    if (
        document
            .getElementById(
                'gameOverOverlay'
            )
            .classList.contains('show')
    ) return;

    if (
        e.target.closest('button')
    ) return;

    dropBlock();
}

// ================= COLORS =================

const blockPalettes = [

    ['#7fd3ff', '#5ebeff'],
    ['#ffd57e', '#ffb84d'],
    ['#ff9db0', '#ff7290'],
    ['#8effc1', '#55f59a'],
    ['#d7b5ff', '#af7eff']

];

function getPalette() {

    return blockPalettes[
        Math.floor(
            Math.random() *
            blockPalettes.length
        )
    ];
}

// ================= HELPERS =================

function roundRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
) {

    ctx.moveTo(x + radius, y);

    ctx.arcTo(
        x + width,
        y,
        x + width,
        y + height,
        radius
    );

    ctx.arcTo(
        x + width,
        y + height,
        x,
        y + height,
        radius
    );

    ctx.arcTo(
        x,
        y + height,
        x,
        y,
        radius
    );

    ctx.arcTo(
        x,
        y,
        x + width,
        y,
        radius
    );

    ctx.closePath();
}

function updateStats() {

    const ids = [

        'menuBestScore',
        'menuCoins',
        'gameCoins',
        'shopCoins',
        'yourCoins'

    ];

    ids.forEach(id => {

        const el =
            document.getElementById(id);

        if (!el) return;

        if (id === 'menuBestScore') {

            el.textContent = bestScore;

        } else {

            el.textContent = coins;
        }
    });

    localStorage.setItem(
        'towerCoins',
        coins
    );
}

// ================= BLOCK =================

class Block {

    constructor(
        x,
        y,
        width,
        height,
        palette
    ) {

        this.x = x;

        this.y = y;

        this.width = width;

        this.height = height;

        this.palette = palette;

        this.scale = 0;
    }

    update() {

        this.scale +=
            (1 - this.scale) * 0.18;
    }

    draw() {

        this.update();

        const centerX =
            this.x + this.width / 2;

        const centerY =
            this.y + this.height / 2;

        ctx.save();

        ctx.translate(
            centerX,
            centerY
        );

        ctx.scale(
            this.scale,
            this.scale
        );

        ctx.translate(
            -centerX,
            -centerY
        );

        // shadow

        ctx.fillStyle =
            'rgba(0,0,0,.08)';

        ctx.beginPath();

        roundRect(
            ctx,
            this.x + 5,
            this.y + 7,
            this.width,
            this.height,
            12
        );

        ctx.fill();

        // gradient

        const gradient =
            ctx.createLinearGradient(
                this.x,
                this.y,
                this.x,
                this.y + this.height
            );

        gradient.addColorStop(
            0,
            this.palette[0]
        );

        gradient.addColorStop(
            1,
            this.palette[1]
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();

        roundRect(
            ctx,
            this.x,
            this.y,
            this.width,
            this.height,
            12
        );

        ctx.fill();

        // shine

        ctx.fillStyle =
            'rgba(255,255,255,.18)';

        ctx.beginPath();

        roundRect(
            ctx,
            this.x + 4,
            this.y + 4,
            this.width - 8,
            this.height / 2.5,
            10
        );

        ctx.fill();

        ctx.restore();
    }
}

// ================= PARTICLES =================

function spawnParticles(x, y) {

    for (let i = 0; i < 14; i++) {

        particles.push({

            x,
            y,

            vx:
                (Math.random() - .5) * 5,

            vy:
                Math.random() * -4 - 1,

            size:
                Math.random() * 8 + 4,

            alpha:1,

            color:[

                '#ffffff',
                '#7fd3ff',
                '#ffd57e',
                '#ff9db0'

            ][
                Math.floor(
                    Math.random() * 4
                )
            ]
        });
    }
}

function drawParticles() {

    particles.forEach((p, index) => {

        p.x += p.vx;

        p.y += p.vy;

        p.vy += 0.08;

        p.alpha -= 0.02;

        p.size *= 0.985;

        ctx.globalAlpha = p.alpha;

        ctx.fillStyle = p.color;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y + cameraOffset,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.globalAlpha = 1;

        if (p.alpha <= 0) {

            particles.splice(index, 1);
        }
    });
}

// ================= EFFECTS =================

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

function animateScore() {

    const scoreEl =
        document.getElementById('score');

    scoreEl.animate(
        [

            {
                transform:'scale(1)'
            },

            {
                transform:'scale(1.2)'
            },

            {
                transform:'scale(1)'
            }

        ],
        {
            duration:180
        }
    );
}

function spawnComboText(combo) {

    const div =
        document.createElement('div');

    div.className =
        'combo-text';

    div.innerText =
        `PERFECT x${combo}`;

    document.body.appendChild(div);

    setTimeout(() => {

        div.remove();

    }, 1000);
}

// ================= START GAME =================

function startGame() {

    resizeCanvas();

    score = 0;

    combo = 0;

    direction = 1;

    speed =
        canvas.width * 0.006;

    blockHeight =
        canvas.height * 0.045;

    baseWidth =
        canvas.width * 0.42;

    blocks = [];

    currentBlock = null;

    particles = [];

    cameraOffset = 0;

    gameRunning = true;

    enableGameInput();

    document.getElementById(
        'score'
    ).textContent = 0;

    const base =
        new Block(

            canvas.width / 2 -
            baseWidth / 2,

            canvas.height -
            blockHeight - 40,

            baseWidth,

            blockHeight,

            getPalette()
        );

    blocks.push(base);

    createBlock();
}

// ================= CREATE BLOCK =================

function createBlock() {

    const last =
        blocks[blocks.length - 1];

    currentBlock =
        new Block(

            -last.width,

            last.y - blockHeight,

            last.width,

            blockHeight,

            getPalette()
        );

    canvas.animate(
        [

            {
                transform:'scale(1)'
            },

            {
                transform:'scale(1.01)'
            },

            {
                transform:'scale(1)'
            }

        ],
        {
            duration:180
        }
    );
}

// ================= UPDATE =================

function update() {

    if (
        !gameRunning ||
        !currentBlock
    ) return;

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

    const targetOffset =
        Math.max(

            0,

            blocks.length *
            blockHeight -

            canvas.height * 0.55
        );

    cameraOffset +=
        (targetOffset - cameraOffset) * 0.06;
}

// ================= DRAW =================

function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
        );

    gradient.addColorStop(
        0,
        '#9be7ff'
    );

    gradient.addColorStop(
        1,
        '#f6fbff'
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}

function draw() {

    drawBackground();

    ctx.save();

    ctx.translate(
        0,
        cameraOffset
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

    ctx.restore();

    drawParticles();
}

// ================= DROP =================

function dropBlock() {

    if (
        !gameRunning ||
        !currentBlock
    ) return;

    haptic();

    const last =
        blocks[blocks.length - 1];

    const overlapStart =
        Math.max(
            currentBlock.x,
            last.x
        );

    const overlapEnd =
        Math.min(

            currentBlock.x +
            currentBlock.width,

            last.x +
            last.width
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

    if (accuracy > 0.96) {

        combo++;

        perfectEffect();

        spawnComboText(combo);

        haptic('success');

    } else {

        combo = 0;
    }

    currentBlock.x =
        overlapStart;

    currentBlock.width =
        overlapWidth;

    blocks.push(currentBlock);

    score++;

    animateScore();

    document.getElementById(
        'score'
    ).textContent = score;

    speed +=
        canvas.width * 0.00008;

    if (blocks.length > 18) {

        blocks.shift();

        blocks.forEach(block => {

            block.y += blockHeight;
        });
    }

    spawnParticles(

        currentBlock.x +
        currentBlock.width / 2,

        currentBlock.y
    );

    createBlock();
}

// ================= GAME OVER =================

function endGame() {

    gameRunning = false;

    inputEnabled = false;

    haptic('error');

    const earned =
        Math.floor(score / 2);

    coins += earned;

    if (score > bestScore) {

        bestScore = score;

        localStorage.setItem(
            'towerBest',
            bestScore
        );
    }

    updateStats();

    document.getElementById(
        'finalScore'
    ).textContent = score;

    document.getElementById(
        'coinsEarned'
    ).textContent = earned;

    document.getElementById(
        'bestScore'
    ).textContent = bestScore;

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

    startGame();
}

// ================= LEADERBOARD =================

function switchTab(tab) {

    document
        .querySelectorAll('.tab')
        .forEach(btn => {

            btn.classList.remove('active');
        });

    event.target.classList.add(
        'active'
    );

    loadLeaderboard();
}

function loadLeaderboard() {

    const list =
        document.getElementById(
            'leaderboardList'
        );

    list.innerHTML = '';

    const data = [

        ['Oliver',245],
        ['Emma',220],
        ['Lucas',198],
        ['Sophia',176],
        ['Liam',150],
        ['Mia',132],
        ['Noah',120]

    ];

    data.forEach((player, index) => {

        const item =
            document.createElement('div');

        item.className =
            'leader-item';

        item.innerHTML = `

            <div class="leader-left">

                <div class="leader-rank">
                    #${index + 1}
                </div>

                <div class="leader-name">
                    ${player[0]}
                </div>

            </div>

            <div class="leader-score">
                ${player[1]}
            </div>

        `;

        list.appendChild(item);
    });

    document.getElementById(
        'yourScore'
    ).textContent = bestScore;
}

// ================= SHOP =================

let currentCategory = 'blocks';

const shopItemsData = {

    blocks:[

        ['Classic','🟦',0,true],
        ['Candy','🍬',100,false],
        ['Sunset','🌇',250,false],
        ['Ice','❄️',350,false]

    ],

    backgrounds:[

        ['Clouds','☁️',120,false],
        ['Night','🌙',240,false],
        ['Space','🌌',500,false]

    ],

    effects:[

        ['Sparkles','✨',180,false],
        ['Rainbow','🌈',350,false]

    ]
};

function switchCategory(category) {

    currentCategory = category;

    document
        .querySelectorAll('.shop-tab')
        .forEach(btn => {

            btn.classList.remove('active');
        });

    event.target.classList.add(
        'active'
    );

    loadShop();
}

function loadShop() {

    const grid =
        document.getElementById(
            'shopItems'
        );

    grid.innerHTML = '';

    const items =
        shopItemsData[currentCategory];

    items.forEach(item => {

        const div =
            document.createElement('div');

        div.className =
            'shop-card';

        div.innerHTML = `

            <div class="shop-icon">
                ${item[1]}
            </div>

            <div class="shop-name">
                ${item[0]}
            </div>

            <div class="shop-price">

                ${
                    item[3]
                    ? 'OWNED'
                    : '💰 ' + item[2]
                }

            </div>

        `;

        grid.appendChild(div);
    });
}

// ================= EVENTS =================

window.addEventListener(
    'touchstart',
    handleGameTap,
    { passive:true }
);

window.addEventListener(
    'mousedown',
    handleGameTap
);

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

// ================= LOOP =================

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );
}

// ================= INIT =================

initTelegram();

updateStats();

gameLoop();
