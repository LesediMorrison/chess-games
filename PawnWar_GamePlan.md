# Pawn War - Game Development Plan

This document outlines the development plan for "Pawn War," a web-based chess variant designed to help players learn pawn mechanics.

**Target Platform:** Web-based game (HTML, CSS, JavaScript)
**Game Mode:** Single-player (Human vs. Simple AI)
**Visual Style:** Simple 2D chessboard

## Existing Code Base Assessment (Recreated)

*   **[`index.html`](index.html):** Basic HTML structure with a `div#board` for the game and `div#game-status` for messages.
*   **[`style.css`](style.css):** Contains styles for the board, squares, pawns (white/black), selected pieces, possible moves, and game status.
*   **[`script.js`](script.js):** Implements:
    *   Board initialization and rendering.
    *   Pawn placement for white and black.
    *   Player click handling for pawn selection and movement.
    *   Move validation (forward one, initial forward two, diagonal capture, en passant).
    *   Piece movement logic.
    *   Highlighting for selected pawns and valid moves.
    *   Player turn switching.
    *   Win condition checking.
    *   Simple AI for black pieces.

## Implemented Development Plan

### Phase 1: Core Game Enhancements

1.  **Implement "En Passant" Capture:**
    *   **Logic:**
        *   Modified `isValidMove` in [`script.js`](script.js) to detect en passant conditions.
        *   Tracks the opponent's last move (specifically if it was a two-square pawn advance from its starting row) via `lastMoveDetails`.
        *   The capturing pawn must be on its 5th rank (row 3 for white, row 4 for black).
        *   The opponent's pawn must have just moved two squares and landed adjacent to the capturing pawn.
    *   **Execution:**
        *   Updated `movePawn` in [`script.js`](script.js) to remove the *captured* pawn (which is not on the landing square of the capturing pawn).
    *   **Data Structure:**
        *   `lastMoveDetails = { pieceColor, startRow, startCol, endRow, endCol, isTwoStepPawnMove: true/false }` stores information about the most recent move.

2.  **Implement Win Condition:**
    *   **Logic:**
        *   After each successful move in `movePawn`, `checkWinCondition` checks if any pawn has reached the opponent's back rank.
        *   White pawn wins if it reaches row 0.
        *   Black pawn wins if it reaches row 7.
    *   **Execution:**
        *   `checkWinCondition()` function implemented and called after `movePawn` in [`script.js`](script.js).
    *   **User Feedback:**
        *   The `div#game-status` element in [`index.html`](index.html) displays the winner (e.g., "White Wins!" or "Black Wins!").
        *   `gameOver` flag prevents further moves.

3.  **Refine User Interface/Experience for Learning:**
    *   **Current Player Display:**
        *   [`script.js`](script.js) updates the `div#game-status` element to show whose turn it is.
    *   **(Optional) Move History:** (Not implemented in this pass, can be a future enhancement)

### Phase 2: Simple AI Opponent (for Black)

1.  **AI Turn Logic:**
    *   In [`script.js`](script.js), `switchPlayer` calls `triggerAIMove` via `setTimeout` if `currentPlayer` becomes 'black'.
    *   `triggerAIMove` iterates through all of the AI's pawns.
    *   For each AI pawn, it iterates through all possible board squares to find valid moves using `isValidMove`.

2.  **AI Decision Making (Simple Strategy):**
    *   `triggerAIMove` evaluates potential moves:
        *   **Priority 1: Winning Move:** AI pawn reaches player's back rank.
        *   **Priority 2: Capture Player's Pawn:** Includes standard and en passant captures.
        *   **Priority 3: Advance Pawn:** Prefers moves that advance pawns closer to the player's back rank.
        *   **Fallback: Random Valid Move:** If multiple moves fit criteria or no preferred move, picks randomly.

3.  **Executing AI Move:**
    *   `triggerAIMove` calls `movePawn`, `checkWinCondition`, and `switchPlayer`.
    *   A 500ms delay is used before the AI makes its move.

### Phase 3: Teaching "Strengthening Pawn Chains"

*   **Implicit Learning:** Game mechanics encourage forming pawn chains.
*   **(Optional) Explicit Hints/Tutorial System:** (Not implemented, noted as future enhancement).

## Game Flow Diagram (Conceptual)

```mermaid
graph TD
    A[Start Game] --> B{Initialize Board & Render};
    B --> C{Player's Turn (White)};
    C -- Select Pawn --> D[Highlight Pawn & Possible Moves];
    D -- Select Destination --> E{Validate Move};
    E -- Valid Move --> F[Execute Move & Update Board];
    F --> G{Check Win Condition};
    G -- Win --> H[Declare Winner & End Game];
    G -- No Win --> I{Switch Player};
    I --> J{AI's Turn (Black)};
    J --> K[AI Calculates All Possible Moves for Black Pawns];
    K --> L[AI Selects Best Move (Win > Capture > Advance)];
    L --> M[Execute AI Move & Update Board];
    M --> N{Check Win Condition};
    N -- Win --> H;
    N -- No Win --> O{Switch Player};
    O --> C;
    E -- Invalid Move --> D;
```

This plan has been followed to recreate the Pawn War game.