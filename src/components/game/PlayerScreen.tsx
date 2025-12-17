import { useGame } from '../../context/GameContext';
import { useMultiplayerContext } from '../../context/MultiplayerContext';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { WoodPanel, ChalkboardPanel } from '../ui/GamePanels';
import { motion, AnimatePresence } from 'framer-motion';

export const PlayerScreen = () => {
    const { state } = useGame();
    const { sendMessage } = useMultiplayerContext();
    const [hasAnswered, setHasAnswered] = useState(false);
    const [comment, setComment] = useState('');

    useEffect(() => {
        setHasAnswered(false);
        setComment('');
    }, [state.currentQuestion?.id]);

    const handleAnswer = (index: number) => {
        if (hasAnswered) return;
        const myId = localStorage.getItem('hm_player_id') || 'unknown';

        sendMessage({
            type: 'SUBMIT_ANSWER',
            payload: {
                playerId: myId,
                answerIndex: index,
                comment: comment.trim() || undefined
            }
        });

        setHasAnswered(true);
        localStorage.setItem('hm_last_answer', String(index));
    };

    if (state.status === 'RESULT') {
        const myAnswer = localStorage.getItem('hm_last_answer');
        const isCorrect = state.currentQuestion?.correctIndex === Number(myAnswer);

        return (
            <div className={cn(
                "min-h-screen flex flex-col justify-center items-center p-6 text-white transition-colors duration-500",
                isCorrect ? "bg-[#2E7D32]" : "bg-[#B71C1C]"
            )}>
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center"
                >
                    <WoodPanel className="p-8 mb-8">
                        <h1 className="text-6xl font-black mb-2 drop-shadow-lg">
                            {isCorrect ? "BOA!" : "BEBE!"}
                        </h1>
                        <p className="text-xl font-bold opacity-80">
                            {isCorrect ? "Você honrou a república." : "O veterano está decepcionado."}
                        </p>
                    </WoodPanel>

                    <div className="text-[10rem] animate-bounce">
                        {isCorrect ? "🍺" : "🥃"}
                    </div>
                </motion.div>
            </div>
        );
    }

    if (state.status === 'LOBBY') {
        return (
            <div className="min-h-screen bg-[#3E2723] flex flex-col items-center justify-center p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]">
                <WoodPanel className="p-10 max-w-sm">
                    <h1 className="text-4xl font-black text-[#FFEB3B] mb-4">MESA RESERVADA!</h1>
                    <p className="text-lg text-white font-bold mb-6">Aguardando o Host abrir o bar...</p>
                    <div className="flex justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="text-6xl"
                        >
                            🍺
                        </motion.div>
                    </div>
                </WoodPanel>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1A1A1A] flex flex-col bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            {/* Header Area */}
            <div className="p-4">
                <WoodPanel className="p-4 text-center">
                    <h2 className="text-[#FFEB3B] font-black tracking-widest uppercase">República Hentrometeu</h2>
                </WoodPanel>
            </div>

            <main className="flex-1 flex flex-col p-4 gap-4 max-w-md mx-auto w-full">
                <AnimatePresence mode="wait">
                    {!hasAnswered ? (
                        <motion.div
                            key="options"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex-1 flex flex-col gap-4"
                        >
                            <ChalkboardPanel className="mb-2 shrink-0">
                                <p className="text-center font-bold text-lg leading-tight">
                                    {state.currentQuestion?.text || "Preparando a próxima saca..."}
                                </p>
                            </ChalkboardPanel>

                            <div className="grid grid-cols-1 gap-3">
                                {state.currentQuestion?.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        className="bg-[#6D4C41] border-b-4 border-[#3E2723] active:border-b-0 active:translate-y-1 p-4 rounded-xl text-white font-bold text-left transition-all flex items-center gap-4 shadow-lg"
                                    >
                                        <div className="w-10 h-10 bg-[#3E2723] rounded-lg flex items-center justify-center text-[#FFEB3B] font-black shrink-0">
                                            {['A', 'B', 'C', 'D', 'E'][idx]}
                                        </div>
                                        <span className="line-clamp-2">{opt}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-auto space-y-2">
                                <label className="text-[#8D6E63] text-xs font-bold uppercase tracking-widest pl-2">Gritos da Galera (Opcional)</label>
                                <input
                                    type="text"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value.slice(0, 50))}
                                    placeholder="Mande um recado..."
                                    className="w-full bg-[#EFEBE9] border-2 border-[#8D6E63] rounded-xl p-3 text-[#3E2723] font-bold placeholder-[#8D6E63]/50 focus:outline-none focus:ring-2 focus:ring-[#FFEB3B]"
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="waiting"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex-1 flex flex-col justify-center items-center text-center"
                        >
                            <div className="text-[8rem] mb-6">⏳</div>
                            <WoodPanel className="p-6">
                                <p className="text-white font-black text-2xl uppercase italic animate-pulse">Aguardando os outros bêbados...</p>
                            </WoodPanel>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};
