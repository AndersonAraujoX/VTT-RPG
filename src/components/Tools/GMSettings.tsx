import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { networkManager } from '../../services/network';
import { Layout } from 'lucide-react';

interface GMSettingsProps {
    onOpenDungeonGenerator: () => void;
}

export const GMSettings: React.FC<GMSettingsProps> = ({ onOpenDungeonGenerator }) => {
    const isHost = useGameStore(s => s.isHost);
    const fogEnabled = useGameStore(s => s.map.fogEnabled);
    const dynamicLightingEnabled = useGameStore(s => s.map.dynamicLightingEnabled);
    const activeTool = useGameStore(s => s.activeTool);
    const weather = useGameStore(s => s.map.weather);
    const dayTime = useGameStore(s => s.map.dayTime);

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

            <button
                onClick={onOpenDungeonGenerator}
                className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/40 hover:to-blue-600/40 border border-cyan-500/50 rounded-xl text-xs font-black uppercase tracking-widest text-cyan-400 transition-all shadow-lg group"
            >
                <Layout size={16} className="group-hover:rotate-12 transition-transform" />
                Dungeon Architect
            </button>

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

            <div className="mt-4 p-2 bg-gray-900 border border-blue-700 rounded-lg space-y-3">
                <h3 className="text-xs font-bold uppercase text-blue-400 flex items-center gap-2">
                    🌍 Environment
                </h3>

                <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Weather</label>
                    <div className="flex gap-1">
                        {(['none', 'rain', 'snow'] as const).map(w => (
                            <button
                                key={w}
                                onClick={() => {
                                    useGameStore.getState().setWeather(w);
                                    networkManager.sendAction('SYNC_STATE', { map: useGameStore.getState().map });
                                }}
                                className={`flex-1 text-[10px] py-1 rounded capitalize font-bold border ${weather === w ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {w}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Time of Day</label>
                        <span className="text-[10px] font-mono text-blue-300">{Math.floor(dayTime)}:00h</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="23.9"
                        step="0.1"
                        value={dayTime}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            useGameStore.getState().setDayTime(val);
                            // Throttled network sync would be better, but for now direct
                            networkManager.sendAction('SYNC_STATE', { map: useGameStore.getState().map });
                        }}
                        className="w-full accent-blue-500 bg-gray-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-gray-600 font-bold px-1">
                        <span>Midnight</span>
                        <span>Noon</span>
                        <span>Midnight</span>
                    </div>
                </div>
            </div>
        </>
    );
};
