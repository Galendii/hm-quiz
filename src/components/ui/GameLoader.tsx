import { motion } from 'framer-motion';

interface GameLoaderProps {
    message?: string;
}

export const GameLoader = ({ message = "Enchendo os copos..." }: GameLoaderProps) => {
    return (
        <div className="flex flex-col items-center justify-center space-y-8 bg-black/40 backdrop-blur-md p-10 rounded-3xl border-2 border-white/10 shadow-2xl">
            {/* Beer Filling Animation */}
            <div className="relative w-24 h-32 border-4 border-white/20 rounded-b-xl rounded-t-sm overflow-hidden">
                {/* Beer Liquid */}
                <motion.div
                    initial={{ height: "0%" }}
                    animate={{ height: "80%" }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                    className="absolute bottom-0 w-full bg-[#FFD740] shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]"
                >
                    {/* Bubbles */}
                    <motion.div
                        animate={{ y: [-10, -50], opacity: [0, 1, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="absolute left-4 top-2 w-2 h-2 bg-white/40 rounded-full"
                    />
                    <motion.div
                        animate={{ y: [-5, -40], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.3 }}
                        className="absolute right-6 top-4 w-1.5 h-1.5 bg-white/40 rounded-full"
                    />
                </motion.div>

                {/* Foam */}
                <motion.div
                    initial={{ bottom: "0%" }}
                    animate={{ bottom: "80%" }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                    className="absolute w-full h-6 bg-white shadow-lg flex justify-around items-end"
                >
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-6 h-6 bg-white rounded-full -mb-3 shadow-md" />
                    ))}
                </motion.div>

                {/* Glass shine */}
                <div className="absolute top-0 right-2 w-2 h-full bg-white/10 skew-x-12" />
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
                <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-[#FFEB3B] font-black text-2xl tracking-widest uppercase italic drop-shadow-md"
                >
                    {message}
                </motion.div>
                <div className="text-white/40 text-xs font-mono uppercase tracking-tighter">
                    Preparando as perguntas do Veterano...
                </div>
            </div>

            {/* Progress Bar (Visual only) */}
            <div className="w-64 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full bg-gradient-to-r from-transparent via-[#FFEB3B] to-transparent"
                />
            </div>
        </div>
    );
};
