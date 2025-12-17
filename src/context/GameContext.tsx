import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { GameState, GameStatus, Player, Question } from '../types';

interface GameContextType {
    state: GameState;
    dispatch: React.Dispatch<Action>;
    isHost: boolean;
    setRole: (role: 'HOST' | 'PLAYER') => void;
}

type Action =
    | { type: 'SET_ROLE'; payload: 'HOST' | 'PLAYER' }
    | { type: 'UPDATE_STATUS'; payload: GameStatus }
    | { type: 'ADD_PLAYER'; payload: Player }
    | { type: 'UPDATE_PLAYER_SCORE'; payload: { id: string; score: number } }
    | { type: 'SET_QUESTION'; payload: Question }
    | { type: 'ADD_COMMENT'; payload: { playerName: string; text: string } }
    | { type: 'SET_ROOM_CODE'; payload: string }
    | { type: 'DECREMENT_TIMER' }
    | { type: 'SET_TIMER'; payload: number }
    | { type: 'SUBMIT_ANSWER'; payload: { playerId: string; answerIndex: number } }
    | { type: 'INCREMENT_ROUND' }
    | { type: 'RESET_ROUND' }
    | { type: 'SET_TOTAL_ROUNDS'; payload: number }
    | { type: 'RESET_GAME' };

const initialState: GameState = {
    roomCode: '',
    status: 'LOBBY',
    currentRound: 0,
    totalComponentRounds: 10,
    players: {},
    timeLeft: 0,
    recentComments: []
};

const GameContext = createContext<GameContextType | undefined>(undefined);

const gameReducer = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'UPDATE_STATUS':
            return { ...state, status: action.payload };
        case 'ADD_PLAYER':
            return {
                ...state,
                players: { ...state.players, [action.payload.id]: action.payload },
            };
        case 'SET_QUESTION':
            return {
                ...state,
                currentQuestion: action.payload,
            };
        case 'SET_ROOM_CODE':
            return { ...state, roomCode: action.payload };
        case 'SET_TIMER':
            return { ...state, timeLeft: action.payload };
        case 'DECREMENT_TIMER':
            return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };
        case 'SUBMIT_ANSWER': {
            const { playerId, answerIndex } = action.payload;
            const player = state.players[playerId];
            if (!player || !state.currentQuestion) return state;

            const isCorrect = answerIndex === state.currentQuestion.correctIndex;
            const points = isCorrect ? 100 + (state.timeLeft * 2) : 0; // Score based on speed

            return {
                ...state,
                players: {
                    ...state.players,
                    [playerId]: {
                        ...player,
                        lastAnswer: String(answerIndex), // Store as string for flexibility
                        score: player.score + points,
                        streak: isCorrect ? player.streak + 1 : 0
                    }
                }
            };
        }
        case 'INCREMENT_ROUND':
            return { ...state, currentRound: state.currentRound + 1 };
        case 'SET_TOTAL_ROUNDS':
            return { ...state, totalComponentRounds: action.payload };
        case 'ADD_COMMENT':
            return {
                ...state,
                recentComments: [
                    ...state.recentComments,
                    { ...action.payload, id: Math.random().toString(36).substr(2, 9) }
                ].slice(-5) // Keep only last 5
            };
        case 'RESET_ROUND':
            // potential perf hits if many players, but fine for < 50
            const resetPlayers = Object.entries(state.players).reduce((acc, [id, p]) => {
                acc[id] = { ...p, lastAnswer: undefined };
                return acc;
            }, {} as Record<string, Player>);
            return { ...state, players: resetPlayers, timeLeft: 30, recentComments: [] };
        case 'RESET_GAME':
            return initialState;
        default:
            return state;
    }
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [role, setRoleState] = React.useState<'HOST' | 'PLAYER'>('PLAYER');

    const setRole = (r: 'HOST' | 'PLAYER') => setRoleState(r);

    return (
        <GameContext.Provider value={{ state, dispatch, isHost: role === 'HOST', setRole }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
