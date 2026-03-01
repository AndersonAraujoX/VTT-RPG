interface Point {
    x: number;
    y: number;
}

export function getIntersection(ray1: Point, ray2: Point, seg1: Point, seg2: Point) {
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

export interface Wall {
    p1: Point;
    p2: Point;
}

export function calculateVisionPolygon(
    tokenPos: Point,
    radiusPx: number,
    walls: Wall[],
    bounds: { minX: number, minY: number, maxX: number, maxY: number }
): Point[] {
    const tx = tokenPos.x;
    const ty = tokenPos.y;

    const boundaryWalls = [
        { p1: { x: bounds.minX, y: bounds.minY }, p2: { x: bounds.maxX, y: bounds.minY } },
        { p1: { x: bounds.maxX, y: bounds.minY }, p2: { x: bounds.maxX, y: bounds.maxY } },
        { p1: { x: bounds.maxX, y: bounds.maxY }, p2: { x: bounds.minX, y: bounds.maxY } },
        { p1: { x: bounds.minX, y: bounds.maxY }, p2: { x: bounds.minX, y: bounds.minY } }
    ];

    let tokenWalls = [...walls, ...boundaryWalls];

    // Create 16-gon light boundary for smooth circular vision
    const polyPoints: Point[] = [];
    const sides = 16;
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides;
        polyPoints.push({ x: tx + Math.cos(angle) * radiusPx, y: ty + Math.sin(angle) * radiusPx });
    }
    for (let i = 0; i < sides; i++) {
        const p1 = polyPoints[i];
        const p2 = polyPoints[(i + 1) % sides];
        tokenWalls.push({ p1, p2 });
    }

    const points: Point[] = [];
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
    return intersects.map(i => ({ x: i.x, y: i.y }));
}

export function isPointInCircle(point: Point, center: Point, radius: number): boolean {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return dx * dx + dy * dy <= radius * radius;
}

export function isPointInRect(point: Point, rect: { x: number, y: number, width: number, height: number }): boolean {
    return point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height;
}

/**
 * Checks if a point is inside a cone defined by start point, length, angle, and spread (opening angle).
 * spread is in radians.
 */
export function isPointInCone(point: Point, start: Point, length: number, directionAngle: number, spread: number): boolean {
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > length * length) return false;

    const pointAngle = Math.atan2(dy, dx);
    let diff = pointAngle - directionAngle;

    // Normalize angle difference to [-PI, PI]
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    return Math.abs(diff) <= spread / 2;
}
