import { useEffect, useRef, useCallback, useState } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import type { GameEvent } from '../types';
import { getPublicIP } from '../utils/network';

// Prefix to avoid collisions on public PeerServer
const ID_PREFIX = 'hntm-quiz-';

type MultiplayerProps = {
    role: 'HOST' | 'PLAYER';
    roomCode: string;
    playerName?: string; // Only for player
    playerId?: string;   // Only for player
    onMessage: (event: GameEvent) => void;
    onConnectionOpen?: () => void;
    verifiySameIp?: boolean; // New prop to enable strict IP check
};

export const useMultiplayer = ({ role, roomCode, playerName, playerId, onMessage, onConnectionOpen, verifiySameIp = false }: MultiplayerProps) => {
    const peerRef = useRef<Peer | null>(null);
    const connectionsRef = useRef<DataConnection[]>([]); // For Host: list of players
    const hostConnRef = useRef<DataConnection | null>(null); // For Player: connection to host
    const [isConnected, setIsConnected] = useState(false);
    const [myIp, setMyIp] = useState<string | null>(null);

    // Fetch IP on mount if verification is needed
    useEffect(() => {
        if (verifiySameIp || role === 'PLAYER') { // Players always fetch to send, Host fetches to verify
            getPublicIP().then(setMyIp);
        }
    }, [verifiySameIp, role]);

    useEffect(() => {
        if (!roomCode) return;
        // Wait for IP if verification is enabled? 
        // For Player: yes, we need IP to send in metadata.
        // For Host: yes, we need IP to verify incoming.
        if ((verifiySameIp || role === 'PLAYER') && !myIp) return;

        // Cleanup previous instance
        if (peerRef.current) {
            peerRef.current.destroy();
        }

        const peerId = role === 'HOST'
            ? `${ID_PREFIX}${roomCode}`
            : undefined; // Player gets auto ID

        const peer = peerId
            ? new Peer(peerId, { debug: 1 })
            : new Peer({ debug: 1 });
        peerRef.current = peer;

        peer.on('open', (id) => {
            console.log(`[PeerJS] Opened with ID: ${id}`);
            setIsConnected(true);

            if (role === 'PLAYER') {
                if (roomCode) connectToHost(peer, roomCode, myIp);
            } else {
                onConnectionOpen?.();
            }
        });

        peer.on('connection', (conn) => {
            // HOST Logic: Receive connection
            if (role === 'HOST') {
                handleHostConnection(conn);
            } else {
                // Player receiving connection? (Should rely on hostConnRef)
                // Usually won't happen unless P2P mesh, but we use Star topology.
                conn.on('data', (data) => onMessage(data as GameEvent));
            }
        });

        peer.on('error', (err) => {
            console.error('[PeerJS Error]', err);
            // Retry logic could go here
        });

        return () => {
            peer.destroy();
        };
    }, [role, roomCode, myIp, verifiySameIp]);

    const connectToHost = (peer: Peer, code: string, playerIp: string | null) => {
        const hostId = `${ID_PREFIX}${code}`;
        console.log(`[PeerJS] Player connecting to Host: ${hostId}`);

        // Send IP in metadata
        const conn = peer.connect(hostId, {
            reliable: true,
            metadata: { ip: playerIp }
        });

        conn.on('open', () => {
            console.log('[PeerJS] Connected to Host!');
            hostConnRef.current = conn;
            setIsConnected(true);
            onConnectionOpen?.();

            // Send Handshake
            if (playerName) {
                conn.send({
                    type: 'JOIN_ROOM',
                    payload: { name: playerName, id: playerId || peer.id }
                } as GameEvent);
            }
        });

        conn.on('data', (data) => {
            console.log('[Player Received]', data);
            onMessage(data as GameEvent);
        });

        conn.on('close', () => {
            console.log('[PeerJS] Disconnected from Host');
            setIsConnected(false);
        });

        conn.on('error', (err) => console.error('Connection Error', err));
    };

    const handleHostConnection = (conn: DataConnection) => {
        console.log(`[PeerJS] Incoming connection from ${conn.peer}`, conn.metadata);

        // IP CHECK
        if (verifiySameIp && myIp && conn.metadata?.ip) {
            if (conn.metadata.ip !== myIp) {
                console.warn(`[Security] Rejected connection from different IP: ${conn.metadata.ip} (Host: ${myIp})`);
                conn.close();
                return;
            }
        }

        connectionsRef.current.push(conn);

        conn.on('data', (data) => {
            console.log(`[Host Received from ${conn.peer}]`, data);
            onMessage(data as GameEvent);
        });

        conn.on('close', () => {
            connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
        });
    };

    const sendMessage = useCallback((event: GameEvent) => {
        if (role === 'HOST') {
            // Broadcast to all players
            connectionsRef.current.forEach(conn => {
                if (conn.open) conn.send(event);
            });
        } else {
            // Send to host
            if (hostConnRef.current?.open) {
                hostConnRef.current.send(event);
            }
        }
    }, [role]);

    return { sendMessage, isConnected, peerId: peerRef.current?.id };
};
