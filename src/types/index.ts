export type Role = 'HOST' | 'PLAYER';

export type GameStatus = 'LOBBY' | 'STARTING' | 'QUESTION' | 'RESULT' | 'LEADERBOARD' | 'GAME_OVER';

export interface Player {
    id: string;
    name: string;
    score: number;
    streak: number;
    lastAnswer?: string; // Option ID or Index
    connected: boolean;
}

export interface Question {
    id: string;
    text: string;
    options: string[]; // ["A", "B", "C", "D", "E"]
    correctIndex: number;
    context?: string; // Historical context flavor
}

export interface GameState {
    roomCode: string;
    status: GameStatus;
    currentRound: number;
    totalComponentRounds: number; // if we want a fixed set
    players: Record<string, Player>;
    currentQuestion?: Question;
    timeLeft: number;
    winner?: Player;
}

// Multiplayer Events
export type GameEvent =
    | { type: 'JOIN_ROOM'; payload: { name: string; id: string } }
    | { type: 'PLAYER_JOINED'; payload: Player }
    | { type: 'START_GAME'; payload: {} }
    | { type: 'NEW_QUESTION'; payload: { question: Question; timeLeft: number } }
    | { type: 'SUBMIT_ANSWER'; payload: { playerId: string; answerIndex: number } }
    | { type: 'ROUND_RESULT'; payload: { correctIndex: number; scores: Record<string, number> } }
    | { type: 'SYNC_STATE'; payload: GameState } // For reconnection/late joiners
    | { type: 'GAME_OVER'; payload: { winner: Player } };
