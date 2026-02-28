import { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';
import { useGameStore } from '../store/gameStore';

export class NetworkManager {
    peer: Peer | null = null;
    connections: DataConnection[] = [];
    hostConnection: DataConnection | null = null;
    onPeerConnect?: (peerId: string) => void;

    constructor() {
        // Singleton or managed by App
    }

    initialize(id?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            this.peer = new Peer(id);

            this.peer!.on('open', (newId: string) => {
                console.log('My Peer ID is: ' + newId);
                resolve(newId);
            });

            this.peer!.on('connection', (conn: DataConnection) => {
                this.handleConnection(conn);
            });

            this.peer!.on('error', (err: any) => {
                console.error(err);
                reject(err);
            });
        });
    }

    connectToHost(hostId: string) {
        if (!this.peer) return;
        const conn = this.peer.connect(hostId);
        this.hostConnection = conn;

        conn.on('open', () => {
            console.log('Connected to host');
            // Request initial state
            conn.send({ type: 'REQUEST_STATE' });
            this.onPeerConnect?.(conn.peer);
        });

        conn.on('data', (data) => {
            this.handleData(data, conn);
        });
    }

    handleConnection(conn: DataConnection) {
        this.connections.push(conn);
        conn.on('open', () => {
            this.onPeerConnect?.(conn.peer);
        });
        conn.on('data', (data) => {
            this.handleData(data, conn);
        });
        conn.on('close', () => {
            this.connections = this.connections.filter(c => c !== conn);
        });
    }

    handleData(data: any, conn: DataConnection) {
        const store = useGameStore.getState();
        console.log('Received data:', data);

        switch (data.type) {
            case 'SYNC_STATE':
                store.syncState(data.payload);
                break;
            case 'REQUEST_STATE':
                if (store.isHost) {
                    // Send current state to new player
                    conn.send({
                        type: 'SYNC_STATE',
                        payload: {
                            tokens: store.tokens,
                            map: store.map,
                            chat: store.chat,
                            // turnOrder etc.
                        }
                    });
                }
                break;
            // Actions that need to be rebroadcasted by host
            case 'ACTION':
                // Apply locally
                this.applyAction(data.action, data.payload);
                // If I am host, broadcast to everyone else
                if (store.isHost) {
                    this.broadcast({ type: 'ACTION', action: data.action, payload: data.payload }, conn.peer);
                }
                break;
        }
    }

    applyAction(action: string, payload: any) {
        const store = useGameStore.getState();
        switch (action) {
            case 'ADD_TOKEN': store.addToken(payload); break;
            case 'UPDATE_TOKEN': store.updateToken(payload.id, payload.data); break;
            case 'ADD_CHAT': store.addChatMessage(payload); break;
            case 'UPDATE_MAP': store.updateMap({ url: payload.url }); break;
            case 'ADD_TEXT': store.addText(payload); break;
            case 'REMOVE_TEXT': store.removeText(payload); break;
            // ...
        }
    }

    broadcast(data: any, excludePeerId?: string) {
        this.connections.forEach(conn => {
            if (conn.peer !== excludePeerId) {
                conn.send(data);
            }
        });
    }

    sendAction(action: string, payload: any) {
        // Apply locally first
        this.applyAction(action, payload);

        const message = { type: 'ACTION', action, payload };

        if (this.hostConnection) {
            this.hostConnection.send(message);
        } else {
            // I am host
            this.broadcast(message);
        }
    }
}

export const networkManager = new NetworkManager();
