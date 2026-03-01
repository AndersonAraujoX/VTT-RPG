import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('GameStore Environment', () => {
    beforeEach(() => {
        // Reset environment state
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

    it('should update weather state', () => {
        const store = useGameStore.getState();
        expect(store.map.weather).toBe('none');

        store.setWeather('rain');
        expect(useGameStore.getState().map.weather).toBe('rain');

        store.setWeather('snow');
        expect(useGameStore.getState().map.weather).toBe('snow');
    });

    it('should update day time state', () => {
        const store = useGameStore.getState();
        expect(store.map.dayTime).toBe(12);

        store.setDayTime(20);
        expect(useGameStore.getState().map.dayTime).toBe(20);

        store.setDayTime(2);
        expect(useGameStore.getState().map.dayTime).toBe(2);
    });
});
