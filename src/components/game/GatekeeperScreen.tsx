import { useState } from 'react';
import { Button } from '../ui/Button';

const ACCESS_HASH = 'aef80f19c329dcf29a1765eaa3f225f3cfb455a1f449434dfb793ecf93f708ce';

export const GatekeeperScreen = ({ onAccessGranted }: { onAccessGranted: () => void }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState(false);

    const FALLBACK_HASH = 2362316350; // Simple Hash of H3NTR0M3T3U

    // Simple hashing function for non-secure contexts (LAN)
    const simpleHash = (str: string) => {
        let h = 0xdeadbeef;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
        }
        return (h ^ h >>> 16) >>> 0;
    };

    const checkCode = async () => {
        try {
            // Try secure SHA-256 first (works on localhost/HTTPS)
            if (crypto && crypto.subtle) {
                const encoder = new TextEncoder();
                const data = encoder.encode(code);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                if (hashHex === ACCESS_HASH) {
                    onAccessGranted();
                    return;
                }
            } else {
                // Fallback for LAN (HTTP)
                if (simpleHash(code) === FALLBACK_HASH) {
                    onAccessGranted();
                    return;
                }
            }
        } catch (e) {
            // Fallback if crypto throws
            if (simpleHash(code) === FALLBACK_HASH) {
                onAccessGranted();
                return;
            }
        }

        // Failure
        setError(true);
        setTimeout(() => setError(false), 2000);
    };

    return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-4 font-mono">
            <div className="max-w-md w-full border border-green-900 bg-black p-8 rounded-xl shadow-[0_0_50px_rgba(0,255,0,0.1)]">
                <h1 className="text-green-500 text-3xl font-bold mb-8 text-center tracking-widest uppercase border-b border-green-900 pb-4">
                    Acesso Restrito
                </h1>

                <div className="space-y-6">
                    <div>
                        <label className="block text-green-800 text-xs mb-2 uppercase tracking-widest">Código de Autorização</label>
                        <input
                            type="password"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && checkCode()}
                            className="w-full bg-green-950/20 border-2 border-green-900 text-green-500 p-4 rounded-lg focus:outline-none focus:border-green-500 text-center tracking-[0.5em] text-xl placeholder-green-900/50"
                            placeholder="••••••••••"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-center text-sm font-bold animate-pulse">
                            VAZA RALÉ
                        </div>
                    )}

                    <Button
                        onClick={checkCode}
                        className="w-full bg-green-900/40 hover:bg-green-800/40 border-green-700 text-green-400 font-bold py-4 tracking-widest"
                    >
                        VERIFICAR
                    </Button>
                </div>

                <div className="mt-8 text-center text-green-900/40 text-xs">
                    REPÚBLICA HENTROMETEU • SISTEMA DE SEGURANÇA v4.2
                </div>
            </div>
        </div>
    );
};
