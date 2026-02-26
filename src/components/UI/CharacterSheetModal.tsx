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
    const [conditions, setConditions] = useState<string[]>([]);

    // New Fields
    const [auras, setAuras] = useState<{ id: string, radius: number, color: string }[]>([]);
    const [lightRadius, setLightRadius] = useState<number>(0);
    const [attributes, setAttributes] = useState({
        strength: 10, dexterity: 10, constitution: 10,
        intelligence: 10, wisdom: 10, charisma: 10
    });
    const [skills, setSkills] = useState<Record<string, number>>({
        acrobatics: 0, animalHandling: 0, arcana: 0, athletics: 0,
        deception: 0, history: 0, insight: 0, intimidation: 0,
        investigation: 0, medicine: 0, nature: 0, perception: 0,
        performance: 0, persuasion: 0, religion: 0, sleightOfHand: 0,
        stealth: 0, survival: 0
    });

    const myId = useGameStore(state => state.myId);
    const username = useGameStore(state => state.username);
    const addChatMessage = useGameStore(state => state.addChatMessage);

    const standardConditions = ['Poisoned', 'Prone', 'Stunned', 'Invisible'];

    useEffect(() => {
        if (token) {
            setName(token.label || 'Unknown');
            setHp(token.stats?.hp || 0);
            setMaxHp(token.stats?.maxHp || 0);
            setAc(token.stats?.ac || 10);
            setConditions(token.conditions || []);
            setAuras(token.auras || []);
            setLightRadius(token.lightRadius || 0);

            if (token.stats?.attributes) {
                setAttributes(token.stats.attributes);
            }
            if (token.stats?.skills) {
                setSkills({ ...skills, ...token.stats.skills });
            }
        }
    }, [token]);

    const handleSave = () => {
        if (!token) return;
        networkManager.sendAction('UPDATE_TOKEN', {
            id: token.id,
            data: {
                label: name,
                stats: { hp, maxHp, ac, attributes, skills },
                conditions: conditions,
                auras: auras,
                lightRadius: lightRadius > 0 ? lightRadius : undefined
            }
        });
        onClose();
    };

    const handleRoll = (label: string, modifier: number) => {
        const rollResult = Math.floor(Math.random() * 20) + 1;
        const total = rollResult + modifier;
        const msg = {
            id: Date.now().toString(),
            senderId: myId,
            senderName: username || 'Player',
            timestamp: Date.now(),
            content: `Rolling ${label}`,
            type: 'roll' as const,
            rollData: {
                formula: `1d20 + ${modifier}`,
                result: total,
                details: `[${rollResult}] + ${modifier}`
            }
        };

        addChatMessage(msg);
        networkManager.sendAction('CHAT_MESSAGE', msg);
    };

    const calculateModifier = (score: number) => Math.floor((score - 10) / 2);

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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400">Armour Class (AC)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-900 border border-gray-700 px-2 py-1 rounded text-white"
                                value={ac}
                                onChange={e => setAc(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400">Light Radius (ft)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-900 border border-gray-700 px-2 py-1 rounded text-white"
                                value={lightRadius}
                                onChange={e => setLightRadius(Number(e.target.value))}
                                title="0 for no light source"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-2 mt-2">
                        {/* Attributes Column */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase">Attributes</h3>
                            {Object.entries(attributes).map(([attr, score]) => {
                                const mod = calculateModifier(score);
                                return (
                                    <div key={attr} className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleRoll(attr.toUpperCase(), mod)}
                                            className="bg-gray-700 hover:bg-purple-600 px-2 py-0.5 rounded textxs text-white"
                                            title={`Roll ${attr} Check`}
                                        >
                                            🎲
                                        </button>
                                        <label className="flex-1 text-[10px] uppercase text-gray-300">
                                            {attr.substring(0, 3)}
                                        </label>
                                        <input
                                            type="number"
                                            className="w-12 bg-gray-900 border border-gray-700 px-1 py-0.5 rounded text-xs text-center text-white"
                                            value={score}
                                            onChange={e => setAttributes({ ...attributes, [attr]: Number(e.target.value) })}
                                        />
                                        <span className="w-6 text-xs text-right text-gray-400">{mod >= 0 ? `+${mod}` : mod}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Skills Column - Just a few common ones for UI demo to avoid massive list */}
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase sticky top-0 bg-gray-800 py-1">Skills</h3>
                            {['acrobatics', 'athletics', 'perception', 'stealth', 'investigation'].map(skill => {
                                // For full 5e, skills map to attributes. For simplicity here, they are flat overrides or based on raw input.
                                const val = skills[skill] || 0;
                                return (
                                    <div key={skill} className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleRoll(skill.charAt(0).toUpperCase() + skill.slice(1), val)}
                                            className="bg-gray-700 hover:bg-purple-600 px-1 py-0.5 rounded text-[10px] text-white"
                                            title={`Roll ${skill} Check`}
                                        >
                                            🎲
                                        </button>
                                        <label className="flex-1 text-[10px] capitalize text-gray-300 truncate">
                                            {skill}
                                        </label>
                                        <input
                                            type="number"
                                            className="w-10 bg-gray-900 border border-gray-700 px-1 py-0.5 rounded text-[10px] text-center text-white"
                                            value={val}
                                            onChange={e => setSkills({ ...skills, [skill]: Number(e.target.value) })}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-2 mt-2">
                        <label className="block text-xs text-gray-400 mb-1">Conditions</label>
                        <div className="flex flex-wrap gap-2">
                            {standardConditions.map(cond => (
                                <label key={cond} className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded text-xs select-none cursor-pointer border border-gray-700 hover:border-gray-500">
                                    <input
                                        type="checkbox"
                                        checked={conditions.includes(cond)}
                                        onChange={(e) => {
                                            if (e.target.checked) setConditions([...conditions, cond]);
                                            else setConditions(conditions.filter(c => c !== cond));
                                        }}
                                        className="accent-purple-500"
                                    />
                                    {cond}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-2 mt-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs text-gray-400">Magic Auras</label>
                            <button
                                onClick={() => setAuras([...auras, { id: Date.now().toString(), radius: 10, color: '#00ffff' }])}
                                className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded text-white"
                            >
                                + Add Aura
                            </button>
                        </div>
                        <div className="space-y-2 max-h-24 overflow-y-auto">
                            {auras.map(aura => (
                                <div key={aura.id} className="flex items-center gap-2 bg-gray-900 p-1 rounded border border-gray-700">
                                    <input
                                        type="color"
                                        value={aura.color}
                                        onChange={e => setAuras(auras.map(a => a.id === aura.id ? { ...a, color: e.target.value } : a))}
                                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                                    />
                                    <input
                                        type="number"
                                        className="w-16 bg-gray-800 border border-gray-600 px-1 py-0.5 rounded text-xs text-white"
                                        value={aura.radius}
                                        onChange={e => setAuras(auras.map(a => a.id === aura.id ? { ...a, radius: Number(e.target.value) } : a))}
                                        placeholder="Radius ft"
                                    />
                                    <span className="text-[10px] text-gray-400 flex-1">ft radius</span>
                                    <button
                                        onClick={() => setAuras(auras.filter(a => a.id !== aura.id))}
                                        className="text-red-400 hover:text-red-300 text-xs px-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {auras.length === 0 && <div className="text-[10px] text-gray-500 italic">No active auras.</div>}
                        </div>
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
