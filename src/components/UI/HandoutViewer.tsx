import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { networkManager } from '../../services/network';
import { X } from 'lucide-react';

export const HandoutViewer: React.FC = () => {
    const handout = useGameStore(s => s.handout);
    const isHost = useGameStore(s => s.isHost);

    if (!handout) return null;

    const handleClose = () => {
        if (isHost) {
            useGameStore.getState().setHandout(null);
            networkManager.sendAction('SYNC_STATE', { handout: null });
        } else {
            // Players can close it locally for themselves
            useGameStore.getState().setHandout(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm">
            <div className="relative max-w-full max-h-full">
                <button
                    onClick={handleClose}
                    className="absolute -top-12 right-0 bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg flex items-center gap-2"
                >
                    <X size={24} /> {isHost ? "Close for Everyone" : "Close"}
                </button>
                <img
                    src={handout}
                    alt="Handout"
                    className="max-w-full max-h-[85vh] object-contain rounded-lg border-4 border-gray-700 shadow-2xl"
                />
            </div>
        </div>
    );
};
