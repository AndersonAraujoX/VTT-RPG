import React from 'react';
import { useGameStore, type SavedAsset } from '../../store/gameStore';
import { networkManager } from '../../services/network';

export const AssetLibrary: React.FC = () => {
    const isHost = useGameStore(s => s.isHost);
    const savedAssets = useGameStore(s => s.savedAssets);

    if (!isHost) return null;

    return (
        <div className="mt-4 p-2 bg-gray-900 border border-emerald-700 rounded-lg space-y-2">
            <h3 className="text-xs font-bold uppercase text-emerald-400 flex justify-between items-center">
                📚 Asset Library
                <label className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded hover:bg-emerald-600 cursor-pointer">
                    + Upload
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                    const imgUrl = ev.target?.result as string;
                                    const asset: SavedAsset = {
                                        id: Date.now().toString(),
                                        name: file.name.split('.')[0],
                                        imageUrl: imgUrl,
                                        defaultSize: 1
                                    };
                                    useGameStore.getState().addSavedAsset(asset);
                                    networkManager.sendAction('SYNC_STATE', { savedAssets: useGameStore.getState().savedAssets });
                                };
                                reader.readAsDataURL(file);
                            }
                            e.target.value = '';
                        }}
                    />
                </label>
            </h3>
            {savedAssets.length === 0 ? (
                <p className="text-[10px] text-gray-500 italic">No saved assets. Upload images to create a quick-drop library.</p>
            ) : (
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                    {savedAssets.map(asset => (
                        <div
                            key={asset.id}
                            className="relative group cursor-pointer"
                        >
                            <img
                                src={asset.imageUrl}
                                alt={asset.name}
                                className="w-full aspect-square object-cover rounded hover:ring-2 ring-emerald-500 transition-all"
                                title={`Click to drop ${asset.name}`}
                                onClick={() => {
                                    const t = {
                                        id: Date.now().toString(),
                                        x: Math.floor(useGameStore.getState().map.offsetX / -50) + 3, // drop near view center roughly
                                        y: Math.floor(useGameStore.getState().map.offsetY / -50) + 3,
                                        size: asset.defaultSize,
                                        image: asset.imageUrl,
                                        label: asset.name,
                                        stats: { hp: 10, maxHp: 10, ac: 10 }
                                    };
                                    networkManager.sendAction('ADD_TOKEN', t);
                                }}
                            />
                            <button
                                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[10px] items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    useGameStore.getState().removeSavedAsset(asset.id);
                                    networkManager.sendAction('SYNC_STATE', { savedAssets: useGameStore.getState().savedAssets });
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
