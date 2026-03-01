import { useEffect, type MutableRefObject } from 'react';
import { Graphics, Container, Sprite, Assets, Text, TextStyle } from 'pixi.js';
import { useGameStore, type Token, type MapState, type Drawing, type TextItem as MapText, type Wall, type MapAsset, type MapTrigger } from '../../../store/gameStore';
import { networkManager } from '../../../services/network';
import { isPointInCircle, isPointInRect, isPointInCone } from '../utils/math';

interface UseTokenRendererProps {
    tokens: Token[];
    tokenContainerRef: MutableRefObject<Container>;
    mapState: MapState;
    myId: string;
    isHost: boolean;
    activeLayer: 'map' | 'token';
    onEditToken?: (id: string) => void;
    drawings: Drawing[];
    triggers: MapTrigger[];
}

export function useTokenRenderer({
    tokens,
    tokenContainerRef,
    mapState,
    myId,
    isHost,
    activeLayer,
    onEditToken,
    drawings,
    triggers
}: UseTokenRendererProps) {
    useEffect(() => {
        tokenContainerRef.current.removeChildren();

        tokens.forEach(token => {
            if (token.hidden && !isHost && token.ownerId !== myId) return;

            const graphics = new Container();
            const baseShape = new Graphics();

            // Auras
            if (token.auras && token.auras.length > 0) {
                token.auras.forEach((aura: any) => {
                    const auraG = new Graphics();
                    const radiusPx = (aura.radius / 5) * mapState.scale;
                    auraG.circle(0, 0, radiusPx);
                    const colorNum = parseInt((aura.color || '#ffff00').replace('#', '0x'), 16);
                    auraG.fill({ color: colorNum, alpha: 0.2 });
                    auraG.stroke({ color: colorNum, width: 2, alpha: 0.5 });
                });
            }

            // Targeting Indicator
            if (token.targetId) {
                const target = tokens.find(t => t.id === token.targetId);
                if (target) {
                    const targetG = new Graphics();
                    targetG.circle(0, 0, mapState.scale / 2 + 5);
                    targetG.stroke({ color: 0xff0000, width: 2, alpha: 0.8 });
                    graphics.addChild(targetG);
                }
            }

            // AoE Highlighting
            const isInsideAoE = drawings.some(d => {
                if (d.type === 'freehand' || d.points.length < 2) return false;
                const p0 = d.points[0];
                const p1 = d.points[1];
                const dx = p1.x - p0.x;
                const dy = p1.y - p0.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const tokenPoint = {
                    x: token.x * mapState.scale + mapState.scale / 2,
                    y: token.y * mapState.scale + mapState.scale / 2
                };

                if (d.type === 'circle') return isPointInCircle(tokenPoint, p0, dist);
                if (d.type === 'cube') return isPointInRect(tokenPoint, { x: p0.x - dist, y: p0.y - dist, width: dist * 2, height: dist * 2 });
                if (d.type === 'cone') {
                    const angle = Math.atan2(dy, dx);
                    const spread = 53.1 * (Math.PI / 180);
                    return isPointInCone(tokenPoint, p0, dist, angle, spread);
                }
                return false;
            });

            if (isInsideAoE) {
                const highlight = new Graphics();
                highlight.circle(0, 0, mapState.scale / 2);
                highlight.fill({ color: 0xffff00, alpha: 0.3 });
                graphics.addChildAt(highlight, 0);
            }


            // Image/Shape
            if (token.image) {
                Assets.load(token.image).then((tex) => {
                    if (graphics.destroyed) return;
                    try {
                        const sprite = new Sprite(tex);
                        sprite.anchor.set(0.5);
                        const targetSize = (mapState.scale || 50) - 4;
                        const tW = tex.width || 256;
                        const tH = tex.height || 256;
                        const scale = Math.max(targetSize / tW, targetSize / tH);
                        sprite.scale.set(scale);

                        const mask = new Graphics();
                        mask.circle(0, 0, (mapState.scale || 50) / 2 - 2);
                        mask.fill(0xffffff);

                        const imgContainer = new Container();
                        imgContainer.addChild(sprite);
                        imgContainer.addChild(mask);
                        sprite.mask = mask;

                        const border = new Graphics();
                        border.circle(0, 0, mapState.scale / 2 - 2);
                        border.stroke({ width: 3, color: 0xcccccc });

                        imgContainer.addChild(border);
                        graphics.addChildAt(imgContainer, token.auras && token.auras.length > 0 ? token.auras.length : 0);
                    } catch (e) {
                        console.error('Failed to create token texture:', e);
                    }
                }).catch(e => console.error("Token Image Load Failed:", e));
            } else {
                baseShape.circle(0, 0, mapState.scale / 2 - 2);
                baseShape.fill(0xff0000);
                baseShape.stroke({ width: 2, color: 0xffffff });
                graphics.addChild(baseShape);
            }

            if (token.hidden) graphics.alpha = 0.5;

            graphics.position.set(
                token.x * mapState.scale + mapState.scale / 2,
                token.y * mapState.scale + mapState.scale / 2
            );

            // HP Bar
            if (token.stats && token.stats.maxHp > 0) {
                const barWidth = mapState.scale * 0.8;
                const barHeight = 4;
                const hpPercent = Math.max(0, Math.min(1, token.stats.hp / token.stats.maxHp));

                const hpBg = new Graphics();
                hpBg.rect(-barWidth / 2, -mapState.scale / 2 - 8, barWidth, barHeight);
                hpBg.fill(0xff0000);

                const hpFg = new Graphics();
                hpFg.rect(-barWidth / 2, -mapState.scale / 2 - 8, barWidth * hpPercent, barHeight);
                hpFg.fill(0x00ff00);

                graphics.addChild(hpBg);
                graphics.addChild(hpFg);
            }

            // Conditions
            if (token.conditions && token.conditions.length > 0) {
                const iconRadius = 4;
                const startAngle = -Math.PI / 4;
                const conditionColors: Record<string, number> = {
                    'poisoned': 0x00ff00,
                    'prone': 0xffff00,
                    'stunned': 0x00ffff,
                    'invisible': 0xaabbcc
                };

                token.conditions.forEach((cond: string, index: number) => {
                    if (cond.toLowerCase() === 'dead') return;
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

            // Interactions
            if (isHost || token.ownerId === myId) {
                graphics.eventMode = activeLayer === 'token' ? 'static' : 'none';
                graphics.cursor = activeLayer === 'token' ? 'pointer' : 'default';

                let dragData: any = null;
                let lastClickTime = 0;
                let startPos = { x: 0, y: 0 };
                let distText: Text | null = null;

                graphics.on('pointerdown', (event) => {
                    const isModifierHeld = event.shiftKey || event.altKey;

                    if (event.button === 0 && activeLayer === 'token') {
                        const now = Date.now();
                        if (now - lastClickTime < 300 && onEditToken) {
                            onEditToken(token.id);
                        }
                        lastClickTime = now;

                        if (!isModifierHeld) {
                            dragData = event;
                            graphics.alpha = token.hidden ? 0.3 : 0.5;
                            startPos = { x: graphics.x, y: graphics.y };
                            event.stopPropagation();

                            distText = new Text({
                                text: '0 ft',
                                style: new TextStyle({ fontFamily: 'Arial', fontSize: 16, fill: 0xffffff, stroke: { color: 0x000000, width: 3 } })
                            });
                            distText.anchor.set(0.5, 1);
                            distText.position.set(0, -mapState.scale / 2 - 10);
                            graphics.addChild(distText);
                        }
                    }
                });

                graphics.on('rightclick', (event) => {
                    if (isHost) {
                        event.stopPropagation();
                        event.preventDefault();
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

                        // Grid Snapping preview
                        const previewGridX = Math.round((newPos.x - mapState.scale / 2) / mapState.scale);
                        const previewGridY = Math.round((newPos.y - mapState.scale / 2) / mapState.scale);

                        graphics.position.set(
                            previewGridX * mapState.scale + mapState.scale / 2,
                            previewGridY * mapState.scale + mapState.scale / 2
                        );

                        if (distText) {
                            const dx = Math.abs(previewGridX - token.x);
                            const dy = Math.abs(previewGridY - token.y);
                            // Chebyshev distance (standard 5e)
                            const maxSquares = Math.max(dx, dy);
                            const ft = maxSquares * 5;
                            distText.text = `${ft}ft / ${maxSquares}sq`;
                        }
                    }
                });

                graphics.on('pointerup', () => {
                    if (dragData) {
                        graphics.alpha = token.hidden ? 0.5 : 1;
                        dragData = null;
                        if (distText && !distText.destroyed) {
                            distText.destroy();
                            distText = null;
                        }

                        const newGridX = Math.round((graphics.x - mapState.scale / 2) / mapState.scale);
                        const newGridY = Math.round((graphics.y - mapState.scale / 2) / mapState.scale);

                        // Trigger check
                        const finalPos = { x: graphics.x, y: graphics.y };
                        const trigger = triggers.find(t => isPointInCircle(finalPos, { x: t.x, y: t.y }, t.radius));

                        if (trigger) {
                            // Block move, snap back to start or trigger edge? 
                            // Standard VTT behavior: block move and trigger effect.
                            graphics.position.set(startPos.x, startPos.y);

                            if (trigger.effectVFX) {
                                useGameStore.getState().triggerVFX({
                                    id: Math.random().toString(),
                                    type: trigger.effectVFX,
                                    x: trigger.x,
                                    y: trigger.y
                                });
                            }

                            if (trigger.chatMessage) {
                                useGameStore.getState().addChatMessage({
                                    id: Math.random().toString(),
                                    senderId: 'system',
                                    senderName: 'System',
                                    timestamp: Date.now(),
                                    content: trigger.chatMessage,
                                    type: 'system'
                                });
                            }

                            return;
                        }

                        networkManager.sendAction('UPDATE_TOKEN', {
                            id: token.id,
                            data: { x: newGridX, y: newGridY }
                        });
                    }
                });
                graphics.on('pointerupoutside', () => {
                    if (dragData) {
                        graphics.alpha = token.hidden ? 0.5 : 1;
                        dragData = null;
                        if (distText && !distText.destroyed) {
                            distText.destroy();
                            distText = null;
                        }
                        graphics.position.set(startPos.x, startPos.y);
                    }
                });
            }

            tokenContainerRef.current.addChild(graphics);
        });
    }, [tokens, mapState.scale, isHost, myId, activeLayer, onEditToken, drawings]);
}

export function useDrawingsRenderer(
    drawings: Drawing[],
    drawingContainerRef: MutableRefObject<Container>,
    mapScale: number
) {
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

                if (d.type === 'circle') {
                    g.circle(p0.x, p0.y, dist);
                } else if (d.type === 'cube') {
                    g.rect(p0.x - dist, p0.y - dist, dist * 2, dist * 2);
                } else if (d.type === 'cone') {
                    const angle = Math.atan2(dy, dx);
                    const halfAngle = (53.1 / 2) * (Math.PI / 180);

                    g.moveTo(p0.x, p0.y);
                    g.lineTo(p0.x + Math.cos(angle - halfAngle) * dist, p0.y + Math.sin(angle - halfAngle) * dist);
                    g.arc(p0.x, p0.y, dist, angle - halfAngle, angle + halfAngle, false);
                    g.lineTo(p0.x, p0.y);
                }

                g.fill({ color: d.color, alpha: 0.2 });
                g.stroke({ color: d.color, width: 2, alpha: 0.8 });
            }

            drawingContainerRef.current.addChild(g);
        });
    }, [drawings, mapScale]);
}

export function useTextsRenderer(
    texts: MapText[],
    textContainerRef: MutableRefObject<Container>,
    isHost: boolean,
    onRemoveText: (id: string) => void
) {
    useEffect(() => {
        textContainerRef.current.removeChildren();

        if (Array.isArray(texts)) texts.forEach(t => {
            const hexColor = (t.color || '#ffffff').replace('#', '0x');
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
                        onRemoveText(t.id);
                    }
                });
            }

            textContainerRef.current.addChild(pt);
        });
    }, [texts, isHost, onRemoveText]);
}

export function useWallsRenderer(
    walls: Wall[],
    wallContainerRef: MutableRefObject<Container>,
    isHost: boolean
) {
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
}

export function useMapAssetsRenderer(
    mapAssets: MapAsset[],
    mapAssetsContainerRef: MutableRefObject<Container>,
    mapScale: number,
    isHost: boolean,
    activeLayer: 'map' | 'token'
) {
    useEffect(() => {
        mapAssetsContainerRef.current.removeChildren();

        mapAssets.forEach(asset => {
            if (!asset.image) return;

            const graphics = new Container();

            Assets.load(asset.image).then((tex) => {
                if (graphics.destroyed) return;
                try {
                    const sprite = new Sprite(tex);
                    sprite.anchor.set(0.5);

                    const scaleX = asset.width / tex.width;
                    const scaleY = asset.height / tex.height;
                    sprite.scale.set(Math.min(scaleX, scaleY));

                    graphics.addChild(sprite);
                } catch (e) {
                    console.error('Failed to create map asset texture:', e);
                }
            }).catch(e => console.error("Map Asset Image Load Failed:", e));

            graphics.position.set(asset.x, asset.y);

            if (isHost) {
                graphics.eventMode = activeLayer === 'map' ? 'static' : 'none';
                graphics.cursor = activeLayer === 'map' ? 'pointer' : 'default';

                let dragData: any = null;

                graphics.on('pointerdown', (event) => {
                    const isModifierHeld = event.shiftKey || event.altKey;
                    if (event.button === 0 && activeLayer === 'map' && !isModifierHeld) {
                        dragData = event;
                        graphics.alpha = 0.8;
                        event.stopPropagation();
                    }
                });

                graphics.on('rightclick', (event) => {
                    if (activeLayer === 'map') {
                        event.stopPropagation();
                        event.preventDefault();
                        if (window.confirm("Delete this map asset?")) {
                            networkManager.sendAction('REMOVE_MAP_ASSET', asset.id);
                        }
                    }
                });

                graphics.on('pointermove', (event) => {
                    if (dragData && activeLayer === 'map') {
                        // @ts-ignore
                        const newPos = event.getLocalPosition(graphics.parent);
                        graphics.position.set(newPos.x, newPos.y);
                    }
                });

                const onDragEnd = () => {
                    if (dragData) {
                        dragData = null;
                        graphics.alpha = 1;
                        const snapX = Math.round(graphics.x / mapScale) * mapScale;
                        const snapY = Math.round(graphics.y / mapScale) * mapScale;

                        networkManager.sendAction('UPDATE_MAP_ASSET', {
                            id: asset.id,
                            data: { x: snapX, y: snapY }
                        });
                    }
                };

                graphics.on('pointerup', onDragEnd);
                graphics.on('pointerupoutside', onDragEnd);
            }

            mapAssetsContainerRef.current.addChild(graphics);
        });
    }, [mapAssets, activeLayer, mapScale, isHost]);
}

export function useTriggersRenderer(
    triggers: MapTrigger[],
    triggerContainerRef: MutableRefObject<Container>,
    isHost: boolean,
    onRemoveTrigger: (id: string) => void
) {
    useEffect(() => {
        triggerContainerRef.current.removeChildren();

        // Triggers are mostly invisible or ghosted for GM
        if (!isHost) {
            triggers.filter(t => t.isVisibleToPlayers).forEach(t => {
                const g = new Graphics();
                g.circle(t.x, t.y, t.radius);
                g.fill({ color: 0xaa0000, alpha: 0.1 });
                g.stroke({ width: 1, color: 0xaa0000, alpha: 0.2 });
                triggerContainerRef.current.addChild(g);
            });
            return;
        }

        // GM sees all triggers
        triggers.forEach(t => {
            const g = new Graphics();
            g.circle(t.x, t.y, t.radius);

            let color = 0xaa0000;
            if (t.type === 'teleport') color = 0x0000aa;
            if (t.type === 'prompt') color = 0x00aa00;

            g.fill({ color, alpha: 0.3 });
            g.stroke({ width: 2, color, alpha: 0.5 });

            g.eventMode = 'static';
            g.cursor = 'pointer';
            g.on('rightclick', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (confirm(`Delete this ${t.type} trigger?`)) {
                    onRemoveTrigger(t.id);
                }
            });

            triggerContainerRef.current.addChild(g);
        });
    }, [triggers, isHost, onRemoveTrigger]);
}
