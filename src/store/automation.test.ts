import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('GameStore Automation Tools (Macros & Audio)', () => {
    beforeEach(() => {
        // Reset the store before each test
        useGameStore.setState({
            macros: [],
            audio: { url: null, isPlaying: false }
        });
    });

    it('should add a macro', () => {
        const store = useGameStore.getState();
        store.addMacro({ id: 'm1', label: 'Attack', command: '/roll 1d20+5' });

        expect(useGameStore.getState().macros).toHaveLength(1);
        expect(useGameStore.getState().macros[0].label).toBe('Attack');
    });

    it('should remove a macro', () => {
        const store = useGameStore.getState();
        store.addMacro({ id: 'm1', label: 'Attack', command: '/roll 1d20+5' });
        store.addMacro({ id: 'm2', label: 'Heal', command: '/roll 1d4' });

        store.removeMacro('m1');

        expect(useGameStore.getState().macros).toHaveLength(1);
        expect(useGameStore.getState().macros[0].id).toBe('m2');
    });

    it('should set audio state', () => {
        const store = useGameStore.getState();

        // Start playing
        store.setAudio('http://example.com/music.mp3', true);
        expect(useGameStore.getState().audio.url).toBe('http://example.com/music.mp3');
        expect(useGameStore.getState().audio.isPlaying).toBe(true);

        // Stop playing
        store.setAudio(null, false);
        expect(useGameStore.getState().audio.url).toBeNull();
        expect(useGameStore.getState().audio.isPlaying).toBe(false);
    });
});
