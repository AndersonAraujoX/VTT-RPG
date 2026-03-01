import { useEffect, type MutableRefObject } from 'react';
import { Container, Graphics, Ticker } from 'pixi.js';

interface UseWeatherRendererProps {
    weather: 'none' | 'rain' | 'snow';
    weatherContainerRef: MutableRefObject<Container>;
    width: number;
    height: number;
}

export function useWeatherRenderer({
    weather,
    weatherContainerRef,
    width,
    height
}: UseWeatherRendererProps) {
    useEffect(() => {
        const container = weatherContainerRef.current;
        container.removeChildren();
        if (weather === 'none') return;

        const particles: { g: Graphics; vy: number; vx: number }[] = [];
        const count = weather === 'rain' ? 100 : 80;

        for (let i = 0; i < count; i++) {
            const g = new Graphics();
            if (weather === 'rain') {
                g.rect(0, 0, 1, 15);
                g.fill({ color: 0xaaaaff, alpha: 0.4 });
            } else {
                g.circle(0, 0, Math.random() * 3 + 1);
                g.fill({ color: 0xffffff, alpha: 0.8 });
            }

            g.x = Math.random() * width;
            g.y = Math.random() * height;

            const vy = weather === 'rain' ? 10 + Math.random() * 10 : 1 + Math.random() * 2;
            const vx = weather === 'rain' ? (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 1;

            container.addChild(g);
            particles.push({ g, vy, vx });
        }

        const tickerCb = (ticker: Ticker) => {
            particles.forEach(p => {
                p.g.y += p.vy * ticker.deltaTime;
                p.g.x += p.vx * ticker.deltaTime;

                if (p.g.y > height) {
                    p.g.y = -20;
                    p.g.x = Math.random() * width;
                }
                if (p.g.x > width) p.g.x = 0;
                if (p.g.x < 0) p.g.x = width;
            });
        };

        Ticker.shared.add(tickerCb);

        return () => {
            Ticker.shared.remove(tickerCb);
            container.removeChildren();
        };
    }, [weather, weatherContainerRef, width, height]);
}
