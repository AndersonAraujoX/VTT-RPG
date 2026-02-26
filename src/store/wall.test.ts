import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, type Wall } from './gameStore';

describe('GameStore Wall Tools', () => {
    beforeEach(() => {
        useGameStore.getState().clearWalls();
        useGameStore.getState().toggleDynamicLighting(false);
    });

    it('should add a wall', () => {
        const store = useGameStore.getState();
        expect(store.walls).toHaveLength(0);

        const newWall: Wall = {
            id: 'wall-1',
            p1: { x: 10, y: 10 },
            p2: { x: 100, y: 100 }
        };

        store.addWall(newWall);
        expect(useGameStore.getState().walls).toHaveLength(1);
        expect(useGameStore.getState().walls[0]).toEqual(newWall);
    });

    it('should remove a wall by id', () => {
        const store = useGameStore.getState();
        const wallId = 'wall-to-remove';
        store.addWall({ id: wallId, p1: { x: 0, y: 0 }, p2: { x: 50, y: 50 } });
        expect(useGameStore.getState().walls).toHaveLength(1);

        useGameStore.getState().removeWall(wallId);
        expect(useGameStore.getState().walls).toHaveLength(0);
    });

    it('should clear all walls', () => {
        const store = useGameStore.getState();
        store.addWall({ id: 'w1', p1: { x: 0, y: 0 }, p2: { x: 50, y: 50 } });
        store.addWall({ id: 'w2', p1: { x: 10, y: 10 }, p2: { x: 60, y: 60 } });
        expect(useGameStore.getState().walls).toHaveLength(2);

        useGameStore.getState().clearWalls();
        expect(useGameStore.getState().walls).toHaveLength(0);
    });

    it('should toggle dynamic lighting', () => {
        const store = useGameStore.getState();
        expect(store.map.dynamicLightingEnabled).toBe(false);

        store.toggleDynamicLighting(true);
        expect(useGameStore.getState().map.dynamicLightingEnabled).toBe(true);
    });
});
