import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

export const SpatialAudioEngine: React.FC = () => {
    const audioZones = useGameStore(s => s.audioZones);
    const tokens = useGameStore(s => s.tokens);
    const myId = useGameStore(s => s.myId);
    const mapScale = useGameStore(s => s.map.scale);

    // Manage active audio elements
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

    useEffect(() => {
        // Sync audio elements with state
        const currentZoneIds = audioZones.map(z => z.id);

        // Remove old zones
        Object.keys(audioRefs.current).forEach(id => {
            if (!currentZoneIds.includes(id)) {
                audioRefs.current[id].pause();
                audioRefs.current[id].src = "";
                delete audioRefs.current[id];
            }
        });

        // Add or update zones
        audioZones.forEach(zone => {
            if (!audioRefs.current[zone.id]) {
                const audio = new Audio(zone.url);
                audio.loop = zone.loop !== false;
                audio.volume = 0;
                audio.play().catch(e => console.warn("Spatial Audio Autoplay Blocked:", e));
                audioRefs.current[zone.id] = audio;
            } else if (audioRefs.current[zone.id].src !== zone.url) {
                audioRefs.current[zone.id].src = zone.url;
                audioRefs.current[zone.id].play();
            }
        });
    }, [audioZones]);

    // Volume calculation loop
    useEffect(() => {
        const interval = setInterval(() => {
            const myTokens = tokens.filter(t => t.ownerId === myId);
            if (myTokens.length === 0) return;

            audioZones.forEach(zone => {
                const audio = audioRefs.current[zone.id];
                if (!audio) return;

                // Find min distance to any of my tokens
                let minDistance = Infinity;
                myTokens.forEach(token => {
                    const dx = (token.x * mapScale + mapScale / 2) - zone.x;
                    const dy = (token.y * mapScale + mapScale / 2) - zone.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDistance) minDistance = dist;
                });

                // Calculate volume based on radius
                // Volume = baseVolume * (1 - distance/radius)
                let volume = 0;
                if (minDistance <= zone.radius) {
                    volume = zone.baseVolume * (1 - minDistance / zone.radius);
                }

                // Smoothly adjust volume
                audio.volume = Math.max(0, Math.min(1, volume));
            });
        }, 100);

        return () => clearInterval(interval);
    }, [audioZones, tokens, myId, mapScale]);

    return null; // Side-effect only component
};
