import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { networkManager } from '../../services/network';
import { Trash } from 'lucide-react';

export const TurnTracker: React.FC = () => {
    const turnOrder = useGameStore(s => s.turnOrder);
    const isHost = useGameStore(s => s.isHost);

    const handleNext = () => {
        useGameStore.getState().nextTurn();
        networkManager.sendAction('SYNC_STATE', { turnOrder: useGameStore.getState().turnOrder });
    };

    const handleClear = () => {
        useGameStore.getState().clearInitiative();
        networkManager.sendAction('SYNC_STATE', { turnOrder: [] });
    };

    const handleRemove = (id: string) => {
        useGameStore.getState().removeFromInitiative(id);
        networkManager.sendAction('SYNC_STATE', { turnOrder: useGameStore.getState().turnOrder });
    }

    if ((turnOrder || []).length === 0) return null;

    return (
        <div className="bg-gray-900/90 border border-gray-700 rounded-lg p-3 text-white w-64 shadow-2xl backdrop-blur-sm pointer-events-auto">
            <h3 className="text-sm font-bold border-b border-gray-700 pb-2 mb-2 flex justify-between items-center">
                Initiative
                <div className="flex gap-2">
                    {isHost && <button onClick={handleClear} className="text-xs text-red-400 hover:text-red-300">Clear</button>}
                    {isHost && <button onClick={handleNext} className="text-xs bg-blue-600 px-2 py-0.5 rounded hover:bg-blue-500">Next</button>}
                </div>
            </h3>

            <div className="space-y-1 max-h-64 overflow-y-auto">
                {(turnOrder || []).map((entity, index) => (
                    <div
                        key={entity.id}
                        className={`flex items-center gap-2 p-2 rounded text-sm ${index === 0 ? 'bg-blue-900/50 border border-blue-500' : 'bg-gray-800'}`}
                    >
                        <span className="font-mono text-gray-500 text-xs text-center w-4">{(index + 1)}</span>
                        <div className="w-6 h-6 rounded-full bg-indigo-500 border border-white flex-shrink-0 flex items-center justify-center font-bold text-xs">{entity.name.charAt(0).toUpperCase()}</div>
                        <span className="flex-1 truncate font-bold">{entity.name}</span>
                        <div className="text-xs font-bold text-green-400 bg-gray-900 px-1.5 py-0.5 rounded">{entity.initiative}</div>
                        {isHost && (
                            <button onClick={() => handleRemove(entity.id)} className="text-gray-500 hover:text-red-400">
                                <Trash size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
