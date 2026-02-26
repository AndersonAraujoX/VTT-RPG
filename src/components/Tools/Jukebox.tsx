import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { networkManager } from '../../services/network';

export const Jukebox: React.FC = () => {
    const audioState = useGameStore(s => s.audio);
    const isHost = useGameStore(s => s.isHost);
    const [inputUrl, setInputUrl] = useState('');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sync HTML5 Audio element with store state
    useEffect(() => {
        if (!audioRef.current) return;

        const el = audioRef.current;

        if (audioState.url && audioState.isPlaying) {
            if (el.src !== audioState.url) {
                el.src = audioState.url;
            }
            el.play().catch(e => console.error("Auto-play prevented", e));
        } else {
            el.pause();
            if (!audioState.url) {
                el.src = '';
            }
        }
    }, [audioState]);

    const handlePlayUrl = () => {
        if (!inputUrl) return;
        networkManager.sendAction('PLAY_AUDIO', { url: inputUrl, isPlaying: true });
        useGameStore.getState().setAudio(inputUrl, true);
        setInputUrl('');
    };

    const handleStop = () => {
        networkManager.sendAction('PLAY_AUDIO', { url: null, isPlaying: false });
        useGameStore.getState().setAudio(null, false);
    };

    // Only Host controls the Jukebox for now to avoid chaos
    if (!isHost) {
        return (
            <div className="mt-4 p-3 bg-gray-900 border border-gray-700 rounded-lg">
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-2">
                    🎵 Jukebox
                </h3>
                <div className="text-xs text-gray-400">
                    {audioState.isPlaying ? 'Playing track...' : 'Stopped'}
                </div>
                <audio ref={audioRef} loop hidden />
            </div>
        );
    }

    return (
        <div className="mt-4 p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-2">
                🎵 Jukebox (Host Controls)
            </h3>

            <div className="flex flex-col gap-2">
                <input
                    type="text"
                    placeholder="Audio URL (mp3/wav)"
                    className="w-full bg-gray-800 border border-gray-600 px-2 py-1 rounded text-xs text-white"
                    value={inputUrl}
                    onChange={e => setInputUrl(e.target.value)}
                />

                <div className="flex gap-2">
                    <button
                        onClick={handlePlayUrl}
                        disabled={!inputUrl}
                        className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs py-1 rounded font-bold"
                    >
                        Play
                    </button>
                    <button
                        onClick={handleStop}
                        disabled={!audioState.isPlaying}
                        className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs py-1 rounded font-bold"
                    >
                        Stop
                    </button>
                </div>

                <div className="text-[10px] text-gray-500 mt-1 truncate">
                    Now playing: {audioState.isPlaying && audioState.url ? audioState.url.split('/').pop() : 'None'}
                </div>
            </div>

            {/* Hidden audio element actually playing the sound */}
            <audio ref={audioRef} loop hidden />
        </div>
    );
};
