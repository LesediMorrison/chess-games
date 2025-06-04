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
    1: 15,  // Level 1: 15 pawns
    2: 15,  // Level 2: 15 pawns
    3: 15,  // Level 3: 15 pawns
    4: 25,  // Level 4: 25 pawns
    5: 25,  // Level 5: 25 pawns
    6: 40,  // Level 6: 40 pawns
    7: 40,  // Level 7: 40 pawns
    8: 40,  // Level 8: 40 pawns
    9: 50,  // Level 9: 50 pawns
    10: 75  // Level 10: 75 pawns, final level
};

// Power-up types
const POWERUP_TYPES = {
    SHIELD: 'shield',
    TIME_SLOW: 'timeSlow',
    CLEAR_BOARD: 'clearBoard',
    FORTRESS_REPAIR: 'fortressRepair'
};

// Power-up settings
const POWERUP_SETTINGS = {
    spawnInterval: 15000, // Spawn every 15 seconds
    duration: {
        [POWERUP_TYPES.SHIELD]: 5000,
        [POWERUP_TYPES.TIME_SLOW]: 8000
    },
    probability: {
        [POWERUP_TYPES.SHIELD]: 0.25,
        [POWERUP_TYPES.TIME_SLOW]: 0.25,
        [POWERUP_TYPES.CLEAR_BOARD]: 0.25,
        [POWERUP_TYPES.FORTRESS_REPAIR]: 0.25
    }
};

// Pawn types and their properties
const PAWN_TYPES = {
    NORMAL: 'normal',
    FAST: 'fast',
    ARMORED: 'armored',
    GHOST: 'ghost'
};

// Achievement tracking
const ACHIEVEMENTS = {
    PERFECT_DEFENSE: 'perfectDefense',
    KNIGHTS_HONOR: 'knightsHonor',
    SPEED_RUNNER: 'speedRunner',
    SURVIVOR: 'survivor'
};

let activePowerups = new Set();
let powerupTimer = 0;
let comboCount = 0;
let comboTimer = 0;
let gameStats = {
    startTime: 0,
    moveCount: 0,
    captureStreak: 0,
    maxCaptureStreak: 0,
    levelStartHealth: 10
};

// Add pawn speed tracking
const PAWN_SPEEDS = {
    VERY_FAST: 300,  // Move every 0.3 seconds (for higher levels)
    FAST: 500,       // Move every 0.5 seconds
    MEDIUM: 1000,    // Move every 1 second
    SLOW: 2000       // Move every 2 seconds
};

// Track individual pawn speeds
const pawnSpeedMap = new Map(); // Maps pawn ID to its speed
let pawnIdCounter = 0; // Unique ID for each pawn

// Function to get speed distribution based on level
function getPawnSpeed(level) {
    if (level >= 9) {
        // Level 9-10: Mostly very fast and fast pawns
        const speedDistribution = [
            PAWN_SPEEDS.VERY_FAST, PAWN_SPEEDS.VERY_FAST, PAWN_SPEEDS.VERY_FAST,
            PAWN_SPEEDS.FAST, PAWN_SPEEDS.FAST,
            PAWN_SPEEDS.MEDIUM
        ];
        return speedDistribution[Math.floor(Math.random() * speedDistribution.length)];
    } else if (level >= 7) {
        // Level 7-8: Mix of very fast, fast, and medium pawns
        const speedDistribution = [
            PAWN_SPEEDS.VERY_FAST, PAWN_SPEEDS.VERY_FAST,
            PAWN_SPEEDS.FAST, PAWN_SPEEDS.FAST,
            PAWN_SPEEDS.MEDIUM, PAWN_SPEEDS.MEDIUM
        ];
        return speedDistribution[Math.floor(Math.random() * speedDistribution.length)];
    } else if (level >= 6) {
        // Level 6: Original distribution
        const speedDistribution = [
            PAWN_SPEEDS.FAST, PAWN_SPEEDS.FAST,
            PAWN_SPEEDS.MEDIUM, PAWN_SPEEDS.MEDIUM,
            PAWN_SPEEDS.SLOW
        ];
        return speedDistribution[Math.floor(Math.random() * speedDistribution.length)];
    } else if (level >= 3) {
        // Level 3-5: Random distribution
        const speeds = [PAWN_SPEEDS.FAST, PAWN_SPEEDS.MEDIUM, PAWN_SPEEDS.SLOW];
        return speeds[Math.floor(Math.random() * speeds.length)];
    }
    return PAWN_SPEEDS.MEDIUM; // Default speed for levels 1-2
}

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
    
    const distribution = getPawnTypeDistribution(kdCurrentLevel);
    const pawnsToSpawn = calculatePawnsToSpawn();
    let pawnsSpawnedThisWave = 0;
    let attempts = 0;
    const maxAttempts = 16;

    // Create an array of available columns (0-7)
    let availableColumns = Array.from({length: 8}, (_, i) => i);
    
    while (pawnsSpawnedThisWave < pawnsToSpawn && attempts < maxAttempts && availableColumns.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableColumns.length);
        const spawnCol = availableColumns[randomIndex];
        
        if (kdBoardState[PAWN_SPAWN_ROW][spawnCol] === null) {
            const pawnId = `pawn_${pawnIdCounter++}`;
            const speed = getPawnSpeed(kdCurrentLevel);
            const pawnType = selectPawnType(distribution);
            
            kdBoardState[PAWN_SPAWN_ROW][spawnCol] = { 
                type: 'pawn', 
                color: 'attacker',
                id: pawnId,
                pawnType: pawnType,
                lastMoveTime: Date.now(),
                health: pawnType === PAWN_TYPES.ARMORED ? 2 : 1
            };
            
            pawnSpeedMap.set(pawnId, speed);
            pawnsSpawnedThisWave++;
            availableColumns.splice(randomIndex, 1);
        }
        attempts++;
    }
    
    if (pawnsSpawnedThisWave > 0) {
        console.log(`Spawned ${pawnsSpawnedThisWave} pawns in wave (Level ${kdCurrentLevel})`);
    }
}

function selectPawnType(distribution) {
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const [type, probability] of Object.entries(distribution)) {
        cumulativeProbability += probability;
        if (random <= cumulativeProbability) {
            return type;
        }
    }
    
    return PAWN_TYPES.NORMAL;
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
    const currentTime = Date.now();
    
    // First, check for potential captures and show warnings in levels 1-2
    if (kdCurrentLevel <= 2) {
        let knightInDanger = false;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (kdBoardState[r][c] && kdBoardState[r][c].type === 'pawn') {
                    const nextRow = r + 1;
                    if (nextRow < 8) {
                        // Only check diagonal captures for warnings
                        if ((c - 1 >= 0 && kdBoardState[nextRow][c - 1] && kdBoardState[nextRow][c - 1].type === 'knight') ||
                            (c + 1 < 8 && kdBoardState[nextRow][c + 1] && kdBoardState[nextRow][c + 1].type === 'knight')) {
                            knightInDanger = true;
                            GameSounds.play('warning');
                        }
                    }
                }
            }
        }
        if (knightInDanger && kdMessageArea) {
            kdMessageArea.textContent = "Warning: Knight in danger of diagonal capture! Move to safety!";
            kdMessageArea.style.color = "#ff4444";
            setTimeout(() => {
                if (kdMessageArea && kdMessageArea.textContent === "Warning: Knight in danger of diagonal capture! Move to safety!") {
                    kdMessageArea.textContent = "";
                    kdMessageArea.style.color = "";
                }
            }, 2000);
        }
    }

    // Now move pawns (iterate backwards to handle moves correctly)
    for (let r = 7; r >= 0; r--) {
        for (let c = 0; c < 8; c++) {
            const pawn = kdBoardState[r][c];
            if (pawn && pawn.type === 'pawn') {
                const pawnSpeed = pawnSpeedMap.get(pawn.id) || PAWN_SPEEDS.MEDIUM;
                
                // Check if it's time for this pawn to move
                if (currentTime - pawn.lastMoveTime >= pawnSpeed) {
                    const nextRow = r + 1;

                    if (nextRow < 8) {
                        let hasMoved = false;
                        
                        // Check for diagonal captures only
                        const canCaptureLeft = c - 1 >= 0 && kdBoardState[nextRow][c - 1] && kdBoardState[nextRow][c - 1].type === 'knight';
                        const canCaptureRight = c + 1 < 8 && kdBoardState[nextRow][c + 1] && kdBoardState[nextRow][c + 1].type === 'knight';
                        
                        // First priority: Try diagonal captures
                        if (!powerupManager.activePowerups.has(POWERUP_TYPES.SHIELD)) {
                            if (canCaptureLeft) {
                                // Capture knight to the left diagonal
                                kdBoardState[nextRow][c - 1] = pawn;
                                kdBoardState[r][c] = null;
                                pawn.lastMoveTime = currentTime;
                                GameSounds.play('capture');
                                if(kdMessageArea) kdMessageArea.textContent = "Knight was captured diagonally!";
                                kdPawnsCaptured++;
                                updateKDInfoBar();
                                hasMoved = true;
                            } else if (canCaptureRight) {
                                // Capture knight to the right diagonal
                                kdBoardState[nextRow][c + 1] = pawn;
                                kdBoardState[r][c] = null;
                                pawn.lastMoveTime = currentTime;
                                GameSounds.play('capture');
                                if(kdMessageArea) kdMessageArea.textContent = "Knight was captured diagonally!";
                                kdPawnsCaptured++;
                                updateKDInfoBar();
                                hasMoved = true;
                            }
                        }
                        
                        // Second priority: Try to move forward if not blocked
                        if (!hasMoved) {
                            const isGhost = pawn.pawnType === PAWN_TYPES.GHOST;
                            const isBlocked = kdBoardState[nextRow][c] !== null;
                            
                            // Move forward only if not blocked (or is ghost pawn, but ghosts still can't move through knights)
                            if (!isBlocked || (isGhost && kdBoardState[nextRow][c].type !== 'knight')) {
                                kdBoardState[nextRow][c] = pawn;
                                kdBoardState[r][c] = null;
                                pawn.lastMoveTime = currentTime;
                            }
                        }
                    } else {
                        // Pawn reached the fortress (bottom rank)
                        kdBoardState[r][c] = null;
                        pawnSpeedMap.delete(pawn.id);
                        handlePawnAtFortress(c, false);
                    }
                }
            }
        }
    }
}

function handlePawnAtFortress(col, knightOverrun = false) {
    // Only reduce fortress health if pawn actually reached the bottom (not from knight captures)
    if (!knightOverrun) {
        kdFortressHealth--;
        updateKDInfoBar();
        if (kdMessageArea) {
            kdMessageArea.textContent = `Fortress hit! Health: ${kdFortressHealth}`;
        }
        
        if (kdFortressHealth <= 0) {
            kdGameOver("The Fortress has fallen!");
        } else {
            if (kdCurrentLevel === 1 && !kdLevel1InitialPawnDealtWith) {
                const initialPawnExists = kdBoardState.flat().some(p => p && p.type === 'pawn');
                if (!initialPawnExists) {
                    console.log("Level 1 initial pawn dealt with (hit fortress). Spawning next wave.");
                    kdLevel1InitialPawnDealtWith = true;
                    currentPawnsPerWave = PAWNS_PER_WAVE_BASE;
                    spawnPawnWave();
                    nextPawnWaveTimer = 0;
                }
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
    kdCurrentLevel = 1;
    pawnSpeedMap.clear();
    pawnIdCounter = 0;
    initializeKnightDefense();
}

function kdLevelUp() {
    // Calculate total pawns needed for current level
    const currentLevelRequirement = LEVEL_REQUIREMENTS[kdCurrentLevel];
    
    // Check if player has completed the current level
    if (kdPawnsCaptured >= currentLevelRequirement) {
        if (kdCurrentLevel === 10) {
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
    const difficultyTier = Math.floor((level + 1) / 2);
    
    // Adjust wave timing and pawn counts based on level
    if (level >= 9) {
        currentPawnWaveInterval = Math.max(1500, PAWN_WAVE_INTERVAL_BASE - (difficultyTier * 2500));
        currentPawnsPerWave = 8;
    } else if (level >= 7) {
        currentPawnWaveInterval = Math.max(2000, PAWN_WAVE_INTERVAL_BASE - (difficultyTier * 2000));
        currentPawnsPerWave = 7;
    } else if (level >= 5) {
        currentPawnWaveInterval = Math.max(2500, PAWN_WAVE_INTERVAL_BASE - (difficultyTier * 1500));
        currentPawnsPerWave = 6;
    } else if (level >= 3) {
        currentPawnWaveInterval = Math.max(3000, PAWN_WAVE_INTERVAL_BASE - (difficultyTier * 1000));
        currentPawnsPerWave = 5;
    } else {
        currentPawnWaveInterval = Math.max(3500, PAWN_WAVE_INTERVAL_BASE - (difficultyTier * 800));
        currentPawnsPerWave = 4;
    }

    // Update max pawns on board based on level
    const maxPawns = level >= 9 ? 15 : 
                     level >= 7 ? 13 :
                     level >= 5 ? 11 : 
                     level >= 3 ? 9 : 7;

    // Pawn type distribution
    const pawnTypeDistribution = getPawnTypeDistribution(level);

    console.log(`Level ${level} (Difficulty Tier ${difficultyTier}):
        WaveInterval=${currentPawnWaveInterval},
        PawnsPerWave=${currentPawnsPerWave},
        MaxPawns=${maxPawns},
        PawnTypes=${JSON.stringify(pawnTypeDistribution)}`);
    
    if (kdGameActive) {
        if (kdGameLoopInterval) clearInterval(kdGameLoopInterval);
        kdGameLoopInterval = setInterval(kdGameTick, 100);
    }
}

function getPawnTypeDistribution(level) {
    if (level >= 9) {
        return {
            [PAWN_TYPES.NORMAL]: 0.3,
            [PAWN_TYPES.FAST]: 0.3,
            [PAWN_TYPES.ARMORED]: 0.2,
            [PAWN_TYPES.GHOST]: 0.2
        };
    } else if (level >= 7) {
        return {
            [PAWN_TYPES.NORMAL]: 0.4,
            [PAWN_TYPES.FAST]: 0.3,
            [PAWN_TYPES.ARMORED]: 0.2,
            [PAWN_TYPES.GHOST]: 0.1
        };
    } else if (level >= 5) {
        return {
            [PAWN_TYPES.NORMAL]: 0.5,
            [PAWN_TYPES.FAST]: 0.3,
            [PAWN_TYPES.ARMORED]: 0.2
        };
    } else if (level >= 3) {
        return {
            [PAWN_TYPES.NORMAL]: 0.7,
            [PAWN_TYPES.FAST]: 0.3
        };
    }
    return {
        [PAWN_TYPES.NORMAL]: 1
    };
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

// Helper function to count pawns currently on the board
function countPawnsOnBoard() {
    let count = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (kdBoardState[r][c] && kdBoardState[r][c].type === 'pawn') {
                count++;
            }
        }
    }
    return count;
}

function calculatePawnsToSpawn() {
    // Base number of pawns for the level
    let pawnsToSpawn;
    if (kdCurrentLevel >= 9) {
        pawnsToSpawn = 8; // 8 pawns for levels 9-10
    } else if (kdCurrentLevel >= 7) {
        pawnsToSpawn = 7; // 7 pawns for levels 7-8
    } else if (kdCurrentLevel >= 5) {
        pawnsToSpawn = 6; // 6 pawns for levels 5-6
    } else if (kdCurrentLevel >= 3) {
        pawnsToSpawn = 5; // 5 pawns for levels 3-4
    } else {
        pawnsToSpawn = 4; // 4 pawns for levels 1-2
    }

    // Adjust based on current board state
    const currentPawns = countPawnsOnBoard();
    const maxPawns = kdCurrentLevel >= 9 ? 15 : 
                     kdCurrentLevel >= 7 ? 13 :
                     kdCurrentLevel >= 5 ? 11 : 
                     kdCurrentLevel >= 3 ? 9 : 7;

    // If board is too full, reduce spawn count
    if (currentPawns >= maxPawns) {
        return 0;
    } else if (currentPawns + pawnsToSpawn > maxPawns) {
        return maxPawns - currentPawns;
    }

    return pawnsToSpawn;
}
