import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export const TurnTracker: React.FC = () => {
    const tokens = useGameStore(s => s.tokens);
    const turnOrder = useGameStore(s => s.turnOrder);
    const isHost = useGameStore(s => s.isHost);

    // In a real app we'd dispatch actions to reorder 'turnOrder' in the store
    // This state is just for local visual highlight in this simplified version
    const [activeTurn, setActiveTurn] = useState(0);

    const sortedTokens = turnOrder.map(id => tokens.find(t => t.id === id)).filter(Boolean);

    const nextTurn = () => {
        setActiveTurn((prev) => (prev + 1) % sortedTokens.length);
    };

    if (sortedTokens.length === 0) return null;

    return (
        <div className="absolute top-4 left-4 bg-gray-900/90 border border-gray-700 rounded-lg p-3 text-white w-64 shadow-2xl backdrop-blur-sm z-50">
            <h3 className="text-sm font-bold border-b border-gray-700 pb-2 mb-2 flex justify-between">
                Initiative
                {isHost && (
                    <button onClick={nextTurn} className="text-xs bg-blue-600 px-2 rounded hover:bg-blue-500">Next</button>
                )}
            </h3>

            <div className="space-y-1 max-h-64 overflow-y-auto">
                {sortedTokens.map((token, index) => (
                    <div
                        key={token?.id}
                        className={`flex items-center gap-2 p-2 rounded text-sm ${index === activeTurn ? 'bg-blue-900/50 border border-blue-500' : 'bg-gray-800'}`}
                    >
                        <span className="font-mono text-gray-500 text-xs">{(index + 1) + '.'}</span>
                        <div className="w-6 h-6 rounded-full bg-red-500 border border-white flex-shrink-0" />
                        <span className="flex-1 truncate">{token?.label || 'Unknown'}</span>
                        <div className="text-xs font-bold text-yellow-500">HP: {token?.stats?.hp}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
