import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('GameStore Automated Initiative', () => {
    beforeEach(() => {
        // Reset the store turnOrder state before each test
        useGameStore.setState({ turnOrder: [] });
    });

    it('should add to initiative and sort descending by value', () => {
        const store = useGameStore.getState();
        expect(store.turnOrder).toHaveLength(0);

        store.addToInitiative('Goblin', 12);
        store.addToInitiative('Hero', 18);
        store.addToInitiative('Dragon', 5);
        store.addToInitiative('Rogue', 22);

        const state = useGameStore.getState();
        expect(state.turnOrder).toHaveLength(4);

        // Assert sorting order (22, 18, 12, 5)
        expect(state.turnOrder[0].name).toBe('Rogue');
        expect(state.turnOrder[1].name).toBe('Hero');
        expect(state.turnOrder[2].name).toBe('Goblin');
        expect(state.turnOrder[3].name).toBe('Dragon');
    });

    it('should cycle to the next turn correctly', () => {
        const store = useGameStore.getState();
        store.addToInitiative('A', 20);
        store.addToInitiative('B', 15);
        store.addToInitiative('C', 10);

        expect(useGameStore.getState().turnOrder[0].name).toBe('A');

        store.nextTurn();
        let state = useGameStore.getState();
        expect(state.turnOrder[0].name).toBe('B');
        expect(state.turnOrder[2].name).toBe('A');

        store.nextTurn();
        state = useGameStore.getState();
        expect(state.turnOrder[0].name).toBe('C');
        expect(state.turnOrder[2].name).toBe('B');
    });

    it('should remove an entity from initiative', () => {
        const store = useGameStore.getState();
        store.addToInitiative('Target', 10);

        const state = useGameStore.getState();
        const id = state.turnOrder[0].id;

        store.removeFromInitiative(id);
        expect(useGameStore.getState().turnOrder).toHaveLength(0);
    });

    it('should clear the initiative tracker entirely', () => {
        const store = useGameStore.getState();
        store.addToInitiative('A', 20);
        store.addToInitiative('B', 15);

        expect(useGameStore.getState().turnOrder).toHaveLength(2);

        store.clearInitiative();
        expect(useGameStore.getState().turnOrder).toHaveLength(0);
    });
});
