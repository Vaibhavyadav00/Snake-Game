const board = document.querySelector('.board');
const startButton = document.querySelector(".btn-start");
const restartButton = document.querySelector(".btn-restart");
const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const timeEl = document.getElementById('time');

const blockHeight = 50;
const blockWidth = 50;

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);
const blocks = {};

let snake = [{ x: 1, y: 3 }];
let direction = 'down';
let food;

let intervalId = null;
let timerId = null;
let elapsedSeconds = 0;
let speed = 500;
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let gameRunning = false;

highScoreEl.textContent = highScore;
restartButton.textContent = "Play Again";

function generateFood() {
    let foodPosition;
    let foodOnSnake;
    do {
        foodPosition = {
            x: Math.floor(Math.random() * rows),
            y: Math.floor(Math.random() * cols)
        };
        foodOnSnake = snake.some(seg => seg.x === foodPosition.x && seg.y === foodPosition.y);
    } while (foodOnSnake);
    return foodPosition;
}

// Build grid
for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const block = document.createElement('div');
        block.classList.add("block");
        board.appendChild(block);
        blocks[`${row}-${col}`] = block;
    }
}

function increaseSpeed() {
    speed = Math.max(300, speed - 10);
    clearInterval(intervalId);
    intervalId = setInterval(render, speed);
}

function updateTimerDisplay() {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    timeEl.textContent = `${String(minutes).padStart(2, '0')}-${String(seconds).padStart(2, '0')}`;
}

function startTimer() {
    elapsedSeconds = 0;
    updateTimerDisplay();
    timerId = setInterval(() => {
        elapsedSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function resetGame() {
    // Clear leftover visuals from any previous game
    Object.values(blocks).forEach(block => block.classList.remove('fill', 'food'));

    snake = [{ x: 1, y: 3 }];
    direction = 'down';
    speed = 500;

    score = 0;
    scoreEl.textContent = score;
    elapsedSeconds = 0;
    updateTimerDisplay();

    blocks[`${snake[0].x}-${snake[0].y}`].classList.add('fill');

    food = generateFood();
    blocks[`${food.x}-${food.y}`].classList.add('food');
}

function startGame() {
    resetGame();

    startGameModal.style.display = 'none';
    gameOverModal.style.display = 'none';
    modal.style.display = 'none';
    gameRunning = true;

    clearInterval(intervalId);
    clearInterval(timerId);
    intervalId = setInterval(render, speed);
    startTimer();
}

function endGame(reason) {
    gameRunning = false;
    clearInterval(intervalId);
    clearInterval(timerId);
    intervalId = null;
    timerId = null;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.textContent = highScore;
    }

    let reasonEl = gameOverModal.querySelector('.reason');
    if (!reasonEl) {
        reasonEl = document.createElement('p');
        reasonEl.classList.add('reason');
        gameOverModal.insertBefore(reasonEl, restartButton);
    }
    reasonEl.textContent = reason;

    startGameModal.style.display = 'none';
    gameOverModal.style.display = 'flex';
    modal.style.display = 'flex';
}

function render() {
    let head;
    if (direction === "left")       head = { x: snake[0].x,     y: snake[0].y - 1 };
    else if (direction === "right") head = { x: snake[0].x,     y: snake[0].y + 1 };
    else if (direction === "up")    head = { x: snake[0].x - 1, y: snake[0].y     };
    else if (direction === "down")  head = { x: snake[0].x + 1, y: snake[0].y     };

    // Boundary check
    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
        endGame("You hit the wall!");
        return;
    }

    const isEating = head.x === food.x && head.y === food.y;

    // Self-collision check (ignore the tail unless it's not moving this tick)
    for (let i = 0; i < snake.length; i++) {
        if (!isEating && i === snake.length - 1) continue;
        if (head.x === snake[i].x && head.y === snake[i].y) {
            endGame("The snake bit itself!");
            return;
        }
    }

    if (isEating) {
        snake.unshift(head);
        blocks[`${head.x}-${head.y}`].classList.add("fill");

        score += 10;
        scoreEl.textContent = score;

        blocks[`${food.x}-${food.y}`].classList.remove("food");
        food = generateFood();
        blocks[`${food.x}-${food.y}`].classList.add("food");

        increaseSpeed();
    } else {
        const tail = snake.pop();
        blocks[`${tail.x}-${tail.y}`].classList.remove("fill");
        snake.unshift(head);
        blocks[`${head.x}-${head.y}`].classList.add("fill");
    }
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !gameRunning) {
        startGame();
        return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
    }

    if      (event.key === "ArrowUp"    && direction !== "down")  direction = "up";
    else if (event.key === "ArrowRight" && direction !== "left")  direction = "right";
    else if (event.key === "ArrowLeft"  && direction !== "right") direction = "left";
    else if (event.key === "ArrowDown"  && direction !== "up")    direction = "down";
});
