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

            // Interaction (Pan/Zoom)
            let isDragging = false;
            let lastPos = { x: 0, y: 0 };

            app.canvas.addEventListener('mousedown', (e) => {
                if (e.button === 1 || (e.button === 0 && e.altKey)) {
                    isDragging = true;
                    lastPos = { x: e.clientX, y: e.clientY };
                }
            });

            window.addEventListener('mouseup', () => isDragging = false);
            window.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const dx = e.clientX - lastPos.x;
                    const dy = e.clientY - lastPos.y;
                    mapContainerRef.current.position.x += dx;
                    mapContainerRef.current.position.y += dy;
                    lastPos = { x: e.clientX, y: e.clientY };
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

    return <div ref={containerRef} className="w-full h-full" />;
};
