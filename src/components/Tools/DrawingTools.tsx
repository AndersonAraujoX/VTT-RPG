import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { networkManager } from '../../services/network';

export const DrawingTools: React.FC = () => {
    const activeTool = useGameStore(s => s.activeTool);
    const toolColor = useGameStore(s => s.toolColor);
    const toolThickness = useGameStore(s => s.toolThickness);

    return (
        <div className="mt-4 p-2 bg-gray-900 border border-gray-700 rounded-lg space-y-2">
            <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center justify-between">
                ✏️ Drawing Tools
                <button
                    onClick={() => {
                        useGameStore.getState().clearDrawings();
                        networkManager.sendAction('SYNC_STATE', { drawings: [] });
                    }}
                    className="text-[10px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded hover:bg-red-800"
                >
                    Clear All
                </button>
            </h3>

            <div className="flex gap-2 mb-2">
                <button
                    onClick={() => useGameStore.getState().setActiveTool('pan')}
                    className={`flex-1 text-xs py-1 rounded font-bold ${activeTool === 'pan' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    ✋ Pan
                </button>
                <button
                    onClick={() => useGameStore.getState().setActiveTool('draw')}
                    className={`flex-1 text-xs py-1 rounded font-bold ${activeTool === 'draw' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    ✏️ Draw
                </button>
                <button
                    onClick={() => useGameStore.getState().setActiveTool('text')}
                    className={`flex-1 text-xs py-1 rounded font-bold ${activeTool === 'text' ? 'bg-pink-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    📝 Text
                </button>
            </div>

            <h4 className="text-[10px] font-bold text-gray-400 mt-2 mb-1 uppercase">AoE Templates</h4>
            <div className="flex gap-1">
                <button
                    onClick={() => useGameStore.getState().setActiveTool('circle')}
                    className={`flex-1 text-xs py-1 rounded font-bold ${activeTool === 'circle' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    ⭕ Circle
                </button>
                <button
                    onClick={() => useGameStore.getState().setActiveTool('cone')}
                    className={`flex-1 text-xs py-1 rounded font-bold ${activeTool === 'cone' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    📐 Cone
                </button>
                <button
                    onClick={() => useGameStore.getState().setActiveTool('cube')}
                    className={`flex-1 text-xs py-1 rounded font-bold ${activeTool === 'cube' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    ⬛ Cube
                </button>
            </div>

            {activeTool !== 'pan' && (
                <div className="flex gap-2 items-center mt-2">
                    <input
                        type="color"
                        value={toolColor}
                        onChange={(e) => useGameStore.getState().setToolColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                    />
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={toolThickness}
                        onChange={(e) => useGameStore.getState().setToolThickness(parseInt(e.target.value))}
                        className="flex-1"
                    />
                </div>
            )}
            <p className="text-[10px] text-gray-500 mt-1">Hold <kbd className="bg-gray-800 px-1 rounded">Alt</kbd> and drag for Ruler.</p>
        </div>
    );
};
