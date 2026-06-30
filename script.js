const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Adjust size to typical desktop resolution aspect ratio
canvas.width = 600;
canvas.height = 700;

// Game State Values
let score = 0;
let baseSpeed = 1.0;
let wordSpawnInterval = 2000; // ms
let lastSpawnTime = 0;
let gameActive = true;

// Entities
let fallingWords = [];
let lasers = [];
let targetWord = null; // Lock-on word when player starts typing

// Word database dictionary
const wordBank = [
    "laser", "galaxy", "nebula", "meteor", "rocket", "quantum", "gravity", "orbit", 
    "vector", "matrix", "arcade", "engine", "syntax", "hazard", "shield", "plasma",
    "cosmic", "photon", "pulsar", "quasar", "stellar", "vacuum", "vortex", "cyber"
];

// Laser Cannon position (Centered at bottom)
const shipX = canvas.width / 2;
const shipY = canvas.height - 40;

class FallingWord {
    constructor() {
        this.text = wordBank[Math.floor(Math.random() * wordBank.length)];
        this.x = Math.max(50, Math.random() * (canvas.width - 150));
        this.y = -20;
        this.speed = baseSpeed + Math.random() * 0.5;
        this.typedIndex = 0; // Tracks typed character accuracy
    }

    update() {
        this.y += this.speed;
        if (this.y > shipY - 10) {
            endGame();
        }
    }

    draw() {
        ctx.font = "20px 'Courier New'";
        
        // Draw untyped block of text
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText(this.text, this.x, this.y);

        // Highlight typed characters in neon green
        if (this.typedIndex > 0) {
            ctx.fillStyle = "#00ffcc";
            const typedText = this.text.substring(0, this.typedIndex);
            ctx.fillText(typedText, this.x, this.y);
        }
    }
}

class Laser {
    constructor(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.life = 5; // Frames to stay visible
    }

    draw() {
        if (this.life > 0) {
            ctx.beginPath();
            ctx.strokeStyle = "#ff3366";
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ff3366";
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.targetX, this.targetY);
            ctx.stroke();
            ctx.closePath();
            
            // Clear canvas shadow side effects
            ctx.shadowBlur = 0;
            this.life--;
        }
    }
}

// Intercept Global Keyboard inputs
window.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    const pressedKey = e.key.toLowerCase();
    
    // Ignore function or modifier control keys
    if (pressedKey.length > 1) return;

    if (targetWord === null) {
        // Look for any word starting with the input key
        for (let word of fallingWords) {
            if (word.text[0] === pressedKey) {
                targetWord = word;
                targetWord.typedIndex = 1;
                fireLaser(targetWord.x + 10, targetWord.y);
                checkWordCompletion();
                break;
            }
        }
    } else {
        // Lock-on active: User must progress down current focused word string
        const expectedKey = targetWord.text[targetWord.typedIndex].toLowerCase();
        if (pressedKey === expectedKey) {
            targetWord.typedIndex++;
            fireLaser(targetWord.x + (targetWord.typedIndex * 10), targetWord.y);
            checkWordCompletion();
        }
    }
});

function fireLaser(tx, ty) {
    lasers.push(new Laser(shipX, shipY, tx, ty));
}

function checkWordCompletion() {
    if (targetWord && targetWord.typedIndex >= targetWord.text.length) {
        // Flash elimination score increments
        score += targetWord.text.length * 10;
        
        // Remove word from processing tree
        fallingWords = fallingWords.filter(w => w !== targetWord);
        targetWord = null;

        // Progressively scale difficulty based on score metrics
        baseSpeed += 0.05;
        wordSpawnInterval = Math.max(800, wordSpawnInterval - 50);
    }
}

function drawShip() {
    ctx.beginPath();
    ctx.fillStyle = "#3399ff";
    ctx.moveTo(shipX, shipY - 15);
    ctx.lineTo(shipX - 15, shipY + 15);
    ctx.lineTo(shipX + 15, shipY + 15);
    ctx.fill();
    ctx.closePath();
}

function drawScore() {
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px 'Courier New'";
    ctx.fillText(`SCORE: ${score}`, 20, 30);
}

function endGame() {
    gameActive = false;
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

function resetGame() {
    score = 0;
    baseSpeed = 1.0;
    wordSpawnInterval = 2000;
    fallingWords = [];
    lasers = [];
    targetWord = null;
    gameActive = true;
    gameOverScreen.classList.add('hidden');
    lastSpawnTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Master Render/Physics Engine Loop
function gameLoop(currentTime) {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Timing tracking for new generation waves
    if (currentTime - lastSpawnTime > wordSpawnInterval) {
        fallingWords.push(new FallingWord());
        lastSpawnTime = currentTime;
    }

    // Render & Move Laser tracks
    lasers = lasers.filter(laser => laser.life > 0);
    lasers.forEach(laser => laser.draw());

    // Update word structures
    fallingWords.forEach(word => {
        word.update();
        word.draw();
    });

    drawShip();
    drawScore();

    requestAnimationFrame(gameLoop);
}

restartBtn.addEventListener('click', resetGame);

// Bootstrap Game
resetGame();
