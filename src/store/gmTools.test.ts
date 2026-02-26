import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, type Wall } from './gameStore';

describe('GameStore GM Tools Features', () => {
    beforeEach(() => {
        // Reset the store state before each test
        useGameStore.setState({
            scenes: [],
            activeSceneId: 'default',
            walls: [],
            tokens: [],
            drawings: [],
            savedAssets: []
        });
    });

    it('should save and load a scene', () => {
        const store = useGameStore.getState();
        expect(store.scenes).toHaveLength(0);

        // Modify current state
        store.addWall({ id: 'w1', p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } });

        // Save scene
        useGameStore.getState().saveScene('Tavern');
        const stateAfterSave = useGameStore.getState();

        expect(stateAfterSave.scenes).toHaveLength(1);
        const sceneId = stateAfterSave.scenes[0].id;
        expect(stateAfterSave.scenes[0].name).toBe('Tavern');
        expect(stateAfterSave.scenes[0].walls).toHaveLength(1);
        expect(stateAfterSave.activeSceneId).toBe(sceneId);

        // Clear current state
        useGameStore.getState().clearWalls();
        expect(useGameStore.getState().walls).toHaveLength(0);

        // Load scene
        useGameStore.getState().loadScene(sceneId);
        expect(useGameStore.getState().activeSceneId).toBe(sceneId);
        expect(useGameStore.getState().walls).toHaveLength(1);
        expect(useGameStore.getState().walls[0].id).toBe('w1');
    });

    it('should toggle a door state', () => {
        const store = useGameStore.getState();
        const door: Wall = { id: 'door1', p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 }, isDoor: true, isOpen: false };
        store.addWall(door);

        expect(useGameStore.getState().walls[0].isOpen).toBe(false);

        // Toggle open
        useGameStore.getState().toggleWallDoor('door1');
        expect(useGameStore.getState().walls[0].isOpen).toBe(true);

        // Toggle closed
        useGameStore.getState().toggleWallDoor('door1');
        expect(useGameStore.getState().walls[0].isOpen).toBe(false);
    });

    it('should manage saved assets', () => {
        const store = useGameStore.getState();
        expect(store.savedAssets).toHaveLength(0);

        store.addSavedAsset({
            id: 'goblin1',
            name: 'Goblin',
            imageUrl: 'http://example.com/goblin.png',
            defaultSize: 1
        });

        expect(useGameStore.getState().savedAssets).toHaveLength(1);
        expect(useGameStore.getState().savedAssets[0].name).toBe('Goblin');

        useGameStore.getState().removeSavedAsset('goblin1');
        expect(useGameStore.getState().savedAssets).toHaveLength(0);
    });
});
