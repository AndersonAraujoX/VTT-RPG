import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('GameStore Fog of War', () => {
    beforeEach(() => {
        // Reset the store map state before each test
        useGameStore.setState({
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
            }
        });
    });

    it('should toggle fog visibility', () => {
        const store = useGameStore.getState();
        expect(store.map.fogEnabled).toBe(false);

        store.toggleFog(true);
        expect(useGameStore.getState().map.fogEnabled).toBe(true);

        store.toggleFog(false);
        expect(useGameStore.getState().map.fogEnabled).toBe(false);
    });

    it('should add revealed areas', () => {
        const store = useGameStore.getState();
        expect(store.map.revealedAreas).toHaveLength(0);

        store.revealArea(100, 200, 50);

        const state = useGameStore.getState();
        expect(state.map.revealedAreas).toHaveLength(1);
        expect(state.map.revealedAreas[0]).toEqual({ x: 100, y: 200, radius: 50 });

        store.revealArea(300, 400, 25);
        expect(useGameStore.getState().map.revealedAreas).toHaveLength(2);
    });

    it('should reset revealed areas', () => {
        const store = useGameStore.getState();
        store.revealArea(100, 200, 50);
        store.revealArea(300, 400, 25);

        expect(useGameStore.getState().map.revealedAreas).toHaveLength(2);

        useGameStore.getState().resetFog();
        expect(useGameStore.getState().map.revealedAreas).toHaveLength(0);
    });
});
