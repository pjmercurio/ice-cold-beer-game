const block1 = document.getElementById("block1");
const block2 = document.getElementById("block2");
const canvas = document.getElementById("lineCanvas");
const ball = document.getElementById("ball");

// Initialize canvas context
const ctx = canvas.getContext("2d");

// Holes
const holesContainer = document.getElementById("holes");
const holeRadius = 35; // Radius of each hole (half of its width/height)

// Initialize positions
let currentLevel = 1;
let block1Y = window.innerHeight - block1.offsetHeight;
let block2Y = window.innerHeight - block2.offsetHeight;
let ballX = 50; // Start ball near the left block
let ballVelocity = 0; // Initial velocity of the ball

// Physics properties
const gravity = 0.5; // Simulated gravity
const friction = 0.99; // Friction to slow the ball
const dampening = 0.4; // Dampening factor for collisions

// Line properties
const lineWidth = 4;
const lineColor = "white";

// Movement speed for the blocks
const blockMoveSpeed = 5;
let activeKeys = {};
let moveInterval;

// Set initial positions
block1.style.top = block1Y + "px";
block1.style.left = "50px";
block2.style.top = block2Y + "px";
block2.style.right = "50px";

// Resize canvas to fill the container
function resizeCanvas() {
    const container = document.getElementById("container");
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Calculate tilt and draw the line on the canvas
function calculateTiltAndLine() {
    const container = document.getElementById("container");
    const containerRect = container.getBoundingClientRect();

    const block1Rect = block1.getBoundingClientRect();
    const block2Rect = block2.getBoundingClientRect();

    const x1 = block1Rect.left + block1Rect.width / 2 - containerRect.left;
    const y1 = block1Rect.top + block1Rect.height / 2 - containerRect.top;

    const x2 = block2Rect.left + block2Rect.width / 2 - containerRect.left;
    const y2 = block2Rect.top + block2Rect.height / 2 - containerRect.top;

    const tilt = (y2 - y1) / (x2 - x1); // Slope of the line

    // Draw the line on the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    return { tilt, x1, y1, x2, y2 };
}

function updateBall(tilt, x1, y1, x2, y2) {
    ballVelocity += tilt * gravity; // Ball accelerates due to tilt
    ballVelocity *= friction; // Apply friction
    ballX += ballVelocity; // Update ball's position

    const ballRadius = ball.offsetWidth / 2;

    // Calculate inner boundaries of the line (inner edges of the blocks)
    const block1InnerX = x1 + block1.offsetWidth / 2;
    const block2InnerX = x2 - block2.offsetWidth / 2;
    const maxBallX = Math.hypot(block2InnerX - block1InnerX, y2 - y1) - ballRadius;

    // Bounce effect
    if (ballX <= 0) {
        ballX = 0;
        ballVelocity = -ballVelocity * dampening;
    } else if (ballX >= maxBallX) {
        ballX = maxBallX;
        ballVelocity = -ballVelocity * dampening;
    }

    // Calculate the ball's vertical position
    const ballY = y1 + tilt * ballX - ballRadius; // Adjust for ball's radius
    ball.style.left = block1InnerX + ballX - ballRadius + "px"; // Position horizontally relative to block1InnerX
    ball.style.top = ballY - 20 + "px"; // Position vertically
}

// Function to handle movement based on active keys
function moveBlocks() {
    // Move left block up
    if (activeKeys["w"]) {
        block1Y = Math.max(0, block1Y - blockMoveSpeed);
        block1.style.top = block1Y + "px";
    }
    // Move left block down
    if (activeKeys["s"]) {
        block1Y = Math.min(window.innerHeight - block1.offsetHeight, block1Y + blockMoveSpeed);
        block1.style.top = block1Y + "px";
    }
    // Move right block up
    if (activeKeys["o"]) {
        block2Y = Math.max(0, block2Y - blockMoveSpeed);
        block2.style.top = block2Y + "px";
    }
    // Move right block down
    if (activeKeys["l"]) {
        block2Y = Math.min(window.innerHeight - block2.offsetHeight, block2Y + blockMoveSpeed);
        block2.style.top = block2Y + "px";
    }
}

// Check if the ball overlaps with any hole
function checkCollision() {
    const ballRect = ball.getBoundingClientRect();
    const ballCenterX = ballRect.left + ball.offsetWidth / 2;
    const ballCenterY = ballRect.top + ball.offsetHeight / 2;

    // Check each hole for collision
    document.querySelectorAll(".hole").forEach((hole) => {
        const holeX = parseFloat(hole.dataset.x);
        const holeY = parseFloat(hole.dataset.y);

        // Calculate distance between ball center and hole center
        const distance = Math.hypot(ballCenterX - holeX, ballCenterY - holeY);

        // If the ball overlaps the hole, trigger the "fall in" effect
        if (distance < holeRadius) {
            ball.style.transition = "transform 300ms ease-out, opacity 300ms ease-out";
            ball.style.transform = "scale(0)";
            ball.style.opacity = "0";
            setTimeout(resetGame, 500);
        }
    });
}

// Start the movement loop
function startMoveLoop() {
    if (!moveInterval) {
        moveInterval = setInterval(moveBlocks, 16); // ~60fps
    }
}

// Stop the movement loop
function stopMoveLoop() {
    if (!Object.keys(activeKeys).length) {
        clearInterval(moveInterval);
        moveInterval = null;
    }
}

// Keydown event to track active keys
document.addEventListener("keydown", (event) => {
    if (!activeKeys[event.key]) {
        activeKeys[event.key] = true;
        startMoveLoop();
    }
});

// Keyup event to stop tracking released keys
document.addEventListener("keyup", (event) => {
    delete activeKeys[event.key];
    stopMoveLoop();
});


// Game loop to continuously update the ball's position
function gameLoop() {
    const { tilt, x1, y1, x2, y2 } = calculateTiltAndLine();
    updateBall(tilt, x1, y1, x2, y2);
    checkCollision(); // Check for collisions with holes
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    block1.style.transition = "top 0.5s";
    block2.style.transition = "top 0.5s";
    block1Y = window.innerHeight - block1.offsetHeight;
    block2Y = window.innerHeight - block2.offsetHeight;
    block1.style.top = block1Y + "px";
    block2.style.top = block2Y + "px";
    ball.style.transform = "scale(1)";
    ball.style.opacity = "1";
    setTimeout(() => {
        block1.style.transition = "none";
        block2.style.transition = "none";
    }, 500);
}

// Initialize
resizeCanvas();
gameLoop();

// Create random holes
function createHoles() {
    const holePositions = [
        [0.5, 0.05],
        [0.4, 0.07],
        [0.2, 0.1],
        [0.3, 0.12],
        [0.7, 0.15],
        [0.5, 0.17],
        [0.4, 0.2],
        [0.8, 0.2],
        [0.45, 0.25],
        [0.1, 0.25],
        [0.58, 0.2],
        [0.35, 0.27],
        [0.6, 0.3],
        [0.25, 0.3],
        [0.05, 0.32],
        [0.85, 0.32],
        [0.75, 0.35],
        [0.5, 0.35],
        [0.3, 0.4],
        [0.68, 0.4],
        [0.4, 0.45],
        [0.1, 0.45],
        [0.2, 0.47],
        [0.6, 0.5],
        [0.15, 0.55],
        [0.3, 0.55],
        [0.25, 0.6],
        [0.5, 0.52],
        [0.7, 0.52],
        [0.9, 0.55],
        [0.8, 0.6]
    ];
    const winningHolePositions = [
        [0.45, 0.6],
        [0.8, 0.45],
        [0.17, 0.35],
        [0.4, 0.35],
        [0.7, 0.25],
        [0.45, 0.13]
    ];

    let index = 0;
    holePositions.forEach((holePosition) => addHole(holePosition, false));
    index = 0;
    winningHolePositions.forEach((holePosition) => addHole(holePosition, true));

    function addHole(holePosition, isWinningHole = false) {
        const hole = document.createElement("div");
        hole.className = isWinningHole ? "hole winningHole" : "hole";

        // Random position within the container
        const holeX = holePosition[0] * (window.innerWidth - holeRadius * 2);
        const holeY = holePosition[1] * (window.innerHeight - holeRadius * 2);

        hole.style.left = `${holeX}px`;
        hole.style.top = `${holeY}px`;
        hole.style.height = `${holeRadius * 2}px`;
        hole.style.width = `${holeRadius * 2}px`;
        hole.innerText = index;

        // Attach data attributes for position
        hole.dataset.x = holeX + holeRadius; // Center X
        hole.dataset.y = holeY + holeRadius; // Center Y

        holesContainer.appendChild(hole);
        index++;
    }
}

createHoles();

