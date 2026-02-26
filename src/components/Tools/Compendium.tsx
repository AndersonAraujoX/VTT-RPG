import React, { useState } from 'react';
import { type Token } from '../../store/gameStore';
import { networkManager } from '../../services/network';
import { Search, Loader2, Download } from 'lucide-react';

export const Compendium: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ index: string, name: string, url: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

    const searchMonsters = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            // dnd5eapi search
            const res = await fetch(`https://www.dnd5eapi.co/api/monsters/?name=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data.results || []);
        } catch (e) {
            console.error("Failed to search monsters", e);
        }
        setLoading(false);
    };

    const importMonster = async (index: string) => {
        setLoadingDetail(index);
        try {
            const res = await fetch(`https://www.dnd5eapi.co/api/monsters/${index}`);
            const data = await res.json();

            // Calculate standard size based on 5e size
            let size = 1; // Medium
            if (data.size === 'Large') size = 2;
            else if (data.size === 'Huge') size = 3;
            else if (data.size === 'Gargantuan') size = 4;

            const t: Token = {
                id: Date.now().toString(),
                x: 0, // Dropped at origin, GM can drag
                y: 0,
                size: size,
                image: `https://api.dicebear.com/7.x/bottts/svg?seed=${index}`, // Placeholder image since API lacks images
                label: data.name,
                stats: {
                    hp: data.hit_points,
                    maxHp: data.hit_points,
                    ac: data.armor_class?.[0]?.value || 10,
                    attributes: {
                        strength: data.strength,
                        dexterity: data.dexterity,
                        constitution: data.constitution,
                        intelligence: data.intelligence,
                        wisdom: data.wisdom,
                        charisma: data.charisma
                    },
                    skills: data.proficiencies
                        ?.filter((p: any) => p.proficiency.index.startsWith('skill-'))
                        .reduce((acc: Record<string, number>, p: any) => {
                            const skillName = p.proficiency.index.replace('skill-', '');
                            acc[skillName] = p.value;
                            return acc;
                        }, {}) || {}
                }
            };

            networkManager.sendAction('ADD_TOKEN', t);

        } catch (e) {
            console.error("Failed to fetch monster detail", e);
        }
        setLoadingDetail(null);
    };

    return (
        <div className="bg-gray-800 p-4 border-b border-gray-700">
            <h3 className="font-bold text-gray-200 mb-2 flex items-center gap-2">
                <Search size={16} /> 5e Compendium
            </h3>

            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 text-sm text-white"
                    placeholder="Search Monsters..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchMonsters()}
                />
                <button
                    onClick={searchMonsters}
                    className="bg-purple-600 hover:bg-purple-500 rounded px-3 py-1 flex items-center justify-center"
                    disabled={loading}
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {results.map(r => (
                    <div key={r.index} className="flex items-center justify-between bg-gray-900 p-2 rounded text-sm text-gray-300 hover:bg-gray-700">
                        <span className="truncate flex-1">{r.name}</span>
                        <button
                            onClick={() => importMonster(r.index)}
                            className="text-purple-400 hover:text-purple-300 p-1"
                            title="Import to Map"
                            disabled={loadingDetail === r.index}
                        >
                            {loadingDetail === r.index ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        </button>
                    </div>
                ))}
            </div>
            {results.length === 0 && query && !loading && (
                <div className="text-xs text-gray-500 italic mt-2">No results</div>
            )}
        </div>
    );
};
