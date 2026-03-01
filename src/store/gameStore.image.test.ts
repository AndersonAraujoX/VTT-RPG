import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('GameStore Image Handling', () => {
    beforeEach(() => {
        // Reset the store before each test
        useGameStore.setState({
            tokens: [],
            map: { url: null, scale: 50, offsetX: 0, offsetY: 0, fogEnabled: false, revealedAreas: [], dynamicLightingEnabled: false, weather: 'none' as const, dayTime: 12 },
            savedAssets: []
        });
    });

    it('should correctly set the map url when updateMap is called with a base64 string', () => {
        const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

        useGameStore.getState().updateMap({ url: testBase64 });

        const state = useGameStore.getState();
        expect(state.map.url).toBe(testBase64);
    });

    it('should retain the image string when adding a new token with an image', () => {
        const testImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...'; // Dummy string
        const token = {
            id: 'test-img-token',
            x: 5,
            y: 5,
            size: 1,
            image: testImage,
            label: 'Test Monster',
            stats: { hp: 10, maxHp: 10, ac: 10 }
        };

        useGameStore.getState().addToken(token);

        const state = useGameStore.getState();
        expect(state.tokens).toHaveLength(1);
        expect(state.tokens[0].image).toBe(testImage);
    });

    it('should add a saved asset successfully', () => {
        const asset = {
            id: 'asset-1',
            name: 'Tree',
            imageUrl: 'data:image/png;base64,tree_base64_data',
            defaultSize: 1
        };

        useGameStore.getState().addSavedAsset(asset);

        const state = useGameStore.getState();
        expect(state.savedAssets).toHaveLength(1);
        expect(state.savedAssets[0].name).toBe('Tree');
        expect(state.savedAssets[0].imageUrl).toBe(asset.imageUrl);
    });
});
