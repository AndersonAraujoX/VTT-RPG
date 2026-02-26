import React, { useEffect, useRef } from 'react';
import { Application, Sprite, Container, Graphics, Assets } from 'pixi.js';
import { useGameStore } from '../store/gameStore';
import { networkManager } from '../services/network';

interface MapBoardProps {
    onEditToken?: (id: string) => void;
}

export const MapBoard: React.FC<MapBoardProps> = ({ onEditToken }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const mapState = useGameStore((state) => state.map);
    const tokens = useGameStore((state) => state.tokens);
    const myId = useGameStore((state) => state.myId);
    const isHost = useGameStore((state) => state.isHost);

    // Refs for managing Pixi objects
    const mapContainerRef = useRef<Container>(new Container());
    const tokenContainerRef = useRef<Container>(new Container());
    const fogContainerRef = useRef<Container>(new Container());
    const overlayContainerRef = useRef<Container>(new Container()); // For tools like drawing reveal radius
    const backgroundSpriteRef = useRef<Sprite | null>(null);

    // Initialize Pixi
    useEffect(() => {
        if (!containerRef.current) return;

        const initPixi = async () => {
            const app = new Application();
            await app.init({
                resizeTo: containerRef.current!,
                backgroundColor: 0x1a1a1a,
                antialias: true
            });

            containerRef.current!.appendChild(app.canvas);
            appRef.current = app;

            // Setup Layers
            app.stage.addChild(mapContainerRef.current);
            mapContainerRef.current.addChild(tokenContainerRef.current);
            mapContainerRef.current.addChild(fogContainerRef.current);
            mapContainerRef.current.addChild(overlayContainerRef.current);

            // Interaction (Pan/Zoom and Tools)
            let isPanning = false;
            let isRevealing = false;
            let lastPos = { x: 0, y: 0 };
            let revealStart = { x: 0, y: 0 };

            app.canvas.addEventListener('mousedown', (e) => {
                const rect = app.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                if (e.shiftKey && useGameStore.getState().isHost) {
                    isRevealing = true;
                    // Convert screen to world coordinates using the inverse transform
                    // mapContainer.position + world * scale = screen
                    // world = (screen - position) / scale
                    const screenX = mouseX;
                    const screenY = mouseY;
                    const worldX = (screenX - mapContainerRef.current.position.x) / mapContainerRef.current.scale.x;
                    const worldY = (screenY - mapContainerRef.current.position.y) / mapContainerRef.current.scale.y;

                    revealStart = { x: worldX, y: worldY };
                } else if (e.button === 1 || (e.button === 0 && e.altKey)) {
                    isPanning = true;
                    lastPos = { x: e.clientX, y: e.clientY };
                }
            });

            window.addEventListener('mouseup', (e) => {
                isPanning = false;
                if (isRevealing) {
                    isRevealing = false;
                    overlayContainerRef.current.removeChildren();

                    const rect = app.canvas.getBoundingClientRect();
                    const screenX = e.clientX - rect.left;
                    const screenY = e.clientY - rect.top;
                    const worldX = (screenX - mapContainerRef.current.position.x) / mapContainerRef.current.scale.x;
                    const worldY = (screenY - mapContainerRef.current.position.y) / mapContainerRef.current.scale.y;

                    const dx = worldX - revealStart.x;
                    const dy = worldY - revealStart.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);

                    if (radius > 5) {
                        networkManager.sendAction('SYNC_STATE', {
                            map: {
                                ...useGameStore.getState().map,
                                revealedAreas: [...useGameStore.getState().map.revealedAreas, { x: revealStart.x, y: revealStart.y, radius }]
                            }
                        });
                        useGameStore.getState().revealArea(revealStart.x, revealStart.y, radius);
                    }
                }
            });

            window.addEventListener('mousemove', (e) => {
                if (isPanning) {
                    const dx = e.clientX - lastPos.x;
                    const dy = e.clientY - lastPos.y;
                    mapContainerRef.current.position.x += dx;
                    mapContainerRef.current.position.y += dy;
                    lastPos = { x: e.clientX, y: e.clientY };
                } else if (isRevealing) {
                    const rect = app.canvas.getBoundingClientRect();
                    const screenX = e.clientX - rect.left;
                    const screenY = e.clientY - rect.top;
                    const worldX = (screenX - mapContainerRef.current.position.x) / mapContainerRef.current.scale.x;
                    const worldY = (screenY - mapContainerRef.current.position.y) / mapContainerRef.current.scale.y;

                    const dx = worldX - revealStart.x;
                    const dy = worldY - revealStart.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);

                    overlayContainerRef.current.removeChildren();
                    const g = new Graphics();
                    g.circle(revealStart.x, revealStart.y, radius);
                    g.fill({ color: 0xffffff, alpha: 0.3 });
                    g.stroke({ width: 2, color: 0xffff00 });
                    overlayContainerRef.current.addChild(g);
                }
            });

            app.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const scaleFactor = 1.1;
                const newScale = e.deltaY < 0
                    ? mapContainerRef.current.scale.x * scaleFactor
                    : mapContainerRef.current.scale.x / scaleFactor;

                if (newScale > 0.1 && newScale < 5) {
                    mapContainerRef.current.scale.set(newScale);
                }
            });
        };

        initPixi();

        return () => {
            appRef.current?.destroy({ removeView: true });
        };
    }, []);

    // Update Map Background
    useEffect(() => {
        const updateBackground = async () => {
            if (!mapState.url || !appRef.current) return;

            try {
                const texture = await Assets.load(mapState.url);
                if (backgroundSpriteRef.current) {
                    mapContainerRef.current.removeChild(backgroundSpriteRef.current);
                }

                const sprite = new Sprite(texture);
                backgroundSpriteRef.current = sprite;
                mapContainerRef.current.addChildAt(sprite, 0); // Add to bottom
            } catch (e) {
                console.error("Failed to load map bg", e);
            }
        };
        updateBackground();
    }, [mapState.url]);

    // Sync Tokens
    useEffect(() => {
        tokenContainerRef.current.removeChildren();

        tokens.forEach(token => {
            // GM Layer Logic
            if (token.hidden && !isHost) return; // Players don't see hidden tokens

            const graphics = new Graphics();
            graphics.circle(0, 0, mapState.scale / 2 - 2);
            graphics.fill(0xff0000);
            graphics.stroke({ width: 2, color: 0xffffff });

            // Visual indication for GM that token is hidden
            if (token.hidden) {
                graphics.alpha = 0.5;
            }

            graphics.position.set(
                token.x * mapState.scale + mapState.scale / 2,
                token.y * mapState.scale + mapState.scale / 2
            );

            // --- HP Bar Rendering ---
            if (token.stats && token.stats.maxHp > 0) {
                const barWidth = mapState.scale * 0.8;
                const barHeight = 4;
                const hpPercent = Math.max(0, Math.min(1, token.stats.hp / token.stats.maxHp));

                const hpBg = new Graphics();
                hpBg.rect(-barWidth / 2, -mapState.scale / 2 - 8, barWidth, barHeight);
                hpBg.fill(0xff0000); // Red background

                const hpFg = new Graphics();
                hpFg.rect(-barWidth / 2, -mapState.scale / 2 - 8, barWidth * hpPercent, barHeight);
                hpFg.fill(0x00ff00); // Green foreground

                graphics.addChild(hpBg);
                graphics.addChild(hpFg);
            }

            // --- Status Effects Rendering ---
            if (token.conditions && token.conditions.length > 0) {
                const iconRadius = 4;
                const startAngle = -Math.PI / 4; // Top right

                // Colors for standard conditions
                const conditionColors: Record<string, number> = {
                    'poisoned': 0x00ff00, // Green
                    'prone': 0xffff00,    // Yellow
                    'stunned': 0x00ffff,  // Cyan
                    'invisible': 0xaabbcc // Light Gray
                };

                token.conditions.forEach((cond, index) => {
                    const angle = startAngle + (index * Math.PI / 4);
                    const dist = mapState.scale / 2 - 2;
                    const cx = Math.cos(angle) * dist;
                    const cy = Math.sin(angle) * dist;

                    const ind = new Graphics();
                    ind.circle(cx, cy, iconRadius);
                    ind.fill(conditionColors[cond.toLowerCase()] || 0xffffff);
                    ind.stroke({ width: 1, color: 0x000000 });
                    graphics.addChild(ind);
                });
            }

            graphics.eventMode = 'static';
            graphics.cursor = 'pointer';

            let dragData: any = null;
            let startPos = { x: 0, y: 0 };
            let lastClickTime = 0;

            // Dragging Logic
            if (isHost || token.ownerId === myId) {
                graphics.on('pointerdown', (event) => {
                    if (event.button === 0) { // Left click to drag
                        // Double Click Detection
                        const now = Date.now();
                        if (now - lastClickTime < 300 && onEditToken) {
                            onEditToken(token.id);
                            // Prevent drag start on double click if desired, but 
                            // dragging a tiny bit is fine.
                        }
                        lastClickTime = now;

                        dragData = event;
                        graphics.alpha = token.hidden ? 0.3 : 0.5;
                        startPos = { x: graphics.x, y: graphics.y };
                        event.stopPropagation();
                    }
                });

                // Context Menu (Right Click)
                graphics.on('rightclick', (event) => {
                    if (isHost) {
                        event.stopPropagation();
                        // Simple browser confirm for now, later custom UI
                        // Using a small timeout to avoid context menu event conflict
                        setTimeout(() => {
                            const action = confirm(`Manage Token?\nOK: Toggle Visibility (Current: ${token.hidden ? 'Hidden' : 'Visible'})\nCancel: Delete Token`);
                            if (action) {
                                networkManager.sendAction('UPDATE_TOKEN', {
                                    id: token.id,
                                    data: { hidden: !token.hidden }
                                });
                            } else {
                                // If they explicitly clicked cancel on a confirm it usually means "No", 
                                // but here we are hackily using it for "Delete". 
                                // Better UX: Use a real HTML overlay context menu in next step.
                                // For now let's just do visibility toggle on single click?
                                // Actually, let's just make right click = Toggle Visibility for simplicity first.
                                // Or use window.prompt? No, let's keep it simple:
                                // Right Click = Toggle Visibility.
                            }
                        }, 10);
                    }
                });

                // Better Interaction: Right click triggers visibility toggle directly for efficiency
                graphics.on('rightclick', (event) => {
                    if (isHost) {
                        event.stopPropagation();
                        event.preventDefault(); // Try to block browser menu
                        networkManager.sendAction('UPDATE_TOKEN', {
                            id: token.id,
                            data: { hidden: !token.hidden }
                        });
                    }
                });

                graphics.on('pointermove', (event) => {
                    if (dragData) {
                        // @ts-ignore
                        const newPos = event.getLocalPosition(graphics.parent);
                        graphics.position.set(newPos.x, newPos.y);
                    }
                });

                graphics.on('pointerup', () => {
                    if (dragData) {
                        dragData = null;
                        graphics.alpha = token.hidden ? 0.5 : 1;

                        const gridX = Math.floor(graphics.x / mapState.scale);
                        const gridY = Math.floor(graphics.y / mapState.scale);

                        networkManager.sendAction('UPDATE_TOKEN', {
                            id: token.id,
                            data: { x: gridX, y: gridY }
                        });
                    }
                });

                graphics.on('pointerupoutside', () => {
                    dragData = null;
                    graphics.alpha = token.hidden ? 0.5 : 1;
                    graphics.position.set(startPos.x, startPos.y);
                });
            }

            tokenContainerRef.current.addChild(graphics);
        });

    }, [tokens, mapState.scale, isHost, myId, mapState.url]);

    // Render Fog of War
    useEffect(() => {
        fogContainerRef.current.removeChildren();
        if (!mapState.fogEnabled) {
            fogContainerRef.current.visible = false;
            return;
        }

        fogContainerRef.current.visible = true;

        const g = new Graphics();

        // Draw the massive black rectangle
        g.rect(-10000, -10000, 20000, 20000);

        // Draw circles for revealed areas and explicitly cut them out
        mapState.revealedAreas.forEach(area => {
            g.circle(area.x, area.y, area.radius);
            g.cut(); // PixiJS v8 path boolean operation
        });

        g.fill({ color: 0x000000, alpha: 0.95 });

        fogContainerRef.current.addChild(g);

    }, [mapState.fogEnabled, mapState.revealedAreas]);

    return <div ref={containerRef} className="w-full h-full" />;
};
