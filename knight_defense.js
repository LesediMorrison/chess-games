// Knight Defense Game Logic
// Version: 1.0
// Last updated: 2025-05-30

console.log("Knight Defense script loaded.");

// DOM Elements for Knight Defense
const kdInfoBar = document.getElementById('kd-info-bar');
const kdFortressHealthSpan = document.getElementById('kd-fortress-health');
const kdPawnsCapturedSpan = document.getElementById('kd-pawns-captured');
const kdCurrentLevelSpan = document.getElementById('kd-current-level');
const kdBoardElement = document.getElementById('kd-board');
const kdMessageArea = document.getElementById('kd-message-area');
const kdStartButton = document.getElementById('kd-start-button');
const kdResetButton = document.getElementById('kd-reset-button');
const kdBackToMainMenuButton = document.getElementById('kd-back-to-main-menu'); // This button is in index.html

// Game State Variables
let kdGameActive = false;
let kdFortressHealth = 10;
let kdPawnsCaptured = 0;
let kdCurrentLevel = 1;
const kdBoardState = []; // 8x8 array for piece positions
const kdKnightChar = '♘'; // Or '♞'
const kdPawnChar = '♙'; // White pawn, as they are attacking

const KNIGHT_START_ROW = 7; // Knight starts at the bottom
const KNIGHT_START_COL = 4; // e.g., e1
let kdKnightPosition = { row: KNIGHT_START_ROW, col: KNIGHT_START_COL };
let kdSelectedKnightSquare = null; // To store {row, col} of selected knight

const PAWN_SPAWN_ROW = 0; // Pawns spawn at the top
let kdGameLoopInterval = null;
const PAWN_MOVE_INTERVAL_BASE = 2000; // Base speed: 2 seconds per move
let currentPawnMoveInterval = PAWN_MOVE_INTERVAL_BASE;
let nextPawnWaveTimer = 0;
const PAWN_WAVE_INTERVAL_BASE = 10000;
let currentPawnWaveInterval = PAWN_WAVE_INTERVAL_BASE;
const PAWNS_PER_WAVE_BASE = 2;
let currentPawnsPerWave = PAWNS_PER_WAVE_BASE;

// New level progression system
const LEVEL_REQUIREMENTS = {
    1: 10,  // Level 1: 10 pawns, base difficulty
    2: 10,  // Level 2: 10 pawns, increased difficulty
    3: 15,  // Level 3: 15 pawns, same difficulty as level 2
    4: 15,  // Level 4: 15 pawns, increased difficulty
    5: 20,  // Level 5: 20 pawns, same difficulty as level 4
    6: 20,  // Level 6: 20 pawns, increased difficulty
    7: 25,  // Level 7: 25 pawns, same difficulty as level 6
    8: 25,  // Level 8: 25 pawns, increased difficulty
    9: 30,  // Level 9: 30 pawns, same difficulty as level 8
    10: 30  // Level 10: 30 pawns, final difficulty level
};

const MAX_LEVEL = 10;
let kdLevel1InitialPawnDealtWith = false;
let isLevelTransition = false;

// --- Initialization ---
function initializeKnightDefense() {
    console.log("Initializing Knight Defense mode...");
    kdFortressHealth = 10;
    kdPawnsCaptured = 0;
    kdCurrentLevel = 1;
    kdGameActive = false;
    kdKnightPosition = { row: KNIGHT_START_ROW, col: KNIGHT_START_COL };
    nextPawnWaveTimer = 0;
    kdLevel1InitialPawnDealtWith = false; // Reset for new game

    updateKDInfoBar();
    initializeKDBoardState();
    renderKDBoard();
    
    if(kdMessageArea) kdMessageArea.textContent = "Click 'Start Knight Defense' to begin!";
    if(kdStartButton) kdStartButton.style.display = 'inline-block';
    if(kdResetButton) kdResetButton.style.display = 'none';
}

function initializeKDBoardState() {
    for (let i = 0; i < 8; i++) {
        kdBoardState[i] = [];
        for (let j = 0; j < 8; j++) {
            kdBoardState[i][j] = null; // Empty
        }
    }
    // Place initial knight
    kdBoardState[kdKnightPosition.row][kdKnightPosition.col] = { type: 'knight', color: 'player' }; // Assuming player controls white knight
}

function renderKDBoard() {
    if (!kdBoardElement) return;
    kdBoardElement.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((i + j) % 2 === 0 ? 'light' : 'dark'); // Reuse Pawn War styles
            square.dataset.row = i;
            square.dataset.col = j;

            const piece = kdBoardState[i][j];
            if (piece) {
                const pieceElement = document.createElement('span');
                pieceElement.classList.add('pawn'); // Can reuse .pawn style for size, or make .kd-piece
                if (piece.type === 'knight') {
                    pieceElement.textContent = kdKnightChar;
                    pieceElement.style.color = '#FFF'; // Example: white knight
                } else if (piece.type === 'pawn') {
                    pieceElement.textContent = kdPawnChar;
                    pieceElement.style.color = '#AAA'; // Example: greyish pawns
                }
                square.appendChild(pieceElement);
            }
            square.addEventListener('click', handleKDSquareClick); // Add click listener
            kdBoardElement.appendChild(square);
        }
    }
}

function updateKDInfoBar() {
    if(kdFortressHealthSpan) kdFortressHealthSpan.textContent = kdFortressHealth;
    if(kdPawnsCapturedSpan) {
        const currentRequirement = LEVEL_REQUIREMENTS[kdCurrentLevel];
        kdPawnsCapturedSpan.textContent = `${kdPawnsCaptured}/${currentRequirement}`;
    }
    if(kdCurrentLevelSpan) kdCurrentLevelSpan.textContent = kdCurrentLevel;
}

// --- Game Flow ---
function startKDGame() {
    console.log("startKDGame function called."); // <-- New Log
    if (kdGameActive) {
        console.log("kdGameActive is true, returning from startKDGame.");
        return;
    }
    console.log("Setting kdGameActive to true.");
    kdGameActive = true;
    // Reset stats for a new game, but keep level if desired or reset level too
    kdFortressHealth = 10;
    kdPawnsCaptured = 0;
    // kdCurrentLevel = 1; // Optionally reset level or continue from current
    
    initializeKDBoardState(); // Place knight
    renderKDBoard();
    updateKDInfoBar();

    if(kdMessageArea) kdMessageArea.textContent = `Level ${kdCurrentLevel} - Defend the Fortress!`;
    if(kdStartButton) kdStartButton.style.display = 'none';
    if(kdResetButton) kdResetButton.style.display = 'inline-block';
    
    // Reset/set difficulty parameters for the current level
    setDifficultyParametersForLevel(kdCurrentLevel);

    // Spawn initial pawns for level 1
    console.log("About to call spawnInitialKDPawns()."); // <-- New Log
    spawnInitialKDPawns();
    renderKDBoard(); // Re-render after spawning

    // Start pawn spawning/movement loop
    if (kdGameLoopInterval) clearInterval(kdGameLoopInterval);
    kdGameLoopInterval = setInterval(kdGameTick, currentPawnMoveInterval);
}

function kdGameTick() {
    if (!kdGameActive || isLevelTransition) return;
    
    moveKDPawns();
    
    if (kdCurrentLevel === 1 && !kdLevel1InitialPawnDealtWith) {
        // For level 1, wait for the initial pawn to be dealt with before starting timed waves
    } else {
        nextPawnWaveTimer += currentPawnMoveInterval;
        if (nextPawnWaveTimer >= currentPawnWaveInterval) {
            spawnPawnWave();
            nextPawnWaveTimer = 0;
        }
    }
    
    renderKDBoard();
}

function spawnPawnWave() {
    if (!kdGameActive) return;
    
    // Determine how many pawns to spawn in this wave
    let pawnsToSpawn;
    if (kdCurrentLevel >= 3) {
        // From level 3 onwards, randomize the wave size between 2 and 4 pawns
        pawnsToSpawn = Math.floor(Math.random() * 3) + 2; // Random number between 2 and 4
        console.log(`Level ${kdCurrentLevel}: Random wave size: ${pawnsToSpawn} pawns`);
    } else {
        // Levels 1-2 use the standard currentPawnsPerWave
        pawnsToSpawn = currentPawnsPerWave;
    }

    let pawnsSpawnedThisWave = 0;
    let attempts = 0;
    const maxAttempts = 16;

    // Create an array of available columns (0-7)
    let availableColumns = Array.from({length: 8}, (_, i) => i);
    
    while (pawnsSpawnedThisWave < pawnsToSpawn && attempts < maxAttempts && availableColumns.length > 0) {
        // Get a random index from the available columns
        const randomIndex = Math.floor(Math.random() * availableColumns.length);
        const spawnCol = availableColumns[randomIndex];
        
        if (kdBoardState[PAWN_SPAWN_ROW][spawnCol] === null) {
            kdBoardState[PAWN_SPAWN_ROW][spawnCol] = { type: 'pawn', color: 'attacker' };
            pawnsSpawnedThisWave++;
            // Remove the used column from available columns
            availableColumns.splice(randomIndex, 1);
        }
        attempts++;
    }
    
    if (pawnsSpawnedThisWave > 0) {
        console.log(`Spawned ${pawnsSpawnedThisWave} pawns in wave (Level ${kdCurrentLevel})`);
    }
}

function spawnInitialKDPawns() {
    // Level 1: Spawn only one pawn in the middle initially.
    const midCol = Math.floor(Math.random() * 2) + 3; // Column 3 or 4
    if (kdBoardState[PAWN_SPAWN_ROW][midCol] === null) {
        kdBoardState[PAWN_SPAWN_ROW][midCol] = { type: 'pawn', color: 'attacker' };
        console.log(`Spawned initial single pawn for L1 at [0,${midCol}]`);
    } else { // Fallback if mid is somehow taken (should not happen on fresh board)
        for (let c = 0; c < 8; c++) {
            if (kdBoardState[PAWN_SPAWN_ROW][c] === null) {
                kdBoardState[PAWN_SPAWN_ROW][c] = { type: 'pawn', color: 'attacker' };
                console.log(`Spawned initial single pawn (fallback) for L1 at [0,${c}]`);
                break;
            }
        }
    }
}

function moveKDPawns() {
    for (let r = 7; r >= 0; r--) { // Iterate backwards to handle moves correctly in one pass
        for (let c = 0; c < 8; c++) {
            if (kdBoardState[r][c] && kdBoardState[r][c].type === 'pawn') {
                const pawn = kdBoardState[r][c];
                const nextRow = r + 1;

                if (nextRow < 8) { // Pawn is not yet at the fortress rank
                    if (kdBoardState[nextRow][c] && kdBoardState[nextRow][c].type === 'knight') {
                        // Pawn attempts to move onto the knight's square
                        if(kdMessageArea) kdMessageArea.textContent = "Knight was overrun! Fortress takes damage!";
                        kdBoardState[r][c] = null; // Pawn is removed
                        handlePawnAtFortress(c, true); // Pass a flag indicating knight was overrun
                    } else if (kdBoardState[nextRow][c] === null) { // Square is empty, move pawn
                        kdBoardState[nextRow][c] = pawn;
                        kdBoardState[r][c] = null;
                    } else {
                        // Square is occupied by another pawn, pawn is blocked (stays in place for this tick)
                        // This means kdBoardState[r][c] remains `pawn`
                        // Or, decide if they stack or get removed. For now, they block.
                        kdBoardState[r][c] = pawn; // Explicitly keep it if blocked
                    }
                } else {
                    // Pawn reached the fortress (bottom rank)
                    kdBoardState[r][c] = null; // Pawn is removed from its current spot before handling fortress hit
                    handlePawnAtFortress(c, false);
                }
            }
        }
    }
}

function handlePawnAtFortress(col, knightOverrun = false) {
    kdFortressHealth--;
    updateKDInfoBar();
    if (!knightOverrun && kdMessageArea) {
        kdMessageArea.textContent = `Fortress hit! Health: ${kdFortressHealth}`;
    }
    
    if (kdFortressHealth <= 0) {
        kdGameOver("The Fortress has fallen!");
    } else {
        if (kdCurrentLevel === 1 && !kdLevel1InitialPawnDealtWith) {
            const initialPawnExists = kdBoardState.flat().some(p => p && p.type === 'pawn');
            if (!initialPawnExists) { // Check if the board is clear of the initial pawn
                console.log("Level 1 initial pawn dealt with (hit fortress). Spawning next wave.");
                kdLevel1InitialPawnDealtWith = true;
                currentPawnsPerWave = PAWNS_PER_WAVE_BASE; // Now spawn 2 for subsequent waves
                spawnPawnWave(); // Spawn the "first" wave of 2
                nextPawnWaveTimer = 0; // Reset timer for subsequent timed waves
            }
        }
    }
}


function kdGameOver(message) {
    kdGameActive = false;
    if (kdGameLoopInterval) clearInterval(kdGameLoopInterval);
    if(kdMessageArea) kdMessageArea.textContent = `Game Over: ${message}`;
    // Consider showing start button again or specific reset options
}


function resetKDGame() {
    console.log("Resetting Knight Defense Game.");
    if (kdGameLoopInterval) clearInterval(kdGameLoopInterval);
    kdGameActive = false;
    kdCurrentLevel = 1; // Reset level on full reset
    initializeKnightDefense();
}

function kdLevelUp() {
    // Calculate total pawns needed for current level
    const currentLevelRequirement = LEVEL_REQUIREMENTS[kdCurrentLevel];
    
    // Check if player has completed the current level
    if (kdPawnsCaptured >= currentLevelRequirement) {
        if (kdCurrentLevel === MAX_LEVEL) {
            kdGameOver("Congratulations! You've defended the Fortress and beaten all levels!");
            updateKDInfoBar();
            return;
        }

        kdCurrentLevel++;
        isLevelTransition = true; // Pause pawn spawning
        
        // Clear all existing pawns from the board
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (kdBoardState[i][j] && kdBoardState[i][j].type === 'pawn') {
                    kdBoardState[i][j] = null;
                }
            }
        }
        
        // Show level up animation
        showLevelUpAnimation(kdCurrentLevel);
        
        // Update game parameters
        setDifficultyParametersForLevel(kdCurrentLevel);
        nextPawnWaveTimer = 0;
        updateKDInfoBar();
        renderKDBoard();
    }
}

function setDifficultyParametersForLevel(level) {
    // Base difficulty increases only on even-numbered levels
    const difficultyTier = Math.floor((level + 1) / 2);  // This gives us increasing difficulty every 2 levels
    
    // Pawns move faster: Decrease interval
    currentPawnMoveInterval = Math.max(300, PAWN_MOVE_INTERVAL_BASE - (difficultyTier - 1) * 150);

    // Pawns come more frequently - adjust wave timing based on level
    if (level >= 3) {
        // From level 3 onwards, waves come slightly faster to account for random sizes
        currentPawnWaveInterval = Math.max(4000, PAWN_WAVE_INTERVAL_BASE - (difficultyTier - 1) * 1000);
    } else {
        // Levels 1-2 use the original timing
        currentPawnWaveInterval = Math.max(4000, PAWN_WAVE_INTERVAL_BASE - (difficultyTier - 1) * 800);
    }

    // For levels 1-2, still use the base wave size
    if (level < 3) {
        currentPawnsPerWave = PAWNS_PER_WAVE_BASE + Math.floor(difficultyTier / 2);
    }
    // For level 3+, pawnsPerWave is not used as waves are randomized

    console.log(`Level ${level} (Difficulty Tier ${difficultyTier}):
        MoveInterval=${currentPawnMoveInterval},
        WaveInterval=${currentPawnWaveInterval},
        Random Waves=${level >= 3 ? 'Yes (2-4 pawns)' : 'No, fixed: ' + currentPawnsPerWave},
        Required Captures=${LEVEL_REQUIREMENTS[level]}`);
    
    // Restart game loop with new speed
    if (kdGameActive) {
        if (kdGameLoopInterval) clearInterval(kdGameLoopInterval);
        kdGameLoopInterval = setInterval(kdGameTick, currentPawnMoveInterval);
    }
}


// --- Knight Movement Logic ---
function handleKDSquareClick(event) {
    if (!kdGameActive || isLevelTransition) return;
    const clickedSquare = event.currentTarget;
    const row = parseInt(clickedSquare.dataset.row);
    const col = parseInt(clickedSquare.dataset.col);

    if (kdSelectedKnightSquare) { // Knight is selected, try to move
        if (isValidKnightMove(kdSelectedKnightSquare.row, kdSelectedKnightSquare.col, row, col)) {
            let capturedPawnThisMove = false;
            if (kdBoardState[row][col] && kdBoardState[row][col].type === 'pawn') {
                kdPawnsCaptured++;
                capturedPawnThisMove = true;
                if (kdPawnsCaptured > 0 && kdPawnsCaptured % LEVEL_REQUIREMENTS[kdCurrentLevel] === 0) {
                    kdLevelUp();
                }
            }
            updateKDInfoBar();

            // Move the knight
            kdBoardState[row][col] = kdBoardState[kdSelectedKnightSquare.row][kdSelectedKnightSquare.col];
            kdBoardState[kdSelectedKnightSquare.row][kdSelectedKnightSquare.col] = null;
            kdKnightPosition = { row, col };

            // Update the selected knight position instead of clearing it
            kdSelectedKnightSquare = { row, col };
            
            // Clear and reapply highlights for the new position
            clearKDHighlights();
            highlightValidKnightMoves(row, col);
            
            renderKDBoard();

            if (capturedPawnThisMove && kdCurrentLevel === 1 && !kdLevel1InitialPawnDealtWith) {
                const initialPawnExists = kdBoardState.flat().some(p => p && p.type === 'pawn');
                if (!initialPawnExists) {
                    console.log("Level 1 initial pawn dealt with (captured). Spawning next wave.");
                    kdLevel1InitialPawnDealtWith = true;
                    currentPawnsPerWave = PAWNS_PER_WAVE_BASE;
                    spawnPawnWave();
                    nextPawnWaveTimer = 0;
                }
            }
        }
    } else { // No knight selected, try to select
        if (kdBoardState[row][col] && kdBoardState[row][col].type === 'knight') {
            kdSelectedKnightSquare = { row, col };
            highlightValidKnightMoves(row, col);
        }
    }
}

function isValidKnightMove(startR, startC, endR, endC) {
    const dRow = Math.abs(endR - startR);
    const dCol = Math.abs(endC - startC);
    return (dRow === 2 && dCol === 1) || (dRow === 1 && dCol === 2);
    // TODO: Add check to ensure end square is not occupied by friendly piece (not applicable here yet)
}

function highlightValidKnightMoves(knightR, knightC) {
    clearKDHighlights();
    const knightSquare = kdBoardElement.querySelector(`[data-row="${knightR}"][data-col="${knightC}"]`);
    if (knightSquare) knightSquare.classList.add('kd-selected-knight'); // New class for knight selection

    const moves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    moves.forEach(move => {
        const r = knightR + move[0];
        const c = knightC + move[1];
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            // Can move to empty or pawn square
            if (kdBoardState[r][c] === null || (kdBoardState[r][c] && kdBoardState[r][c].type === 'pawn')) {
                 const squareEl = kdBoardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                 if (squareEl) squareEl.classList.add('kd-possible-move'); // New class for KD possible moves
            }
        }
    });
}

function clearKDHighlights() {
    if (!kdBoardElement) return;
    kdBoardElement.querySelectorAll('.kd-selected-knight').forEach(el => el.classList.remove('kd-selected-knight'));
    kdBoardElement.querySelectorAll('.kd-possible-move').forEach(el => el.classList.remove('kd-possible-move'));
}


// --- Event Listeners ---
if (kdStartButton) {
    kdStartButton.addEventListener('click', startKDGame);
}
if (kdResetButton) {
    kdResetButton.addEventListener('click', resetKDGame);
}

// TODO:
// - Pawn spawning logic (more sophisticated, timed, based on level)
// - Collision detection refinement (pawn-knight interaction if knight doesn't move)
// - Level progression (25 captures, pawn speed/frequency adjustments)
// - Visual feedback for fortress damage, level up, game over
// - Sound effects? (optional)

// Add this new function for the level-up animation
function showLevelUpAnimation(level) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'level-up-overlay';
    
    // Create "LEVEL" text
    const levelText = document.createElement('div');
    levelText.className = 'level-up-text';
    levelText.textContent = 'LEVEL';
    
    // Create level number
    const levelNumber = document.createElement('div');
    levelNumber.className = 'level-up-number';
    levelNumber.textContent = level;
    
    // Add elements to overlay
    overlay.appendChild(levelText);
    overlay.appendChild(levelNumber);
    
    // Add overlay to body
    document.body.appendChild(overlay);
    
    // Remove overlay after animation
    setTimeout(() => {
        overlay.remove();
        isLevelTransition = false; // Re-enable pawn spawning
    }, 3000); // Match this with CSS animation duration
}