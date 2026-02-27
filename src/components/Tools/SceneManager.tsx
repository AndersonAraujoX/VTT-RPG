import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { networkManager } from '../../services/network';

export const SceneManager: React.FC = () => {
    const isHost = useGameStore(s => s.isHost);
    const scenes = useGameStore(s => s.scenes);
    const activeSceneId = useGameStore(s => s.activeSceneId);
    const [newSceneName, setNewSceneName] = useState('');

    if (!isHost) return null;

    return (
        <div className="mt-4 p-2 bg-gray-900 border border-purple-700 rounded-lg space-y-2">
            <h3 className="text-xs font-bold uppercase text-purple-400">🗺️ Scene Manager</h3>
            <div className="flex gap-1">
                <input
                    type="text"
                    placeholder="New Scene Name..."
                    className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white"
                    value={newSceneName}
                    onChange={(e) => setNewSceneName(e.target.value)}
                />
                <button
                    onClick={() => {
                        if (!newSceneName.trim()) return;
                        useGameStore.getState().saveScene(newSceneName.trim());
                        setNewSceneName('');
                        // The new scene list syncs automatically if we send state
                        const state = useGameStore.getState();
                        networkManager.sendAction('SYNC_STATE', { scenes: state.scenes, activeSceneId: state.activeSceneId });
                    }}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs font-bold"
                >
                    Save
                </button>
            </div>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                {scenes.map(scene => (
                    <button
                        key={scene.id}
                        onClick={() => {
                            useGameStore.getState().loadScene(scene.id);
                            const state = useGameStore.getState();
                            networkManager.sendAction('SYNC_STATE', {
                                activeSceneId: state.activeSceneId,
                                map: state.map,
                                tokens: state.tokens,
                                drawings: state.drawings,
                                walls: state.walls
                            });
                        }}
                        className={`text-left px-2 py-1 text-xs rounded transition-colors truncate ${activeSceneId === scene.id ? 'bg-purple-800 font-bold' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        {scene.name}
                    </button>
                ))}
            </div>
        </div>
    );
};
