import React from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Token } from '../../store/gameStore';
import { networkManager } from '../../services/network';
import { X, Target, Package } from 'lucide-react';

interface TokenContextMenuProps {
    token: Token;
    x: number;
    y: number;
    onClose: () => void;
    onOpenInventory: () => void;
}

export const TokenContextMenu: React.FC<TokenContextMenuProps> = ({ token, x, y, onClose, onOpenInventory }) => {
    const isHost = useGameStore(s => s.isHost);
    const myId = useGameStore(s => s.myId);

    const canEdit = isHost || token.ownerId === myId;

    if (!canEdit) return null;

    const handleHpAdjustment = (amount: number) => {
        const currentHp = token.stats?.hp || 0;
        const newHp = Math.max(0, Math.min(token.stats?.maxHp || 100, currentHp + amount));

        const data = { stats: { ...token.stats!, hp: newHp } };
        useGameStore.getState().updateToken(token.id, data);
        networkManager.sendAction('UPDATE_TOKEN', { id: token.id, data });

        if (amount < 0) {
            const vfxId = Date.now().toString();
            useGameStore.getState().addFloatingText({
                id: vfxId,
                x: token.x * 50 + 25, // Assuming base scale 50, centered
                y: token.y * 50,
                text: `${amount}`,
                color: '#ff0000'
            });
        }
    };

    return (
        <div
            className="fixed z-[1000] bg-gray-900/90 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-4 w-64 text-white"
            style={{ left: x, top: y }}
        >
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <h3 className="font-bold text-sm truncate">{token.label || 'Token'}</h3>
                <button onClick={onClose} className="hover:text-red-400 transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-4">
                {/* HP Section */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        <span>Hit Points</span>
                        <span>{token.stats?.hp}/{token.stats?.maxHp}</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="bg-green-500 h-full transition-all duration-300"
                            style={{ width: `${((token.stats?.hp || 0) / (token.stats?.maxHp || 1)) * 100}%` }}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleHpAdjustment(-5)}
                            className="flex-1 py-1 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded text-xs transition-colors"
                        >
                            -5
                        </button>
                        <button
                            onClick={() => handleHpAdjustment(5)}
                            className="flex-1 py-1 bg-green-500/20 hover:bg-green-500/40 border border-green-500/50 rounded text-xs transition-colors"
                        >
                            +5
                        </button>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={onOpenInventory}
                        className="flex items-center justify-center gap-2 p-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded-lg text-xs transition-all"
                    >
                        <Package size={14} className="text-blue-400" />
                        Inventory
                    </button>
                    <button
                        className="flex items-center justify-center gap-2 p-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/50 rounded-lg text-xs transition-all opacity-50 cursor-not-allowed"
                    >
                        <Target size={14} className="text-purple-400" />
                        Target
                    </button>
                </div>

                {/* Status Icons */}
                <div className="pt-2 border-t border-white/10 flex gap-2 overflow-x-auto pb-1">
                    {['Poisoned', 'Prone', 'Stunned', 'Blinded'].map(cond => (
                        <button
                            key={cond}
                            onClick={() => {
                                const newConds = token.conditions?.includes(cond)
                                    ? token.conditions.filter(c => c !== cond)
                                    : [...(token.conditions || []), cond];
                                useGameStore.getState().updateToken(token.id, { conditions: newConds });
                                networkManager.sendAction('UPDATE_TOKEN', { id: token.id, data: { conditions: newConds } });
                            }}
                            className={`px-2 py-1 rounded-full text-[9px] font-bold border transition-all whitespace-nowrap ${token.conditions?.includes(cond)
                                ? 'bg-purple-500 border-purple-400 text-white'
                                : 'bg-gray-800 border-white/10 text-gray-500 hover:border-white/30'
                                }`}
                        >
                            {cond}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
