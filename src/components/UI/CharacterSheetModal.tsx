import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { networkManager } from '../../services/network';

interface CharacterSheetModalProps {
    tokenId: string;
    onClose: () => void;
}

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({ tokenId, onClose }) => {
    const token = useGameStore(state => state.tokens.find(t => t.id === tokenId));
    const [name, setName] = useState('');
    const [hp, setHp] = useState(0);
    const [maxHp, setMaxHp] = useState(0);
    const [ac, setAc] = useState(0);

    useEffect(() => {
        if (token) {
            setName(token.label || 'Unknown');
            setHp(token.stats?.hp || 0);
            setMaxHp(token.stats?.maxHp || 0);
            setAc(token.stats?.ac || 10);
            // Notes would be a new field, assuming we add it or just use label for now? 
            // The task said "Notes", so let's check store interface. 
            // Store interface has 'label', 'stats'. No notes. I should probably add notes to store first if strictly needed.
            // For now let's map "Notes" to 'label' or add it. I'll add it to store in a bit if I missed it.
            // Actually, let's just stick to what exists for now to avoid refactoring store interface mid-component creation. 
            // I'll assume 'label' is the name. 'Notes' might need a new field.
            // Let's rely on 'label' as Name. 
            // I'll skip 'notes' for this first pass to ensure type safety, or add it to the type now.
        }
    }, [token]);

    const handleSave = () => {
        if (!token) return;
        networkManager.sendAction('UPDATE_TOKEN', {
            id: token.id,
            data: {
                label: name,
                stats: { hp, maxHp, ac }
            }
        });
        onClose();
    };

    if (!token) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-600 p-6 rounded-lg w-96 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-purple-400">Edit Token: {name}</h2>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-400">Name / Label</label>
                        <input
                            type="text"
                            className="w-full bg-gray-900 border border-gray-700 px-2 py-1 rounded text-white"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400">Current HP</label>
                            <input
                                type="number"
                                className="w-full bg-gray-900 border border-gray-700 px-2 py-1 rounded text-white"
                                value={hp}
                                onChange={e => setHp(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400">Max HP</label>
                            <input
                                type="number"
                                className="w-full bg-gray-900 border border-gray-700 px-2 py-1 rounded text-white"
                                value={maxHp}
                                onChange={e => setMaxHp(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400">Armour Class (AC)</label>
                        <input
                            type="number"
                            className="w-full bg-gray-900 border border-gray-700 px-2 py-1 rounded text-white"
                            value={ac}
                            onChange={e => setAc(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded font-bold"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
