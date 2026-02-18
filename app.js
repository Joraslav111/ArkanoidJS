const CANVAS_NODE = document.getElementById("Arkanoid");
const CTX = CANVAS_NODE.getContext("2d");
const BALL_RADIUS = 10;

const overlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const restartBtn = document.getElementById("restartBtn");
let gameStartTime = performance.now();

const GAME_STATE = {
    MENU: "menu",
    PLAYING: "playing",
    PAUSED: "paused",
    GAME_OVER: "gameover"
};

let gameState = GAME_STATE.MENU;

CTX.font = "40px Silkscreen";

const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;

const BRICK_ROW_COUNT = 12;
const BRICK_COLUMN_COUNT = 7;
let BRICK_WIDTH;
const BRICK_HEIGHT = 30;
const BRICK_PADDING = 5;
const TOP_OFFSET = 90;

const totalPadding = 2 * BRICK_PADDING + (BRICK_ROW_COUNT - 1) * BRICK_PADDING;
BRICK_WIDTH = (CANVAS_NODE.width - totalPadding) / BRICK_ROW_COUNT;

let ballX = CANVAS_NODE.width / 2;
let ballY = CANVAS_NODE.height - 60;
let dX = 3;
let dY = -3;

let paddleX = (CANVAS_NODE.width - PADDLE_WIDTH) / 2;

let score = 0;
let lives = 3;

let lastSpeedIncreaseScore = 0;
const SPEED_INCREMENT = 0.5;
const MAX_SPEED = 14;


let paused = false;

const BRICKS = [];

for (let a = 0; a < BRICK_COLUMN_COUNT; a++) {
    BRICKS[a] = [];

    let rowFromBottom = BRICK_COLUMN_COUNT - 1 - a;
    let hitsNeeded = Math.floor(rowFromBottom / 2) + 1;
    for (let b = 0; b < BRICK_ROW_COUNT; b++) {
        BRICKS[a][b] = {
            x: 0,
            y: 0,
            status: 1,
            hits: hitsNeeded
        };
    }
}

function showStartMenu() {
    gameState = GAME_STATE.MENU;
    paused = true;

    overlayTitle.textContent = "ARKANOID";
    restartBtn.textContent = "Start";

    overlay.classList.remove("hidden");
}

function startGame() {
    gameState = GAME_STATE.PLAYING;
    paused = false;
    gameStartTime = performance.now();

    overlay.classList.add("hidden");
}

function showGameOverMessage(win = false) {
    gameState = GAME_STATE.GAME_OVER;
    paused = true;

    overlayTitle.textContent = win ? "YOU WIN!" : "GAME OVER";
    restartBtn.textContent = "Play again";

    overlay.classList.remove("hidden");
}

function hideOverlay() {
    overlay.classList.add("hidden");
}


restartBtn.addEventListener("click", () => {
    if (gameState === GAME_STATE.MENU) {
        startGame();
    } else {
        document.location.reload();
    }
});

function drawBricks() {
    for (let a = 0; a < BRICK_COLUMN_COUNT; a++) {
        for (let b = 0; b < BRICK_ROW_COUNT; b++) {
            if (BRICKS[a][b].status === 1) {

                const BRICK_X = b * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING;

                const BRICK_Y = a * (BRICK_HEIGHT + BRICK_PADDING) + TOP_OFFSET;
                BRICKS[a][b].x = BRICK_X;
                BRICKS[a][b].y = BRICK_Y;

                switch (BRICKS[a][b].hits) {
                    case 1: CTX.fillStyle = "#2da6e2"; break;
                    case 2: CTX.fillStyle = "#FFA500"; break;
                    case 3: CTX.fillStyle = "#e43529"; break;
                    case 4: CTX.fillStyle = "#b91ab9"; break;
                    default: CTX.fillStyle = "#2da6e2";
                }

                CTX.beginPath();
                CTX.rect(BRICK_X, BRICK_Y, BRICK_WIDTH, BRICK_HEIGHT);
                CTX.fill();
                CTX.closePath();
            }
        }
    }
}

function drawBall() {
    CTX.fillStyle = "#58e7bc";
    CTX.beginPath();
    CTX.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    CTX.fill();
    CTX.closePath();
}

function drawPaddle() {
    CTX.fillStyle = "#58e7bc";
    CTX.beginPath();
    CTX.rect(paddleX, CANVAS_NODE.height - 100, PADDLE_WIDTH, PADDLE_HEIGHT);
    CTX.fill();
    CTX.closePath();
}

function drawScore() {
    CTX.fillStyle = "#58e7bc";
    CTX.fillText("Score: " + score, 10, 35);
}

function drawLives() {
    CTX.fillStyle = "#58e7bc";
    CTX.fillText("Lives: " + lives, CANVAS_NODE.width - 205, 35);
}

function detectCollision() {
    for (let a = 0; a < BRICK_COLUMN_COUNT; a++) {
        for (let b = 0; b < BRICK_ROW_COUNT; b++) {
            const brick = BRICKS[a][b];
            if (brick.status !== 1) continue;

            const closestX = Math.max(brick.x, Math.min(ballX, brick.x + BRICK_WIDTH));
            const closestY = Math.max(brick.y, Math.min(ballY, brick.y + BRICK_HEIGHT));

            const dx = ballX - closestX;
            const dy = ballY - closestY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= BALL_RADIUS) {

                brick.hits--;

                if (brick.hits === 0) {
                    brick.status = 0;
                    score++;

                    if (score % 3 === 0 && score !== lastSpeedIncreaseScore) {
                        let newDX = dX > 0 ? dX + SPEED_INCREMENT : dX - SPEED_INCREMENT;
                        let newDY = dY > 0 ? dY + SPEED_INCREMENT : dY - SPEED_INCREMENT;

                        if (newDX * newDX + newDY * newDY <= MAX_SPEED * MAX_SPEED) {
                            dX = newDX;
                            dY = newDY;
                        }
                        lastSpeedIncreaseScore = score;
                    }

                    if (score === BRICK_COLUMN_COUNT * BRICK_ROW_COUNT) {
                        showGameOverMessage(true);
                        return;
                    }
                }

                const leftDist = ballX - brick.x;
                const rightDist = brick.x + BRICK_WIDTH - ballX;
                const topDist = ballY - brick.y;
                const bottomDist = brick.y + BRICK_HEIGHT - ballY;

                const minX = Math.min(leftDist, rightDist);
                const minY = Math.min(topDist, bottomDist);

                if (minX < minY) {
                    dX = -dX;
                    if (leftDist < rightDist) {
                        ballX = brick.x - BALL_RADIUS;
                    } else {
                        ballX = brick.x + BRICK_WIDTH + BALL_RADIUS;
                    }
                } else if (minY < minX) {
                    dY = -dY;
                    if (topDist < bottomDist) {
                        ballY = brick.y - BALL_RADIUS;
                    } else {
                        ballY = brick.y + BRICK_HEIGHT + BALL_RADIUS;
                    }
                } else {
                    dX = -dX;
                    dY = -dY;
                }

                return;
            }
        }
    }
}

document.addEventListener("mousemove", mouseMove);
document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    if (gameState === GAME_STATE.PLAYING) {
        e.preventDefault();
        paused = true;
        gameState = GAME_STATE.PAUSED;
    } 
    else if (gameState === GAME_STATE.PAUSED) {
        e.preventDefault();
        paused = false;
        gameState = GAME_STATE.PLAYING;
    }
});

function mouseMove(e) {
    if (paused || gameState !== GAME_STATE.PLAYING) return;

    const RELATIVE_X = e.clientX - CANVAS_NODE.offsetLeft;
    if (RELATIVE_X > 0 && RELATIVE_X < CANVAS_NODE.width) {
        paddleX = RELATIVE_X - PADDLE_WIDTH / 2;
    }
}

function draw() {
    CTX.clearRect(0, 0, CANVAS_NODE.width, CANVAS_NODE.height);

    drawBall();
    drawPaddle();
    drawBricks();
    drawScore();
    drawLives();

    const elapsed = (performance.now() - gameStartTime) / 1000;
    if (elapsed < 10) {
        CTX.save();
        CTX.font = "20px Silkscreen";
        CTX.fillStyle = "#58e7bc";
        CTX.textAlign = "center";
        CTX.fillText("Press ESC for pause", CANVAS_NODE.width / 2, 35);
        CTX.restore();
    }

    if (!paused) {
        detectCollision();

        if (ballX + dX < BALL_RADIUS || ballX + dX > CANVAS_NODE.width - BALL_RADIUS) {
            dX = -dX;
        }

        if (ballY + dY < BALL_RADIUS) {
            dY = -dY;
        }

        const PADDLE_TOP = CANVAS_NODE.height - 100;
        const PADDLE_BOTTOM = PADDLE_TOP + PADDLE_HEIGHT;

        if (dY > 0) {
            if (ballY + BALL_RADIUS >= PADDLE_TOP && ballY - BALL_RADIUS <= PADDLE_BOTTOM) {
                if (ballX + BALL_RADIUS >= paddleX && ballX - BALL_RADIUS <= paddleX + PADDLE_WIDTH) {
                    dY = -dY;
                    ballY = PADDLE_TOP - BALL_RADIUS;
                }
            }
        }

        if (ballY + BALL_RADIUS >= CANVAS_NODE.height) {
            lives--;

            if (lives === 0) {
                showGameOverMessage(false);

            } else {
                ballX = CANVAS_NODE.width / 2;
                ballY = CANVAS_NODE.height - 60;
                dX = 2;
                dY = -2;
                paddleX = (CANVAS_NODE.width - PADDLE_WIDTH) / 2;
                lastSpeedIncreaseScore = 0;
            }
        }

        ballX += dX;
        ballY += dY;
    } else {

        CTX.fillStyle = "rgba(0, 0, 0, 0.7)";
        CTX.fillRect(0, 0, CANVAS_NODE.width, CANVAS_NODE.height);

        CTX.fillStyle = "#58e7bc";
        CTX.font = "60px Silkscreen";
        CTX.textAlign = "center";
        CTX.fillText("PAUSE", CANVAS_NODE.width / 2, CANVAS_NODE.height / 2);
        CTX.font = "30px Silkscreen";
        CTX.fillText("Press ESC to resume", CANVAS_NODE.width / 2, CANVAS_NODE.height / 2 + 50);
        CTX.textAlign = "left";
    }

    requestAnimationFrame(draw);
}

showStartMenu();
draw();