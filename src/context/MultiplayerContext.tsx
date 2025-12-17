import React, { createContext, useContext, type ReactNode } from 'react';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { useGame } from './GameContext';
import type { GameEvent } from '../types';

interface MultiplayerContextType {
    sendMessage: (event: GameEvent) => void;
    isConnected: boolean;
    peerId?: string;
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

export const MultiplayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { state, isHost, dispatch } = useGame();

    // We grab name/id from storage as a reliable fallback
    const localName = typeof window !== 'undefined' ? localStorage.getItem('hm_player_name') || undefined : undefined;
    const localId = typeof window !== 'undefined' ? localStorage.getItem('hm_player_id') || undefined : undefined;

    const { sendMessage, isConnected, peerId } = useMultiplayer({
        role: isHost ? 'HOST' : 'PLAYER',
        roomCode: state.roomCode,
        playerName: localName,
        playerId: localId,
        onMessage: (event) => {
            switch (event.type) {
                case 'JOIN_ROOM':
                    if (isHost) {
                        dispatch({
                            type: 'ADD_PLAYER',
                            payload: {
                                id: event.payload.id,
                                name: event.payload.name,
                                score: 0,
                                streak: 0,
                                connected: true
                            }
                        });
                    }
                    break;
                case 'SUBMIT_ANSWER':
                    if (isHost) {
                        // Dispatch the answer to GameContext to handle scoring and state
                        dispatch({
                            type: 'SUBMIT_ANSWER',
                            payload: {
                                playerId: event.payload.playerId,
                                answerIndex: event.payload.answerIndex
                            }
                        });
                    }
                    break;
                case 'NEW_QUESTION':
                    if (!isHost) {
                        dispatch({ type: 'SET_QUESTION', payload: event.payload.question });
                        dispatch({ type: 'UPDATE_STATUS', payload: 'QUESTION' });
                        // Clear answer
                        localStorage.removeItem('hm_last_answer');
                    }
                    break;
                case 'ROUND_RESULT':
                    if (!isHost) {
                        dispatch({ type: 'UPDATE_STATUS', payload: 'RESULT' });
                        // We rely on local logic for correct/incorrect based on currentQuestion in state
                        // The payload might bring correctIndex if we want to be sure
                        if (state.currentQuestion) {
                            dispatch({
                                type: 'SET_QUESTION',
                                payload: { ...state.currentQuestion, correctIndex: event.payload.correctIndex }
                            });
                        }
                    }
                    break;
                case 'GAME_OVER':
                    if (!isHost) {
                        dispatch({ type: 'UPDATE_STATUS', payload: 'GAME_OVER' });
                    }
                    break;
            }
        },
        verifiySameIp: true
    });

    return (
        <MultiplayerContext.Provider value={{ sendMessage, isConnected, peerId }}>
            {children}
        </MultiplayerContext.Provider>
    );
};

export const useMultiplayerContext = () => {
    const context = useContext(MultiplayerContext);
    if (!context) {
        throw new Error('useMultiplayerContext must be used within a MultiplayerProvider');
    }
    return context;
};
