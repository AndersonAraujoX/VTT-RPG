import { useEffect } from 'react';
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { useGameStore } from '../../../store/gameStore';
import type { VFXEvent, FloatingText } from '../../../store/gameStore';

interface VFXRendererProps {
    vfx: VFXEvent[];
    floatingTexts: FloatingText[];
    vfxContainerRef: React.RefObject<Container>;
}

export const useVFXRenderer = ({ vfx, floatingTexts, vfxContainerRef }: VFXRendererProps) => {
    // app ticker access if needed

    useEffect(() => {
        if (!vfxContainerRef.current) return;

        // We only clear if needed, but for VFX we might want to manage them individually
        // For simplicity in this v1, we redraw active ones
        vfxContainerRef.current.removeChildren();

        vfx.forEach((effect) => {
            const container = new Container();
            container.position.set(effect.x, effect.y);

            if (effect.type === 'explosion') {
                const g = new Graphics();
                g.circle(0, 0, 10);
                g.fill({ color: effect.color || 0xff4500, alpha: 0.8 });
                container.addChild(g);

                // Simple expansion animation
                let elapsed = 0;
                const duration = 500; // ms
                const animate = (delta: number) => {
                    elapsed += delta * 16.6; // approx ms
                    const progress = elapsed / duration;
                    if (progress >= 1) {
                        if (!container.destroyed) container.destroy();
                        useGameStore.getState().removeVFX(effect.id);
                        return;
                    }
                    g.clear();
                    g.circle(0, 0, 10 + progress * 100);
                    g.fill({ color: effect.color || 0xff4500, alpha: 0.8 * (1 - progress) });
                };

                // Attached to some global ticker logic if available
                // For now, let's use a simple interval or a local ticker reference
                const interval = setInterval(() => animate(1), 16);
                setTimeout(() => clearInterval(interval), duration);
            }

            vfxContainerRef.current?.addChild(container);
        });
    }, [vfx]);

    useEffect(() => {
        if (!vfxContainerRef.current) return;

        floatingTexts.forEach((ft) => {
            const style = new TextStyle({
                fontFamily: 'Arial',
                fontSize: 24,
                fontWeight: 'bold',
                fill: ft.color,
                stroke: { color: 0x000000, width: 4 },
                dropShadow: {
                    alpha: 0.5,
                    angle: Math.PI / 6,
                    blur: 4,
                    color: 0x000000,
                    distance: 6,
                },
            });

            const textObj = new Text({ text: ft.text, style });
            textObj.anchor.set(0.5);
            textObj.position.set(ft.x, ft.y);
            vfxContainerRef.current?.addChild(textObj);

            // Floating animation
            let elapsed = 0;
            const duration = 1500;
            const startY = ft.y;

            const interval = setInterval(() => {
                elapsed += 16;
                const progress = elapsed / duration;
                if (progress >= 1) {
                    clearInterval(interval);
                    if (!textObj.destroyed) textObj.destroy();
                    useGameStore.getState().removeFloatingText(ft.id);
                    return;
                }
                textObj.y = startY - progress * 100;
                textObj.alpha = 1 - progress;
            }, 16);
        });
    }, [floatingTexts]);
};
