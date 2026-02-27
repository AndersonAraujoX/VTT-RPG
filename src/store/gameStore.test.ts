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
                fogEnabled: false,
                revealedAreas: [],
                dynamicLightingEnabled: false
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

    it('should update token HP and retain other stats', () => {
        const token = {
            id: '2',
            x: 0,
            y: 0,
            size: 1,
            image: '',
            label: 'Test Token',
            stats: { hp: 10, maxHp: 10, ac: 10 }
        };
        useGameStore.getState().addToken(token);

        useGameStore.getState().updateToken('2', { stats: { hp: 5, maxHp: 10, ac: 10 } });

        const updatedToken = useGameStore.getState().tokens.find(t => t.id === '2');
        expect(updatedToken?.stats?.hp).toBe(5);
        expect(updatedToken?.stats?.maxHp).toBe(10);
        expect(updatedToken?.label).toBe('Test Token');
    });

    it('should add and update conditions', () => {
        const token = {
            id: '3',
            x: 0,
            y: 0,
            size: 1,
            image: '',
            label: 'Test Token'
        };
        useGameStore.getState().addToken(token);

        // Add condition
        useGameStore.getState().updateToken('3', { conditions: ['poisoned'] });
        expect(useGameStore.getState().tokens.find(t => t.id === '3')?.conditions).toContain('poisoned');

        // Add another condition
        useGameStore.getState().updateToken('3', { conditions: ['poisoned', 'stunned'] });
        expect(useGameStore.getState().tokens.find(t => t.id === '3')?.conditions).toHaveLength(2);
        expect(useGameStore.getState().tokens.find(t => t.id === '3')?.conditions).toContain('stunned');
    });

    it('should set map background', () => {
        useGameStore.getState().updateMap({ url: 'http://example.com/map.jpg' });
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
