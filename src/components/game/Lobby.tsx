import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface LobbyProps {
    onJoin: () => void;
}

export const Lobby = ({ onJoin }: LobbyProps) => {
    const { setRole, dispatch } = useGame();
    const [name, setName] = useState('');
    const [inputRoom, setInputRoom] = useState('');
    const [totalRounds, setTotalRounds] = useState(5);
    const [view, setView] = useState<'SELECTION' | 'HOST_SETUP' | 'PLAYER_JOIN'>('SELECTION');

    const handleCreateRoom = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        dispatch({ type: 'UPDATE_STATUS', payload: 'LOBBY' });

        // Save and ID for Multiplayer Context
        const playerId = crypto.randomUUID();
        localStorage.setItem('hm_player_name', 'Host');
        localStorage.setItem('hm_player_id', playerId);

        dispatch({ type: 'SET_ROOM_CODE', payload: code });
        dispatch({ type: 'SET_TOTAL_ROUNDS', payload: totalRounds });
        setRole('HOST');
        onJoin();
    };

    const handleJoinRoom = () => {
        if (!name || !inputRoom) return;
        setRole('PLAYER');

        // Save and ID for Multiplayer Context
        const playerId = crypto.randomUUID();
        localStorage.setItem('hm_player_name', name);
        localStorage.setItem('hm_player_id', playerId);

        dispatch({ type: 'SET_ROOM_CODE', payload: inputRoom });

        // We do NOT dispatch ADD_PLAYER here anymore for local state,
        // we wait for the PeerJS handshake to confirm connection.
        // But for UI feedback, we might want to?
        // Let's rely on the handshake confirmation (PlayerJoined event) coming back?
        // No, player needs to switch view to PlayerScreen which INITs the connection.
        onJoin();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-primary-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-800 via-primary-950 to-black">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-12 text-center"
            >
                <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,45,122,0.5)]">
                    Quiz da <span className="text-secondary-500">República</span>
                </h1>
                <p className="text-primary-300 text-lg uppercase tracking-widest">Hentrometeu</p>
            </motion.div>

            <Card className="w-full max-w-md" glass>
                {view === 'SELECTION' && (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold text-center mb-6">Quem é você?</h2>
                        <Button size="lg" variant="primary" onClick={() => setView('HOST_SETUP')}>
                            Sou o Host (TV)
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => setView('PLAYER_JOIN')}>
                            Sou Jogador (Celular)
                        </Button>
                    </div>
                )}

                {view === 'HOST_SETUP' && (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold text-center mb-2">Configurar Partida</h2>

                        <div className="space-y-2 text-left">
                            <label className="text-sm text-zinc-400">Número de Perguntas</label>
                            <div className="flex gap-2">
                                {[5, 10, 15].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setTotalRounds(num)}
                                        className={cn(
                                            "flex-1 p-3 rounded-xl border-2 transition-all font-bold",
                                            totalRounds === num
                                                ? "bg-secondary-600 border-secondary-400 text-white"
                                                : "bg-primary-900 border-primary-800 text-zinc-400"
                                        )}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            <Button onClick={handleCreateRoom} className="w-full">
                                Criar Sala
                            </Button>
                            <button
                                onClick={() => setView('SELECTION')}
                                className="text-zinc-500 hover:text-white transition-colors text-sm"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                )}

                {view === 'PLAYER_JOIN' && (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold text-center mb-2">Entrar na Sala</h2>

                        <input
                            type="text"
                            placeholder="SEU NOME (vulgo)"
                            className="w-full p-4 rounded-xl bg-primary-900 border-2 border-primary-700 text-white font-bold placeholder:text-primary-600 focus:border-secondary-500 focus:outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <input
                            type="text"
                            placeholder="CÓDIGO DA SALA"
                            className="w-full p-4 rounded-xl bg-primary-900 border-2 border-primary-700 text-white font-bold placeholder:text-primary-600 focus:border-secondary-500 focus:outline-none uppercase"
                            value={inputRoom}
                            onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
                        />

                        <Button
                            size="lg"
                            variant="secondary"
                            disabled={!name || !inputRoom}
                            onClick={handleJoinRoom}
                        >
                            ENTRAR
                        </Button>
                        <Button variant="ghost" onClick={() => setView('SELECTION')}>Voltar</Button>
                    </div>
                )}
            </Card>
        </div>
    );
};
