"use strict";
console.clear();

// Класс Stage отвечает за создание и настройку сцены, камеры и освещения
class Stage {
    constructor() {
        // Метод для рендеринга сцены
        this.render = function () {
            this.renderer.render(this.scene, this.camera);
        };

        // Добавление и удаление объектов на сцене
        this.add = function (elem) {
            this.scene.add(elem);
        };
        this.remove = function (elem) {
            this.scene.remove(elem);
        };

        // HTML-контейнер для сцены
        this.container = document.getElementById('game');

        // Настройка WebGLRenderer: включение сглаживания и настройка фона
        this.renderer = new THREE.WebGLRenderer({
            antialias: true, // Сглаживание краев объектов
            alpha: false    // Отключение прозрачности фона
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight); // Установка размера
        this.renderer.setClearColor('#D0CBC7', 1); // Цвет фона сцены
        this.container.appendChild(this.renderer.domElement); // Добавление рендера в HTML

        // Создание сцены
        this.scene = new THREE.Scene();

        // Настройка камеры ортографического типа
        let aspect = window.innerWidth / window.innerHeight; // Пропорции экрана
        let d = 20; // Размер видимой области камеры
        this.camera = new THREE.OrthographicCamera(
            -d * aspect, d * aspect, d, -d, -100, 1000
        );
        this.camera.position.set(2, 2, 2); // Позиция камеры
        this.camera.lookAt(new THREE.Vector3(0, 0, 0)); // Направление взгляда камеры

        // Добавление освещения
        this.light = new THREE.DirectionalLight(0xffffff, 0.5); // Направленный свет
        this.light.position.set(0, 499, 0); // Позиция источника света
        this.scene.add(this.light); // Добавление света на сцену

        this.softLight = new THREE.AmbientLight(0xffffff, 0.4); // Мягкий рассеянный свет
        this.scene.add(this.softLight);

        // Обработка изменения размеров окна
        window.addEventListener('resize', () => this.onResize());
        this.onResize();
    }

    // Метод для плавного изменения положения камеры
    setCamera(y, speed = 0.3) {
        TweenLite.to(this.camera.position, speed, { y: y + 4, ease: Power1.easeInOut });
        TweenLite.to(this.camera.lookAt, speed, { y: y, ease: Power1.easeInOut });
    }

    // Метод для обработки изменения размеров окна
    onResize() {
        let viewSize = 30;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.left = window.innerWidth / -viewSize;
        this.camera.right = window.innerWidth / viewSize;
        this.camera.top = window.innerHeight / viewSize;
        this.camera.bottom = window.innerHeight / -viewSize;
        this.camera.updateProjectionMatrix();
    }
}

// Класс Block отвечает за создание и управление блоками в игре
class Block {
    constructor(block) {
        // Состояния блока
        this.STATES = { ACTIVE: 'active', STOPPED: 'stopped', MISSED: 'missed' };
        this.MOVE_AMOUNT = 12; // Расстояние, на которое блок может двигаться

        // Размеры и положение блока
        this.dimension = { width: 0, height: 0, depth: 0 };
        this.position = { x: 0, y: 0, z: 0 };

        // Ссылка на предыдущий блок
        this.targetBlock = block;
        this.index = (this.targetBlock ? this.targetBlock.index : 0) + 1; // Индекс текущего блока

        // Определение рабочей плоскости и измерений
        this.workingPlane = this.index % 2 ? 'x' : 'z';
        this.workingDimension = this.index % 2 ? 'width' : 'depth';

        // Установка размеров и положения на основе предыдущего блока или стандартных значений
        this.dimension.width = this.targetBlock ? this.targetBlock.dimension.width : 10;
        this.dimension.height = this.targetBlock ? this.targetBlock.dimension.height : 2;
        this.dimension.depth = this.targetBlock ? this.targetBlock.dimension.depth : 10;

        this.position.x = this.targetBlock ? this.targetBlock.position.x : 0;
        this.position.y = this.dimension.height * this.index; // Высота текущего блока
        this.position.z = this.targetBlock ? this.targetBlock.position.z : 0;

        // Цвет блока
        this.colorOffset = this.targetBlock ? this.targetBlock.colorOffset : Math.round(Math.random() * 100);
        if (!this.targetBlock) {
            this.color = 0x333344; // Базовый цвет первого блока
        } else {
            let offset = this.index + this.colorOffset;
            let r = Math.sin(0.3 * offset) * 55 + 200;
            let g = Math.sin(0.3 * offset + 2) * 55 + 200;
            let b = Math.sin(0.3 * offset + 4) * 55 + 200;
            this.color = new THREE.Color(r / 255, g / 255, b / 255); // Генерация цвета для остальных блоков
        }

        // Установка состояния
        this.state = this.index > 1 ? this.STATES.ACTIVE : this.STATES.STOPPED;

        // Направление движения и скорость
        this.speed = -0.1 - (this.index * 0.005); // Скорость уменьшается с каждым блоком
        this.speed = Math.max(this.speed, -4); // Ограничение скорости
        this.direction = this.speed;

        // Создание 3D-объекта блока
        let geometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(
            this.dimension.width / 2,
            this.dimension.height / 2,
            this.dimension.depth / 2
        ));
        this.material = new THREE.MeshToonMaterial({ color: this.color, shading: THREE.FlatShading });
        this.mesh = new THREE.Mesh(geometry, this.material);

        // Установка начального положения блока
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        if (this.state == this.STATES.ACTIVE) {
            this.position[this.workingPlane] = Math.random() > 0.5 ? -this.MOVE_AMOUNT : this.MOVE_AMOUNT;
        }
    }

    // Метод для изменения направления блока
    reverseDirection() {
        this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed);
    }

    // Метод для размещения блока на сцене
    place() {
        this.state = this.STATES.STOPPED;
        let overlap = this.targetBlock.dimension[this.workingDimension] -
            Math.abs(this.position[this.workingPlane] - this.targetBlock.position[this.workingPlane]);

        // Логика обрезки и размещения блока
        let blocksToReturn = {
            plane: this.workingPlane,
            direction: this.direction
        };

        if (this.dimension[this.workingDimension] - overlap < 0.3) {
            overlap = this.dimension[this.workingDimension];
            blocksToReturn.bonus = true;
            this.position.x = this.targetBlock.position.x;
            this.position.z = this.targetBlock.position.z;
            this.dimension.width = this.targetBlock.dimension.width;
            this.dimension.depth = this.targetBlock.dimension.depth;
        }

        if (overlap > 0) {
            let choppedDimensions = {
                width: this.dimension.width,
                height: this.dimension.height,
                depth: this.dimension.depth
            };
            choppedDimensions[this.workingDimension] -= overlap;
            this.dimension[this.workingDimension] = overlap;

            let placedGeometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
            placedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(
                this.dimension.width / 2,
                this.dimension.height / 2,
                this.dimension.depth / 2
            ));
            let placedMesh = new THREE.Mesh(placedGeometry, this.material);

            let choppedGeometry = new THREE.BoxGeometry(choppedDimensions.width, choppedDimensions.height, choppedDimensions.depth);
            choppedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(
                choppedDimensions.width / 2,
                choppedDimensions.height / 2,
                choppedDimensions.depth / 2
            ));
            let choppedMesh = new THREE.Mesh(choppedGeometry, this.material);

            let choppedPosition = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            };

            if (this.position[this.workingPlane] < this.targetBlock.position[this.workingPlane]) {
                this.position[this.workingPlane] = this.targetBlock.position[this.workingPlane];
            } else {
                choppedPosition[this.workingPlane] += overlap;
            }

            placedMesh.position.set(this.position.x, this.position.y, this.position.z);
            choppedMesh.position.set(choppedPosition.x, choppedPosition.y, choppedPosition.z);

            blocksToReturn.placed = placedMesh;
            if (!blocksToReturn.bonus) blocksToReturn.chopped = choppedMesh;
        } else {
            this.state = this.STATES.MISSED;
        }

        this.dimension[this.workingDimension] = overlap;
        return blocksToReturn;
    }

    // Метод для обновления положения блока на каждом кадре
    tick() {
        if (this.state == this.STATES.ACTIVE) {
            let value = this.position[this.workingPlane];
            if (value > this.MOVE_AMOUNT || value < -this.MOVE_AMOUNT) {
                this.reverseDirection();
            }
            this.position[this.workingPlane] += this.direction;
            this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
        }
    }
}

// Класс Game управляет всей логикой игры
class Game {
    constructor() {
        this.STATES = {
            'LOADING': 'loading',
            'PLAYING': 'playing',
            'READY': 'ready',
            'ENDED': 'ended',
            'RESETTING': 'resetting'
        };
        this.blocks = [];
        this.state = this.STATES.LOADING;

        // Инициализация сцены
        this.stage = new Stage();

        // Элементы интерфейса
        this.mainContainer = document.getElementById('container');
        this.scoreContainer = document.getElementById('score');
        this.startButton = document.getElementById('start-button');
        this.instructions = document.getElementById('instructions');

        this.scoreContainer.innerHTML = '0'; // Счет игры

        // Группы для управления блоками
        this.newBlocks = new THREE.Group();
        this.placedBlocks = new THREE.Group();
        this.choppedBlocks = new THREE.Group();

        this.stage.add(this.newBlocks);
        this.stage.add(this.placedBlocks);
        this.stage.add(this.choppedBlocks);

        this.addBlock(); // Добавление первого блока
        this.tick(); // Запуск цикла игры

        this.updateState(this.STATES.READY); // Установка начального состояния игры

        // События для управления игрой
        document.addEventListener('keydown', e => {
            if (e.keyCode == 32) this.onAction();
        });
        document.addEventListener('click', e => {
            this.onAction();
        });
    }

    // Обновление состояния игры
    updateState(newState) {
        for (let key in this.STATES) {
            this.mainContainer.classList.remove(this.STATES[key]);
        }
        this.mainContainer.classList.add(newState);
        this.state = newState;
    }

    // Действия пользователя
    onAction() {
        switch (this.state) {
            case this.STATES.READY:
                this.startGame();
                break;
            case this.STATES.PLAYING:
                this.placeBlock();
                break;
            case this.STATES.ENDED:
                this.restartGame();
                break;
        }
    }

    // Запуск игры
    startGame() {
        if (this.state != this.STATES.PLAYING) {
            this.scoreContainer.innerHTML = '0';
            this.updateState(this.STATES.PLAYING);
            this.addBlock();
        }
    }

    // Перезапуск игры
    restartGame() {
        this.updateState(this.STATES.RESETTING);

        let oldBlocks = this.placedBlocks.children;
        let removeSpeed = 0.2;
        let delayAmount = 0.02;

        for (let i = 0; i < oldBlocks.length; i++) {
            TweenLite.to(oldBlocks[i].scale, removeSpeed, {
                x: 0, y: 0, z: 0,
                delay: (oldBlocks.length - i) * delayAmount,
                ease: Power1.easeIn,
                onComplete: () => this.placedBlocks.remove(oldBlocks[i])
            });
            TweenLite.to(oldBlocks[i].rotation, removeSpeed, {
                y: 0.5,
                delay: (oldBlocks.length - i) * delayAmount,
                ease: Power1.easeIn
            });
        }

        let cameraMoveSpeed = removeSpeed * 2 + (oldBlocks.length * delayAmount);
        this.stage.setCamera(2, cameraMoveSpeed);

        let countdown = { value: this.blocks.length - 1 };
        TweenLite.to(countdown, cameraMoveSpeed, {
            value: 0,
            onUpdate: () => {
                this.scoreContainer.innerHTML = String(Math.round(countdown.value));
            }
        });

        this.blocks = this.blocks.slice(0, 1);

        setTimeout(() => {
            this.startGame();
        }, cameraMoveSpeed * 1000);
    }

    // Размещение текущего блока
    placeBlock() {
        let currentBlock = this.blocks[this.blocks.length - 1];
        let newBlocks = currentBlock.place();
        this.newBlocks.remove(currentBlock.mesh);

        if (newBlocks.placed) {
            this.placedBlocks.add(newBlocks.placed);
        }
        if (newBlocks.chopped) {
            this.choppedBlocks.add(newBlocks.chopped);

            let positionParams = {
                y: '-=30',
                ease: Power1.easeIn,
                onComplete: () => this.choppedBlocks.remove(newBlocks.chopped)
            };

            let rotateRandomness = 10;
            let rotationParams = {
                delay: 0.05,
                x: newBlocks.plane == 'z' ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
                z: newBlocks.plane == 'x' ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
                y: Math.random() * 0.1,
            };

            if (newBlocks.chopped.position[newBlocks.plane] > newBlocks.placed.position[newBlocks.plane]) {
                positionParams[newBlocks.plane] = '+=' + (40 * Math.abs(newBlocks.direction));
            } else {
                positionParams[newBlocks.plane] = '-=' + (40 * Math.abs(newBlocks.direction));
            }

            TweenLite.to(newBlocks.chopped.position, 1, positionParams);
            TweenLite.to(newBlocks.chopped.rotation, 1, rotationParams);
        }

        this.addBlock();
    }

    // Добавление нового блока
    addBlock() {
        let lastBlock = this.blocks[this.blocks.length - 1];
        if (lastBlock && lastBlock.state == lastBlock.STATES.MISSED) {
            return this.endGame();
        }

        this.scoreContainer.innerHTML = String(this.blocks.length - 1);
        let newKidOnTheBlock = new Block(lastBlock);
        this.newBlocks.add(newKidOnTheBlock.mesh);
        this.blocks.push(newKidOnTheBlock);
        this.stage.setCamera(this.blocks.length * 2);

        if (this.blocks.length >= 5) {
            this.instructions.classList.add('hide');
        }
    }

    // Завершение игры
    endGame() {
        this.updateState(this.STATES.ENDED);
    }

    // Цикл игры
    tick() {
        this.blocks[this.blocks.length - 1].tick();
        this.stage.render();
        requestAnimationFrame(() => {
            this.tick();
        });
    }
}

// Запуск игры
let game = new Game();
