import React from 'react';
import { useGameStore } from '../../store/gameStore';

export const SaveLoadMenu: React.FC = () => {
    return (
        <div className="border-t border-gray-700 my-2 pt-2 space-y-2">
            <button
                className="w-full text-left px-3 py-2 bg-green-900/50 hover:bg-green-800 rounded text-sm transition-colors text-green-100 flex items-center gap-2"
                onClick={() => {
                    const state = useGameStore.getState();
                    const data = {
                        tokens: state.tokens,
                        map: state.map,
                        chat: state.chat,
                        turnOrder: state.turnOrder,
                        version: 1
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `vtt-save-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                }}
            >
                💾 Save Campaign
            </button>

            <label className="w-full text-left px-3 py-2 bg-blue-900/50 hover:bg-blue-800 rounded text-sm transition-colors text-blue-100 flex items-center gap-2 cursor-pointer block">
                <span>📂 Load Campaign</span>
                <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            try {
                                const data = JSON.parse(ev.target?.result as string);
                                useGameStore.getState().syncState(data);
                                alert('Campaign loaded successfully!');
                            } catch (err) {
                                alert('Failed to load campaign file.');
                            }
                        };
                        reader.readAsText(file);
                        e.target.value = '';
                    }}
                />
            </label>
        </div>
    );
};
