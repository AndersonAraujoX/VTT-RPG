import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, type Drawing } from './gameStore';

describe('GameStore Drawing Tools', () => {
    beforeEach(() => {
        // Reset the store drawings state before each test
        useGameStore.setState({ drawings: [] });
    });

    it('should add a drawing', () => {
        const store = useGameStore.getState();
        expect(store.drawings).toHaveLength(0);

        const newDrawing: Drawing = {
            id: 'draw-1',
            type: 'freehand',
            color: '#ff0000',
            thickness: 5,
            points: [{ x: 10, y: 10 }, { x: 20, y: 20 }]
        };

        store.addDrawing(newDrawing);
        expect(useGameStore.getState().drawings).toHaveLength(1);
        expect(useGameStore.getState().drawings[0]).toEqual(newDrawing);
    });

    it('should remove a drawing by id', () => {
        const store = useGameStore.getState();
        const drawing: Drawing = {
            id: 'draw-1',
            type: 'rect',
            color: '#00ff00',
            thickness: 2,
            points: [{ x: 50, y: 50 }, { x: 100, y: 100 }]
        };

        store.addDrawing(drawing);
        expect(useGameStore.getState().drawings).toHaveLength(1);

        store.removeDrawing('draw-1');
        expect(useGameStore.getState().drawings).toHaveLength(0);
    });

    it('should clear all drawings', () => {
        const store = useGameStore.getState();
        store.addDrawing({ id: '1', type: 'freehand', color: '#fff', thickness: 1, points: [] });
        store.addDrawing({ id: '2', type: 'freehand', color: '#fff', thickness: 1, points: [] });

        expect(useGameStore.getState().drawings).toHaveLength(2);

        store.clearDrawings();
        expect(useGameStore.getState().drawings).toHaveLength(0);
    });
});
