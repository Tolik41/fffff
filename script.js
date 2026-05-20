/*
Tower Block Telegram Mini App

Описание:
Основная логика игры Tower Block.

Принцип работы:
1. Платформа двигается.
2. Игрок нажимает на экран.
3. Платформа останавливается.
4. Лишняя часть отрезается.
5. Башня растет вверх.
*/

// ======================================================
// 1. Проверка загрузки скрипта
// ======================================================

console.log("SCRIPT LOADED");

// ======================================================
// 2. Telegram Mini Apps
// ======================================================

if (
    typeof window.Telegram !== "undefined" &&
    window.Telegram.WebApp
) {

    Telegram.WebApp.ready();

    Telegram.WebApp.expand();
}

// ======================================================
// 3. Получение HTML элементов
// ======================================================

const canvas =
    document.getElementById("game-canvas");

const ctx =
    canvas.getContext("2d");

const menuScreen =
    document.getElementById("menu-screen");

const gameScreen =
    document.getElementById("game-screen");

const playButton =
    document.getElementById("play-button");

const levelText =
    document.getElementById("level");

const scoreText =
    document.getElementById("score");

const comboText =
    document.getElementById("combo");

// ======================================================
// 4. Настройки игры
// ======================================================

const CONFIG = {

    blockHeight: 30,

    startWidth: 240,

    minWidth: 40,

    speed: 4,

    perfectWindow: 5,

    baseScore: 10
};

// ======================================================
// 5. Размеры canvas
// ======================================================

function resizeCanvas() {

    const dpr =
        window.devicePixelRatio || 1;

    canvas.width =
        window.innerWidth * dpr;

    canvas.height =
        window.innerHeight * dpr;

    canvas.style.width =
        window.innerWidth + "px";

    canvas.style.height =
        window.innerHeight + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);

// ======================================================
// 6. Игровые переменные
// ======================================================

let blocks = [];

let gameRunning = false;

let direction = 1;

let level = 1;

let score = 0;

let combo = 1;

// ======================================================
// 7. Создание стартового блока
// ======================================================

function createBaseBlock() {

    blocks = [

        {

            x:
                window.innerWidth / 2 -
                CONFIG.startWidth / 2,

            y:
                window.innerHeight - 120,

            width:
                CONFIG.startWidth,

            height:
                CONFIG.blockHeight,

            moving: false
        }
    ];
}

// ======================================================
// 8. Создание нового блока
// ======================================================

function createMovingBlock() {

    const lastBlock =
        blocks[blocks.length - 1];

    blocks.push({

        x: 0,

        y:
            lastBlock.y -
            CONFIG.blockHeight,

        width:
            lastBlock.width,

        height:
            CONFIG.blockHeight,

        moving: true
    });
}

// ======================================================
// 9. Отрисовка блоков
// ======================================================

function drawBlocks() {

    blocks.forEach(block => {

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(

            block.x,

            block.y,

            block.width,

            block.height
        );
    });
}

// ======================================================
// 10. Обновление движения
// ======================================================

function updateMovingBlock() {

    const currentBlock =
        blocks[blocks.length - 1];

    if (!currentBlock.moving) {
        return;
    }

    currentBlock.x +=
        CONFIG.speed * direction;

    if (

        currentBlock.x <= 0 ||

        currentBlock.x +
        currentBlock.width >=
        window.innerWidth

    ) {

        direction *= -1;
    }
}

// ======================================================
// 11. Установка блока
// ======================================================

function placeBlock() {

    if (!gameRunning) {
        return;
    }

    const currentBlock =
        blocks[blocks.length - 1];

    if (!currentBlock.moving) {
        return;
    }

    const previousBlock =
        blocks[blocks.length - 2];

    currentBlock.moving = false;

    const overlap =

        Math.min(

            currentBlock.x +
            currentBlock.width,

            previousBlock.x +
            previousBlock.width

        ) -

        Math.max(

            currentBlock.x,

            previousBlock.x
        );

    // Проверка проигрыша
    if (overlap <= 0) {

        gameOver();

        return;
    }

    // Проверка идеального попадания
    const perfectHit =

        Math.abs(

            currentBlock.x -
            previousBlock.x

        ) <= CONFIG.perfectWindow;

    // Идеальное попадание
    if (perfectHit) {

        combo += 1;

        score +=
            CONFIG.baseScore *
            combo;

        currentBlock.x =
            previousBlock.x;

    } else {

        combo = 1;

        currentBlock.width =
            overlap;

        currentBlock.x =

            Math.max(

                currentBlock.x,

                previousBlock.x
            );

        score +=
            CONFIG.baseScore;
    }

    // Проверка минимальной ширины
    if (
        currentBlock.width <=
        CONFIG.minWidth
    ) {

        gameOver();

        return;
    }

    level += 1;

    updateUI();

    createMovingBlock();
}

// ======================================================
// 12. Обновление UI
// ======================================================

function updateUI() {

    levelText.innerText = level;

    scoreText.innerText = score;

    comboText.innerText =
        "x" + combo;
}

// ======================================================
// 13. Рендер сцены
// ======================================================

function render() {

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    drawBlocks();
}

// ======================================================
// 14. Игровой цикл
// ======================================================

function gameLoop() {

    if (!gameRunning) {
        return;
    }

    updateMovingBlock();

    render();

    requestAnimationFrame(
        gameLoop
    );
}

// ======================================================
// 15. Запуск игры
// ======================================================

function startGame() {

    console.log("GAME START");

    menuScreen.classList.add(
        "hidden"
    );

    gameScreen.classList.remove(
        "hidden"
    );

    level = 1;

    score = 0;

    combo = 1;

    direction = 1;

    createBaseBlock();

    createMovingBlock();

    updateUI();

    gameRunning = true;

    requestAnimationFrame(
        gameLoop
    );
}

// ======================================================
// 16. Конец игры
// ======================================================

function gameOver() {

    gameRunning = false;

    alert(
        "Игра окончена. Очки: " +
        score
    );

    menuScreen.classList.remove(
        "hidden"
    );

    gameScreen.classList.add(
        "hidden"
    );
}

// ======================================================
// 17. Управление
// ======================================================

playButton.addEventListener(

    "click",

    startGame
);

canvas.addEventListener(

    "pointerdown",

    placeBlock
);
