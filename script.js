// 12 Types of animal emojis
const animals = ['🐶', '🐱', '🦊', '🦁', '🐯', '🐮', '🐷', '🐨', '🐻', '🐼', '🐸', '🐵'];

// DOM Elements
const board = document.getElementById('game-board');
const timerVal = document.getElementById('timer-val');
const movesVal = document.getElementById('moves-val');
const bestVal = document.getElementById('best-val');
const resetBtn = document.getElementById('reset-btn');
const victoryModal = document.getElementById('victory-modal');
const modalTime = document.getElementById('modal-time');
const modalMoves = document.getElementById('modal-moves');
const replayBtn = document.getElementById('replay-btn');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

// Game state variables
let deck = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchedPairs = 0;
let moves = 0;
let seconds = 0;
let timerInterval = null;
let gameStarted = false;

// Confetti Particle System Variables
let confettiActive = false;
let confettiAnimationId = null;
let particles = [];

// Initialize game on load
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    loadBestScore();
    setupCanvas();
});

// Setup Canvas Size for responsive layout
function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Fisher-Yates Shuffle Algorithm
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Start / Initialize Game
function initGame() {
    // Stop previous state
    stopTimer();
    stopConfetti();
    
    // Reset state variables
    deck = [...animals, ...animals]; // 24 cards
    shuffle(deck);
    
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    matchedPairs = 0;
    moves = 0;
    seconds = 0;
    gameStarted = false;
    
    // Reset UI
    timerVal.textContent = '00:00';
    movesVal.textContent = '0';
    victoryModal.classList.remove('active');
    
    // Build Board
    board.innerHTML = '';
    deck.forEach((emoji, index) => {
        const cardElement = createCardElement(emoji, index);
        board.appendChild(cardElement);
    });
}

// Create Card DOM Structure
function createCardElement(emoji, index) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.emoji = emoji;
    card.dataset.index = index;

    const inner = document.createElement('div');
    inner.classList.add('card-inner');

    const back = document.createElement('div');
    back.classList.add('card-face', 'card-back');
    const pattern = document.createElement('span');
    pattern.classList.add('card-back-pattern');
    pattern.textContent = '?';
    back.appendChild(pattern);

    const front = document.createElement('div');
    front.classList.add('card-face', 'card-front');
    const emojiSpan = document.createElement('span');
    emojiSpan.classList.add('card-emoji');
    emojiSpan.textContent = emoji;
    front.appendChild(emojiSpan);

    inner.appendChild(back);
    inner.appendChild(front);
    card.appendChild(inner);

    card.addEventListener('click', () => handleCardClick(card));
    return card;
}

// Handle Card Click
function handleCardClick(card) {
    // Prevent clicking if board is locked, card is already flipped, or already matched
    if (lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) {
        return;
    }

    // Start timer on first card click
    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    // Flip the card
    card.classList.add('flipped');

    if (!firstCard) {
        // First card selected
        firstCard = card;
    } else {
        // Second card selected
        secondCard = card;
        moves++;
        movesVal.textContent = moves;
        checkMatch();
    }
}

// Check if selected cards match
function checkMatch() {
    const isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;
    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

// Match Found
function disableCards() {
    // Keep cards flipped and add matched status
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    
    matchedPairs++;
    
    // Reset selection
    resetSelection();

    // Check if won
    if (matchedPairs === animals.length) {
        setTimeout(handleVictory, 600);
    }
}

// Mismatch Found
function unflipCards() {
    lockBoard = true;
    
    // Add shake class for visual feedback
    firstCard.classList.add('shake');
    secondCard.classList.add('shake');

    setTimeout(() => {
        // Remove shake and flip back
        firstCard.classList.remove('shake', 'flipped');
        secondCard.classList.remove('shake', 'flipped');
        
        resetSelection();
    }, 900); // matching time window
}

// Reset card selection states
function resetSelection() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}

// Timer Functions
function startTimer() {
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        timerVal.textContent = formatTime(seconds);
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// LocalStorage Best Score Management
function loadBestScore() {
    const bestMoves = localStorage.getItem('bestMoves');
    const bestTime = localStorage.getItem('bestTime');
    
    if (bestMoves !== null) {
        bestVal.textContent = `${bestMoves} ครั้ง (${formatTime(parseInt(bestTime))})`;
    } else {
        bestVal.textContent = '-';
    }
}

function saveBestScore() {
    const currentBestMoves = localStorage.getItem('bestMoves');
    const currentBestTime = localStorage.getItem('bestTime');
    
    // Best score condition: lower moves, or equal moves and lower time
    const isNewRecord = currentBestMoves === null || 
                        moves < parseInt(currentBestMoves) || 
                        (moves === parseInt(currentBestMoves) && seconds < parseInt(currentBestTime));

    if (isNewRecord) {
        localStorage.setItem('bestMoves', moves);
        localStorage.setItem('bestTime', seconds);
        loadBestScore();
    }
}

// Handle Victory Game State
function handleVictory() {
    stopTimer();
    
    // Update Victory Modal Info
    modalTime.textContent = formatTime(seconds);
    modalMoves.textContent = moves;
    
    saveBestScore();
    
    // Open Modal
    victoryModal.classList.add('active');
    
    // Launch Confetti Effect
    startConfetti();
}

// Confetti Particle Class
class ConfettiParticle {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 6;
        
        // Colors palette (pastel tones)
        const colors = ['#f43f5e', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#f97316', '#06b6d4'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        const spread = 50; // spread angle
        const radAngle = (angle + (Math.random() * spread - spread / 2)) * Math.PI / 180;
        const velocity = Math.random() * 12 + 8;
        
        this.speedX = Math.cos(radAngle) * velocity;
        this.speedY = Math.sin(radAngle) * velocity;
        this.gravity = 0.3;
        this.friction = 0.98;
        this.opacity = 1;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 8 - 4;
    }
    
    update() {
        this.speedY += this.gravity;
        this.speedX *= this.friction;
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        
        // Fade out as it falls out of viewport height
        if (this.y > canvas.height) {
            this.opacity -= 0.05;
        }
    }
    
    draw() {
        if (this.opacity <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

// Confetti burst triggers
function startConfetti() {
    confettiActive = true;
    particles = [];
    
    // Initial big burst from bottom corners
    fireBurst(50);
    
    // Spawn some continuous particles during active modal
    let burstCount = 0;
    const burstInterval = setInterval(() => {
        if (!confettiActive || burstCount > 4) {
            clearInterval(burstInterval);
            return;
        }
        fireBurst(30);
        burstCount++;
    }, 800);
    
    animateConfetti();
}

function fireBurst(count) {
    // Left bottom corner firing up-right (angle -45deg)
    for (let i = 0; i < count / 2; i++) {
        particles.push(new ConfettiParticle(0, canvas.height, -45));
    }
    // Right bottom corner firing up-left (angle -135deg)
    for (let i = 0; i < count / 2; i++) {
        particles.push(new ConfettiParticle(canvas.width, canvas.height, -135));
    }
}

function stopConfetti() {
    confettiActive = false;
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = [];
}

function animateConfetti() {
    if (!confettiActive) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles = particles.filter(p => p.opacity > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    
    confettiAnimationId = requestAnimationFrame(animateConfetti);
}

// Event Listeners for Reset & Replay
resetBtn.addEventListener('click', initGame);
replayBtn.addEventListener('click', initGame);
