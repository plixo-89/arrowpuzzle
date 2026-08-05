const LEVELS = [
    // Level 1: Three long arrows side-by-side
    [
        { r: 4, c: 2, dir: 'down', length: 3 },
        { r: 2, c: 3, dir: 'up', length: 3 },
        { r: 4, c: 4, dir: 'down', length: 3 }
    ],
    // Level 2: Interlocked (must be clicked in specific order)
    [
        { r: 2, c: 2, dir: 'right' },
        { r: 2, c: 3, dir: 'down' },
        { r: 3, c: 2, dir: 'up' },
        { r: 3, c: 3, dir: 'left' },
        { r: 1, c: 2, dir: 'up' },
        { r: 4, c: 3, dir: 'down' }
    ],
    // Level 3: A line puzzle
    [
        { r: 2, c: 1, dir: 'right' },
        { r: 2, c: 2, dir: 'right' },
        { r: 2, c: 3, dir: 'up' },
        { r: 3, c: 3, dir: 'down' },
        { r: 3, c: 2, dir: 'left' },
        { r: 3, c: 1, dir: 'left' }
    ]
];

const CELL_SIZE = 45;
const GRID_COLS = 6;
const GRID_ROWS = 6;

// Minimalist Arrow SVG matching the screenshot
// Mathematically guarantees the tail and tip sit EXACTLY on the background dots
function getArrowSvg(length = 1) {
    // The dots are mathematically exactly at y=30, y=-30, y=-90, etc. in the local SVG coordinate space.
    // Because the dot has a radius (r=3), a sharp triangle tip exactly at y=30 will let the bottom half of the round dot peek out!
    // We push the tip slightly past the center (y=34) so the wide part of the arrowhead completely covers the dot.
    const tipY = 34;
    // Tail of the arrow is exactly on the dot (length - 1) cells behind it.
    const tailY = length === 1 ? -30 : 30 - (length - 1) * 60;

    const lineEndY = tipY - 15; // Line stops perfectly at the base of the arrowhead

    return `
        <line x1="30" y1="${tailY}" x2="30" y2="${lineEndY}" />
        <path class="arrow-head" d="M 16 ${lineEndY} L 30 ${tipY} L 44 ${lineEndY} Z" />
    `;
}

let currentLevel = 0;
let activeBlocks = [];
let lives = 5;
const MAX_LIVES = 5;

const boardEl = document.getElementById('game-board');
const piecesContainer = document.getElementById('pieces-container');
const levelDisplay = document.getElementById('level-display');
const winModal = document.getElementById('win-modal');
const loseModal = document.getElementById('lose-modal');
const btnNext = document.getElementById('btn-next-level');
const btnRestart = document.getElementById('btn-restart-level');
const heartElements = document.querySelectorAll('.heart');

function initGame() {
    btnNext.addEventListener('click', () => {
        winModal.style.display = 'none';
        currentLevel++;
        if (currentLevel >= LEVELS.length) currentLevel = 0;
        loadLevel(currentLevel);
    });

    btnRestart.addEventListener('click', () => {
        loseModal.style.display = 'none';
        loadLevel(currentLevel);
    });

    loadLevel(currentLevel);
}

function loadLevel(levelIndex) {
    piecesContainer.innerHTML = '';
    activeBlocks = [];
    levelDisplay.textContent = levelIndex + 1;
    winModal.style.display = 'none';
    loseModal.style.display = 'none';

    // Reset lives
    lives = MAX_LIVES;
    heartElements.forEach(h => h.classList.remove('empty'));

    const levelData = LEVELS[levelIndex];

    // Calculate bounding box of the entire level to perfectly center it
    let minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity;
    levelData.forEach(blockData => {
        const block = { r: blockData.r, c: blockData.c, dir: blockData.dir, length: blockData.length || 1 };
        const cells = getOccupiedCells(block);
        cells.forEach(cell => {
            if (cell.c < minC) minC = cell.c;
            if (cell.c > maxC) maxC = cell.c;
            if (cell.r < minR) minR = cell.r;
            if (cell.r > maxR) maxR = cell.r;
        });
    });

    // Resize the board dynamically to exactly fit the puzzle
    boardEl.style.width = `${(maxC - minC + 1) * CELL_SIZE}px`;
    boardEl.style.height = `${(maxR - minR + 1) * CELL_SIZE}px`;

    const dotGridEl = document.querySelector('.dot-grid');
    dotGridEl.innerHTML = ''; // Clear old dots
    const dotsCreated = new Set();

    levelData.forEach((blockData, index) => {
        // Shift coordinates so the puzzle starts exactly at top-left of the dynamic board
        const block = {
            id: index,
            r: blockData.r - minR,
            c: blockData.c - minC,
            dir: blockData.dir,
            length: blockData.length || 1,
            el: null
        };

        // Spawn permanent dots behind the arrow
        const occupied = getOccupiedCells(block);
        occupied.forEach(cell => {
            const key = `${cell.c},${cell.r}`;
            if (!dotsCreated.has(key)) {
                dotsCreated.add(key);
                const dot = document.createElement('div');
                dot.className = 'static-dot';
                dot.style.left = `${cell.c * CELL_SIZE + CELL_SIZE / 2}px`;
                dot.style.top = `${cell.r * CELL_SIZE + CELL_SIZE / 2}px`;
                dotGridEl.appendChild(dot);
            }
        });

        const div = document.createElement('div');
        div.className = 'piece';
        div.style.left = `${block.c * CELL_SIZE}px`;
        div.style.top = `${block.r * CELL_SIZE}px`;

        // Base SVG points DOWN (rotation 0)
        let rot = 0;
        if (block.dir === 'up') rot = 180;
        if (block.dir === 'left') rot = 90;
        if (block.dir === 'right') rot = -90;

        div.style.setProperty('--rot', `${rot}deg`);
        div.style.transform = `rotate(${rot}deg)`;

        div.innerHTML = `<svg viewBox="0 0 60 60" style="overflow: visible;">${getArrowSvg(block.length)}</svg>`;

        div.addEventListener('click', () => handleBlockClick(block, rot));

        block.el = div;
        piecesContainer.appendChild(div);
        activeBlocks.push(block);
    });
}

function handleBlockClick(block, baseRot) {
    if (!activeBlocks.includes(block)) return; // Already cleared

    if (isBlocked(block)) {
        // Play error animation
        block.el.classList.remove('bumping');
        void block.el.offsetWidth; // trigger reflow
        block.el.classList.add('bumping');

        // Handle lives
        if (lives > 0) {
            lives--;
            // Empty the hearts from right to left
            for (let i = 0; i < MAX_LIVES; i++) {
                if (i >= lives) {
                    heartElements[i].classList.add('empty');
                }
            }
        }

        setTimeout(() => {
            if (block.el) block.el.classList.remove('bumping');
            if (lives === 0) {
                loseModal.style.display = 'flex';
            }
        }, 400);
    } else {
        // Success! Fly away
        activeBlocks = activeBlocks.filter(b => b.id !== block.id);

        block.el.classList.add('flying');

        // Calculate fly out distance relative to the board
        const flyDistance = 800;
        let tx = 0, ty = 0;

        if (block.dir === 'up') ty = -flyDistance;
        if (block.dir === 'down') ty = flyDistance;
        if (block.dir === 'left') tx = -flyDistance;
        if (block.dir === 'right') tx = flyDistance;

        // Combine base rotation and new translation
        block.el.style.transform = `translate(${tx}px, ${ty}px) rotate(${baseRot}deg)`;
        block.el.style.opacity = '0';

        setTimeout(() => {
            if (block.el && block.el.parentNode) {
                block.el.parentNode.removeChild(block.el);
            }
            checkWin();
        }, 1200); // Wait 1.2s for the smooth animation to finish
    }
}

function getOccupiedCells(block) {
    const cells = [];
    for (let i = 0; i < block.length; i++) {
        if (block.dir === 'up') cells.push({ c: block.c, r: block.r + i });
        else if (block.dir === 'down') cells.push({ c: block.c, r: block.r - i });
        else if (block.dir === 'left') cells.push({ c: block.c + i, r: block.r });
        else if (block.dir === 'right') cells.push({ c: block.c - i, r: block.r });
    }
    return cells;
}

function isBlocked(block) {
    const myCells = getOccupiedCells(block);

    // To check if blocked, we look exactly 1 cell ahead of the tip (which is at block.c, block.r)
    let checkC = block.c;
    let checkR = block.r;
    if (block.dir === 'up') checkR -= 1;
    if (block.dir === 'down') checkR += 1;
    if (block.dir === 'left') checkC -= 1;
    if (block.dir === 'right') checkC += 1;

    // Check if checkC, checkR is occupied by ANY cell of ANY other block
    for (let other of activeBlocks) {
        if (other.id === block.id) continue;

        const otherCells = getOccupiedCells(other);
        for (let oc of otherCells) {
            if (oc.c === checkC && oc.r === checkR) return true;
        }
    }
    return false;
}

function checkWin() {
    if (activeBlocks.length === 0) {
        winModal.style.display = 'flex';
    }
}

// Zoom slider logic
const zoomSlider = document.querySelector('.zoom-slider');
if (zoomSlider) {
    zoomSlider.addEventListener('input', (e) => {
        const scale = e.target.value / 100;
        boardEl.style.transform = `scale(${scale})`;
    });
}

// Start
initGame();
