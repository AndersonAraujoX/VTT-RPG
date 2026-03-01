import React, { useState } from 'react';
import { useGameStore, type Token, type Item } from '../../store/gameStore';
import { Package, Trash2, Search, Plus, X } from 'lucide-react';
import { networkManager } from '../../services/network';

interface InventoryModalProps {
    token: Token;
    onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ token, onClose }) => {
    const isHost = useGameStore(s => s.isHost);
    const myId = useGameStore(s => s.myId);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const isOwner = token.ownerId === myId || isHost;
    const items = token.inventory || [];

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        try {
            // Searching Open5e for items/magic items
            const res = await fetch(`https://api.open5e.com/magicitems/?search=${searchQuery}`);
            const data = await res.json();
            setSearchResults(data.results.slice(0, 5));
        } catch (e) {
            console.error("Failed to fetch loot items:", e);
        } finally {
            setLoading(false);
        }
    };

    const addItem = (sourceItem: any) => {
        const newItem: Item = {
            id: Math.random().toString(36).substr(2, 9),
            name: sourceItem.name,
            description: sourceItem.desc,
            type: sourceItem.type,
            quantity: 1
        };
        const newInventory = [...items, newItem];
        updateInventory(newInventory);
    };

    const removeItem = (itemId: string) => {
        const newInventory = items.filter(i => i.id !== itemId);
        updateInventory(newInventory);
    };

    const updateInventory = (inventory: Item[]) => {
        useGameStore.getState().updateToken(token.id, { inventory });
        networkManager.sendAction('UPDATE_TOKEN', {
            id: token.id,
            data: { inventory }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-purple-500/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                        <Package size={18} /> {token.label || 'Token'} Inventory
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Item List */}
                    <div className="space-y-2">
                        {items.length === 0 ? (
                            <p className="text-center text-gray-500 text-xs py-4 italic">No items in inventory.</p>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 flex justify-between items-center hover:bg-gray-800 transition-colors">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-100">{item.name}</h4>
                                        <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{item.type || 'Miscellaneous'}</p>
                                    </div>
                                    {isOwner && (
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* GM Search Tools */}
                    {isHost && (
                        <div className="pt-4 border-t border-gray-800 space-y-3">
                            <h3 className="text-[10px] font-bold uppercase text-gray-500">Quick Add Item (Open5e)</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search magic items..."
                                    className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button
                                    onClick={handleSearch}
                                    className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                                >
                                    <Search size={14} />
                                </button>
                            </div>

                            {loading && <div className="text-center py-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mx-auto"></div></div>}

                            <div className="space-y-1">
                                {searchResults.map(res => (
                                    <button
                                        key={res.slug}
                                        onClick={() => addItem(res)}
                                        className="w-full text-left px-3 py-2 text-[10px] bg-gray-950/50 border border-gray-800 rounded-lg hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex justify-between items-center group"
                                    >
                                        <span className="text-gray-300 group-hover:text-purple-300">{res.name}</span>
                                        <Plus size={10} className="text-gray-500" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
