import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Token {
    id: string;
    x: number;
    y: number;
    size: number;
    image: string;
    label?: string;
    stats?: {
        hp: number;
        maxHp: number;
        ac: number;
    };
    ownerId?: string; // If 'undefined', GM controls. If set, specific player controls.
    hidden?: boolean; // If true, only visible to GM (ghosted)
    conditions?: string[]; // Array of status effects (e.g., 'poisoned', 'prone')
}

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    timestamp: number;
    content: string;
    type: 'text' | 'roll' | 'system';
    rollData?: {
        formula: string;
        result: number;
        details: string;
    };
}

export interface Macro {
    id: string;
    label: string;
    command: string;
}

export interface GameState {
    // Identity
    myId: string;
    isHost: boolean;
    username: string;

    // Game Data
    tokens: Token[];
    map: {
        url: string | null;
        scale: number; // Pixels per grid unit (e.g. 50px)
        offsetX: number;
        offsetY: number;
        gridType: 'square' | 'hex';
        fogEnabled: boolean;
        revealedAreas: { x: number, y: number, radius: number }[];
    };
    chat: ChatMessage[];
    turnOrder: string[]; // Token IDs
    macros: Macro[]; // Local user macros
    audio: {
        url: string | null;
        isPlaying: boolean;
    };

    // Actions
    setIdentity: (id: string, isHost: boolean) => void;
    setUsername: (name: string) => void;
    addToken: (token: Token) => void;
    updateToken: (id: string, data: Partial<Token>) => void;
    removeToken: (id: string) => void;
    setMapBackground: (url: string) => void;
    addChatMessage: (msg: ChatMessage) => void;

    // Map Actions
    toggleFog: (enabled: boolean) => void;
    revealArea: (x: number, y: number, radius: number) => void;
    resetFog: () => void;

    // Automation Actions
    addMacro: (macro: Macro) => void;
    removeMacro: (id: string) => void;
    setAudio: (url: string | null, isPlaying: boolean) => void;

    // Sync methods (called by network)
    syncState: (state: Partial<GameState>) => void;
}

export const useGameStore = create<GameState>((set) => ({
    myId: uuidv4(),
    isHost: false,
    username: 'Player',
    tokens: [],
    map: {
        url: null,
        scale: 50,
        offsetX: 0,
        offsetY: 0,
        gridType: 'square',
        fogEnabled: false,
        revealedAreas: [],
    },
    chat: [],
    turnOrder: [],
    macros: [],
    audio: { url: null, isPlaying: false },

    setIdentity: (id, isHost) => set({ myId: id, isHost }),
    setUsername: (name) => set({ username: name }),
    addToken: (token) => set((state) => ({ tokens: [...state.tokens, token] })),
    updateToken: (id, data) => set((state) => ({
        tokens: state.tokens.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),
    removeToken: (id) => set((state) => ({
        tokens: state.tokens.filter((t) => t.id !== id),
    })),
    setMapBackground: (url) => set((state) => ({ map: { ...state.map, url } })),
    addChatMessage: (msg) => set((state) => ({ chat: [...state.chat, msg] })),

    toggleFog: (enabled) => set((state) => ({ map: { ...state.map, fogEnabled: enabled } })),
    revealArea: (x, y, radius) => set((state) => ({
        map: { ...state.map, revealedAreas: [...state.map.revealedAreas, { x, y, radius }] }
    })),
    resetFog: () => set((state) => ({ map: { ...state.map, revealedAreas: [] } })),

    addMacro: (macro) => set((state) => ({ macros: [...state.macros, macro] })),
    removeMacro: (id) => set((state) => ({ macros: state.macros.filter(m => m.id !== id) })),
    setAudio: (url, isPlaying) => set({ audio: { url, isPlaying } }),

    syncState: (newState) => set((state) => ({ ...state, ...newState })),
}));
