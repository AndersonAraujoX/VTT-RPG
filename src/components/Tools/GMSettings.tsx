import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { networkManager } from '../../services/network';

export const GMSettings: React.FC = () => {
    const isHost = useGameStore(s => s.isHost);
    const fogEnabled = useGameStore(s => s.map.fogEnabled);
    const dynamicLightingEnabled = useGameStore(s => s.map.dynamicLightingEnabled);
    const activeTool = useGameStore(s => s.activeTool);

    if (!isHost) return null;

    return (
        <>
            <label className="text-left px-3 py-2 bg-indigo-900/50 hover:bg-indigo-800 rounded text-sm transition-colors cursor-pointer block border border-indigo-700 font-bold mt-4">
                <span>📜 Share Handout</span>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                                const url = ev.target?.result as string;
                                useGameStore.getState().setHandout(url);
                                networkManager.sendAction('SYNC_STATE', { handout: url });
                            };
                            reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                    }}
                />
            </label>

            <div className="mt-4 p-2 bg-gray-900 border border-gray-700 rounded-lg space-y-2">
                <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                    🌫️ Fog of War
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const newState = !useGameStore.getState().map.fogEnabled;
                            useGameStore.getState().toggleFog(newState);
                            networkManager.sendAction('SYNC_STATE', { map: useGameStore.getState().map });
                        }}
                        className={`flex-1 text-xs py-1 rounded font-bold ${fogEnabled ? 'bg-red-700 hover:bg-red-600' : 'bg-green-700 hover:bg-green-600'
                            }`}
                    >
                        {fogEnabled ? 'Disable Fog' : 'Enable Fog'}
                    </button>
                    <button
                        onClick={() => {
                            useGameStore.getState().resetFog();
                            networkManager.sendAction('SYNC_STATE', { map: useGameStore.getState().map });
                        }}
                        className="flex-1 text-xs py-1 rounded font-bold bg-gray-700 hover:bg-gray-600 text-white"
                    >
                        Reset Vision
                    </button>
                </div>
                <p className="text-[10px] text-gray-500">Hold <kbd className="bg-gray-800 px-1 rounded">Shift</kbd> and drag on map to reveal areas.</p>
            </div>

            <div className="mt-4 p-2 bg-gray-900 border border-yellow-700 rounded-lg space-y-2 flex flex-col">
                <h3 className="text-xs font-bold uppercase text-yellow-500 flex items-center justify-between">
                    💡 Dynamic Lighting
                    <button
                        onClick={() => {
                            useGameStore.getState().clearWalls();
                            networkManager.sendAction('SYNC_STATE', { walls: [] });
                        }}
                        className="text-[10px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded hover:bg-red-800"
                    >
                        Clear Walls
                    </button>
                </h3>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const newState = !useGameStore.getState().map.dynamicLightingEnabled;
                            useGameStore.getState().toggleDynamicLighting(newState);
                            networkManager.sendAction('SYNC_STATE', { map: useGameStore.getState().map });
                        }}
                        className={`flex-1 text-xs py-1 rounded font-bold ${dynamicLightingEnabled ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-green-700 hover:bg-green-600 text-white'
                            }`}
                    >
                        {dynamicLightingEnabled ? 'Disable Lighting' : 'Enable Lighting'}
                    </button>
                </div>

                <div className="flex gap-2 mt-1">
                    <button
                        onClick={() => useGameStore.getState().setActiveTool('wall')}
                        className={`flex-1 text-xs py-1 rounded font-bold ${activeTool === 'wall' ? 'bg-yellow-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        🧱 Draw Walls
                    </button>
                    <button
                        onClick={() => useGameStore.getState().setActiveTool('door')}
                        className={`flex-1 text-xs py-1 rounded font-bold ${activeTool === 'door' ? 'bg-amber-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        🚪 Draw Door
                    </button>
                </div>
                <p className="text-[10px] text-gray-400">Lines drawn will block vision for all tokens.</p>
            </div>
        </>
    );
};
