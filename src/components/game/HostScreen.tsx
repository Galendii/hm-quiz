import React from 'react';
import { useGame } from '../../context/GameContext';
import { useMultiplayerContext } from '../../context/MultiplayerContext';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import { AiService } from '../../services';
import { cn } from '../../lib/utils';
import PubScene from '../../assets/pub-scene.jpeg';


// --- WOODEN COMPONENTS ---
const WoodPanel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn(
        "relative bg-[#5D4037] border-4 border-[#3E2723] rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.5)]",
        "before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] before:opacity-20 before:pointer-events-none", // Optional texture if we had one, or use CSS gradient
        "after:absolute after:inset-[2px] after:border-2 after:border-[#8D6E63]/30 after:rounded-md after:pointer-events-none", // Inner highlight
        className
    )} style={{
        backgroundImage: 'repeating-linear-gradient(45deg, #5D4037 0px, #5D4037 10px, #4E342E 10px, #4E342E 12px)'
    }}>
        <div className="relative z-10">{children}</div>
    </div>
);

const ChalkboardPanel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn(
        "bg-[#212121] border-8 border-[#5D4037] rounded-xl shadow-2xl p-6",
        className
    )}>
        <div className="h-full w-full border border-white/10 rounded-lg p-4 font-handwriting text-white">
            {children}
        </div>
    </div>
);

const BarSceneLayout = ({ children, timeLeft, answeredCount, totalPlayers }: {
    children: React.ReactNode,
    timeLeft: number,
    answeredCount: number,
    totalPlayers: number
}) => {
    return (
        <div className="relative w-full h-screen overflow-hidden flex flex-col font-sans">
            {/* Static Background Image */}
            <div className="absolute inset-0 bg-black">
                <img
                    src={PubScene}
                    alt="Bar Background"
                    className="w-full h-full object-cover opacity-60"
                />
            </div>

            {/* Top Info Bar (Timer & Score) hanging on signs */}
            <div className="relative z-10 flex justify-between items-start p-6">
                <div className="origin-top-left animate-[swing_3s_ease-in-out_infinite]">
                    <WoodPanel className="p-4 transform rotate-2">
                        <div className="text-[#FFEB3B] font-mono text-4xl font-black tracking-widest drop-shadow-md text-center">
                            {timeLeft}s
                        </div>
                        <div className="text-[10px] text-[#A1887F] font-bold text-center uppercase tracking-tighter">Tempo</div>
                    </WoodPanel>
                </div>

                <div className="origin-top-right">
                    <WoodPanel className="p-4 transform -rotate-1">
                        <div className="text-white font-mono text-2xl font-bold text-center">{answeredCount}/{totalPlayers}</div>
                        <div className="text-[10px] text-[#A1887F] font-bold text-center uppercase tracking-tighter">Bêbados</div>
                    </WoodPanel>
                </div>
            </div>

            {/* Bottom Interaction Area (Question Box) */}
            <div className="relative z-20 mt-auto w-full pt-12 pb-8 px-4 md:px-12 flex flex-col items-center">
                {children}
            </div>
        </div>
    );
};

export const HostScreen = () => {


    const { state, dispatch } = useGame();
    const { sendMessage } = useMultiplayerContext();

    // Memoize service to keep history
    // No API ID passed here, so it will use the backend proxy by default
    const aiService = React.useMemo(() => new AiService(''), []);

    // Derived state
    const totalPlayers = Object.keys(state.players).length;
    const answeredCount = Object.values(state.players).filter(p => p.lastAnswer !== undefined).length;

    // ... Timer and Effect Hooks remain same ...
    // Timer Logic
    React.useEffect(() => {
        if (state.status === 'QUESTION' && state.timeLeft > 0) {
            const timer = setInterval(() => {
                dispatch({ type: 'DECREMENT_TIMER' });
            }, 1000);
            return () => clearInterval(timer);
        } else if (state.status === 'QUESTION' && state.timeLeft === 0) {
            // Time's up!
            dispatch({ type: 'UPDATE_STATUS', payload: 'RESULT' });
            // Broadcast Time's up if needed
        }
    }, [state.status, state.timeLeft, dispatch]);

    // Check if everyone answered
    React.useEffect(() => {
        if (state.status === 'QUESTION' && totalPlayers > 0 && answeredCount === totalPlayers) {
            setTimeout(() => {
                handleEndRound();
            }, 1000);
        }
    }, [answeredCount, totalPlayers, state.status, dispatch]);

    // Timer expiration
    React.useEffect(() => {
        if (state.status === 'QUESTION' && state.timeLeft === 0) {
            handleEndRound();
        }
    }, [state.status, state.timeLeft]);

    const handleEndRound = () => {
        dispatch({ type: 'UPDATE_STATUS', payload: 'RESULT' });
        // Broadcast Result
        if (state.currentQuestion) {
            sendMessage({
                type: 'ROUND_RESULT',
                payload: {
                    correctIndex: state.currentQuestion.correctIndex,
                    scores: {} // We rely on players knowing their score or syncing state later
                }
            });
        }
    };

    const handleShowLeaderboard = () => {
        dispatch({ type: 'UPDATE_STATUS', payload: 'LEADERBOARD' });
    };

    const handleNextQuestion = () => {
        if (state.currentRound + 1 >= state.totalComponentRounds) {
            dispatch({ type: 'UPDATE_STATUS', payload: 'GAME_OVER' });
            sendMessage({ type: 'GAME_OVER', payload: { winner: getWinner() } });
        } else {
            nextRound(); // This increments round implicitly? No, we need to increment round in reducer or here.
            // We need an action for NEXT_ROUND that increments the counter?
            // "RESET_ROUND" clears answer but doesn't increment currentRound usually.
            // Let's check reset logic.
            // Actually, we should increment round index when setting new question or explicitly.
            // We'll trust state.currentRound is managed. We might need an action INCREMENT_ROUND.
        }
    };

    const getWinner = () => { // Changed type to any for simplicity, assuming Player type is defined elsewhere
        return Object.values(state.players).sort((a, b) => b.score - a.score)[0];
    };

    // --- SUB-COMPONENTS (Inline for simplicity, can extract later) ---

    // Note: LeaderboardView and GameOverView inside use 'state' from closure, that's fine for now as they are full screen overlays not inside BarSceneLayout usually, OR we move them out too.
    // Actually, LeaderboardView uses 'state', so keep it here for now or pass props.
    // For BarSceneLayout re-use, we just invoke it.

    // ... (Keep LeaderboardView/GameOverView/Game Logic inside for now as they are complex) ...
    // But since BarSceneLayout is now outside, we must pass arguments.

    const LeaderboardView = () => {
        const sortedPlayers = Object.values(state.players).sort((a, b) => b.score - a.score);

        return (
            <div className="flex flex-col h-full bg-primary-950 text-white p-6 items-center pt-20">
                <h2 className="text-5xl font-bold mb-12 text-secondary-500 drop-shadow-lg">Ranking da República</h2>

                <div className="w-full max-w-3xl space-y-4">
                    {sortedPlayers.map((player, idx) => (
                        <motion.div
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            key={player.id}
                            className={cn(
                                "flex justify-between items-center p-6 rounded-2xl border-2",
                                idx === 0 ? "bg-yellow-900/30 border-yellow-500 scale-105" :
                                    idx === 1 ? "bg-zinc-800/50 border-zinc-400" :
                                        idx === 2 ? "bg-orange-900/30 border-orange-500" :
                                            "bg-primary-900 border-primary-800"
                            )}
                        >
                            <div className="flex items-center gap-6">
                                <span className={cn(
                                    "text-3xl font-black w-12 text-center",
                                    idx === 0 ? "text-yellow-400" : "text-zinc-500"
                                )}>#{idx + 1}</span>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-bold">{player.name}</span>
                                    <span className="text-sm text-zinc-400">🔥 Streak: {player.streak}</span>
                                </div>
                            </div>
                            <span className="text-3xl font-black text-secondary-400">{player.score} pts</span>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12">
                    <Button size="lg" onClick={handleNextQuestion}>
                        {state.currentRound + 1 >= state.totalComponentRounds ? "Finalizar Jogo" : "Próxima Pergunta"}
                    </Button>
                </div>
            </div>
        );
    };

    const GameOverView = () => {
        const winner = getWinner();
        return (
            <div className="flex flex-col h-full justify-center items-center bg-primary-950 text-white p-6">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <h1 className="text-6xl font-black text-secondary-500 mb-8">FIM DA REVOLUÇÃO</h1>
                    <div className="text-2xl text-zinc-400 mb-12">O novo Presidente da República é:</div>

                    <div className="bg-gradient-to-br from-secondary-600 to-purple-800 p-12 rounded-3xl border-4 border-white shadow-2xl mb-12">
                        <div className="text-6xl font-black mb-4">{winner?.name || 'Ninguém?'}</div>
                        <div className="text-4xl font-bold opacity-80">{winner?.score || 0} pontos</div>
                    </div>

                    <Button onClick={() => window.location.reload()}>Nova Eleição</Button>
                </motion.div>
            </div>
        );
    };

    const startGame = async () => {
        dispatch({ type: 'UPDATE_STATUS', payload: 'STARTING' });
        // Simulate loading
        setTimeout(nextRound, 1000);
    };

    const nextRound = async () => {
        try {
            dispatch({ type: 'INCREMENT_ROUND' });
            dispatch({ type: 'RESET_ROUND' });

            const question = await aiService.generateQuestion();
            dispatch({ type: 'SET_QUESTION', payload: question });
            dispatch({ type: 'SET_TIMER', payload: 30 }); // Reset timer
            dispatch({ type: 'UPDATE_STATUS', payload: 'QUESTION' });

            // Broadcast to players
            sendMessage({
                type: 'NEW_QUESTION',
                payload: { question, timeLeft: 30 }
            });
        } catch (e) {
            console.error(e);
            alert('A República está com problemas técnicos. (Erro na IA)');
        }
    };

    if (state.status === 'LOBBY') {
        return (
            <BarSceneLayout timeLeft={state.timeLeft} answeredCount={answeredCount} totalPlayers={totalPlayers}>
                <div className="w-full max-w-5xl mb-12">
                    <WoodPanel className="mb-12 p-10 text-center transform -rotate-1">
                        <h2 className="text-5xl md:text-7xl font-black text-[#FFEB3B] mb-2 tracking-tighter drop-shadow-[4px_4px_0_#000]">
                            BAR DO QUIZ
                        </h2>
                        <div className="inline-flex items-center gap-4 bg-black/30 px-8 py-2 rounded-full border-2 border-white/20">
                            <span className="text-[#D7CCC8] font-bold uppercase tracking-widest text-sm">Código da Mesa</span>
                            <span className="text-4xl font-mono font-bold text-white tracking-[0.2em]">{state.roomCode}</span>
                        </div>
                    </WoodPanel>

                    {/* API Key Input */}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                        {Object.values(state.players).map(player => (
                            <motion.div
                                key={player.id}
                                initial={{ scale: 0, rotate: -10 }}
                                animate={{ scale: 1, rotate: Math.random() * 6 - 3 }}
                                className="relative"
                            >
                                {/* Coaster Style */}
                                <div className="w-full aspect-square bg-[#EFEBE9] rounded-full border-4 border-[#8D6E63] shadow-lg flex flex-col items-center justify-center p-4 text-center transform hover:scale-105 transition-transform">
                                    <div className="text-4xl mb-2">🍺</div>
                                    <div className="font-black text-[#3E2723] text-lg leading-tight line-clamp-2">{player.name}</div>
                                </div>
                            </motion.div>
                        ))}
                        {Object.values(state.players).length === 0 && (
                            <div className="col-span-full text-center text-white/50 italic text-xl mt-4">
                                "Garçom! A mesa está vazia..."
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            className="text-2xl px-16 py-8 bg-[#2E7D32] hover:bg-[#1B5E20] border-b-8 border-[#1B5E20] text-white shadow-xl rounded-2xl transform transition-transform active:translate-y-2 active:border-b-0"
                            onClick={startGame}
                        >
                            ABRIR O BAR
                        </Button>
                    </div>
                </div>
            </BarSceneLayout>
        );
    }

    if (state.status === 'QUESTION' && state.currentQuestion) {
        return (
            <BarSceneLayout timeLeft={state.timeLeft} answeredCount={answeredCount} totalPlayers={totalPlayers}>
                <motion.div
                    initial={{ y: 200 }}
                    animate={{ y: 0 }}
                    className="w-full max-w-5xl"
                >
                    {/* Question Board (Wooden Sign) */}
                    <WoodPanel className="mb-6 p-8 md:p-12 text-center border-b-8 border-[#3E2723]">
                        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight drop-shadow-[2px_2px_0_#3E2723]">
                            {state.currentQuestion.text}
                        </h2>
                    </WoodPanel>

                    {/* Options (Planks) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {state.currentQuestion.options.map((opt, idx) => (
                            <div key={idx} className="bg-[#6D4C41] border-4 border-[#4E342E] rounded-xl p-4 flex items-center gap-4 text-white shadow-lg transform hover:-translate-y-1 transition-transform cursor-default">
                                <div className="w-12 h-12 rounded-lg bg-[#3E2723] flex items-center justify-center font-bold text-[#FFEB3B] text-xl border-2 border-[#8D6E63] shrink-0">
                                    {['A', 'B', 'C', 'D', 'E'][idx]}
                                </div>
                                <span className="text-xl font-bold drop-shadow-sm">{opt}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </BarSceneLayout>
        );
    }

    if (state.status === 'RESULT') {
        const question = state.currentQuestion;
        if (!question) return null;
        return (
            <BarSceneLayout timeLeft={state.timeLeft} answeredCount={answeredCount} totalPlayers={totalPlayers}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-4xl"
                >
                    <ChalkboardPanel>
                        <div className="flex flex-col items-center text-center">
                            <h2 className="text-[#FFEB3B] text-2xl font-bold mb-4 font-mono tracking-widest uppercase border-b-2 border-white/20 pb-2">
                                A Verdade da Mesa
                            </h2>

                            <div className="text-4xl md:text-6xl font-black text-green-400 mb-8 drop-shadow-md">
                                {question.options[question.correctIndex]}
                            </div>

                            <div className="bg-white/5 p-6 rounded-lg w-full text-left">
                                <strong className="text-[#FFAB91] block mb-2 text-sm uppercase">Curiosidade de Bêbado:</strong>
                                <p className="text-zinc-300 italic text-xl leading-relaxed">
                                    "{question.context}"
                                </p>
                            </div>

                            <div className="mt-8 w-full flex justify-center">
                                <Button size="lg" variant="secondary" onClick={handleShowLeaderboard}>
                                    VER CONTA
                                </Button>
                            </div>
                        </div>
                    </ChalkboardPanel>
                </motion.div>
            </BarSceneLayout>
        );
    }

    if (state.status === 'LEADERBOARD') {
        return <LeaderboardView />;
    }

    if (state.status === 'GAME_OVER') {
        return <GameOverView />;
    }

    // Fallback
    return <BarSceneLayout timeLeft={state.timeLeft} answeredCount={answeredCount} totalPlayers={totalPlayers}><div></div></BarSceneLayout>;
};
