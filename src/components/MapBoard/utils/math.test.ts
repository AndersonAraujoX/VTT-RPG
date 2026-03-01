import { describe, it, expect } from 'vitest';
import { getIntersection, calculateVisionPolygon, type Wall } from './math';

describe('MapBoard Math Utils - getIntersection', () => {
    it('should correctly find intersection of two crossing segments', () => {
        // Ray from (0,0) to (10,0)
        const ray1 = { x: 0, y: 0 };
        const ray2 = { x: 10, y: 0 };
        // Wall from (5, -5) to (5, 5)
        const seg1 = { x: 5, y: -5 };
        const seg2 = { x: 5, y: 5 };

        const result = getIntersection(ray1, ray2, seg1, seg2);

        expect(result).not.toBeNull();
        expect(result?.x).toBeCloseTo(5);
        expect(result?.y).toBeCloseTo(0);
        expect(result?.param).toBeCloseTo(0.5); // Intersection is at 50% of the ray
    });

    it('should return null if lines are parallel', () => {
        const ray1 = { x: 0, y: 0 };
        const ray2 = { x: 10, y: 0 };
        const seg1 = { x: 0, y: 5 };
        const seg2 = { x: 10, y: 5 };

        const result = getIntersection(ray1, ray2, seg1, seg2);
        expect(result).toBeNull();
    });

    it('should return null if intersection is behind the ray origin (t <= 0)', () => {
        const ray1 = { x: 0, y: 0 };
        const ray2 = { x: 10, y: 0 };
        // Wall behind the origin
        const seg1 = { x: -5, y: -5 };
        const seg2 = { x: -5, y: 5 };

        const result = getIntersection(ray1, ray2, seg1, seg2);
        expect(result).toBeNull();
    });

    it('should return null if intersection is outside the wall segment bounds (u < 0 or u > 1)', () => {
        const ray1 = { x: 0, y: 0 };
        const ray2 = { x: 10, y: 0 };
        // Wall is far above the ray's actual Y path
        const seg1 = { x: 5, y: 5 };
        const seg2 = { x: 5, y: 15 };

        const result = getIntersection(ray1, ray2, seg1, seg2);
        expect(result).toBeNull();
    });
});

describe('MapBoard Math Utils - calculateVisionPolygon', () => {
    it('should generate a polygon bounded by the radius without obstructing walls', () => {
        const tokenPos = { x: 0, y: 0 };
        const radius = 100;
        const walls: Wall[] = [];
        const bounds = { minX: -500, minY: -500, maxX: 500, maxY: 500 };

        const poly = calculateVisionPolygon(tokenPos, radius, walls, bounds);
        // It generates points for the 16-gon
        expect(poly.length).toBeGreaterThanOrEqual(16);

        // The points should be within the radius
        poly.forEach(p => {
            const dist = Math.sqrt(p.x * p.x + p.y * p.y);
            expect(dist).toBeLessThanOrEqual(radius + 0.1);
        });
    });

    it('should clip vision polygon to a nearby wall', () => {
        const tokenPos = { x: 0, y: 0 };
        const radius = 100;
        // A wall blocking the right side at x=50
        const walls: Wall[] = [
            { p1: { x: 50, y: -200 }, p2: { x: 50, y: 200 } }
        ];
        const bounds = { minX: -500, minY: -500, maxX: 500, maxY: 500 };

        const poly = calculateVisionPolygon(tokenPos, radius, walls, bounds);

        // None of the polygon points should strongly exceed x=50 (accounting for float precision)
        poly.forEach(p => {
            expect(p.x).toBeLessThanOrEqual(50.1);
        });
    });
});
