import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLMotionProps<'div'> {
    glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, children, glass = false, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                    'rounded-2xl p-6 shadow-xl',
                    glass
                        ? 'bg-black/40 backdrop-blur-md border border-white/10'
                        : 'bg-primary-800 border border-primary-700',
                    className
                )}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
