import React, { useEffect, useRef } from 'react';
import { Application, Sprite, Container, Graphics, Text, TextStyle, Assets } from 'pixi.js';
import { useGameStore } from '../store/gameStore';
import { networkManager } from '../services/network';

// --- Raycasting Math Helper ---
function getIntersection(ray1: { x: number, y: number }, ray2: { x: number, y: number }, seg1: { x: number, y: number }, seg2: { x: number, y: number }) {
    const r_px = ray1.x;
    const r_py = ray1.y;
    const r_dx = ray2.x - ray1.x;
    const r_dy = ray2.y - ray1.y;

    const s_px = seg1.x;
    const s_py = seg1.y;
    const s_dx = seg2.x - seg1.x;
    const s_dy = seg2.y - seg1.y;

    const denominator = r_dx * s_dy - r_dy * s_dx;
    if (denominator === 0) return null; // Parallel

    const T1 = (s_px - r_px) * s_dy - (s_py - r_py) * s_dx;
    const t = T1 / denominator;

    const U1 = (s_px - r_px) * r_dy - (s_py - r_py) * r_dx;
    const u = U1 / denominator;

    if (t > 0 && u >= 0 && u <= 1) {
        return {
            x: r_px + r_dx * t,
            y: r_py + r_dy * t,
            param: t
        };
    }
    return null;
}


interface MapBoardProps {
    onEditToken?: (id: string) => void;
}

export const MapBoard: React.FC<MapBoardProps> = ({ onEditToken }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const mapState = useGameStore((state) => state.map);
    const drawings = useGameStore((state) => state.drawings);
    const walls = useGameStore((state) => state.walls);
    const tokens = useGameStore((state) => state.tokens);
    const pings = useGameStore((state) => state.pings);
    const texts = useGameStore((state) => state.texts);
    const myId = useGameStore((state) => state.myId);
    const isHost = useGameStore((state) => state.isHost);

    // Refs for managing Pixi objects
    const mapContainerRef = useRef<Container>(new Container());
    const tokenContainerRef = useRef<Container>(new Container());
    const fogContainerRef = useRef<Container>(new Container());
    const lightingContainerRef = useRef<Container>(new Container());
    const wallContainerRef = useRef<Container>(new Container());
    const drawingContainerRef = useRef<Container>(new Container());
    const pingContainerRef = useRef<Container>(new Container());
    const textContainerRef = useRef<Container>(new Container());
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
            app.stage.addChild(wallContainerRef.current);
            app.stage.addChild(fogContainerRef.current);
            app.stage.addChild(textContainerRef.current);
            app.stage.addChild(tokenContainerRef.current);
            app.stage.addChild(lightingContainerRef.current);
            mapContainerRef.current.addChild(fogContainerRef.current);
            mapContainerRef.current.addChild(wallContainerRef.current);
            mapContainerRef.current.addChild(pingContainerRef.current);
            mapContainerRef.current.addChild(overlayContainerRef.current);

            // Interaction (Pan/Zoom and Tools)
            let isPanning = false;
            let isRevealing = false;
            let isDrawing = false;
            let lastPos = { x: 0, y: 0 };
            let toolStart = { x: 0, y: 0 };
            let currentDrawingPoints: { x: number, y: number }[] = [];
            let measuringPoints: { x: number, y: number }[] = []; // Waypoint Ruler

            app.canvas.addEventListener('mousedown', (e) => {
                const rect = app.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const worldX = (mouseX - mapContainerRef.current.position.x) / mapContainerRef.current.scale.x;
                const worldY = (mouseY - mapContainerRef.current.position.y) / mapContainerRef.current.scale.y;

                if (e.shiftKey && useGameStore.getState().isHost) {
                    isRevealing = true;
                    toolStart = { x: worldX, y: worldY };
                } else if (e.altKey) {
                    if (e.button === 0) { // Left-click start
                        measuringPoints = [{ x: worldX, y: worldY }, { x: worldX, y: worldY }];
                    } else if (e.button === 2 && measuringPoints.length > 0) { // Right-click waypoint
                        measuringPoints[measuringPoints.length - 1] = { x: worldX, y: worldY };
                        measuringPoints.push({ x: worldX, y: worldY });
                    }
                } else if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
                    // Ping System: Ctrl + Click or Middle Click (if not dragging)
                    const pingId = Date.now().toString();
                    const newPing = { id: pingId, x: worldX, y: worldY, color: useGameStore.getState().toolColor || '#ffff00' };
                    useGameStore.getState().addPing(newPing);
                    networkManager.sendAction('SYNC_STATE', { pings: useGameStore.getState().pings });

                    // Auto-remove ping after 3 seconds
                    setTimeout(() => {
                        useGameStore.getState().removePing(pingId);
                        networkManager.sendAction('SYNC_STATE', { pings: useGameStore.getState().pings });
                    }, 3000);

                    // We still allow panning if they drag:
                    isPanning = true;
                    lastPos = { x: e.clientX, y: e.clientY };
                } else if (e.button === 0 && useGameStore.getState().activeTool === 'draw') {
                    isDrawing = true;
                    currentDrawingPoints = [{ x: worldX, y: worldY }];
                } else if (e.button === 0 && ['circle', 'cone', 'cube'].includes(useGameStore.getState().activeTool)) {
                    isDrawing = true;
                    // Snap AoE origin to grid intersection
                    const snapX = Math.round(worldX / useGameStore.getState().map.scale) * useGameStore.getState().map.scale;
                    const snapY = Math.round(worldY / useGameStore.getState().map.scale) * useGameStore.getState().map.scale;
                    currentDrawingPoints = [{ x: snapX, y: snapY }, { x: worldX, y: worldY }]; // [snapOrigin, current]
                } else if (e.button === 0 && (useGameStore.getState().activeTool === 'wall' || useGameStore.getState().activeTool === 'door')) {
                    isDrawing = true;
                    currentDrawingPoints = [{ x: worldX, y: worldY }, { x: worldX, y: worldY }];
                } else if (e.button === 0 && useGameStore.getState().activeTool === 'text') {
                    const content = window.prompt("Enter text for map:");
                    if (content?.trim()) {
                        const newText = {
                            id: Date.now().toString(),
                            x: worldX,
                            y: worldY,
                            text: content.trim(),
                            color: useGameStore.getState().toolColor || '#ffffff',
                            fontSize: 32 / mapContainerRef.current.scale.x // scale up slightly so it's readable
                        };
                        useGameStore.getState().addText(newText);
                        networkManager.sendAction('ADD_TEXT', newText);
                    }
                } else if (e.button === 0 && useGameStore.getState().activeTool === 'pan' && useGameStore.getState().isHost) {
                    // Check if GM clicked on a door to toggle it
                    let toggled = false;
                    const walls = useGameStore.getState().walls;
                    for (const w of walls) {
                        if (w.isDoor) {
                            // Distance from click point to line segment
                            const l2 = Math.pow(w.p1.x - w.p2.x, 2) + Math.pow(w.p1.y - w.p2.y, 2);
                            if (l2 === 0) continue;
                            const t = Math.max(0, Math.min(1, ((worldX - w.p1.x) * (w.p2.x - w.p1.x) + (worldY - w.p1.y) * (w.p2.y - w.p1.y)) / l2));
                            const proj = { x: w.p1.x + t * (w.p2.x - w.p1.x), y: w.p1.y + t * (w.p2.y - w.p1.y) };
                            const dist = Math.sqrt(Math.pow(worldX - proj.x, 2) + Math.pow(worldY - proj.y, 2));

                            // 10 pixels roughly 
                            if (dist < (15 / useGameStore.getState().map.scale)) {
                                useGameStore.getState().toggleWallDoor(w.id);
                                networkManager.sendAction('SYNC_STATE', { walls: useGameStore.getState().walls });
                                toggled = true;
                                break;
                            }
                        }
                    }
                    if (!toggled) {
                        isPanning = true;
                        lastPos = { x: e.clientX, y: e.clientY };
                    }
                } else if (e.button === 0 && useGameStore.getState().activeTool === 'pan') {
                    isPanning = true;
                    lastPos = { x: e.clientX, y: e.clientY };
                }
            });

            window.addEventListener('mouseup', (e) => {
                isPanning = false;

                const rect = app.canvas.getBoundingClientRect();
                const worldX = (e.clientX - rect.left - mapContainerRef.current.position.x) / mapContainerRef.current.scale.x;
                const worldY = (e.clientY - rect.top - mapContainerRef.current.position.y) / mapContainerRef.current.scale.y;

                if (isRevealing) {
                    isRevealing = false;
                    overlayContainerRef.current.removeChildren();

                    const dx = worldX - toolStart.x;
                    const dy = worldY - toolStart.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);

                    if (radius > 5) {
                        networkManager.sendAction('SYNC_STATE', {
                            map: {
                                ...useGameStore.getState().map,
                                revealedAreas: [...useGameStore.getState().map.revealedAreas, { x: toolStart.x, y: toolStart.y, radius }]
                            }
                        });
                        useGameStore.getState().revealArea(toolStart.x, toolStart.y, radius);
                    }
                } else if (measuringPoints.length > 0 && !e.altKey) {
                    // Only clear the ruler if Alt is released during mouse up
                    measuringPoints = [];
                    overlayContainerRef.current.removeChildren();
                } else if (isDrawing) {
                    isDrawing = false;
                    const activeTool = useGameStore.getState().activeTool;
                    if ((activeTool === 'wall' || activeTool === 'door') && currentDrawingPoints.length > 1) {
                        const p0 = currentDrawingPoints[0];
                        const p1 = currentDrawingPoints[1];
                        // Minimum distance check to avoid 0-length walls
                        const dist = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
                        if (dist > 5) {
                            const newWall = {
                                id: Date.now().toString(),
                                p1: p0,
                                p2: p1,
                                isDoor: activeTool === 'door',
                                isOpen: false
                            };
                            useGameStore.getState().addWall(newWall);
                            networkManager.sendAction('SYNC_STATE', { walls: useGameStore.getState().walls });
                        }
                    } else if (currentDrawingPoints.length > 1) {
                        const newDrawing = {
                            id: Date.now().toString(),
                            type: activeTool === 'draw' ? 'freehand' : activeTool,
                            color: useGameStore.getState().toolColor || '#ffffff',
                            thickness: useGameStore.getState().toolThickness || 3,
                            points: currentDrawingPoints
                        };
                        useGameStore.getState().addDrawing(newDrawing as any);
                        networkManager.sendAction('SYNC_STATE', { drawings: useGameStore.getState().drawings });
                    }
                    currentDrawingPoints = [];
                }
            });

            window.addEventListener('mousemove', (e) => {
                const rect = app.canvas.getBoundingClientRect();
                const worldX = (e.clientX - rect.left - mapContainerRef.current.position.x) / mapContainerRef.current.scale.x;
                const worldY = (e.clientY - rect.top - mapContainerRef.current.position.y) / mapContainerRef.current.scale.y;

                if (isPanning) {
                    const dx = e.clientX - lastPos.x;
                    const dy = e.clientY - lastPos.y;
                    mapContainerRef.current.position.x += dx;
                    mapContainerRef.current.position.y += dy;
                    lastPos = { x: e.clientX, y: e.clientY };
                } else if (isRevealing) {
                    const dx = worldX - toolStart.x;
                    const dy = worldY - toolStart.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);

                    overlayContainerRef.current.removeChildren();
                    const g = new Graphics();
                    g.circle(toolStart.x, toolStart.y, radius);
                    g.fill({ color: 0xffffff, alpha: 0.3 });
                    g.stroke({ width: 2, color: 0xffff00 });
                    overlayContainerRef.current.addChild(g);
                } else if (measuringPoints.length > 0) {
                    measuringPoints[measuringPoints.length - 1] = { x: worldX, y: worldY };

                    overlayContainerRef.current.removeChildren();
                    const g = new Graphics();
                    g.stroke({ width: 4, color: 0xffaa00, alpha: 0.8 });

                    let totalDistance = 0;

                    g.moveTo(measuringPoints[0].x, measuringPoints[0].y);

                    for (let i = 1; i < measuringPoints.length; i++) {
                        const p0 = measuringPoints[i - 1];
                        const p1 = measuringPoints[i];

                        g.lineTo(p1.x, p1.y);

                        const dx = p1.x - p0.x;
                        const dy = p1.y - p0.y;
                        const segmentDistPixels = Math.sqrt(dx * dx + dy * dy);
                        // Multiply by 5 for 5ft grid, assuming 1 unit of scale = 5ft block
                        const segmentDistUnits = Math.round((segmentDistPixels / useGameStore.getState().map.scale) * 5);
                        totalDistance += segmentDistUnits;

                        // Only draw text at the final active point to avoid clutter, unless we want all segments.
                        // For a clean look, total distance at the mouse:
                        if (i === measuringPoints.length - 1) {
                            const text = new Text({
                                text: `${totalDistance} ft`,
                                style: new TextStyle({ fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, stroke: { color: 0x000000, width: 4 } })
                            });
                            text.anchor.set(0.5);
                            text.x = p1.x + 20;
                            text.y = p1.y - 20;
                            overlayContainerRef.current.addChild(text);
                        } else {
                            // Draw a small dot at waypoints
                            g.circle(p1.x, p1.y, 4).fill(0xffffff);
                        }
                    }

                    overlayContainerRef.current.addChild(g);
                } else if (isDrawing && currentDrawingPoints.length > 0) {
                    const activeTool = useGameStore.getState().activeTool;

                    if (activeTool === 'draw') {
                        currentDrawingPoints.push({ x: worldX, y: worldY });

                        const g = new Graphics();
                        g.moveTo(currentDrawingPoints[0].x, currentDrawingPoints[0].y);
                        for (let i = 1; i < currentDrawingPoints.length; i++) {
                            g.lineTo(currentDrawingPoints[i].x, currentDrawingPoints[i].y);
                        }
                        g.stroke({ width: useGameStore.getState().toolThickness || 3, color: useGameStore.getState().toolColor || '#ffffff' });

                        overlayContainerRef.current.removeChildren();
                        overlayContainerRef.current.addChild(g);
                    } else if (['circle', 'cone', 'cube'].includes(activeTool)) {
                        currentDrawingPoints[1] = { x: worldX, y: worldY }; // Update end point

                        const p0 = currentDrawingPoints[0];
                        const dx = worldX - p0.x;
                        const dy = worldY - p0.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        const g = new Graphics();
                        g.fill({ color: useGameStore.getState().toolColor, alpha: 0.3 });
                        g.stroke({ width: useGameStore.getState().toolThickness, color: useGameStore.getState().toolColor });

                        if (activeTool === 'circle') {
                            g.circle(p0.x, p0.y, dist);
                        } else if (activeTool === 'cube') {
                            g.rect(p0.x - dist, p0.y - dist, dist * 2, dist * 2);
                        } else if (activeTool === 'cone') {
                            const angle = Math.atan2(dy, dx);
                            const halfAngle = (53.1 / 2) * (Math.PI / 180); // 53.1 degrees total for 5e cone
                            const p1 = { x: p0.x + Math.cos(angle - halfAngle) * dist, y: p0.y + Math.sin(angle - halfAngle) * dist };
                            const p2 = { x: p0.x + Math.cos(angle + halfAngle) * dist, y: p0.y + Math.sin(angle + halfAngle) * dist };

                            g.moveTo(p0.x, p0.y);
                            g.lineTo(p1.x, p1.y);
                            g.lineTo(p2.x, p2.y);
                            g.lineTo(p0.x, p0.y);
                        }

                        overlayContainerRef.current.removeChildren();
                        overlayContainerRef.current.addChild(g);
                    } else if (activeTool === 'wall' || activeTool === 'door') {
                        currentDrawingPoints[1] = { x: worldX, y: worldY };
                        const g = new Graphics();
                        g.moveTo(currentDrawingPoints[0].x, currentDrawingPoints[0].y);
                        g.lineTo(currentDrawingPoints[1].x, currentDrawingPoints[1].y);
                        g.stroke({ width: 5, color: activeTool === 'door' ? 0xffaa00 : 0x00ffff, alpha: 0.8 }); // cyan wall, orange door preview

                        overlayContainerRef.current.removeChildren();
                        overlayContainerRef.current.addChild(g);
                    }
                }
            });

            // Prevent default context menu on canvas
            app.canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });

            // Keyup listener to cancel measurement if Alt is released
            window.addEventListener('keyup', (e) => {
                if (e.key === 'Alt' && measuringPoints.length > 0) {
                    measuringPoints = [];
                    overlayContainerRef.current.removeChildren();
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
            const graphics = new Container();
            const baseShape = new Graphics();

            // --- Auras Rendering ---
            if (token.auras && token.auras.length > 0) {
                token.auras.forEach(aura => {
                    const auraRadiusPx = (aura.radius / 5) * mapState.scale;
                    const auraG = new Graphics();
                    auraG.circle(0, 0, auraRadiusPx);
                    // Convert hex string "#RRGGBB" to number. Assume basic validation.
                    const colorNum = parseInt((aura.color || '#ffffff').replace('#', ''), 16);
                    auraG.fill({ color: colorNum, alpha: 0.2 });
                    auraG.stroke({ color: colorNum, width: 2, alpha: 0.5 });
                    graphics.addChild(auraG);
                });
            }

            // Base Token Shape
            baseShape.circle(0, 0, mapState.scale / 2 - 2);
            baseShape.fill(0xff0000);
            baseShape.stroke({ width: 2, color: 0xffffff });
            graphics.addChild(baseShape);

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
                    if (cond.toLowerCase() === 'dead') return; // Handled separately
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

                // Render Dead X
                if (token.conditions.includes('Dead')) {
                    const deadX = new Graphics();
                    const size = mapState.scale / 2 - 4;
                    deadX.moveTo(-size, -size);
                    deadX.lineTo(size, size);
                    deadX.moveTo(size, -size);
                    deadX.lineTo(-size, size);
                    deadX.stroke({ width: 6, color: 0xaa0000, alpha: 0.8 });
                    graphics.addChild(deadX);
                }
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

                        // Snap to Grid coordinates (Math.round centers it nicely on intersections/cells depending on base)
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

    // Render Map Texts
    useEffect(() => {
        textContainerRef.current.removeChildren();

        texts.forEach(t => {
            const hexColor = t.color.replace('#', '0x');
            const pt = new Text({
                text: t.text,
                style: new TextStyle({
                    fontFamily: 'Arial',
                    fontSize: t.fontSize || 24,
                    fill: parseInt(hexColor, 16),
                    stroke: { color: 0x000000, width: 4 },
                    align: 'center'
                })
            });
            pt.x = t.x;
            pt.y = t.y;
            pt.anchor.set(0.5);

            if (isHost) {
                pt.eventMode = 'static';
                pt.cursor = 'pointer';
                pt.on('rightclick', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (confirm("Delete this text?")) {
                        useGameStore.getState().removeText(t.id);
                        networkManager.sendAction('REMOVE_TEXT', t.id);
                    }
                });
            }

            textContainerRef.current.addChild(pt);
        });
    }, [texts, isHost]);

    useEffect(() => {
        wallContainerRef.current.removeChildren();
        if (!isHost) return;

        walls.forEach(w => {
            const g = new Graphics();
            g.moveTo(w.p1.x, w.p1.y);
            g.lineTo(w.p2.x, w.p2.y);

            let strokeColor = 0x00ffff; // Cyan wall
            const stokeAlpha = 0.5;
            let strokeWidth = 4;

            if (w.isDoor) {
                strokeColor = w.isOpen ? 0x00ff00 : 0xffaa00; // Open = green, closed = orange
                strokeWidth = w.isOpen ? 2 : 6;
            }

            g.stroke({ width: strokeWidth, color: strokeColor, alpha: stokeAlpha });
            wallContainerRef.current.addChild(g);
        });
    }, [walls, isHost]);

    // Dynamic Lighting & Raycasting
    useEffect(() => {
        lightingContainerRef.current.removeChildren();
        if (!mapState.dynamicLightingEnabled) {
            lightingContainerRef.current.visible = false;
            return;
        }

        lightingContainerRef.current.visible = true;

        const g = new Graphics();
        g.rect(-10000, -10000, 20000, 20000);

        const visibleTokens = isHost ? tokens : tokens.filter(t => t.ownerId === myId);

        if (visibleTokens.length > 0) {
            const bounds = { minX: -5000, minY: -5000, maxX: 5000, maxY: 5000 };
            const boundaryWalls = [
                { id: 'b1', p1: { x: bounds.minX, y: bounds.minY }, p2: { x: bounds.maxX, y: bounds.minY } },
                { id: 'b2', p1: { x: bounds.maxX, y: bounds.minY }, p2: { x: bounds.maxX, y: bounds.maxY } },
                { id: 'b3', p1: { x: bounds.maxX, y: bounds.maxY }, p2: { x: bounds.minX, y: bounds.maxY } },
                { id: 'b4', p1: { x: bounds.minX, y: bounds.maxY }, p2: { x: bounds.minX, y: bounds.minY } }
            ];

            const activeWalls = walls.filter(w => !w.isDoor || !w.isOpen); // Open doors do not block light
            const baseWalls = [...activeWalls, ...boundaryWalls];

            visibleTokens.forEach(token => {
                const tx = token.x * mapState.scale + mapState.scale / 2;
                const ty = token.y * mapState.scale + mapState.scale / 2;

                let tokenWalls = [...baseWalls];

                // If token has light radius, bound vision. Otherwise generic huge radius.
                const radiusFt = (token.lightRadius && token.lightRadius > 0) ? token.lightRadius : 1000;
                const radiusPx = (radiusFt / 5) * mapState.scale;

                // Create 16-gon light boundary for smooth circular vision
                const polyPoints: { x: number, y: number }[] = [];
                const sides = 16;
                for (let i = 0; i < sides; i++) {
                    const angle = (i * 2 * Math.PI) / sides;
                    polyPoints.push({ x: tx + Math.cos(angle) * radiusPx, y: ty + Math.sin(angle) * radiusPx });
                }
                for (let i = 0; i < sides; i++) {
                    const p1 = polyPoints[i];
                    const p2 = polyPoints[(i + 1) % sides];
                    tokenWalls.push({ id: `light_${i}`, p1, p2 });
                }

                const points: { x: number, y: number }[] = [];
                tokenWalls.forEach(w => {
                    points.push(w.p1, w.p2);
                });

                const angles: number[] = [];
                points.forEach(p => {
                    const angle = Math.atan2(p.y - ty, p.x - tx);
                    angles.push(angle - 0.00001, angle, angle + 0.00001);
                });

                const intersects: { x: number, y: number, angle: number }[] = [];

                angles.forEach(angle => {
                    const dx = Math.cos(angle);
                    const dy = Math.sin(angle);
                    const ray = {
                        p1: { x: tx, y: ty },
                        p2: { x: tx + dx * (radiusPx + 100), y: ty + dy * (radiusPx + 100) }
                    };

                    let closestIntersect: any = null;
                    let minT = Infinity;

                    tokenWalls.forEach(wall => {
                        const intersect = getIntersection(ray.p1, ray.p2, wall.p1, wall.p2);
                        if (intersect && intersect.param < minT) {
                            minT = intersect.param;
                            closestIntersect = intersect;
                        }
                    });

                    if (closestIntersect) {
                        intersects.push({
                            x: closestIntersect.x,
                            y: closestIntersect.y,
                            angle
                        });
                    }
                });

                intersects.sort((a, b) => a.angle - b.angle);

                if (intersects.length > 0) {
                    g.moveTo(intersects[0].x, intersects[0].y);
                    for (let i = 1; i < intersects.length; i++) {
                        g.lineTo(intersects[i].x, intersects[i].y);
                    }
                    g.lineTo(intersects[0].x, intersects[0].y);
                    g.cut(); // PixiJS path boolean: explicitly cut the vision polygon from the dark background
                }
            });
        }

        g.fill({ color: 0x000000, alpha: 0.95 });
        lightingContainerRef.current.addChild(g);

    }, [tokens, walls, mapState.dynamicLightingEnabled, mapState.scale, isHost, myId]);

    // Render Drawings
    useEffect(() => {
        drawingContainerRef.current.removeChildren();
        drawings.forEach(d => {
            if (d.points.length < 2) return;
            const g = new Graphics();

            if (d.type === 'freehand') {
                g.moveTo(d.points[0].x, d.points[0].y);
                for (let i = 1; i < d.points.length; i++) {
                    g.lineTo(d.points[i].x, d.points[i].y);
                }
                g.stroke({ color: d.color, width: d.thickness });
            } else {
                const p0 = d.points[0];
                const p1 = d.points[1];
                const dx = p1.x - p0.x;
                const dy = p1.y - p0.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                g.fill({ color: d.color, alpha: 0.3 });
                g.stroke({ width: d.thickness, color: d.color });

                if (d.type === 'circle') {
                    g.circle(p0.x, p0.y, dist);
                } else if (d.type === 'cube') {
                    g.rect(p0.x - dist, p0.y - dist, dist * 2, dist * 2);
                } else if (d.type === 'cone') {
                    const angle = Math.atan2(dy, dx);
                    const halfAngle = (53.1 / 2) * (Math.PI / 180);
                    const pA = { x: p0.x + Math.cos(angle - halfAngle) * dist, y: p0.y + Math.sin(angle - halfAngle) * dist };
                    const pB = { x: p0.x + Math.cos(angle + halfAngle) * dist, y: p0.y + Math.sin(angle + halfAngle) * dist };

                    g.moveTo(p0.x, p0.y);
                    g.lineTo(pA.x, pA.y);
                    g.lineTo(pB.x, pB.y);
                    g.lineTo(p0.x, p0.y);
                }
            }
            drawingContainerRef.current.addChild(g);
        });
    }, [drawings]);

    // Render Pings
    useEffect(() => {
        pingContainerRef.current.removeChildren();

        pings.forEach(ping => {
            const g = new Graphics();
            g.circle(ping.x, ping.y, 10);
            g.fill({ color: ping.color, alpha: 0.8 });
            g.stroke({ width: 3, color: 0xffffff });

            // Outer expanding ring effect
            const ring = new Graphics();
            ring.circle(ping.x, ping.y, mapState.scale);
            ring.stroke({ width: 2, color: ping.color, alpha: 0.5 });

            pingContainerRef.current.addChild(g);
            pingContainerRef.current.addChild(ring);

            // Simple animation loop attached to the ticker
            if (appRef.current) {
                let scale = 1;
                let alpha = 1;
                const tickerCb = (time: any) => {
                    scale += 0.05 * time.deltaTime;
                    alpha -= 0.02 * time.deltaTime;
                    if (alpha <= 0) {
                        alpha = 0;
                        if (appRef.current) appRef.current.ticker.remove(tickerCb);
                    }
                    ring.scale.set(scale);
                    ring.alpha = alpha;
                };
                appRef.current.ticker.add(tickerCb);

                // Cleanup ticker on unmount/re-render to avoid memory leaks
                return () => {
                    if (appRef.current) appRef.current.ticker.remove(tickerCb);
                }
            }
        });
    }, [pings, mapState.scale]);

    return <div ref={containerRef} className="w-full h-full" />;
};
