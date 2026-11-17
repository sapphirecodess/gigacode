// ===== Конфигурация =====
const COLS = 30;
const ROWS = 30;
const CELL = 20;
const BASE_INTERVAL = 180; // мс между шагами сетки
const SPEED_INCREMENT = 2;

// ===== Состояние =====
let snake, prevSnake, direction, nextDirection, food, score, highScore, speed, isRunning, isPaused;
let accumulator = 0;
let animationId = null;
let lastFrameTime = 0;

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
    document.addEventListener('keydown', handleKey);

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

// ===== Старт игры =====
function startGame() {
    snake = [{ x: 10, y: 10 }];
    prevSnake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = BASE_INTERVAL;
    isRunning = true;
    isPaused = false;
    accumulator = 0;
    lastFrameTime = 0;

    scoreEl.textContent = '0';
    overlay.classList.add('hidden');

    spawnFood();

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    animationId = requestAnimationFrame(gameLoop);
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

// ===== Игровой цикл: fixed timestep + accumulator =====
function gameLoop(timestamp) {
    if (!isRunning) return;

    if (lastFrameTime === 0) {
        lastFrameTime = timestamp;
        animationId = requestAnimationFrame(gameLoop);
        return;
    }

    const delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    if (!isPaused) {
        accumulator += delta;

        // Шаг логики с фиксированным шагом
        while (accumulator >= speed) {
            savePrevSnake();
            update();
            accumulator -= speed;
        }
    }

    // t — прогресс между шагами: 0 = до шага, 1 = после шага
    const t = speed > 0 ? accumulator / speed : 0;

    draw(t);

    animationId = requestAnimationFrame(gameLoop);
}

// ===== Сохраняем состояние до шага =====
function savePrevSnake() {
    prevSnake = snake.map(s => ({ x: s.x, y: s.y }));
}

// ===== Логика шага =====
function update() {
    direction = { ...nextDirection };

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        return gameOver();
    }

    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        return gameOver();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = score;
        spawnFood();
        increaseSpeed();
    } else {
        snake.pop();
    }
}

// ===== Ускорение =====
function increaseSpeed() {
    if (speed > 60) {
        speed = Math.max(60, speed - SPEED_INCREMENT);
    }
}

// ===== Game Over =====
function gameOver() {
    isRunning = false;

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

// ===== Отрисовка с интерполяцией =====
function draw(t) {
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawFood();
    drawSnake(t);
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

// ===== Плавная змейка с интерполяцией =====
function drawSnake(t) {
    for (let i = 0; i < snake.length; i++) {
        const curr = snake[i];
        const prev = (i < prevSnake.length) ? prevSnake[i] : curr;

        const drawX = prev.x + (curr.x - prev.x) * t;
        const drawY = prev.y + (curr.y - prev.y) * t;

        const px = drawX * CELL;
        const py = drawY * CELL;

        const ratio = 1 - (i / snake.length) * 0.5;
        const r = Math.round(34 * ratio);
        const g = Math.round(197 * ratio);
        const b = Math.round(94 * ratio);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

        const padding = 1;
        const size = CELL - padding * 2;

        const radius = i === 0 ? 6 : 4;
        drawRoundedRect(ctx, px + padding, py + padding, size, size, radius);
        ctx.fill();

        if (i === 0) {
            drawEyes(px + CELL / 2, py + CELL / 2);
        }
    }
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ===== Глаза =====
function drawEyes(cx, cy) {
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

// ===== Еда с пульсацией =====
function drawFood() {
    const cx = food.x * CELL + CELL / 2;
    const cy = food.y * CELL + CELL / 2;
    const radius = CELL / 2 - 2;

    const pulse = 1 + Math.sin(Date.now() / 300) * 0.08;
    const r = radius * pulse;

    ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
    ctx.shadowBlur = 12;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

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
