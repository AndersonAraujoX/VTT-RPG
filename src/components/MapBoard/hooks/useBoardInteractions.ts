import type { MutableRefObject } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { useGameStore } from '../../../store/gameStore';
import { networkManager } from '../../../services/network';
import { processImageUpload } from '../../../utils/imageHandler';

interface UseBoardInteractionsProps {
    appRef: MutableRefObject<Application | null>;
    mapContainerRef: MutableRefObject<Container>;
    overlayContainerRef: MutableRefObject<Container>;
}

export function useBoardInteractions({
    appRef,
    mapContainerRef,
    overlayContainerRef
}: UseBoardInteractionsProps) {

    // Helper definition to bind events to a Pixi Application once it's created
    const bindCanvasEvents = () => {
        if (!appRef.current || !appRef.current.canvas) return;
        const app = appRef.current;
        const canvas = app.canvas;

        let isPanning = false;
        let isRevealing = false;
        let isDrawing = false;
        let lastPos = { x: 0, y: 0 };
        let toolStart = { x: 0, y: 0 };
        let currentDrawingPoints: { x: number, y: number }[] = [];
        let measuringPoints: { x: number, y: number }[] = [];

        const handleMouseDown = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldX = (mouseX - mapContainerRef.current.position.x) / mapContainerRef.current.scale.x;
            const worldY = (mouseY - mapContainerRef.current.position.y) / mapContainerRef.current.scale.y;

            const state = useGameStore.getState();

            if (e.shiftKey && state.isHost) {
                isRevealing = true;
                toolStart = { x: worldX, y: worldY };
            } else if (e.altKey) {
                if (e.button === 0) {
                    measuringPoints = [{ x: worldX, y: worldY }, { x: worldX, y: worldY }];
                } else if (e.button === 2 && measuringPoints.length > 0) {
                    measuringPoints[measuringPoints.length - 1] = { x: worldX, y: worldY };
                    measuringPoints.push({ x: worldX, y: worldY });
                }
            } else if (e.button === 0 && e.ctrlKey) {
                const pingId = Date.now().toString();
                const newPing = { id: pingId, x: worldX, y: worldY, color: state.toolColor || '#ffff00' };
                state.addPing(newPing);
                networkManager.sendAction('SYNC_STATE', { pings: state.pings });

                setTimeout(() => {
                    useGameStore.getState().removePing(pingId);
                    networkManager.sendAction('SYNC_STATE', { pings: useGameStore.getState().pings });
                }, 3000);
            } else if (e.button === 1 || e.button === 2) {
                if (!e.altKey && measuringPoints.length === 0) {
                    isPanning = true;
                    lastPos = { x: e.clientX, y: e.clientY };
                }
            } else if (e.button === 0 && state.activeTool === 'draw') {
                isDrawing = true;
                currentDrawingPoints = [{ x: worldX, y: worldY }];
            } else if (e.button === 0 && ['circle', 'cone', 'cube'].includes(state.activeTool)) {
                isDrawing = true;
                const snapX = Math.round(worldX / state.map.scale) * state.map.scale;
                const snapY = Math.round(worldY / state.map.scale) * state.map.scale;
                currentDrawingPoints = [{ x: snapX, y: snapY }, { x: worldX, y: worldY }];
            } else if (e.button === 0 && (state.activeTool === 'wall' || state.activeTool === 'door')) {
                isDrawing = true;
                currentDrawingPoints = [{ x: worldX, y: worldY }, { x: worldX, y: worldY }];
            } else if (e.button === 0 && state.activeTool === 'text') {
                const content = window.prompt("Enter text for map:");
                if (content?.trim()) {
                    const newText = {
                        id: Date.now().toString(),
                        x: worldX,
                        y: worldY,
                        text: content.trim(),
                        color: state.toolColor || '#ffffff',
                        fontSize: 32 / mapContainerRef.current.scale.x
                    };
                    state.addText(newText);
                    networkManager.sendAction('ADD_TEXT', newText);
                }
            } else if (e.button === 0 && state.activeTool === 'pan') {
                let toggled = false;
                if (state.isHost) {
                    for (const w of state.walls) {
                        if (w.isDoor) {
                            const l2 = Math.pow(w.p1.x - w.p2.x, 2) + Math.pow(w.p1.y - w.p2.y, 2);
                            if (l2 === 0) continue;
                            const t = Math.max(0, Math.min(1, ((worldX - w.p1.x) * (w.p2.x - w.p1.x) + (worldY - w.p1.y) * (w.p2.y - w.p1.y)) / l2));
                            const proj = { x: w.p1.x + t * (w.p2.x - w.p1.x), y: w.p1.y + t * (w.p2.y - w.p1.y) };
                            const dist = Math.sqrt(Math.pow(worldX - proj.x, 2) + Math.pow(worldY - proj.y, 2));

                            if (dist < (15 / state.map.scale)) {
                                state.toggleWallDoor(w.id);
                                networkManager.sendAction('SYNC_STATE', { walls: state.walls });
                                toggled = true;
                                break;
                            }
                        }
                    }
                }
                if (!toggled) {
                    isPanning = true;
                    lastPos = { x: e.clientX, y: e.clientY };
                }
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            isPanning = false;

            const rect = canvas.getBoundingClientRect();
            const worldX = (e.clientX - rect.left - mapContainerRef.current.position.x) / mapContainerRef.current.scale.x;
            const worldY = (e.clientY - rect.top - mapContainerRef.current.position.y) / mapContainerRef.current.scale.y;
            const state = useGameStore.getState();

            if (isRevealing) {
                isRevealing = false;
                overlayContainerRef.current.removeChildren();

                const dx = worldX - toolStart.x;
                const dy = worldY - toolStart.y;
                const radius = Math.sqrt(dx * dx + dy * dy);

                if (radius > 5) {
                    networkManager.sendAction('SYNC_STATE', {
                        map: {
                            ...state.map,
                            revealedAreas: [...state.map.revealedAreas, { x: toolStart.x, y: toolStart.y, radius }]
                        }
                    });
                    state.revealArea(toolStart.x, toolStart.y, radius);
                }
            } else if (measuringPoints.length > 0 && !e.altKey) {
                measuringPoints = [];
                overlayContainerRef.current.removeChildren();
            } else if (isDrawing) {
                isDrawing = false;
                const activeTool = state.activeTool;
                if ((activeTool === 'wall' || activeTool === 'door') && currentDrawingPoints.length > 1) {
                    const p0 = currentDrawingPoints[0];
                    const p1 = currentDrawingPoints[1];
                    const dist = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
                    if (dist > 5) {
                        const newWall = {
                            id: Date.now().toString(),
                            p1: p0,
                            p2: p1,
                            isDoor: activeTool === 'door',
                            isOpen: false
                        };
                        state.addWall(newWall);
                        networkManager.sendAction('SYNC_STATE', { walls: state.walls });
                    }
                } else if (currentDrawingPoints.length > 1) {
                    const newDrawing = {
                        id: Date.now().toString(),
                        type: activeTool === 'draw' ? 'freehand' : activeTool,
                        color: state.toolColor || '#ffffff',
                        thickness: state.toolThickness || 3,
                        points: currentDrawingPoints
                    };
                    state.addDrawing(newDrawing as any);
                    networkManager.sendAction('SYNC_STATE', { drawings: state.drawings });
                }
                currentDrawingPoints = [];
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const worldX = (e.clientX - rect.left - mapContainerRef.current.position.x) / mapContainerRef.current.scale.x;
            const worldY = (e.clientY - rect.top - mapContainerRef.current.position.y) / mapContainerRef.current.scale.y;
            const state = useGameStore.getState();

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
                    const segmentDistUnits = Math.round((segmentDistPixels / state.map.scale) * 5);
                    totalDistance += segmentDistUnits;

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
                        g.circle(p1.x, p1.y, 4).fill(0xffffff);
                    }
                }
                overlayContainerRef.current.addChild(g);
            } else if (isDrawing && currentDrawingPoints.length > 0) {
                const activeTool = state.activeTool;

                if (activeTool === 'draw') {
                    currentDrawingPoints.push({ x: worldX, y: worldY });

                    const g = new Graphics();
                    g.moveTo(currentDrawingPoints[0].x, currentDrawingPoints[0].y);
                    for (let i = 1; i < currentDrawingPoints.length; i++) {
                        g.lineTo(currentDrawingPoints[i].x, currentDrawingPoints[i].y);
                    }
                    g.stroke({ width: state.toolThickness || 3, color: state.toolColor || '#ffffff' });

                    overlayContainerRef.current.removeChildren();
                    overlayContainerRef.current.addChild(g);
                } else if (['circle', 'cone', 'cube'].includes(activeTool)) {
                    currentDrawingPoints[1] = { x: worldX, y: worldY };

                    const p0 = currentDrawingPoints[0];
                    const dx = worldX - p0.x;
                    const dy = worldY - p0.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    const g = new Graphics();

                    if (activeTool === 'circle') {
                        g.circle(p0.x, p0.y, dist);
                    } else if (activeTool === 'cube') {
                        g.rect(p0.x - dist, p0.y - dist, dist * 2, dist * 2);
                    } else if (activeTool === 'cone') {
                        const angle = Math.atan2(dy, dx);
                        const halfAngle = (53.1 / 2) * (Math.PI / 180);
                        const p1 = { x: p0.x + Math.cos(angle - halfAngle) * dist, y: p0.y + Math.sin(angle - halfAngle) * dist };
                        const p2 = { x: p0.x + Math.cos(angle + halfAngle) * dist, y: p0.y + Math.sin(angle + halfAngle) * dist };

                        g.moveTo(p0.x, p0.y);
                        g.lineTo(p1.x, p1.y);
                        g.lineTo(p2.x, p2.y);
                        g.lineTo(p0.x, p0.y);
                    }

                    g.fill({ color: state.toolColor, alpha: 0.3 });
                    g.stroke({ width: state.toolThickness, color: state.toolColor });

                    overlayContainerRef.current.removeChildren();
                    overlayContainerRef.current.addChild(g);
                } else if (activeTool === 'wall' || activeTool === 'door') {
                    currentDrawingPoints[1] = { x: worldX, y: worldY };
                    const g = new Graphics();
                    g.moveTo(currentDrawingPoints[0].x, currentDrawingPoints[0].y);
                    g.lineTo(currentDrawingPoints[1].x, currentDrawingPoints[1].y);
                    g.stroke({ width: 5, color: activeTool === 'door' ? 0xffaa00 : 0x00ffff, alpha: 0.8 });

                    overlayContainerRef.current.removeChildren();
                    overlayContainerRef.current.addChild(g);
                }
            }
        };

        const handleContextMenu = (e: Event) => e.preventDefault();
        const handleDragOver = (e: Event) => e.preventDefault();

        const handleDrop = async (e: DragEvent) => {
            e.preventDefault();
            const file = e.dataTransfer?.files?.[0];
            const state = useGameStore.getState();

            if (file && file.type.startsWith('image/')) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const worldX = (mouseX - mapContainerRef.current.position.x) / mapContainerRef.current.scale.x;
                const worldY = (mouseY - mapContainerRef.current.position.y) / mapContainerRef.current.scale.y;

                const isMap = window.confirm("Set as Background Map? (Click Cancel to drop as a Character Token instead)");

                if (isMap) {
                    const url = await processImageUpload(file, true);
                    state.updateMap({ url });
                    networkManager.sendAction('UPDATE_MAP', { url });
                } else {
                    const imgUrl = await processImageUpload(file, false);
                    const finalGridX = Math.floor(worldX / state.map.scale);
                    const finalGridY = Math.floor(worldY / state.map.scale);

                    const t = {
                        id: Date.now().toString(),
                        x: finalGridX,
                        y: finalGridY,
                        size: 1,
                        image: imgUrl,
                        label: 'Token',
                        stats: { hp: 10, maxHp: 10, ac: 10 },
                        ownerId: state.myId
                    };
                    state.addToken(t);
                    networkManager.sendAction('ADD_TOKEN', t);
                }
            } else {
                try {
                    const textData = e.dataTransfer?.getData('text/plain');
                    if (textData) {
                        const data = JSON.parse(textData);
                        if (data.type === 'compendium_monster' && data.index) {
                            const rect = canvas.getBoundingClientRect();
                            const mouseX = e.clientX - rect.left;
                            const mouseY = e.clientY - rect.top;

                            const worldX = (mouseX - mapContainerRef.current.position.x) / mapContainerRef.current.scale.x;
                            const worldY = (mouseY - mapContainerRef.current.position.y) / mapContainerRef.current.scale.y;

                            const finalGridX = Math.floor(worldX / state.map.scale);
                            const finalGridY = Math.floor(worldY / state.map.scale);

                            fetch(`https://www.dnd5eapi.co/api/monsters/${data.index}`)
                                .then(res => res.json())
                                .then(monsterData => {
                                    let size = 1;
                                    if (monsterData.size === 'Large') size = 2;
                                    else if (monsterData.size === 'Huge') size = 3;
                                    else if (monsterData.size === 'Gargantuan') size = 4;

                                    const t = {
                                        id: Date.now().toString(),
                                        x: finalGridX,
                                        y: finalGridY,
                                        size: size,
                                        image: `https://api.dicebear.com/7.x/bottts/svg?seed=${monsterData.index}`,
                                        label: monsterData.name,
                                        stats: {
                                            hp: monsterData.hit_points,
                                            maxHp: monsterData.hit_points,
                                            ac: monsterData.armor_class?.[0]?.value || 10,
                                            attributes: {
                                                strength: monsterData.strength,
                                                dexterity: monsterData.dexterity,
                                                constitution: monsterData.constitution,
                                                intelligence: monsterData.intelligence,
                                                wisdom: monsterData.wisdom,
                                                charisma: monsterData.charisma
                                            },
                                            skills: monsterData.proficiencies
                                                ?.filter((p: any) => p.proficiency.index.startsWith('skill-'))
                                                .reduce((acc: Record<string, number>, p: any) => {
                                                    const skillName = p.proficiency.index.replace('skill-', '');
                                                    acc[skillName] = p.value;
                                                    return acc;
                                                }, {}) || {}
                                        },
                                        ownerId: undefined
                                    };
                                    state.addToken(t as any);
                                    networkManager.sendAction('ADD_TOKEN', t);
                                }).catch(err => console.error("Failed to fetch monster detail", err));
                        }
                    }
                } catch (err) {
                    // Ignore non-json drops
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Alt' && measuringPoints.length > 0) {
                measuringPoints = [];
                overlayContainerRef.current.removeChildren();
            }
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const scaleFactor = 1.1;
            const newScale = e.deltaY < 0
                ? mapContainerRef.current.scale.x * scaleFactor
                : mapContainerRef.current.scale.x / scaleFactor;

            if (newScale > 0.1 && newScale < 5) {
                mapContainerRef.current.scale.set(newScale);
            }
        };

        // Attach actual event listeners
        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('contextmenu', handleContextMenu);
        canvas.addEventListener('dragover', handleDragOver);
        canvas.addEventListener('drop', handleDrop);
        window.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('wheel', handleWheel, { passive: false });

        // Return a cleanup function
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('contextmenu', handleContextMenu);
            canvas.removeEventListener('dragover', handleDragOver);
            canvas.removeEventListener('drop', handleDrop);
            window.removeEventListener('keyup', handleKeyUp);
            canvas.removeEventListener('wheel', handleWheel);
        };
    };

    return { bindCanvasEvents };
}
