import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, type Ping } from './gameStore';

describe('GameStore QoL Features', () => {
    beforeEach(() => {
        // Reset the store state before each test
        useGameStore.setState({
            pings: [],
            tokens: [],
        });
    });

    it('should add a ping to the store', () => {
        const store = useGameStore.getState();
        expect(store.pings).toHaveLength(0);

        const newPing: Ping = {
            id: 'ping-1',
            x: 500,
            y: 500,
            color: '#ff0000',
        };

        store.addPing(newPing);
        expect(useGameStore.getState().pings).toHaveLength(1);
        expect(useGameStore.getState().pings[0]).toEqual(newPing);
    });

    it('should remove a ping from the store', () => {
        const store = useGameStore.getState();

        const ping1: Ping = { id: 'ping-1', x: 100, y: 100, color: '#ff0000' };
        const ping2: Ping = { id: 'ping-2', x: 200, y: 200, color: '#00ff00' };

        store.addPing(ping1);
        store.addPing(ping2);
        expect(useGameStore.getState().pings).toHaveLength(2);

        useGameStore.getState().removePing('ping-1');

        const stateAfterRemoval = useGameStore.getState();
        expect(stateAfterRemoval.pings).toHaveLength(1);
        expect(stateAfterRemoval.pings[0].id).toBe('ping-2');
    });
});
