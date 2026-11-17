// ===== Конфигурация =====
const COLS = 20;
const ROWS = 20;
const CELL = 20;
const BASE_SPEED = 180; // мс между кадрами
const SPEED_INCREMENT = 2; // ускорение за каждое яблоко

// ===== Состояние =====
let snake, direction, nextDirection, food, score, highScore, gameLoop, speed, isRunning, isPaused;

// ===== DOM =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const finalScoreEl = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');

// ===== Инициализация =====
function init() {
    highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
    highScoreEl.textContent = highScore;

    startBtn.addEventListener('click', startGame);

    // Клавиатура
    document.addEventListener('keydown', handleKey);

    // Мобильные кнопки
    document.querySelectorAll('.ctrl-btn').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            setDirection(btn.dataset.dir);
        });
        btn.addEventListener('click', () => {
            setDirection(btn.dataset.dir);
        });
    });

    drawEmptyGrid();
}

function startGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = BASE_SPEED;
    isRunning = true;
    isPaused = false;

    scoreEl.textContent = '0';
    overlay.classList.add('hidden');

    spawnFood();
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, speed);
}

// ===== Спавн еды =====
function spawnFood() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)
        };
    } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
    food = pos;
}

// ===== Основной цикл =====
function update() {
    if (isPaused) return;

    direction = { ...nextDirection };

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // Столкновение со стеной
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        return gameOver();
    }

    // Столкновение с собой
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        return gameOver();
    }

    snake.unshift(head);

    // Съели еду?
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = score;
        spawnFood();
        increaseSpeed();
    } else {
        snake.pop();
    }

    draw();
}

// ===== Ускорение =====
function increaseSpeed() {
    if (speed > 50) {
        speed = Math.max(50, speed - SPEED_INCREMENT);
        clearInterval(gameLoop);
        gameLoop = setInterval(update, speed);
    }
}

// ===== Game Over =====
function gameOver() {
    isRunning = false;
    clearInterval(gameLoop);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.textContent = highScore;
    }

    overlayTitle.textContent = 'Game Over';
    overlayText.textContent = 'Попробуйте снова';
    finalScoreEl.textContent = 'Счёт: ' + score;
    finalScoreEl.style.display = 'block';
    startBtn.textContent = 'Заново';
    overlay.classList.remove('hidden');
}

// ===== Отрисовка =====
function draw() {
    // Фон
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Сетка
    drawGrid();

    // Еда
    drawFood();

    // Змейка
    drawSnake();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL, 0);
        ctx.lineTo(x * CELL, ROWS * CELL);
        ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL);
        ctx.lineTo(COLS * CELL, y * CELL);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((seg, i) => {
        const ratio = 1 - (i / snake.length) * 0.5;
        const r = Math.round(34 * ratio);
        const g = Math.round(197 * ratio);
        const b = Math.round(94 * ratio);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

        const padding = 1;
        const x = seg.x * CELL + padding;
        const y = seg.y * CELL + padding;
        const size = CELL - padding * 2;

        // Скруглённый квадрат
        const radius = i === 0 ? 6 : 4;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
        ctx.lineTo(x + size, y + size - radius);
        ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
        ctx.lineTo(x + radius, y + size);
        ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // Глаза на голове
        if (i === 0) {
            drawEyes(seg);
        }
    });
}

function drawEyes(head) {
    const cx = head.x * CELL + CELL / 2;
    const cy = head.y * CELL + CELL / 2;

    let eye1, eye2;
    const offset = 4;
    const eyeSize = 3;

    if (direction.x === 1) {
        eye1 = { x: cx + 3, y: cy - offset };
        eye2 = { x: cx + 3, y: cy + offset };
    } else if (direction.x === -1) {
        eye1 = { x: cx - 3, y: cy - offset };
        eye2 = { x: cx - 3, y: cy + offset };
    } else if (direction.y === -1) {
        eye1 = { x: cx - offset, y: cy - 3 };
        eye2 = { x: cx + offset, y: cy - 3 };
    } else {
        eye1 = { x: cx - offset, y: cy + 3 };
        eye2 = { x: cx + offset, y: cy + 3 };
    }

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(eye1.x, eye1.y, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eye2.x, eye2.y, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.arc(eye1.x, eye1.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eye2.x, eye2.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawFood() {
    const cx = food.x * CELL + CELL / 2;
    const cy = food.y * CELL + CELL / 2;
    const radius = CELL / 2 - 2;

    // Свечение
    ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
    ctx.shadowBlur = 12;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Блик
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawEmptyGrid() {
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
}

// ===== Управление =====
function handleKey(e) {
    const key = e.key.toLowerCase();

    if (key === ' ' && isRunning) {
        e.preventDefault();
        togglePause();
        return;
    }

    const dirMap = {
        arrowup: 'up', w: 'up',
        arrowdown: 'down', s: 'down',
        arrowleft: 'left', a: 'left',
        arrowright: 'right', d: 'right'
    };

    if (dirMap[key]) {
        e.preventDefault();
        setDirection(dirMap[key]);
    }
}

function setDirection(dir) {
    const map = {
        up:    { x:  0, y: -1 },
        down:  { x:  0, y:  1 },
        left:  { x: -1, y:  0 },
        right: { x:  1, y:  0 }
    };

    const target = map[dir];
    if (!target) return;

    // Нельзя развернуться на 180°
    if (target.x === -direction.x && target.y === -direction.y) return;

    nextDirection = target;
}

function togglePause() {
    isPaused = !isPaused;

    if (isPaused) {
        overlayTitle.textContent = 'Пауза';
        overlayText.textContent = 'Нажмите Пробел для продолжения';
        finalScoreEl.style.display = 'none';
        startBtn.style.display = 'none';
        overlay.classList.remove('hidden');
    } else {
        startBtn.style.display = '';
        overlay.classList.add('hidden');
    }
}

// ===== Запуск =====
init();
