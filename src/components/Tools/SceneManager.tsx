import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { networkManager } from '../../services/network';
import { Map, Save, Send, Trash2 } from 'lucide-react';

export const SceneManager: React.FC = () => {
    const isHost = useGameStore(s => s.isHost);
    const scenes = useGameStore(s => s.scenes);
    const activeSceneId = useGameStore(s => s.activeSceneId);
    const [newSceneName, setNewSceneName] = useState('');

    if (!isHost) return null;

    const handleSave = () => {
        if (!newSceneName.trim()) return;
        useGameStore.getState().saveScene(newSceneName.trim());
        setNewSceneName('');
        const state = useGameStore.getState();
        networkManager.sendAction('SYNC_STATE', { scenes: state.scenes });
    };

    const handleTeleport = (sceneId: string) => {
        useGameStore.getState().loadScene(sceneId);
        const state = useGameStore.getState();
        networkManager.sendAction('SYNC_STATE', {
            activeSceneId: state.activeSceneId,
            map: state.map,
            tokens: state.tokens,
            drawings: state.drawings,
            walls: state.walls
        });
    };

    const handleDelete = (sceneId: string) => {
        if (!window.confirm("Are you sure you want to delete this scene?")) return;
        const newScenes = scenes.filter(s => s.id !== sceneId);
        useGameStore.setState({ scenes: newScenes });
        networkManager.sendAction('SYNC_STATE', { scenes: newScenes });
    };

    return (
        <div className="mt-4 p-3 bg-gray-900/80 border border-purple-700/50 rounded-xl space-y-3 shadow-lg">
            <h3 className="text-xs font-bold uppercase text-purple-400 flex items-center gap-1">
                <Map size={14} /> Scene Manager
            </h3>

            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="New Scene Name..."
                    className="flex-1 px-2 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                    value={newSceneName}
                    onChange={(e) => setNewSceneName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <button
                    onClick={handleSave}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Save Current State as New Scene"
                >
                    <Save size={14} /> Save
                </button>
            </div>

            {scenes.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {scenes.map(scene => (
                        <div
                            key={scene.id}
                            className={`flex items-center justify-between p-2 rounded-lg border transition-all ${activeSceneId === scene.id ? 'bg-purple-900/40 border-purple-500/50' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                        >
                            <span className="text-xs font-medium truncate flex-1 text-gray-200" title={scene.name}>
                                {scene.name}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleTeleport(scene.id)}
                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                                    title="Teleport Players to this Scene"
                                >
                                    <Send size={12} />
                                </button>
                                <button
                                    onClick={() => handleDelete(scene.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                    title="Delete Scene"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-500 italic text-center py-2">No scenes saved.</p>
            )}
        </div>
    );
};
