import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { generateDungeon } from '../../utils/DungeonGenerator';
import { Layout, Wand2, X } from 'lucide-react';
import { networkManager } from '../../services/network';

interface DungeonGeneratorModalProps {
    onClose: () => void;
}

export const DungeonGeneratorModal: React.FC<DungeonGeneratorModalProps> = ({ onClose }) => {
    const [width, setWidth] = useState(20);
    const [height, setHeight] = useState(20);
    const [rooms, setRooms] = useState(8);
    const mapScale = useGameStore(s => s.map.scale);

    const handleGenerate = () => {
        const dungeon = generateDungeon(width, height, 4, rooms);

        // 1. Clear current walls and drawings
        useGameStore.getState().syncState({ walls: [], drawings: [] });

        // 2. Add floors as drawings
        const newDrawings = dungeon.rooms.map(r => ({
            id: Math.random().toString(36).substr(2, 9),
            type: 'rect' as const,
            x: r.x * mapScale,
            y: r.y * mapScale,
            width: r.width * mapScale,
            height: r.height * mapScale,
            color: '#2a2a2a',
            fillColor: '#1a1a1a',
            opacity: 1,
            layer: 'map' as const,
            thickness: 1,
            points: []
        }));

        const corridorDrawings = dungeon.corridors.map(c => ({
            id: Math.random().toString(36).substr(2, 9),
            type: 'rect' as const,
            x: c.x * mapScale,
            y: c.y * mapScale,
            width: c.width * mapScale,
            height: c.height * mapScale,
            color: '#2a2a2a',
            fillColor: '#1a1a1a',
            opacity: 1,
            layer: 'map' as const,
            thickness: 1,
            points: []
        }));

        // 3. Add walls
        const newWalls = dungeon.walls.map(w => ({
            id: Math.random().toString(36).substr(2, 9),
            p1: { x: w.p1.x * mapScale, y: w.p1.y * mapScale },
            p2: { x: w.p2.x * mapScale, y: w.p2.y * mapScale }
        }));

        // Apply state
        const allDrawings = [...newDrawings, ...corridorDrawings];
        useGameStore.getState().syncState({
            walls: newWalls,
            drawings: allDrawings
        });

        // Broadcast
        networkManager.sendAction('SYNC_STATE', {
            walls: newWalls,
            drawings: allDrawings
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-cyan-500/50 rounded-2xl w-80 shadow-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                        <Layout size={18} /> Dungeon Architect
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Map Dimensions (Squares)</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={width}
                                onChange={e => setWidth(parseInt(e.target.value))}
                                className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-white"
                            />
                            <span className="text-gray-600">x</span>
                            <input
                                type="number"
                                value={height}
                                onChange={e => setHeight(parseInt(e.target.value))}
                                className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Room Count</label>
                        <input
                            type="range"
                            min="2"
                            max="20"
                            value={rooms}
                            onChange={e => setRooms(parseInt(e.target.value))}
                            className="w-full accent-cyan-500"
                        />
                        <div className="text-right text-[10px] text-gray-400">{rooms} rooms</div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                        <Wand2 size={16} /> Construct Dungeon
                    </button>
                </div>
            </div>
        </div>
    );
};
