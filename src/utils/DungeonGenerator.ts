export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DungeonData {
    rooms: Rect[];
    corridors: Rect[];
    walls: { p1: { x: number, y: number }, p2: { x: number, y: number } }[];
}

export function generateDungeon(width: number, height: number, minRoomSize: number = 5, maxRooms: number = 10): DungeonData {
    const rooms: Rect[] = [];
    const corridors: Rect[] = [];

    // Simple Random Room Placement (easier to implement and often better for VTT maps)
    for (let i = 0; i < maxRooms; i++) {
        const w = Math.floor(Math.random() * (width / 4 - minRoomSize)) + minRoomSize;
        const h = Math.floor(Math.random() * (height / 4 - minRoomSize)) + minRoomSize;
        const x = Math.floor(Math.random() * (width - w - 2)) + 1;
        const y = Math.floor(Math.random() * (height - h - 2)) + 1;

        const newRoom: Rect = { x, y, width: w, height: h };

        // Check intersection
        const intersects = rooms.some(other => {
            return !(newRoom.x + newRoom.width < other.x ||
                newRoom.x > other.x + other.width ||
                newRoom.y + newRoom.height < other.y ||
                newRoom.y > other.y + other.height);
        });

        if (!intersects) {
            if (rooms.length > 0) {
                const prevRoom = rooms[rooms.length - 1];
                const prevCenter = { x: prevRoom.x + Math.floor(prevRoom.width / 2), y: prevRoom.y + Math.floor(prevRoom.height / 2) };
                const currCenter = { x: newRoom.x + Math.floor(newRoom.width / 2), y: newRoom.y + Math.floor(newRoom.height / 2) };

                // Horizontal then Vertical corridor
                corridors.push({
                    x: Math.min(prevCenter.x, currCenter.x),
                    y: prevCenter.y,
                    width: Math.abs(prevCenter.x - currCenter.x) + 1,
                    height: 1
                });
                corridors.push({
                    x: currCenter.x,
                    y: Math.min(prevCenter.y, currCenter.y),
                    width: 1,
                    height: Math.abs(prevCenter.y - currCenter.y) + 1
                });
            }
            rooms.push(newRoom);
        }
    }

    // Generate Walls based on rooms and corridors
    // This is a simplified version: just the outlines of rooms
    const walls: DungeonData['walls'] = [];
    rooms.forEach(r => {
        // Top
        walls.push({ p1: { x: r.x, y: r.y }, p2: { x: r.x + r.width, y: r.y } });
        // Bottom
        walls.push({ p1: { x: r.x, y: r.y + r.height }, p2: { x: r.x + r.width, y: r.y + r.height } });
        // Left
        walls.push({ p1: { x: r.x, y: r.y }, p2: { x: r.x, y: r.y + r.height } });
        // Right
        walls.push({ p1: { x: r.x + r.width, y: r.y }, p2: { x: r.x + r.width, y: r.y + r.height } });
    });

    return { rooms, corridors, walls };
}
