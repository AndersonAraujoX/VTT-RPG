import React, { useEffect, useRef } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { useGameStore } from '../store/gameStore';
import type { Token } from '../store/gameStore';
import { networkManager } from '../services/network';
import { calculateVisionPolygon } from './MapBoard/utils/math';
import { useTokenRenderer, useDrawingsRenderer, useTextsRenderer, useWallsRenderer, useMapAssetsRenderer, useTriggersRenderer } from './MapBoard/hooks/usePixiRenderers';
import { useBoardInteractions } from './MapBoard/hooks/useBoardInteractions';
import { useWeatherRenderer } from './MapBoard/hooks/useWeatherRenderer';
import { useVFXRenderer } from './MapBoard/hooks/useVFXRenderer';
import { TokenContextMenu } from './MapBoard/TokenContextMenu';
import { InventoryModal } from './Modals/InventoryModal';

interface MapBoardProps {
    onEditToken?: (id: string) => void;
}

export const MapBoard: React.FC<MapBoardProps> = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const mapState = useGameStore((state) => state.map);
    const mapAssets = useGameStore((state) => state.mapAssets);
    const activeLayer = useGameStore((state) => state.activeLayer);
    const drawings = useGameStore((state) => state.drawings);
    const walls = useGameStore((state) => state.walls);
    const tokens = useGameStore((state) => state.tokens);
    const pings = useGameStore((state) => state.pings);
    const texts = useGameStore((state) => state.texts);
    const myId = useGameStore((state) => state.myId);
    const isHost = useGameStore((state) => state.isHost);
    const vfx = useGameStore((state) => state.vfx);
    const floatingTexts = useGameStore((state) => state.floatingTexts);
    const triggers = useGameStore((state) => state.triggers);

    const [contextMenu, setContextMenu] = React.useState<{ token: Token, x: number, y: number } | null>(null);
    const [inventoryToken, setInventoryToken] = React.useState<Token | null>(null);

    // Refs for managing Pixi objects
    const mapContainerRef = useRef<Container>(new Container());
    const mapAssetsContainerRef = useRef<Container>(new Container());
    const tokenContainerRef = useRef<Container>(new Container());
    const fogContainerRef = useRef<Container>(new Container());
    const lightingContainerRef = useRef<Container>(new Container());
    const wallContainerRef = useRef<Container>(new Container());
    const drawingContainerRef = useRef<Container>(new Container());
    const pingContainerRef = useRef<Container>(new Container());
    const textContainerRef = useRef<Container>(new Container());
    const weatherContainerRef = useRef<Container>(new Container());
    const vfxContainerRef = useRef<Container>(new Container());
    const triggerContainerRef = useRef<Container>(new Container());
    const overlayContainerRef = useRef<Container>(new Container());

    // Initialize Pixi
    useEffect(() => {
        if (!containerRef.current) return;
        let isMounted = true;
        const app = new Application();

        const initPixi = async () => {
            await app.init({
                resizeTo: containerRef.current!,
                backgroundColor: 0x1a1a1a,
                antialias: true
            });

            if (!isMounted) {
                app.destroy({ removeView: true });
                return;
            }

            containerRef.current!.innerHTML = '';
            containerRef.current!.appendChild(app.canvas);
            appRef.current = app;

            app.stage.addChild(mapContainerRef.current);

            mapContainerRef.current.addChild(mapAssetsContainerRef.current);
            mapContainerRef.current.addChild(wallContainerRef.current);
            mapContainerRef.current.addChild(textContainerRef.current);
            mapContainerRef.current.addChild(tokenContainerRef.current);
            mapContainerRef.current.addChild(pingContainerRef.current);
            mapContainerRef.current.addChild(overlayContainerRef.current);
            mapContainerRef.current.addChild(weatherContainerRef.current);
            mapContainerRef.current.addChild(vfxContainerRef.current);
            mapContainerRef.current.addChild(triggerContainerRef.current);
            mapContainerRef.current.addChild(fogContainerRef.current);
            mapContainerRef.current.addChild(lightingContainerRef.current);

            const { bindCanvasEvents } = useBoardInteractions({
                appRef: appRef as any,
                mapContainerRef: mapContainerRef,
                overlayContainerRef: overlayContainerRef
            });
            const cleanupCanvasEvents = bindCanvasEvents();

            return () => {
                if (cleanupCanvasEvents) cleanupCanvasEvents();
            };
        };

        let cleanup: (() => void) | undefined;
        initPixi().then((cleanupFn) => {
            if (isMounted) cleanup = cleanupFn;
            else if (cleanupFn) cleanupFn();
        });

        return () => {
            isMounted = false;
            if (cleanup) cleanup();
            if (appRef.current) {
                appRef.current.destroy({ removeView: true });
                appRef.current = null;
            }
        };
    }, []);

    // --- PixiJS Extracted Renderers ---
    useMapAssetsRenderer(mapAssets, mapAssetsContainerRef, mapState.scale, isHost, activeLayer);

    useTokenRenderer({
        tokens,
        tokenContainerRef,
        mapState,
        myId,
        isHost,
        activeLayer,
        drawings,
        triggers,
        onEditToken: (id) => {
            const token = tokens.find(t => t.id === id);
            if (token) setContextMenu({ token, x: window.innerWidth / 2, y: window.innerHeight / 2 });
        }
    });

    useVFXRenderer({ vfx, floatingTexts, vfxContainerRef });

    useWeatherRenderer({
        weather: mapState.weather,
        weatherContainerRef,
        width: appRef.current?.screen.width || 800,
        height: appRef.current?.screen.height || 600
    });

    useDrawingsRenderer(drawings, drawingContainerRef, mapState.scale);
    useTextsRenderer(
        texts as any,
        textContainerRef,
        isHost,
        (id) => {
            useGameStore.getState().removeText(id);
            networkManager.sendAction('REMOVE_TEXT', id);
        }
    );
    useWallsRenderer(walls, wallContainerRef, isHost);
    useTriggersRenderer(triggers, triggerContainerRef, isHost, (id) => {
        useGameStore.getState().removeTrigger(id);
        networkManager.sendAction('REMOVE_TRIGGER', id);
    });

    // Environment & Lighting Overlay
    useEffect(() => {
        lightingContainerRef.current.removeChildren();

        const timeVal = mapState.dayTime;
        let darkness = 0;
        if (timeVal < 6 || timeVal > 20) darkness = 0.85; // Night
        else if (timeVal >= 6 && timeVal < 10) darkness = 0.85 - ((timeVal - 6) / 4) * 0.85; // Sunrise
        else if (timeVal >= 10 && timeVal <= 18) darkness = 0; // Day
        else if (timeVal > 18 && timeVal <= 20) darkness = ((timeVal - 18) / 2) * 0.85; // Sunset

        if (darkness > 0 || mapState.dynamicLightingEnabled) {
            lightingContainerRef.current.visible = true;
            const bg = new Graphics();
            bg.rect(-10000, -10000, 20000, 20000);

            if (mapState.dynamicLightingEnabled) {
                const visibleTokens = isHost ? tokens : tokens.filter(t => t.ownerId === myId);
                const activeWalls = walls.filter(w => !w.isDoor || !w.isOpen);
                const bounds = { minX: -10000, minY: -10000, maxX: 10000, maxY: 10000 };

                visibleTokens.forEach(token => {
                    const tx = token.x * mapState.scale + mapState.scale / 2;
                    const ty = token.y * mapState.scale + mapState.scale / 2;
                    const radiusFt = (token.lightRadius && token.lightRadius > 0) ? token.lightRadius : 60;
                    const radiusPx = (radiusFt / 5) * mapState.scale;

                    const intersects = calculateVisionPolygon({ x: tx, y: ty }, radiusPx, activeWalls, bounds);
                    if (intersects.length > 0) {
                        bg.moveTo(intersects[0].x, intersects[0].y);
                        for (let i = 1; i < intersects.length; i++) bg.lineTo(intersects[i].x, intersects[i].y);
                        bg.lineTo(intersects[0].x, intersects[0].y);
                        bg.cut();
                    }
                });
            }

            const finalAlpha = Math.max(darkness, mapState.dynamicLightingEnabled ? 0.96 : 0);
            bg.fill({ color: 0x00001a, alpha: finalAlpha }); // Blue midnight tint
            lightingContainerRef.current.addChild(bg);
        } else {
            lightingContainerRef.current.visible = false;
        }
    }, [tokens, walls, mapState.dynamicLightingEnabled, mapState.dayTime, mapState.scale, isHost, myId]);

    // Fog of War (Above lighting)
    useEffect(() => {
        fogContainerRef.current.removeChildren();
        if (!mapState?.fogEnabled) {
            fogContainerRef.current.visible = false;
            return;
        }
        fogContainerRef.current.visible = true;
        const g = new Graphics();
        g.rect(-10000, -10000, 20000, 20000);
        if (Array.isArray(mapState.revealedAreas)) {
            mapState.revealedAreas.forEach(area => {
                g.circle(area.x, area.y, area.radius);
                g.cut();
            });
        }
        g.fill({ color: 0x000000, alpha: 0.98 });
        fogContainerRef.current.addChild(g);
    }, [mapState?.fogEnabled, mapState?.revealedAreas]);

    // Render Pings
    useEffect(() => {
        pingContainerRef.current.removeChildren();
        const activeTickers: ((time: any) => void)[] = [];
        pings.forEach(ping => {
            const g = new Graphics();
            g.circle(ping.x, ping.y, 10);
            g.fill({ color: ping.color, alpha: 0.8 });
            g.stroke({ width: 3, color: 0xffffff });
            const ring = new Graphics();
            ring.circle(ping.x, ping.y, mapState.scale);
            ring.stroke({ width: 2, color: ping.color, alpha: 0.5 });
            pingContainerRef.current.addChild(g);
            pingContainerRef.current.addChild(ring);
            if (appRef.current) {
                let scale = 1, alpha = 1;
                const tickerCb = (time: any) => {
                    scale += 0.05 * time.deltaTime; alpha -= 0.02 * time.deltaTime;
                    if (alpha <= 0) {
                        alpha = 0; if (appRef.current) appRef.current.ticker.remove(tickerCb);
                    } else if (!ring.destroyed) {
                        ring.scale.set(scale); ring.alpha = alpha;
                    }
                };
                appRef.current.ticker.add(tickerCb);
                activeTickers.push(tickerCb);
            }
        });
        return () => { if (appRef.current) activeTickers.forEach(cb => appRef.current!.ticker.remove(cb)); };
    }, [pings, mapState.scale]);

    return (
        <div ref={containerRef} className="w-full h-full absolute inset-0 overflow-hidden">
            {contextMenu && (
                <TokenContextMenu
                    token={contextMenu.token}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onOpenInventory={() => {
                        setInventoryToken(contextMenu.token);
                        setContextMenu(null);
                    }}
                />
            )}

            {inventoryToken && (
                <InventoryModal
                    token={inventoryToken}
                    onClose={() => setInventoryToken(null)}
                />
            )}
        </div>
    );
};
