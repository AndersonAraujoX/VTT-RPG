import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('GameStore Handouts', () => {
    beforeEach(() => {
        // Reset the store handout state before each test
        useGameStore.setState({ handout: null });
    });

    it('should set and clear the handout url', () => {
        const store = useGameStore.getState();
        expect(store.handout).toBeNull();

        const fakeUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        store.setHandout(fakeUrl);
        expect(useGameStore.getState().handout).toBe(fakeUrl);

        store.setHandout(null);
        expect(useGameStore.getState().handout).toBeNull();
    });
});
