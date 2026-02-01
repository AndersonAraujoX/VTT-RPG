import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('Game Store', () => {
    beforeEach(() => {
        useGameStore.setState({
            tokens: [],
            chat: [],
            map: {
                url: null,
                scale: 50,
                offsetX: 0,
                offsetY: 0,
                gridType: 'square',
                fogEnabled: false,
            }
        });
    });

    it('should add a token', () => {
        const token = {
            id: '1',
            x: 0,
            y: 0,
            size: 1,
            image: '',
            stats: { hp: 10, maxHp: 10, ac: 10 }
        };
        useGameStore.getState().addToken(token);
        expect(useGameStore.getState().tokens).toHaveLength(1);
        expect(useGameStore.getState().tokens[0]).toEqual(token);
    });

    it('should update a token', () => {
        const token = {
            id: '1',
            x: 0,
            y: 0,
            size: 1,
            image: ''
        };
        useGameStore.getState().addToken(token);
        useGameStore.getState().updateToken('1', { x: 5 });

        expect(useGameStore.getState().tokens[0].x).toBe(5);
        expect(useGameStore.getState().tokens[0].y).toBe(0);
    });

    it('should remove a token', () => {
        const token = {
            id: '1',
            x: 0,
            y: 0,
            size: 1,
            image: ''
        };
        useGameStore.getState().addToken(token);
        useGameStore.getState().removeToken('1');
        expect(useGameStore.getState().tokens).toHaveLength(0);
    });

    it('should set map background', () => {
        useGameStore.getState().setMapBackground('http://example.com/map.jpg');
        expect(useGameStore.getState().map.url).toBe('http://example.com/map.jpg');
    });

    it('should add chat message', () => {
        const msg = {
            id: '1',
            senderId: 'user1',
            senderName: 'User',
            timestamp: 12345,
            content: 'Hello',
            type: 'text' as const
        };
        useGameStore.getState().addChatMessage(msg);
        expect(useGameStore.getState().chat).toHaveLength(1);
        expect(useGameStore.getState().chat[0].content).toBe('Hello');
    });
});
