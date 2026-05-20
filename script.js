/*
Tower Block Telegram Mini App

Описание:
Этот файл содержит игровую логику.
Игрок должен максимально точно ставить платформы друг на друга.

Принцип работы:
1. Верхняя платформа двигается.
2. Игрок нажимает на экран.
3. Платформа останавливается.
4. Лишняя часть отрезается.
5. Башня растет вверх.
6. За идеальные попадания растет комбо.
*/

// ======================================================
// 1. Конфигурация игры
// ======================================================

// Основные настройки
const GAME_CONFIG = {

    // Высота блока
    blockHeight: 30,

    // Стартовая ширина
    startWidth: 240,

    // Минимальная ширина
    minWidth: 40,

    // Базовая скорость
    baseSpeed: 3,

    // Максимальная скорость
    maxSpeed: 8,

    // Базовые очки
    baseScore: 10,

    // Радиус идеального попадания
    perfectWindow: 4,

    // Шанс редкого блока
    rareChance: 0.01,

    // Смещение камеры
    cameraOffset: 220
};

// ======================================================
// 2. Получение HTML элементов
// ======================================================

// Получение canvas
const canvas = document.getElementById("game-canvas");

// Получение контекста
const ctx = canvas.getContext("2d");

// Получение экранов
const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");

// Получение кнопок
const playButton = document.getElementById("play-button");

// Получение текста статистики
const levelText = document.getElementById("level");
const scoreText = document.getElementById("score");
const comboText = document.getElementById("combo");

// ======================================================
// 3. Настройка canvas
// ======================================================

// Функция обновления размеров
function resizeCanvas() {

    canvas.width = window.innerWidth;

    canvas.height = window.innerHeight;
}

// Первичное обновление
resizeCanvas();

// Обновление при ресайзе
window.addEventListener(
    "resize",
    resizeCanvas
);

// ======================================================
// 4. Игровые переменные
// ======================================================

// Массив платформ
let blocks = [];

// Массив падающих частей
let fallingPieces = [];

// Скорость движения
let moveSpeed = GAME_CONFIG.baseSpeed;

// Направление движения
let direction = 1;

// Активность игры
let gameRunning = false;

// Уровень
let level = 1;

// Очки
let score = 0;

// Комбо
let combo = 1;

// Камера
let cameraY = 0;

// Последнее время кадра
let lastFrameTime = 0;

// ======================================================
// 5. Создание стартовой платформы
// ======================================================

// Функция стартового блока
function createBaseBlock() {

    blocks = [

        {

            x:
                canvas.width / 2 -
                GAME_CONFIG.startWidth / 2,

            y:
                canvas.height - 120,

            width:
                GAME_CONFIG.startWidth,

            height:
                GAME_CONFIG.blockHeight,

            moving: false,

            rare: false
        }
    ];
}

// ======================================================
// 6. Создание движущегося блока
// ======================================================

// Функция нового блока
function createMovingBlock() {

    // Получение прошлого блока
    const lastBlock = blocks[blocks.length - 1];

    // Проверка редкого блока
    const isRare =
        Math.random() <
        GAME_CONFIG.rareChance;

    // Создание блока
    blocks.push({

        x:
            direction > 0
                ? 0
                : canvas.width - lastBlock.width,

        y:
            lastBlock.y -
            GAME_CONFIG.blockHeight,

        width:
            lastBlock.width,

        height:
            GAME_CONFIG.blockHeight,

        moving: true,

        rare: isRare
    });
}

// ======================================================
// 7. Создание падающей части
// ======================================================

// Функция обрезка
function createFallingPiece(
    block,
    overlap,
    offset
) {

    // Размер отрезка
    const cutWidth =
        block.width - overlap;

    // Проверка существования
    if (cutWidth <= 0) {
        return;
    }

    // Создание обрезка
    fallingPieces.push({

        x:
            offset > 0
                ? block.x + overlap
                : block.x,

        y: block.y,

        width: cutWidth,

        height: block.height,

        velocityY: 8
    });
}

// ======================================================
// 8. Отрисовка платформ
// ======================================================

// Функция рисования
function drawBlocks() {

    // Отрисовка платформ
    blocks.forEach(block => {

        // Цвет блока
        ctx.fillStyle =
            block.rare
                ? "#ffd700"
                : "#ffffff";

        // Рисование блока
        ctx.fillRect(

            block.x,

            block.y + cameraY,

            block.width,

            block.height
        );
    });
}

// ======================================================
// 9. Отрисовка падающих частей
// ======================================================

// Функция рисования обрезков
function drawFallingPieces() {

    // Отрисовка частей
    fallingPieces.forEach(piece => {

        ctx.fillStyle = "#888888";

        ctx.fillRect(

            piece.x,

            piece.y + cameraY,

            piece.width,

            piece.height
        );
    });
}

// ======================================================
// 10. Обновление движения блока
// ======================================================

// Функция движения
function updateMovingBlock(deltaTime) {

    // Получение блока
    const currentBlock =
        blocks[blocks.length - 1];

    // Проверка движения
    if (!currentBlock.moving) {
        return;
    }

    // Обновление позиции
    currentBlock.x +=
        moveSpeed *
        direction *
        deltaTime;

    // Проверка границ
    if (

        currentBlock.x <= 0 ||

        currentBlock.x +
        currentBlock.width >=
        canvas.width

    ) {

        direction *= -1;
    }
}

// ======================================================
// 11. Обновление падающих частей
// ======================================================

// Функция падения
function updateFallingPieces(deltaTime) {

    // Обновление позиции
    fallingPieces.forEach(piece => {

        piece.y +=
            piece.velocityY *
            deltaTime;
    });

    // Очистка массива
    fallingPieces =
        fallingPieces.filter(piece => {

            return (
                piece.y + cameraY <
                canvas.height + 200
            );
        });
}

// ======================================================
// 12. Установка блока
// ======================================================

// Функция установки
function placeBlock() {

    // Получение блока
    const currentBlock =
        blocks[blocks.length - 1];

    // Защита от двойного тапа
    if (!currentBlock.moving) {
        return;
    }

    // Получение прошлого блока
    const previousBlock =
        blocks[blocks.length - 2];

    // Остановка движения
    currentBlock.moving = false;

    // Смещение
    const offset =
        currentBlock.x -
        previousBlock.x;

    // Размер пересечения
    const overlap =
        currentBlock.width -
        Math.abs(offset);

    // Проверка проигрыша
    if (
        overlap <=
        GAME_CONFIG.minWidth
    ) {

        gameOver();

        return;
    }

    // Проверка идеального попадания
    const perfectHit =
        Math.abs(offset) <=
        GAME_CONFIG.perfectWindow;

    // Идеальное попадание
    if (perfectHit) {

        // Выравнивание
        currentBlock.x =
            previousBlock.x;

        // Рост комбо
        combo += 1;

        // Начисление очков
        score +=
            GAME_CONFIG.baseScore *
            combo;

    } else {

        // Сброс комбо
        combo = 1;

        // Создание обрезка
        createFallingPiece(
            currentBlock,
            overlap,
            offset
        );

        // Уменьшение ширины
        currentBlock.width =
            overlap;

        // Коррекция позиции
        if (offset > 0) {

            currentBlock.x =
                previousBlock.x +
                previousBlock.width -
                overlap;

        } else {

            currentBlock.x =
                previousBlock.x;
        }

        // Начисление очков
        score +=
            GAME_CONFIG.baseScore;
    }

    // Проверка редкого блока
    if (currentBlock.rare) {

        // Бонусные очки
        score += 100;

        // Сообщение игроку
        showMessage(
            "Редкая платформа! +100"
        );
    }

    // Рост уровня
    level += 1;

    // Увеличение скорости
    moveSpeed = Math.min(

        GAME_CONFIG.baseSpeed +
        level * 0.12,

        GAME_CONFIG.maxSpeed
    );

    // Обновление интерфейса
    updateUI();

    // Обновление камеры
    moveCamera();

    // Проверка наград
    checkRewards();

    // Создание нового блока
    createMovingBlock();
}

// ======================================================
// 13. Обновление интерфейса
// ======================================================

// Функция UI
function updateUI() {

    levelText.innerText = level;

    scoreText.innerText = score;

    comboText.innerText =
        "x" + combo;
}

// ======================================================
// 14. Движение камеры
// ======================================================

// Функция камеры
function moveCamera() {

    // Получение последнего блока
    const lastBlock =
        blocks[blocks.length - 1];

    // Смещение камеры
    cameraY =

        canvas.height -

        lastBlock.y -

        GAME_CONFIG.cameraOffset;
}

// ======================================================
// 15. Проверка наград
// ======================================================

// Функция наград
function checkRewards() {

    // Проверка уровня
    if (level === 50) {

        showMessage(
            "Бонус за 50 этаж"
        );
    }

    // Проверка уровня
    if (level === 100) {

        showMessage(
            "Редкий бонус за 100 этаж"
        );
    }
}

// ======================================================
// 16. Система сообщений
// ======================================================

// Функция уведомлений
function showMessage(text) {

    // Создание элемента
    const message =
        document.createElement("div");

    // Текст уведомления
    message.innerText = text;

    // Стили
    message.style.position =
        "absolute";

    message.style.top = "80px";

    message.style.left = "50%";

    message.style.transform =
        "translateX(-50%)";

    message.style.background =
        "#ffffff";

    message.style.color =
        "#000000";

    message.style.padding =
        "12px 20px";

    message.style.borderRadius =
        "12px";

    message.style.zIndex =
        "999";

    // Добавление элемента
    document.body.appendChild(
        message
    );

    // Удаление уведомления
    setTimeout(() => {

        message.remove();

    }, 2000);
}

// ======================================================
// 17. Отрисовка сцены
// ======================================================

// Функция рендера
function render() {

    // Очистка canvas
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Отрисовка блоков
    drawBlocks();

    // Отрисовка обрезков
    drawFallingPieces();
}

// ======================================================
// 18. Игровой цикл
// ======================================================

// Главная функция игры
function gameLoop(timestamp) {

    // Проверка активности
    if (!gameRunning) {
        return;
    }

    // Расчет deltaTime
    const deltaTime =

        (timestamp - lastFrameTime) /
        16.67;

    // Обновление времени
    lastFrameTime = timestamp;

    // Обновление движения
    updateMovingBlock(deltaTime);

    // Обновление падения
    updateFallingPieces(deltaTime);

    // Отрисовка
    render();

    // Новый кадр
    requestAnimationFrame(
        gameLoop
    );
}

// ======================================================
// 19. Запуск игры
// ======================================================

// Функция запуска
function startGame() {

    // Скрытие меню
    menuScreen.classList.add(
        "hidden"
    );

    // Показ игры
    gameScreen.classList.remove(
        "hidden"
    );

    // Сброс значений
    level = 1;

    score = 0;

    combo = 1;

    direction = 1;

    cameraY = 0;

    // Очистка массивов
    blocks = [];

    fallingPieces = [];

    // Сброс скорости
    moveSpeed =
        GAME_CONFIG.baseSpeed;

    // Создание платформ
    createBaseBlock();

    createMovingBlock();

    // Обновление UI
    updateUI();

    // Запуск игры
    gameRunning = true;

    // Сброс времени
    lastFrameTime =
        performance.now();

    // Старт цикла
    requestAnimationFrame(
        gameLoop
    );
}

// ======================================================
// 20. Завершение игры
// ======================================================

// Функция конца игры
function gameOver() {

    // Остановка игры
    gameRunning = false;

    // Сообщение
    showMessage(

        "Игра окончена. Очки: " +
        score
    );

    // Возврат в меню
    setTimeout(() => {

        menuScreen.classList.remove(
            "hidden"
        );

        gameScreen.classList.add(
            "hidden"
        );

    }, 1500);
}

// ======================================================
// 21. Telegram Mini App
// ======================================================

// Проверка Telegram API
if (
    window.Telegram &&
    Telegram.WebApp
) {

    // Инициализация
    Telegram.WebApp.ready();

    // Раскрытие окна
    Telegram.WebApp.expand();
}

// ======================================================
// 22. Пауза игры
// ======================================================

// Проверка скрытия вкладки
document.addEventListener(

    "visibilitychange",

    () => {

        // Проверка сворачивания
        if (document.hidden) {

            gameRunning = false;

        } else {

            // Проверка наличия игры
            if (blocks.length > 0) {

                gameRunning = true;

                lastFrameTime =
                    performance.now();

                requestAnimationFrame(
                    gameLoop
                );
            }
        }
    }
);

// ======================================================
// 23. События управления
// ======================================================

// Кнопка запуска
playButton.addEventListener(

    "click",

    startGame
);

// Управление через касание
canvas.addEventListener(

    "pointerdown",

    placeBlock
);
