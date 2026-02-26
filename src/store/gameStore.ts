import { create } from 'zustand';

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
        attributes?: {
            strength: number;
            dexterity: number;
            constitution: number;
            intelligence: number;
            wisdom: number;
            charisma: number;
        };
        skills?: Record<string, number>;
    };
    ownerId?: string; // If 'undefined', GM controls. If set, specific player controls.
    hidden?: boolean; // If true, only visible to GM (ghosted)
    conditions?: string[]; // Array of status effects (e.g., 'poisoned', 'prone')
    lightRadius?: number; // Light source radius in grid units/feet
    auras?: { id: string, radius: number, color: string }[]; // Magic auras
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

export interface TurnEntity {
    id: string;
    name: string;
    initiative: number;
}

export interface Drawing {
    id: string;
    type: 'freehand' | 'line' | 'rect' | 'circle' | 'cone' | 'cube';
    color: string;
    thickness: number;
    points: { x: number, y: number }[];
}

export interface TextItem {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    fontSize: number;
}

export interface Wall {
    id: string;
    p1: { x: number, y: number };
    p2: { x: number, y: number };
    isDoor?: boolean;
    isOpen?: boolean;
}

export interface Ping {
    id: string;
    x: number;
    y: number;
    color: string;
}

export interface SavedAsset {
    id: string;
    name: string;
    imageUrl: string;
    defaultSize: number;
}

export interface Scene {
    id: string;
    name: string;
    map: {
        url: string | null;
        scale: number;
        offsetX: number;
        offsetY: number;
        gridType: 'square' | 'hex';
        fogEnabled: boolean;
        revealedAreas: { x: number, y: number, radius: number }[];
        dynamicLightingEnabled: boolean;
    };
    tokens: Token[];
    drawings: Drawing[];
    walls: Wall[];
    texts: TextItem[];
}

export interface SavedAsset {
    id: string;
    name: string;
    imageUrl: string;
    defaultSize: number;
}

export interface Scene {
    id: string;
    name: string;
    map: {
        url: string | null;
        scale: number;
        offsetX: number;
        offsetY: number;
        gridType: 'square' | 'hex';
        fogEnabled: boolean;
        revealedAreas: { x: number, y: number, radius: number }[];
        dynamicLightingEnabled: boolean;
    };
    tokens: Token[];
    drawings: Drawing[];
    walls: Wall[];
    texts: TextItem[];
}

export interface GameState {
    // Identity
    myId: string;
    isHost: boolean;
    username: string;

    // Tool State
    activeTool: 'pan' | 'draw' | 'circle' | 'cone' | 'cube' | 'wall' | 'door' | 'text';
    toolColor: string;
    toolThickness: number;

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
        dynamicLightingEnabled: boolean;
    };
    chat: ChatMessage[];
    turnOrder: TurnEntity[];
    macros: Macro[]; // Local user macros
    audio: {
        url: string | null;
        isPlaying: boolean;
    };
    handout: string | null;
    drawings: Drawing[];
    walls: Wall[];
    texts: TextItem[];
    pings: Ping[];

    // GM Tools State
    scenes: Scene[];
    activeSceneId: string;
    savedAssets: SavedAsset[];

    // Actions
    setIdentity: (id: string, isHost: boolean) => void;
    setUsername: (name: string) => void;
    setActiveTool: (tool: 'pan' | 'draw' | 'circle' | 'cone' | 'cube' | 'wall' | 'door' | 'text') => void;
    setToolColor: (color: string) => void;
    setToolThickness: (thickness: number) => void;
    addToken: (token: Token) => void;
    updateToken: (id: string, data: Partial<Token>) => void;
    removeToken: (id: string) => void;
    updateMap: (data: Partial<GameState['map']>) => void;
    addChatMessage: (msg: ChatMessage) => void;
    addPing: (ping: Ping) => void;
    removePing: (id: string) => void;

    // Map Actions
    toggleFog: (enabled: boolean) => void;
    revealArea: (x: number, y: number, radius: number) => void;
    resetFog: () => void;
    addDrawing: (drawing: Drawing) => void;
    removeDrawing: (id: string) => void;
    clearDrawings: () => void;
    addText: (text: TextItem) => void;
    removeText: (id: string) => void;
    clearTexts: () => void;

    // Wall Actions
    addWall: (wall: Wall) => void;
    removeWall: (id: string) => void;
    clearWalls: () => void;
    toggleWallDoor: (id: string) => void;
    toggleDynamicLighting: (enabled: boolean) => void;

    // Initiative Actions
    setTurnOrder: (order: TurnEntity[]) => void;
    addToInitiative: (name: string, value: number) => void;
    removeFromInitiative: (id: string) => void;
    clearInitiative: () => void;
    nextTurn: () => void;

    // Automation Actions
    addMacro: (macro: Macro) => void;
    removeMacro: (id: string) => void;
    setAudio: (url: string | null, isPlaying: boolean) => void;
    setHandout: (url: string | null) => void;

    // Scene Actions
    saveScene: (name: string) => void;
    loadScene: (id: string) => void;

    // Asset Actions
    addSavedAsset: (asset: SavedAsset) => void;
    removeSavedAsset: (id: string) => void;

    // Sync methods (called by network)
    syncState: (state: Partial<GameState>) => void;
}

export const useGameStore = create<GameState>((set) => ({
    myId: '',
    isHost: false,
    username: `Player ${Math.floor(Math.random() * 1000)}`,

    activeTool: 'pan',
    toolColor: '#ff0000',
    toolThickness: 3,

    tokens: [],
    map: {
        url: null,
        scale: 50,
        offsetX: 0,
        offsetY: 0,
        gridType: 'square',
        fogEnabled: false,
        revealedAreas: [],
        dynamicLightingEnabled: false
    },
    chat: [],
    turnOrder: [],
    macros: [],
    audio: { url: null, isPlaying: false },
    handout: null,
    drawings: [],
    walls: [],
    texts: [],
    pings: [],
    scenes: [],
    activeSceneId: 'default',
    savedAssets: [],

    setIdentity: (id, isHost) => set({ myId: id, isHost }),
    setUsername: (name) => set({ username: name }),
    setActiveTool: (tool) => set({ activeTool: tool }),
    setToolColor: (color) => set({ toolColor: color }),
    setToolThickness: (thickness) => set({ toolThickness: thickness }),

    addToken: (token) => set((state) => ({ tokens: [...state.tokens, token] })),
    updateToken: (id, data) => set((state) => {
        const tokens = state.tokens.map((t) => {
            if (t.id !== id) return t;

            const updatedToken = { ...t, ...data };

            // Death Automation Logic
            if (updatedToken.stats && updatedToken.stats.hp <= 0 && (!t.stats || t.stats.hp > 0)) {
                const newConditions = new Set(updatedToken.conditions || []);
                newConditions.add('Dead');
                newConditions.add('Prone');
                updatedToken.conditions = Array.from(newConditions);
            }

            return updatedToken;
        });
        return { tokens };
    }),
    removeToken: (id) => set((state) => ({ tokens: state.tokens.filter((t) => t.id !== id) })),

    updateMap: (data: Partial<GameState['map']>) => set((state) => ({ map: { ...state.map, ...data } })),
    toggleFog: (enabled) => set((state) => ({ map: { ...state.map, fogEnabled: enabled } })),
    revealArea: (x, y, radius) => set((state) => ({
        map: { ...state.map, revealedAreas: [...state.map.revealedAreas, { x, y, radius }] }
    })),
    resetFog: () => set((state) => ({ map: { ...state.map, revealedAreas: [] } })),

    addChatMessage: (msg) => set((state) => ({ chat: [...state.chat, msg] })),

    addPing: (ping) => set((state) => ({ pings: [...state.pings, ping] })),
    removePing: (id) => set((state) => ({ pings: state.pings.filter(p => p.id !== id) })),

    setTurnOrder: (order) => set({ turnOrder: order }),
    addToInitiative: (name, initiative) => set((state) => {
        const newEntity = { id: Date.now().toString(), name, initiative };
        const newOrder = [...state.turnOrder, newEntity]
            .sort((a, b) => b.initiative - a.initiative);
        return { turnOrder: newOrder };
    }),
    nextTurn: () => set((state) => {
        if (state.turnOrder.length <= 1) return state;
        const [first, ...rest] = state.turnOrder;
        return { turnOrder: [...rest, first] };
    }),
    clearInitiative: () => set({ turnOrder: [] }),
    removeFromInitiative: (id) => set((state) => ({
        turnOrder: state.turnOrder.filter(e => e.id !== id)
    })),

    addMacro: (macro) => set((state) => ({ macros: [...state.macros, macro] })),
    removeMacro: (id) => set((state) => ({ macros: state.macros.filter(m => m.id !== id) })),

    setAudio: (url, isPlaying) => set({ audio: { url, isPlaying } }),
    setHandout: (url) => set({ handout: url }),

    addDrawing: (drawing) => set((state) => ({ drawings: [...state.drawings, drawing] })),
    removeDrawing: (id) => set((state) => ({ drawings: state.drawings.filter(d => d.id !== id) })),
    clearDrawings: () => set({ drawings: [] }),

    addText: (text) => set((state) => ({ texts: [...state.texts, text] })),
    removeText: (id) => set((state) => ({ texts: state.texts.filter(t => t.id !== id) })),
    clearTexts: () => set({ texts: [] }),

    addWall: (wall) => set((state) => ({ walls: [...state.walls, wall] })),
    removeWall: (id) => set((state) => ({ walls: state.walls.filter(w => w.id !== id) })),
    clearWalls: () => set({ walls: [] }),
    toggleWallDoor: (id) => set((state) => ({
        walls: state.walls.map(w => w.id === id ? { ...w, isOpen: !w.isOpen } : w)
    })),
    toggleDynamicLighting: (enabled) => set((state) => ({ map: { ...state.map, dynamicLightingEnabled: enabled } })),

    saveScene: (name) => set((state) => {
        const id = Date.now().toString();
        const newScene: Scene = {
            id,
            name,
            map: state.map,
            tokens: state.tokens,
            drawings: state.drawings,
            walls: state.walls,
            texts: state.texts
        };
        return {
            scenes: [...state.scenes, newScene],
            activeSceneId: id
        };
    }),

    loadScene: (id) => set((state) => {
        const scene = state.scenes.find(s => s.id === id);
        if (!scene) return state;
        return {
            activeSceneId: id,
            map: scene.map,
            tokens: scene.tokens,
            drawings: scene.drawings,
            walls: scene.walls,
            texts: scene.texts || []
        };
    }),

    addSavedAsset: (asset) => set((state) => ({ savedAssets: [...state.savedAssets, asset] })),
    removeSavedAsset: (id) => set((state) => ({ savedAssets: state.savedAssets.filter(a => a.id !== id) })),

    syncState: (newState) => set((state) => ({ ...state, ...newState })),
}));
