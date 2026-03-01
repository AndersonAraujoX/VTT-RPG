import { create } from 'zustand';

export interface MapAsset {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    image: string;
    locked?: boolean;
}

export interface Item {
    id: string;
    name: string;
    description?: string;
    type?: string;
    quantity?: number;
    weight?: number;
    icon?: string;
}

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
    targetId?: string; // Id of the token this token is targeting
    auras?: { id: string, radius: number, color: string }[]; // Magic auras
    isLoot?: boolean;
    inventory?: Item[];
}

export interface VFXEvent {
    id: string;
    type: 'explosion' | 'magic-missile' | 'heal';
    x: number;
    y: number;
    color?: string;
}

export interface FloatingText {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
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
    attackData?: {
        attackerName: string;
        itemName: string;
        damageTotal: number;
        damageType?: string;
        rollResults: { label: string, result: number }[];
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

export interface MapTrigger {
    id: string;
    x: number;
    y: number;
    radius: number;
    type: 'trap' | 'teleport' | 'prompt';
    effectVFX?: 'explosion' | 'magic-missile' | 'heal';
    chatMessage?: string;
    isVisibleToPlayers?: boolean;
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
        fogEnabled: boolean;
        revealedAreas: { x: number, y: number, radius: number }[];
        dynamicLightingEnabled: boolean;
        weather: 'none' | 'rain' | 'snow';
        dayTime: number;
    };
    tokens: Token[];
    mapAssets: MapAsset[];
    drawings: Drawing[];
    walls: Wall[];
    texts: TextItem[];
    triggers: MapTrigger[];
    audioZones: AudioZone[];
}

export type MapState = Scene['map'];

export interface Card {
    id: string;
    typeId: string;
    label?: string;
    imageUrl?: string;
}

export interface AudioZone {
    id: string;
    x: number;
    y: number;
    radius: number;
    url: string;
    baseVolume: number;
    loop?: boolean;
}

export interface Deck {
    id: string;
    name: string;
    cards: Card[];
    discard: Card[];
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
    activeLayer: 'map' | 'token';
    tokens: Token[];
    mapAssets: MapAsset[];
    map: {
        url: string | null;
        scale: number; // Pixels per grid unit (e.g. 50px)
        offsetX: number;
        offsetY: number;
        fogEnabled: boolean;
        revealedAreas: { x: number, y: number, radius: number }[];
        dynamicLightingEnabled: boolean;
        weather: 'none' | 'rain' | 'snow';
        dayTime: number; // 0 to 24
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
    vfx: VFXEvent[];
    floatingTexts: FloatingText[];
    triggers: MapTrigger[];
    audioZones: AudioZone[];

    // GM Tools State
    scenes: Scene[];
    activeSceneId: string;
    savedAssets: SavedAsset[];

    // Deck System
    decks: Deck[];
    hands: Record<string, Card[]>;

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
    setWeather: (weather: 'none' | 'rain' | 'snow') => void;
    setDayTime: (time: number) => void;

    // Combat & VFX Actions
    setTarget: (tokenId: string, targetId: string | null) => void;
    triggerVFX: (vfx: VFXEvent) => void;
    removeVFX: (id: string) => void;
    addFloatingText: (text: FloatingText) => void;
    removeFloatingText: (id: string) => void;

    // Map Layer Actions
    setActiveLayer: (layer: 'map' | 'token') => void;
    addMapAsset: (asset: MapAsset) => void;
    updateMapAsset: (id: string, data: Partial<MapAsset>) => void;
    removeMapAsset: (id: string) => void;

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

    // Trigger Actions
    addTrigger: (trigger: MapTrigger) => void;
    updateTrigger: (id: string, data: Partial<MapTrigger>) => void;
    removeTrigger: (id: string) => void;
    clearTriggers: () => void;

    // Audio Zone Actions
    addAudioZone: (zone: AudioZone) => void;
    updateAudioZone: (id: string, data: Partial<AudioZone>) => void;
    removeAudioZone: (id: string) => void;
    clearAudioZones: () => void;

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

    // Deck Actions
    addDeck: (deck: Deck) => void;
    removeDeck: (id: string) => void;
    shuffleDeck: (deckId: string) => void;
    drawCard: (deckId: string, playerId: string | 'table') => void;
    discardCard: (playerId: string, cardId: string) => void;

    // Automation & Combat
    applyDamage: (tokenId: string, amount: number) => void;

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

    activeLayer: 'token',
    tokens: [],
    mapAssets: [],
    map: {
        url: null,
        scale: 50,
        offsetX: 0,
        offsetY: 0,
        fogEnabled: false,
        revealedAreas: [],
        dynamicLightingEnabled: false,
        weather: 'none',
        dayTime: 12
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
    vfx: [],
    floatingTexts: [],
    triggers: [],
    audioZones: [],
    scenes: [],
    activeSceneId: 'default',
    savedAssets: [],
    decks: [],
    hands: {},

    setIdentity: (id, isHost) => set({ myId: id, isHost }),
    setUsername: (name) => set({ username: name }),
    setActiveTool: (tool) => set({ activeTool: tool }),
    setToolColor: (color) => set({ toolColor: color }),
    setToolThickness: (thickness) => set({ toolThickness: thickness }),

    setActiveLayer: (layer) => set({ activeLayer: layer }),

    addToken: (token) => set((s) => ({ tokens: [...s.tokens, token] })),
    updateToken: (id, data) => set((s) => {
        const tokens = s.tokens.map((t) => {
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
    removeToken: (id) => set((s) => ({ tokens: s.tokens.filter((t) => t.id !== id) })),

    addMapAsset: (asset) => set((s) => ({ mapAssets: [...s.mapAssets, asset] })),
    updateMapAsset: (id, data) => set((s) => ({
        mapAssets: s.mapAssets.map(m => m.id === id ? { ...m, ...data } : m)
    })),
    removeMapAsset: (id) => set((s) => ({ mapAssets: s.mapAssets.filter(m => m.id !== id) })),

    updateMap: (data: Partial<GameState['map']>) => set((state) => ({ map: { ...state.map, ...data } })),
    toggleFog: (enabled) => set((state) => ({ map: { ...state.map, fogEnabled: enabled } })),
    revealArea: (x, y, radius) => set((state) => ({
        map: { ...state.map, revealedAreas: [...state.map.revealedAreas, { x, y, radius }] }
    })),
    resetFog: () => set((state) => ({ map: { ...state.map, revealedAreas: [] } })),

    addChatMessage: (msg) => set((state) => ({ chat: [...state.chat, msg] })),

    addPing: (ping) => set((state) => ({ pings: [...state.pings, ping] })),
    removePing: (id) => set((state) => ({ pings: state.pings.filter(p => p.id !== id) })),
    setWeather: (weather) => set((state) => ({ map: { ...state.map, weather } })),
    setDayTime: (time) => set((state) => ({ map: { ...state.map, dayTime: time } })),

    setTarget: (tokenId, targetId) => set((state) => ({
        tokens: state.tokens.map(t => t.id === tokenId ? { ...t, targetId: targetId || undefined } : t)
    })),
    triggerVFX: (vfx) => set((state) => ({ vfx: [...state.vfx, vfx] })),
    removeVFX: (id) => set((state) => ({ vfx: state.vfx.filter(v => v.id !== id) })),
    addFloatingText: (text) => set((state) => ({ floatingTexts: [...state.floatingTexts, text] })),
    removeFloatingText: (id) => set((state) => ({ floatingTexts: state.floatingTexts.filter(f => f.id !== id) })),

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

    addTrigger: (trigger) => set((s) => ({ triggers: [...s.triggers, trigger] })),
    updateTrigger: (id, data) => set((s) => ({
        triggers: s.triggers.map((t) => t.id === id ? { ...t, ...data } : t)
    })),
    removeTrigger: (id) => set((s) => ({ triggers: s.triggers.filter((t) => t.id !== id) })),
    clearTriggers: () => set({ triggers: [] }),

    addAudioZone: (zone) => set((s) => ({ audioZones: [...s.audioZones, zone] })),
    updateAudioZone: (id, data) => set((s) => ({
        audioZones: s.audioZones.map((z) => z.id === id ? { ...z, ...data } : z)
    })),
    removeAudioZone: (id) => set((s) => ({ audioZones: s.audioZones.filter((z) => z.id !== id) })),
    clearAudioZones: () => set({ audioZones: [] }),

    saveScene: (name) => set((state) => {
        const id = Date.now().toString();
        const newScene: Scene = {
            id,
            name,
            map: state.map,
            mapAssets: state.mapAssets,
            tokens: state.tokens,
            drawings: state.drawings,
            walls: state.walls,
            texts: state.texts,
            triggers: state.triggers,
            audioZones: state.audioZones
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
            mapAssets: scene.mapAssets,
            tokens: scene.tokens,
            drawings: scene.drawings,
            walls: scene.walls,
            texts: scene.texts,
            triggers: scene.triggers || [],
            audioZones: scene.audioZones || []
        };
    }),

    addSavedAsset: (asset) => set((state) => ({ savedAssets: [...state.savedAssets, asset] })),
    removeSavedAsset: (id) => set((state) => ({ savedAssets: state.savedAssets.filter(a => a.id !== id) })),

    addDeck: (deck) => set((state) => ({ decks: [...state.decks, deck] })),
    removeDeck: (id) => set((state) => ({ decks: state.decks.filter(d => d.id !== id) })),
    shuffleDeck: (deckId) => set((state) => ({
        decks: state.decks.map(d => {
            if (d.id !== deckId) return d;
            const allCards = [...d.cards, ...d.discard];
            for (let i = allCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
            }
            return { ...d, cards: allCards, discard: [] };
        })
    })),
    drawCard: (deckId, playerId) => set((state) => {
        const deck = state.decks.find(d => d.id === deckId);
        if (!deck || deck.cards.length === 0) return state;

        const drawnCard = deck.cards[0];
        const newCards = deck.cards.slice(1);

        const newDecks = state.decks.map(d =>
            d.id === deckId ? { ...d, cards: newCards } : d
        );

        if (playerId === 'table') {
            // For now, put to discard immediately if drawn to table
            // Later we can add it to an active table selection
            return {
                decks: newDecks.map(d => d.id === deckId ? { ...d, discard: [...d.discard, drawnCard] } : d)
            };
        }

        const currentHand = state.hands[playerId] || [];
        return {
            decks: newDecks,
            hands: { ...state.hands, [playerId]: [...currentHand, drawnCard] }
        };
    }),
    discardCard: (playerId, cardId) => set((state) => {
        const hand = state.hands[playerId];
        if (!hand) return state;
        const card = hand.find(c => c.id === cardId);
        if (!card) return state;

        const targetDeck = state.decks.find(d =>
            d.cards.some(c => c.id === cardId) || d.discard.some(c => c.id === cardId) || cardId.startsWith(d.id)
        );

        if (targetDeck) {
            return {
                hands: { ...state.hands, [playerId]: hand.filter(c => c.id !== cardId) },
                decks: state.decks.map(d => d.id === targetDeck.id ? { ...d, discard: [...d.discard, card] } : d)
            };
        }

        return {
            hands: { ...state.hands, [playerId]: hand.filter(c => c.id !== cardId) },
        };
    }),

    applyDamage: (tokenId, amount) => set((s) => ({
        tokens: s.tokens.map(t => {
            if (t.id !== tokenId || !t.stats) return t;
            const newHp = Math.max(0, Math.min(t.stats.maxHp, t.stats.hp - amount));
            return { ...t, stats: { ...t.stats, hp: newHp } };
        })
    })),

    syncState: (newState) => set((state) => ({ ...state, ...newState })),
}));
