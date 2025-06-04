// Main Menu Elements
const mainMenuDiv = document.getElementById('main-menu');
const selectPawnWarButton = document.getElementById('select-pawn-war');
const selectKnightDefenseButton = document.getElementById('select-knight-defense');

// Pawn War Specific Elements
const pawnWarBoardElement = document.getElementById('board'); // Assuming 'board' is for Pawn War
const pawnWarGameStatusElement = document.getElementById('game-status'); // Assuming 'game-status' is for Pawn War
const pawnWarSetupContainerDiv = document.getElementById('pawn-war-setup-container');
const pawnWarColorSelectionDiv = document.getElementById('color-selection');
const pawnWarDifficultySelectionDiv = document.getElementById('difficulty-selection');
const pawnWarIconSelectionDiv = document.getElementById('icon-selection');
const pawnWarGameAreaDiv = document.getElementById('pawn-war-game-area');
const pawnWarPlayWhiteButton = document.getElementById('play-white');
const pawnWarPlayBlackButton = document.getElementById('play-black');
const pawnWarDifficultyEasyButton = document.getElementById('difficulty-easy');
const pawnWarDifficultyMediumButton = document.getElementById('difficulty-medium');
const pawnWarDifficultyHardButton = document.getElementById('difficulty-hard');
const pawnWarIconSetStandardButton = document.getElementById('icon-set-standard');
const pawnWarIconSetGeometricButton = document.getElementById('icon-set-geometric');
const pawnWarStartOverButton = document.getElementById('start-over-button');
const pawnWarUndoButton = document.getElementById('undo-button');
const pawnWarHintButton = document.getElementById('hint-button');
const pawnWarHintCountDisplay = document.getElementById('hint-count-display');
const pawnWarPlayerCapturedPawnsDiv = document.getElementById('player-captured-pawns');
const pawnWarAiCapturedPawnsDiv = document.getElementById('ai-captured-pawns');

// Knight Defense Specific Elements (Placeholders for now)
const knightDefenseGameAreaDiv = document.getElementById('knight-defense-game-area');
// const kdStartOverButton = document.getElementById('kd-start-over-button'); // Will be used later

const iconSets = { // This can be shared
    standard: { whitePawn: '♙', blackPawn: '♟', whiteQueen: '♕', blackQueen: '♛' },
    geometric: { whitePawn: '△', blackPawn: '▲', whiteQueen: '♔', blackQueen: '♚' }
};
let currentIconSet = 'standard'; // Default icon set

const board = [];
let selectedPawn = null;
let currentPlayer = 'white'; // White always starts
let playerColor = null;
let aiColor = null;
let currentAIDifficulty = 'easy'; // Default difficulty
let lastMoveDetails = null;
let gameOver = false;
let playerCaptured = [];
let aiCaptured = [];
let moveHistory = []; // For Undo functionality
let enPassantHintShown = false; // For tutorial tooltip
let maxHints = 0;
let hintsLeft = 0;
let pawnsUsedEnPassant = new Set(); // Track pawns that have used en passant

// Initialize the board with pawns
function initializeBoard() {
    for (let i = 0; i < 8; i++) {
        board[i] = [];
        for (let j = 0; j < 8; j++) {
            board[i][j] = null; // Empty square
        }
    }

    // Place white pawns on row 6 (0-indexed)
    for (let j = 0; j < 8; j++) {
        board[6][j] = { type: 'pawn', color: 'white' };
    }

    // Place black pawns on row 1 (0-indexed)
    for (let j = 0; j < 8; j++) {
        board[1][j] = { type: 'pawn', color: 'black' };
    }
}

// Render the Pawn War board
function renderPawnWarBoard() {
    if (!pawnWarBoardElement) return; // Safety check
    pawnWarBoardElement.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((i + j) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = i;
            square.dataset.col = j;

            const piece = board[i][j];
            if (piece) {
                const pawnElement = document.createElement('span');
                pawnElement.classList.add('pawn');
                const icons = iconSets[currentIconSet];
                if (piece.type === 'queen') {
                    pawnElement.classList.add(`${piece.color}-queen`);
                    pawnElement.textContent = piece.color === 'white' ? icons.whiteQueen : icons.blackQueen;
                } else {
                    pawnElement.classList.add(`${piece.color}-pawn`);
                    pawnElement.textContent = piece.color === 'white' ? icons.whitePawn : icons.blackPawn;
                }
                square.appendChild(pawnElement);
            }

            square.addEventListener('click', handleSquareClick);
            pawnWarBoardElement.appendChild(square);
        }
    }
}

// Handle Pawn War square clicks
function handleSquareClick(event) {
    const targetSquare = event.currentTarget;
    const row = parseInt(targetSquare.dataset.row);
    const col = parseInt(targetSquare.dataset.col);

    if (gameOver || currentPlayer === aiColor) { // Prevent player interaction during AI turn or game over
        console.log('Ignoring click - game over or AI turn');
        return;
    }

    if (selectedPawn) {
        const moveValidationResult = isValidMove(selectedPawn.row, selectedPawn.col, row, col);
        if (moveValidationResult.valid) {
            movePawn(selectedPawn.row, selectedPawn.col, row, col, moveValidationResult);
            selectedPawn = null;
            clearHighlights();
            
            // Switch player and trigger AI move if needed
            if (!gameOver) {
                console.log('Player move completed. Current player before switch:', currentPlayer);
                console.log('AI Color:', aiColor);
                currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
                console.log('Switched to:', currentPlayer);
                updateGameStatusMessage();
                
                if (currentPlayer === aiColor) {
                    console.log('Triggering AI move...');
                    setTimeout(() => {
                        console.log('Executing delayed AI move...');
                        triggerAIMove();
                    }, 500);
                }
            }
        } else {
            selectedPawn = null;
            clearHighlights();
        }
    } else {
        const piece = board[row][col];
        if (piece && piece.type === 'pawn' && piece.color === currentPlayer && piece.color === playerColor) {
            selectedPawn = { row, col, piece };
            highlightPossibleMoves(row, col);
        }
    }
}

// Check if a move is valid
function isValidMove(startRow, startCol, endRow, endCol) {
    const piece = board[startRow][startCol];

    if (!piece || piece.type !== 'pawn' || piece.color !== currentPlayer) {
        return { valid: false };
    }

    const rowDiff = endRow - startRow;
    const colDiff = Math.abs(endCol - startCol);

    // Create a unique identifier for the pawn
    const pawnId = `${startRow}-${startCol}`;

    if (piece.color === 'white') {
        // White pawn moves
        if (rowDiff === -1 && colDiff === 0 && board[endRow][endCol] === null) { // 1-step forward
            return { valid: true, type: 'normal' };
        }
        if (startRow === 6 && rowDiff === -2 && colDiff === 0 && board[startRow - 1][startCol] === null && board[endRow][endCol] === null) { // Initial 2-step
            return { valid: true, type: 'normal' };
        }
        if (rowDiff === -1 && colDiff === 1 && board[endRow][endCol] && board[endRow][endCol].color === 'black') { // Capture
            return { valid: true, type: 'normal' };
        }
        // En passant for white
        if (startRow === 3 && rowDiff === -1 && colDiff === 1 && board[endRow][endCol] === null && lastMoveDetails) {
            if (!pawnsUsedEnPassant.has(pawnId) && // Check if this pawn hasn't used en passant before
                lastMoveDetails.pieceColor === 'black' &&
                lastMoveDetails.isTwoStepPawnMove &&
                lastMoveDetails.endRow === 3 &&
                lastMoveDetails.endCol === endCol &&
                board[3][endCol] && board[3][endCol].color === 'black' && board[3][endCol].type === 'pawn') {
                return { valid: true, type: 'enPassant', capturedPawnRow: 3, capturedPawnCol: endCol, pawnId: pawnId };
            }
        }
    } else { // Black pawn moves
        if (rowDiff === 1 && colDiff === 0 && board[endRow][endCol] === null) { // 1-step forward
            return { valid: true, type: 'normal' };
        }
        if (startRow === 1 && rowDiff === 2 && colDiff === 0 && board[startRow + 1][startCol] === null && board[endRow][endCol] === null) { // Initial 2-step
            return { valid: true, type: 'normal' };
        }
        if (rowDiff === 1 && colDiff === 1 && board[endRow][endCol] && board[endRow][endCol].color === 'white') { // Capture
            return { valid: true, type: 'normal' };
        }
        // En passant for black
        if (startRow === 4 && rowDiff === 1 && colDiff === 1 && board[endRow][endCol] === null && lastMoveDetails) {
            if (!pawnsUsedEnPassant.has(pawnId) && // Check if this pawn hasn't used en passant before
                lastMoveDetails.pieceColor === 'white' &&
                lastMoveDetails.isTwoStepPawnMove &&
                lastMoveDetails.endRow === 4 &&
                lastMoveDetails.endCol === endCol &&
                board[4][endCol] && board[4][endCol].color === 'white' && board[4][endCol].type === 'pawn') {
                return { valid: true, type: 'enPassant', capturedPawnRow: 4, capturedPawnCol: endCol, pawnId: pawnId };
            }
        }
    }
    return { valid: false };
}

// Move the pawn
function movePawn(startRow, startCol, endRow, endCol, moveDetails) {
    if (currentPlayer === playerColor && !gameOver) {
        saveMoveHistory();
    }

    const movedPieceData = { ...board[startRow][startCol] };
    let capturedPieceData = null;
    let capturedPieceElement = null;
    const animationDuration = 500;

    // Store captured piece data BEFORE updating board state
    if (moveDetails.type === 'enPassant') {
        capturedPieceData = { ...board[moveDetails.capturedPawnRow][moveDetails.capturedPawnCol] };
        // Mark this pawn as having used en passant
        pawnsUsedEnPassant.add(moveDetails.pawnId);
    } else if (board[endRow][endCol]) {
        capturedPieceData = { ...board[endRow][endCol] };
    }

    // Update the board state
    board[endRow][endCol] = movedPieceData;
    board[startRow][startCol] = null;

    // Handle capture animations and updates
    if (moveDetails.type === 'enPassant') {
        const epSquare = pawnWarBoardElement.querySelector(`[data-row="${moveDetails.capturedPawnRow}"][data-col="${moveDetails.capturedPawnCol}"]`);
        if (epSquare && epSquare.firstChild) {
            capturedPieceElement = epSquare.firstChild;
            board[moveDetails.capturedPawnRow][moveDetails.capturedPawnCol] = null;
        }
    }

    if (capturedPieceElement && capturedPieceData) {
        capturedPieceElement.classList.add('pawn-captured-fadeout');
        if (movedPieceData.color === playerColor) {
            aiCaptured.push(capturedPieceData);
        } else {
            playerCaptured.push(capturedPieceData);
        }
        renderCapturedPawns();
    }

    const isTwoStep = movedPieceData.type === 'pawn' && Math.abs(endRow - startRow) === 2;
    lastMoveDetails = {
        pieceColor: movedPieceData.color,
        startRow: startRow, startCol: startCol,
        endRow: endRow, endCol: endCol,
        isTwoStepPawnMove: isTwoStep
    };

    // Render the board immediately to show the move
    renderPawnWarBoard();
    
    // Check win condition after a short delay to allow for animation
    setTimeout(() => {
        checkWinCondition();
    }, animationDuration);
}

// Check for win condition for Pawn War
function checkWinCondition() {
    // Check for white pawn reaching row 0
    for (let j = 0; j < 8; j++) {
        if (board[0][j] && board[0][j].type === 'pawn' && board[0][j].color === 'white') {
            board[0][j].type = 'queen';
            renderPawnWarBoard();
            if(pawnWarGameStatusElement) {
                pawnWarGameStatusElement.textContent = 'White Wins by Promotion!';
                pawnWarGameStatusElement.className = 'win-message';
            }
            gameOver = true;
            updateGameControlButtonsState();
            return;
        }
    }

    // Check for black pawn reaching row 7
    for (let j = 0; j < 8; j++) {
        if (board[7][j] && board[7][j].type === 'pawn' && board[7][j].color === 'black') {
            board[7][j].type = 'queen';
            renderPawnWarBoard();
            if(pawnWarGameStatusElement) {
                pawnWarGameStatusElement.textContent = 'Black Wins by Promotion!';
                pawnWarGameStatusElement.className = 'win-message';
            }
            gameOver = true;
            updateGameControlButtonsState();
            return;
        }
    }
}

// Highlight possible moves for Pawn War
function highlightPossibleMoves(row, col) {
    clearHighlights(); // Clears all types of highlights
    const selectedSquare = pawnWarBoardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (selectedSquare) {
        selectedSquare.classList.add('selected');
    }

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const validation = isValidMove(row, col, i, j);
            if (validation.valid) {
                const squareToHighlight = pawnWarBoardElement.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                if (squareToHighlight) {
                    squareToHighlight.classList.add('possible-move');
                    if (validation.type === 'enPassant' && currentPlayer === playerColor && !enPassantHintShown) {
                        setTimeout(() => {
                            alert("En Passant! You can capture the opponent's pawn by moving diagonally to the square it skipped.");
                        }, 100);
                        enPassantHintShown = true;
                    }
                }
            }
        }
    }
}

// Clear all highlights (selected, possible, hint)
function clearHighlights() {
    if(pawnWarBoardElement) {
        pawnWarBoardElement.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        pawnWarBoardElement.querySelectorAll('.possible-move').forEach(el => el.classList.remove('possible-move'));
        pawnWarBoardElement.querySelectorAll('.hint-square').forEach(el => el.classList.remove('hint-square'));
    }
}

// Switch player for Pawn War
function switchPlayer() {
    currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
    if (!gameOver) {
        updateGameStatusMessage();
        if (currentPlayer === aiColor) {
            setTimeout(triggerAIMove, 500);
        }
    } else {
        updateGameStatusMessage();
    }
}

// AI Dispatcher for Pawn War
function triggerAIMove() {
    if (gameOver) {
        console.log('Game is over, AI will not move');
        return;
    }

    console.log('AI Move triggered. Current player:', currentPlayer, 'AI Color:', aiColor);

    if (currentPlayer !== aiColor) {
        console.log('Error: AI triggered but not AI turn');
        return;
    }

    if (!pawnWarGameStatusElement) {
        console.error('Game status element not found!');
    } else {
        pawnWarGameStatusElement.textContent = "AI is thinking...";
        pawnWarGameStatusElement.style.color = "#337ab7";
        pawnWarGameStatusElement.style.fontStyle = "italic";
    }

    const allPossibleMoves = generateAllPossibleAIMoves();
    console.log('Possible AI moves:', allPossibleMoves.length);

    if (allPossibleMoves.length === 0) {
        console.log('No possible moves for AI');
        updateGameStatusMessage();
        return;
    }

    let bestMove = null;
    if (currentAIDifficulty === 'easy') {
        bestMove = aiMoveEasy(allPossibleMoves);
    } else if (currentAIDifficulty === 'medium') {
        bestMove = aiMoveMedium(allPossibleMoves);
    } else if (currentAIDifficulty === 'hard') {
        bestMove = aiMoveHard(allPossibleMoves);
    } else {
        bestMove = aiMoveEasy(allPossibleMoves);
    }

    if (bestMove) {
        console.log('AI executing move:', bestMove);
        movePawn(bestMove.startRow, bestMove.startCol, bestMove.endRow, bestMove.endCol, bestMove.moveDetails);
        currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
        updateGameStatusMessage();
    } else {
        console.log('No best move found for AI');
        updateGameStatusMessage();
    }
}

function generateAllPossibleAIMoves() {
    console.log('Generating moves for AI color:', aiColor);
    let possibleMoves = [];
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] && board[r][c].type === 'pawn' && board[r][c].color === aiColor) {
                for (let endR = 0; endR < 8; endR++) {
                    for (let endC = 0; endC < 8; endC++) {
                        const moveValidation = isValidMove(r, c, endR, endC);
                        if (moveValidation.valid) {
                            possibleMoves.push({
                                startRow: r, startCol: c, endRow: endR, endCol: endC,
                                moveDetails: moveValidation, piece: board[r][c]
                            });
                        }
                    }
                }
            }
        }
    }
    
    console.log(`Found ${possibleMoves.length} possible moves for AI`);
    return possibleMoves;
}

// Easy AI Logic
function aiMoveEasy(possibleMoves) {
    if (possibleMoves.length === 0) return null;
    let bestMove = null;

    // Priority 1: Winning move
    const winningRow = (aiColor === 'white') ? 0 : 7;
    for (const move of possibleMoves) {
        if (move.endRow === winningRow) {
            bestMove = move;
            return bestMove; // Immediate return for winning move
        }
    }

    // Priority 2: Capture
    const captureMoves = possibleMoves.filter(move =>
        (board[move.endRow][move.endCol] && board[move.endRow][move.endCol].color === playerColor) ||
        (move.moveDetails.type === 'enPassant')
    );
    if (captureMoves.length > 0) {
        bestMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        return bestMove;
    }

    // Priority 3: Advance Pawn
    const forwardMoves = possibleMoves.filter(move => board[move.endRow][move.endCol] === null);
    if (forwardMoves.length > 0) {
        if (aiColor === 'white') {
            forwardMoves.sort((a, b) => a.endRow - b.endRow); // White wants to minimize row index
        } else {
            forwardMoves.sort((a, b) => b.endRow - a.endRow); // Black wants to maximize row index
        }
        bestMove = forwardMoves[0]; // Furthest advance
        return bestMove;
    }
    
    // Fallback: any random valid move
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}

// Medium AI Logic (Placeholder - to be enhanced)
function aiMoveMedium(possibleMoves) {
    if (possibleMoves.length === 0) return null;
    let bestMove = null;

    // Priority 1: Winning move
    const winningRow = (aiColor === 'white') ? 0 : 7;
    for (const move of possibleMoves) {
        if (move.endRow === winningRow) {
            return move; // Immediate return
        }
    }

    // Priority 2: "Safer" Captures (simple lookahead)
    let safeCaptures = [];
    const captureMoves = possibleMoves.filter(move =>
        (board[move.endRow][move.endCol] && board[move.endRow][move.endCol].color === playerColor) ||
        (move.moveDetails.type === 'enPassant')
    );

    for (const capMove of captureMoves) {
        // Simulate the capture
        const tempBoard = JSON.parse(JSON.stringify(board)); // Deep copy
        tempBoard[capMove.endRow][capMove.endCol] = tempBoard[capMove.startRow][capMove.startCol];
        tempBoard[capMove.startRow][capMove.startCol] = null;
        if (capMove.moveDetails.type === 'enPassant') {
            // The pawn captured en passant is on the AI's starting rank, in the destination column
            tempBoard[capMove.startRow][capMove.endCol] = null;
        }

        // Check if player can recapture immediately
        let canPlayerRecapture = false;
        const originalCurrentPlayer = currentPlayer; // Save
        currentPlayer = playerColor; // Simulate player's turn

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (tempBoard[r][c] && tempBoard[r][c].color === playerColor) {
                    // Temporarily use the AI's captured piece's square as target
                    const validation = isValidMoveOnBoard(tempBoard, r, c, capMove.endRow, capMove.endCol);
                    if (validation.valid) {
                        canPlayerRecapture = true;
                        break;
                    }
                }
            }
            if (canPlayerRecapture) break;
        }
        currentPlayer = originalCurrentPlayer; // Restore

        if (!canPlayerRecapture) {
            safeCaptures.push(capMove);
        }
    }

    if (safeCaptures.length > 0) {
        bestMove = safeCaptures[Math.floor(Math.random() * safeCaptures.length)];
        return bestMove;
    }
    // If all captures are unsafe, might take one anyway or prefer advance
    if (captureMoves.length > 0 && !bestMove) { // Fallback to any capture if no safe ones
         bestMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
         // Potentially return here, or let it fall through to advance
    }


    // Priority 3: Advance Pawn (preferring central or paired, then furthest)
    // This part can be more complex. For now, similar to easy but after safer captures.
    if (!bestMove) {
        const forwardMoves = possibleMoves.filter(move => board[move.endRow][move.endCol] === null);
        if (forwardMoves.length > 0) {
            // Add logic here to prefer central/paired pawns if desired
            // For now, just furthest:
            if (aiColor === 'white') {
                forwardMoves.sort((a, b) => a.endRow - b.endRow);
            } else {
                forwardMoves.sort((a, b) => b.endRow - a.endRow);
            }
            bestMove = forwardMoves[0];
            return bestMove;
        }
    }
    
    // Fallback: any random valid move from all captures if no safe ones and no good advance
    if (!bestMove && captureMoves.length > 0) {
        return captureMoves[Math.floor(Math.random() * captureMoves.length)];
    }
    // Final fallback: any random move
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}

// Helper for AI to check moves on a temporary board state
function isValidMoveOnBoard(tempBoard, startRow, startCol, endRow, endCol) {
    // This is a simplified version of the main isValidMove, adapted for a temp board
    // It assumes 'currentPlayer' is correctly set to the player whose move is being checked
    const piece = tempBoard[startRow][startCol];
    if (!piece || piece.type !== 'pawn' || piece.color !== currentPlayer) { // Check against global currentPlayer
        return { valid: false };
    }
    const rowDiff = endRow - startRow;
    const colDiff = Math.abs(endCol - startCol);

    if (piece.color === 'white') {
        if (rowDiff === -1 && colDiff === 0 && tempBoard[endRow][endCol] === null) return { valid: true };
        if (startRow === 6 && rowDiff === -2 && colDiff === 0 && tempBoard[startRow - 1][startCol] === null && tempBoard[endRow][endCol] === null) return { valid: true };
        if (rowDiff === -1 && colDiff === 1 && tempBoard[endRow][endCol] && tempBoard[endRow][endCol].color === 'black') return { valid: true };
        // Simplified: No en-passant check for AI's lookahead on player's recapture
    } else { // Black
        if (rowDiff === 1 && colDiff === 0 && tempBoard[endRow][endCol] === null) return { valid: true };
        if (startRow === 1 && rowDiff === 2 && colDiff === 0 && tempBoard[startRow + 1][startCol] === null && tempBoard[endRow][endCol] === null) return { valid: true };
        if (rowDiff === 1 && colDiff === 1 && tempBoard[endRow][endCol] && tempBoard[endRow][endCol].color === 'white') return { valid: true };
    }
    return { valid: false };
}

// Hard AI Logic (Minimax based)
const MINIMAX_DEPTH = 4; // Increased depth with Alpha-Beta Pruning

function aiMoveHard(possibleMoves) {
    if (possibleMoves.length === 0) return null;

    let bestScore = -Infinity;
    let bestMove = possibleMoves[0]; // Default to first move

    // Temporarily set currentPlayer to AI for simulations
    const originalSimPlayer = currentPlayer;
    currentPlayer = aiColor;

    for (const move of possibleMoves) {
        const tempBoard = JSON.parse(JSON.stringify(board));
        // Simulate the move on tempBoard
        tempBoard[move.endRow][move.endCol] = tempBoard[move.startRow][move.startCol];
        tempBoard[move.startRow][move.startCol] = null;
        if (move.moveDetails.type === 'enPassant') {
            tempBoard[move.startRow][move.endCol] = null; // Corrected en-passant capture
        }
        // Note: lastMoveDetails is not updated for minimax simulation to keep it simpler

        const score = minimax(tempBoard, MINIMAX_DEPTH, -Infinity, Infinity, false, aiColor); // AI made a move, now it's opponent's turn (minimizing)
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    currentPlayer = originalSimPlayer; // Restore
    return bestMove;
}

function minimax(currentBoard, depth, alpha, beta, isMaximizingPlayer, perspectiveColor) {
    const gameResult = checkWinConditionOnBoard(currentBoard);
    if (gameResult !== null) {
        if (gameResult === perspectiveColor) return 10000 + depth; // Win faster is better
        if (gameResult === (perspectiveColor === 'white' ? 'black' : 'white')) return -10000 - depth; // Lose slower is better
    }
    if (depth === 0) {
        return evaluateBoardState(currentBoard, perspectiveColor);
    }

    const movesColor = isMaximizingPlayer ? perspectiveColor : (perspectiveColor === 'white' ? 'black' : 'white');
    const possibleNextMoves = generateMovesForPlayerOnBoard(currentBoard, movesColor);

    if (possibleNextMoves.length === 0) {
        return evaluateBoardState(currentBoard, perspectiveColor);
    }

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of possibleNextMoves) {
            const childBoard = JSON.parse(JSON.stringify(currentBoard));
            childBoard[move.endRow][move.endCol] = childBoard[move.startRow][move.startCol];
            childBoard[move.startRow][move.startCol] = null;
            if (move.moveDetails.type === 'enPassant') {
                childBoard[move.startRow][move.endCol] = null;
            }
            const evalScore = minimax(childBoard, depth - 1, alpha, beta, false, perspectiveColor);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) {
                break; // Beta cut-off
            }
        }
        return maxEval;
    } else { // Minimizing player
        let minEval = Infinity;
        for (const move of possibleNextMoves) {
            const childBoard = JSON.parse(JSON.stringify(currentBoard));
            childBoard[move.endRow][move.endCol] = childBoard[move.startRow][move.startCol];
            childBoard[move.startRow][move.startCol] = null;
            if (move.moveDetails.type === 'enPassant') {
                childBoard[move.startRow][move.endCol] = null;
            }
            const evalScore = minimax(childBoard, depth - 1, alpha, beta, true, perspectiveColor);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) {
                break; // Alpha cut-off
            }
        }
        return minEval;
    }
}

function evaluateBoardState(currentBoard, forColor) {
    let score = 0;
    const opponentColor = (forColor === 'white') ? 'black' : 'white';
    const pawnValue = 100; // Base value of a pawn
    const advancementMultiplier = 10; // Multiplier for how far advanced a pawn is
    const passedPawnBonus = 50; // Bonus for a passed pawn
    const connectedPawnBonus = 5; // Small bonus for connected pawns

    let myPawnsCount = 0;
    let opponentPawnsCount = 0;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = currentBoard[r][c];
            if (piece && piece.type === 'pawn') {
                if (piece.color === forColor) {
                    myPawnsCount++;
                    // Advancement score
                    if (forColor === 'white') {
                        score += (6 - r) * advancementMultiplier; // Max 60 for pawn on row 0
                        if (isPassedPawn(currentBoard, r, c, 'white')) {
                            score += passedPawnBonus;
                        }
                        // Check for connected pawns (supporting this white pawn)
                        if (r + 1 < 8) {
                            if (c - 1 >= 0 && currentBoard[r+1][c-1] && currentBoard[r+1][c-1].color === 'white') score += connectedPawnBonus;
                            if (c + 1 < 8 && currentBoard[r+1][c+1] && currentBoard[r+1][c+1].color === 'white') score += connectedPawnBonus;
                        }
                    } else { // forColor is 'black'
                        score += (r - 1) * advancementMultiplier; // Max 60 for pawn on row 7
                        if (isPassedPawn(currentBoard, r, c, 'black')) {
                            score += passedPawnBonus;
                        }
                        // Check for connected pawns (supporting this black pawn)
                         if (r - 1 >= 0) {
                            if (c - 1 >= 0 && currentBoard[r-1][c-1] && currentBoard[r-1][c-1].color === 'black') score += connectedPawnBonus;
                            if (c + 1 < 8 && currentBoard[r-1][c+1] && currentBoard[r-1][c+1].color === 'black') score += connectedPawnBonus;
                        }
                    }
                } else {
                    opponentPawnsCount++;
                }
            }
        }
    }
    score += (myPawnsCount - opponentPawnsCount) * pawnValue;

    return score;
}

function isPassedPawn(currentBoard, r, c, color) {
    const opponentColor = (color === 'white') ? 'black' : 'white';
    if (color === 'white') {
        for (let i = r - 1; i >= 0; i--) { // Check rows in front
            if (currentBoard[i][c] && currentBoard[i][c].color === opponentColor) return false; // Blocked on same file
            if (c > 0 && currentBoard[i][c-1] && currentBoard[i][c-1].color === opponentColor) return false; // Blocked on adjacent file
            if (c < 7 && currentBoard[i][c+1] && currentBoard[i][c+1].color === opponentColor) return false; // Blocked on adjacent file
        }
    } else { // color is 'black'
        for (let i = r + 1; i < 8; i++) { // Check rows in front
            if (currentBoard[i][c] && currentBoard[i][c].color === opponentColor) return false;
            if (c > 0 && currentBoard[i][c-1] && currentBoard[i][c-1].color === opponentColor) return false;
            if (c < 7 && currentBoard[i][c+1] && currentBoard[i][c+1].color === opponentColor) return false;
        }
    }
    return true;
}


function generateMovesForPlayerOnBoard(currentBoardState, colorForMoves) {
    let possibleMoves = [];
    const originalSimPlayer = currentPlayer; // Save global currentPlayer
    currentPlayer = colorForMoves; // Set for isValidMoveOnBoard (or a dedicated isValidMove for any player)

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (currentBoardState[r][c] && currentBoardState[r][c].type === 'pawn' && currentBoardState[r][c].color === colorForMoves) {
                for (let endR = 0; endR < 8; endR++) {
                    for (let endC = 0; endC < 8; endC++) {
                        // Need a version of isValidMove that can take a board state
                        // For now, we'll use the global isValidMove, but this is a simplification
                        // as lastMoveDetails won't be correct for simulated boards.
                        // A proper minimax would pass lastMoveDetails through simulations or have a stateless isValidMove.
                        // Let's adapt isValidMoveOnBoard to be more general for this.
                        const moveValidation = isValidMoveOnBoard(currentBoardState, r, c, endR, endC); // Uses global currentPlayer
                        if (moveValidation.valid) {
                             possibleMoves.push({
                                startRow: r, startCol: c, endRow: endR, endCol: endC,
                                moveDetails: moveValidation, // moveDetails might be simple {valid:true} from isValidMoveOnBoard
                                piece: currentBoardState[r][c]
                            });
                        }
                    }
                }
            }
        }
    }
    currentPlayer = originalSimPlayer; // Restore global currentPlayer
    return possibleMoves;
}

// Helper to check win condition on a temporary board
function checkWinConditionOnBoard(currentBoard) {
    for (let j = 0; j < 8; j++) {
        if (currentBoard[0][j] && currentBoard[0][j].type === 'pawn' && currentBoard[0][j].color === 'white') return 'white';
        if (currentBoard[7][j] && currentBoard[7][j].type === 'pawn' && currentBoard[7][j].color === 'black') return 'black';
    }
    return null; // No winner
}


// Game Setup Flow
function setupGameControls() {
    // Main Menu Listeners
    if (selectPawnWarButton) selectPawnWarButton.addEventListener('click', showPawnWarSetup);
    if (selectKnightDefenseButton) selectKnightDefenseButton.addEventListener('click', showKnightDefenseGame);

    // Pawn War Setup Listeners
    if (pawnWarPlayWhiteButton) pawnWarPlayWhiteButton.addEventListener('click', () => selectColorAndShowDifficultyOptions('white'));
    if (pawnWarPlayBlackButton) pawnWarPlayBlackButton.addEventListener('click', () => selectColorAndShowDifficultyOptions('black'));
    if (pawnWarDifficultyEasyButton) pawnWarDifficultyEasyButton.addEventListener('click', () => selectDifficultyAndShowIconOptions('easy'));
    if (pawnWarDifficultyMediumButton) pawnWarDifficultyMediumButton.addEventListener('click', () => selectDifficultyAndShowIconOptions('medium'));
    if (pawnWarDifficultyHardButton) pawnWarDifficultyHardButton.addEventListener('click', () => selectDifficultyAndShowIconOptions('hard'));
    if (pawnWarIconSetStandardButton) pawnWarIconSetStandardButton.addEventListener('click', () => startGameWithChosenIcons('standard'));
    if (pawnWarIconSetGeometricButton) pawnWarIconSetGeometricButton.addEventListener('click', () => startGameWithChosenIcons('geometric'));
    
    // Pawn War Game Controls
    if (pawnWarStartOverButton) pawnWarStartOverButton.addEventListener('click', resetGameToSelection);
    if (pawnWarUndoButton) pawnWarUndoButton.addEventListener('click', undoMove);
    if (pawnWarHintButton) pawnWarHintButton.addEventListener('click', showHint);

    // Knight Defense Controls
    const kdBackToMainMenuButton = document.getElementById('kd-back-to-main-menu');
    if (kdBackToMainMenuButton) kdBackToMainMenuButton.addEventListener('click', showMainMenu);
    
    // const kdStartButton = document.getElementById('kd-start-button'); // Listener is in knight_defense.js
    // const kdResetButton = document.getElementById('kd-reset-button'); // Listener is in knight_defense.js

    showMainMenu(); // Initial display
}

function showMainMenu() {
    if (mainMenuDiv) mainMenuDiv.style.display = 'block';
    if (pawnWarSetupContainerDiv) pawnWarSetupContainerDiv.style.display = 'none';
    if (pawnWarColorSelectionDiv) pawnWarColorSelectionDiv.style.display = 'none';
    if (pawnWarDifficultySelectionDiv) pawnWarDifficultySelectionDiv.style.display = 'none';
    if (pawnWarIconSelectionDiv) pawnWarIconSelectionDiv.style.display = 'none';
    if (pawnWarGameAreaDiv) pawnWarGameAreaDiv.style.display = 'none';
    if (knightDefenseGameAreaDiv) knightDefenseGameAreaDiv.style.display = 'none';
    
    if(typeof updateGameControlButtonsState === 'function') {
        updateGameControlButtonsState();
    }
}

function showPawnWarSetup() {
    if (mainMenuDiv) mainMenuDiv.style.display = 'none';
    if (pawnWarSetupContainerDiv) pawnWarSetupContainerDiv.style.display = 'block';
    if (pawnWarColorSelectionDiv) pawnWarColorSelectionDiv.style.display = 'block';
    if (pawnWarDifficultySelectionDiv) pawnWarDifficultySelectionDiv.style.display = 'none';
    if (pawnWarIconSelectionDiv) pawnWarIconSelectionDiv.style.display = 'none';
    if (pawnWarGameAreaDiv) pawnWarGameAreaDiv.style.display = 'none';
    if (knightDefenseGameAreaDiv) knightDefenseGameAreaDiv.style.display = 'none';
}

function showKnightDefenseGame() {
    if (mainMenuDiv) mainMenuDiv.style.display = 'none';
    if (pawnWarSetupContainerDiv) pawnWarSetupContainerDiv.style.display = 'none';
    if (pawnWarGameAreaDiv) pawnWarGameAreaDiv.style.display = 'none';
    if (knightDefenseGameAreaDiv) knightDefenseGameAreaDiv.style.display = 'block';
    
    if (typeof initializeKnightDefense === 'function') {
        initializeKnightDefense();
    } else {
        console.error("initializeKnightDefense function not found. Make sure knight_defense.js is loaded.");
        alert("Error loading Knight Defense mode. Files might be missing.");
    }
    // alert("Knight Defense Mode - Coming Soon!"); // Replaced by actual initialization
}

function updateHintDisplay() { // For Pawn War
    if (pawnWarHintCountDisplay) {
        pawnWarHintCountDisplay.textContent = `Hints left: ${hintsLeft}`;
    }
}

function showHint() { // For Pawn War
    if (gameOver || currentPlayer !== playerColor || hintsLeft <= 0) {
        return;
    }

    // Temporarily set currentPlayer to playerColor for generating player's best move
    const originalTurnPlayer = currentPlayer;
    currentPlayer = playerColor; // Ensure context is for the player

    const allPlayerMoves = generateMovesForPlayerOnBoard(board, playerColor); // Use current board

    currentPlayer = originalTurnPlayer; // Restore current player immediately after generating moves

    if (allPlayerMoves.length === 0) {
        // No hint to show if player has no moves
        return;
    }

    let hintMove = null;
    // Use a medium difficulty AI logic to find a good move for the player
    // We need to simulate as if the AI is playing as the player
    const tempAiColor = aiColor; // Store original AI color
    const tempPlayerColor = playerColor; // Store original player color

    aiColor = playerColor;     // AI temporarily "becomes" the player
    playerColor = tempAiColor; // Player temporarily "becomes" the AI (opponent for hint calc)
    
    // We need to set currentPlayer to the player's color for the AI function to work from player's perspective
    const hintEvaluationPlayer = currentPlayer;
    currentPlayer = aiColor; // Set to player's color (who is now aiColor for this simulation)

    // Medium AI is a good balance for a hint
    hintMove = aiMoveMedium(allPlayerMoves); // aiMoveMedium uses global aiColor

    // Restore original colors and currentPlayer
    aiColor = tempAiColor;
    playerColor = tempPlayerColor;
    currentPlayer = hintEvaluationPlayer;


    if (hintMove) {
        const startSquare = document.querySelector(`[data-row="${hintMove.startRow}"][data-col="${hintMove.startCol}"]`);
        const endSquare = document.querySelector(`[data-row="${hintMove.endRow}"][data-col="${hintMove.endCol}"]`);

        if (startSquare && endSquare) {
            startSquare.classList.add('hint-square');
            endSquare.classList.add('hint-square');

            // Remove hint after a short delay
            setTimeout(() => {
                startSquare.classList.remove('hint-square');
                endSquare.classList.remove('hint-square');
            }, 1500); // Highlight for 1.5 seconds
            hintsLeft--;
            updateHintDisplay();
            updateGameControlButtonsState(); // Update button state after using a hint
        }
    }
}


function saveMoveHistory() {
    const currentBoardState = JSON.parse(JSON.stringify(board));
    const currentLastMoveDetails = lastMoveDetails ? JSON.parse(JSON.stringify(lastMoveDetails)) : null;
    const currentPlayerCaptured = JSON.parse(JSON.stringify(playerCaptured));
    const currentAiCaptured = JSON.parse(JSON.stringify(aiCaptured));

    moveHistory.push({
        board: currentBoardState,
        currentPlayer: currentPlayer, // Player whose turn it was BEFORE this move
        lastMoveDetails: currentLastMoveDetails,
        playerCaptured: currentPlayerCaptured,
        aiCaptured: currentAiCaptured,
        gameOver: gameOver,
        pawnsUsedEnPassant: new Set(pawnsUsedEnPassant) // Save en passant tracking state
    });
    updateGameControlButtonsState();
}

function undoMove() {
    if (moveHistory.length === 0 || gameOver) {
        return;
    }

    const prevState = moveHistory.pop();

    for (let i = 0; i < 8; i++) {
        board[i] = [...(prevState.board[i] || [])]; // Ensure full row copy
    }

    currentPlayer = prevState.currentPlayer;
    lastMoveDetails = prevState.lastMoveDetails;
    playerCaptured = [...prevState.playerCaptured];
    aiCaptured = [...prevState.aiCaptured];
    gameOver = prevState.gameOver;
    pawnsUsedEnPassant = new Set(prevState.pawnsUsedEnPassant); // Restore en passant tracking state

    selectedPawn = null;
    clearHighlights(); // Clear any visual highlights like 'selected' or 'possible-move'
    document.querySelectorAll('.hint-square').forEach(el => el.classList.remove('hint-square')); // Clear hint highlights

    renderBoard();
    renderCapturedPawns();
    updateGameStatusMessage();
    updateGameControlButtonsState();
}

function updateGameControlButtonsState() { // For Pawn War
    if(pawnWarUndoButton) pawnWarUndoButton.disabled = moveHistory.length === 0 || gameOver || currentPlayer === aiColor;
    if(pawnWarHintButton) pawnWarHintButton.disabled = gameOver || currentPlayer === aiColor || hintsLeft <= 0;
}

function updateGameStatusMessage() { // For Pawn War
    if (!pawnWarGameStatusElement) {
        console.error('Game status element not found!');
        return;
    }

    if (gameOver) {
        // checkWinCondition would have set the message. Reset style if it was "AI is thinking".
        if (pawnWarGameStatusElement.textContent.includes("Wins by Promotion!")) {
             pawnWarGameStatusElement.style.color = "";
             pawnWarGameStatusElement.style.fontStyle = "";
        }
    } else {
        pawnWarGameStatusElement.textContent = `Current player: ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}. AI Difficulty: ${currentAIDifficulty.charAt(0).toUpperCase() + currentAIDifficulty.slice(1)}`;
        pawnWarGameStatusElement.style.color = "";
        pawnWarGameStatusElement.style.fontStyle = "";
    }
}


function renderCapturedPawns() {
    if (!pawnWarPlayerCapturedPawnsDiv || !pawnWarAiCapturedPawnsDiv) {
        console.error('Captured pawns display elements not found!');
        return;
    }

    pawnWarPlayerCapturedPawnsDiv.innerHTML = '';
    pawnWarAiCapturedPawnsDiv.innerHTML = '';
    const icons = iconSets[currentIconSet];

    playerCaptured.forEach(pawn => {
        const pawnElement = document.createElement('span');
        pawnElement.classList.add('pawn', `${pawn.color}-pawn`);
        pawnElement.textContent = pawn.color === 'white' ? icons.whitePawn : icons.blackPawn;
        // If promoted pawns can be captured, this needs to handle queen symbols too
        if (pawn.type === 'queen') {
            pawnElement.textContent = pawn.color === 'white' ? icons.whiteQueen : icons.blackQueen;
        }
        pawnWarPlayerCapturedPawnsDiv.appendChild(pawnElement);
    });

    aiCaptured.forEach(pawn => {
        const pawnElement = document.createElement('span');
        pawnElement.classList.add('pawn', `${pawn.color}-pawn`);
        pawnElement.textContent = pawn.color === 'white' ? icons.whitePawn : icons.blackPawn;
        if (pawn.type === 'queen') {
            pawnElement.textContent = pawn.color === 'white' ? icons.whiteQueen : icons.blackQueen;
        }
        pawnWarAiCapturedPawnsDiv.appendChild(pawnElement);
    });
}

function resetGameToSelection() {
    // Hide all game and setup areas
    if (pawnWarSetupContainerDiv) pawnWarSetupContainerDiv.style.display = 'none';
    if (pawnWarColorSelectionDiv) pawnWarColorSelectionDiv.style.display = 'none'; // Explicitly hide children
    if (pawnWarDifficultySelectionDiv) pawnWarDifficultySelectionDiv.style.display = 'none'; // Explicitly hide children
    if (pawnWarIconSelectionDiv) pawnWarIconSelectionDiv.style.display = 'none'; // Explicitly hide children
    if (pawnWarGameAreaDiv) pawnWarGameAreaDiv.style.display = 'none';
    if (knightDefenseGameAreaDiv) knightDefenseGameAreaDiv.style.display = 'none';
    
    // Reset Pawn War specific game state variables
    board.length = 0;
    selectedPawn = null;
    currentPlayer = 'white';
    playerColor = null;
    aiColor = null;
    currentAIDifficulty = 'easy';
    currentIconSet = 'standard';
    lastMoveDetails = null;
    gameOver = false;
    playerCaptured = [];
    aiCaptured = [];
    moveHistory = [];
    enPassantHintShown = false;
    hintsLeft = 0;
    pawnsUsedEnPassant.clear(); // Clear the en passant tracking when resetting the game
    
    // Clear Pawn War UI elements
    if(pawnWarBoardElement) pawnWarBoardElement.innerHTML = '';
    if(pawnWarGameStatusElement) pawnWarGameStatusElement.textContent = '';
    renderCapturedPawns();
    if(pawnWarBoardElement) pawnWarBoardElement.classList.remove('board-rotated');
    
    updateHintDisplay();
    updateGameControlButtonsState();

    showMainMenu();
}


function selectColorAndShowDifficultyOptions(chosenPlayerColor) { // For Pawn War
    playerColor = chosenPlayerColor;
    aiColor = (playerColor === 'white') ? 'black' : 'white';
    if (pawnWarColorSelectionDiv) pawnWarColorSelectionDiv.style.display = 'none';
    if (pawnWarDifficultySelectionDiv) pawnWarDifficultySelectionDiv.style.display = 'block';
    if (pawnWarIconSelectionDiv) pawnWarIconSelectionDiv.style.display = 'none'; // Ensure icon selection is hidden
}

function selectDifficultyAndShowIconOptions(chosenDifficulty) { // For Pawn War
    currentAIDifficulty = chosenDifficulty;
    if (pawnWarDifficultySelectionDiv) pawnWarDifficultySelectionDiv.style.display = 'none';
    if (pawnWarIconSelectionDiv) pawnWarIconSelectionDiv.style.display = 'block';
}

function startGameWithChosenIcons(chosenIconSet) { // This is the final step for Pawn War setup
    console.log('Starting game with:', {
        playerColor: playerColor,
        aiColor: aiColor,
        difficulty: currentAIDifficulty
    });

    currentIconSet = chosenIconSet;
    if (pawnWarSetupContainerDiv) pawnWarSetupContainerDiv.style.display = 'none'; // Hide the entire setup container
    if (pawnWarIconSelectionDiv) pawnWarIconSelectionDiv.style.display = 'none'; // Explicitly hide this step
    if (pawnWarGameAreaDiv) pawnWarGameAreaDiv.style.display = 'block';

    if (playerColor === 'black') {
        if (pawnWarBoardElement) pawnWarBoardElement.classList.add('board-rotated');
    } else {
        if (pawnWarBoardElement) pawnWarBoardElement.classList.remove('board-rotated');
    }

    // Reset game state
    initializeBoard();
    renderPawnWarBoard();
    gameOver = false;
    playerCaptured = [];
    aiCaptured = [];
    moveHistory = [];
    renderCapturedPawns();
    enPassantHintShown = false;
    pawnsUsedEnPassant.clear(); // Clear the en passant tracking when starting a new game

    // Set up hints based on difficulty
    if (currentAIDifficulty === 'easy') maxHints = 5;
    else if (currentAIDifficulty === 'medium') maxHints = 3;
    else if (currentAIDifficulty === 'hard') maxHints = 0;
    else maxHints = 3;
    hintsLeft = maxHints;
    updateHintDisplay();
    updateGameControlButtonsState();

    // Initialize game state
    currentPlayer = 'white';
    lastMoveDetails = null;
    updateGameStatusMessage();

    console.log('Game started. Current player:', currentPlayer, 'AI color:', aiColor);

    // If AI plays white, trigger its move after a short delay
    if (aiColor === 'white') {
        console.log('AI should move first...');
        setTimeout(() => {
            console.log('Triggering initial AI move...');
            triggerAIMove();
        }, 500);
    }
}

setupGameControls(); // Initialize listeners for color, difficulty, and icon selection