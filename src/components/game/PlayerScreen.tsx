import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';
import { useMultiplayerContext } from '../../context/MultiplayerContext';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';

export const PlayerScreen = () => {
    const { state } = useGame();
    // We need a local listener for Result events since they don't necessarily update GameContext question state immediately?
    // Actually Host updates status to RESULT, but PlayerContext doesn't handle status changes from Host unless we sync it.
    // In current implementation, Player only updates QUESTION via NEW_QUESTION.
    // We need to listen to ROUND_RESULT.

    const [hasAnswered, setHasAnswered] = useState(false);

    // We use a separate useMultiplayer instance? No, we use context.
    // But context `onMessage` is "global" for the provider.
    // We need to attach a listener. 
    // Wait, the current Context implementation only dispatches to GameContext.
    // We should probably rely on GameContext having the correct state.
    // But GameContext isn't being updated with RESULT status on Player side yet!
    // The Host sends 'ROUND_RESULT', but the 'MultiplayerContext' provider logic defines what happens.

    // Let's UPDATE MultiplayerContext.tsx to handle ROUND_RESULT by dispatching 'UPDATE_STATUS' -> 'RESULT'? 
    // Or simpler: We add a listener logic here? Not easy with current Context.

    // Best Approach: Update MultiplayerContext.tsx to handle 'ROUND_RESULT'
    // and dispatch something the UI can react to.

    // For now, let's look at `PlayerScreen` rendering based on local state + GameContext.
    // I will add `lastAnswer` logic here.

    const { sendMessage } = useMultiplayerContext();

    // Pythonic way to reset state when question changes: Watch the ID.
    useEffect(() => {
        setHasAnswered(false);
    }, [state.currentQuestion?.id]);

    const handleAnswer = (index: number) => {
        if (hasAnswered) return;
        const myId = localStorage.getItem('hm_player_id') || 'unknown';
        sendMessage({
            type: 'SUBMIT_ANSWER',
            payload: { playerId: myId, answerIndex: index }
        });
        setHasAnswered(true);
        // We'll store our answer index locally to compare with result
        localStorage.setItem('hm_last_answer', String(index));
    };

    // We assume MultiplayerContext updates GameContext 'status' triggers eventually?
    // No, we need to handle the socket event to update status.
    // Right now MultiplayerContext doesn't handle ROUND_RESULT for players. 
    // I will fix MultiplayerContext in next tool call.

    // Assuming status updates:
    if (state.status === 'RESULT') {
        const myAnswer = localStorage.getItem('hm_last_answer');
        const isCorrect = state.currentQuestion?.correctIndex === Number(myAnswer);

        return (
            <div className={cn(
                "min-h-screen flex flex-col justify-center items-center p-6 text-white transition-colors",
                isCorrect ? "bg-green-600" : "bg-red-600"
            )}>
                <h1 className="text-5xl font-black mb-4">{isCorrect ? "BOA!" : "BEBE!"}</h1>
                <p className="text-xl opacity-90 mb-8">
                    {isCorrect ? "Você acertou." : "Errou rude."}
                </p>
                <div className="text-9xl">
                    {isCorrect ? "🍻" : "🥃"}
                </div>
            </div>
        );
    }

    if (state.status === 'LOBBY') {
        return (
            <div className="min-h-screen bg-primary-900 flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-4xl font-black text-secondary-500 mb-4">Você está dentro!</h1>
                <p className="text-xl text-white">Olhe para a TV e espere o Host (aquele tirano) iniciar.</p>
                <div className="mt-8 animate-pulse text-6xl">👀</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-4 flex flex-col">
            <div className="flex-1 grid grid-cols-1 gap-4 content-center">
                <h2 className="text-center text-white font-bold mb-4">ESCOLHA SUA SINA:</h2>
                <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                    {state.currentQuestion?.options.map((opt, idx) => (
                        <Button
                            key={idx}
                            variant={hasAnswered ? "outline" : "secondary"}
                            className={cn("h-16 text-xl", hasAnswered && "opacity-50")}
                            onClick={() => handleAnswer(idx)}
                            disabled={hasAnswered}
                        >
                            {opt}
                        </Button>
                    ))}
                </div>

                {hasAnswered && (
                    <p className="mt-8 text-secondary-400 animate-pulse">Aguardando resultado...</p>
                )}
            </div>
        </div>
    );
};
