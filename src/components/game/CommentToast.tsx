import { motion, AnimatePresence } from 'framer-motion';

interface CommentToastProps {
    comments: { id: string; playerName: string; text: string }[];
}

export const CommentToast = ({ comments }: CommentToastProps) => {
    return (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-full px-4 pointer-events-none">
            <AnimatePresence>
                {comments.map((comment) => (
                    <motion.div
                        key={comment.id}
                        initial={{ y: -50, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -20, opacity: 0, scale: 0.9 }}
                        className="bg-[#F5F5DC] border-2 border-[#D7CCC8] px-6 py-3 rounded-lg shadow-xl max-w-lg w-full relative overflow-hidden"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)',
                            backgroundSize: '24px 24px'
                        }}
                    >
                        {/* Aged paper effect overlay */}
                        <div className="absolute inset-0 bg-orange-900/5 mix-blend-multiply pointer-events-none" />

                        <div className="relative z-10">
                            <span className="text-[#5D4037] font-black text-xs uppercase tracking-widest block mb-1">
                                {comment.playerName} diz:
                            </span>
                            <p className="text-[#3E2723] font-handwriting text-xl leading-tight">
                                "{comment.text}"
                            </p>
                        </div>

                        {/* Paper corner fold effect */}
                        <div className="absolute top-0 right-0 w-8 h-8 bg-black/5 -translate-x-1/2 -translate-y-1/2 rotate-45" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
