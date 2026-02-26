import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, type Token } from './gameStore';

describe('GameStore Immersion & Integration', () => {
    beforeEach(() => {
        useGameStore.setState({
            tokens: []
        });
    });

    it('should update token light radius', () => {
        const store = useGameStore.getState();
        const t1: Token = { id: 't1', x: 0, y: 0, size: 1, image: '' };
        store.addToken(t1);

        // Update token to have light radius
        store.updateToken('t1', { lightRadius: 20 });

        expect(useGameStore.getState().tokens[0].lightRadius).toBe(20);
    });

    it('should update token attributes and skills', () => {
        const store = useGameStore.getState();
        const t2: Token = {
            id: 't2',
            x: 0,
            y: 0,
            size: 1,
            image: '',
            stats: { hp: 10, maxHp: 10, ac: 10 }
        };
        store.addToken(t2);

        // Update stats deeply
        const updatedStats = {
            ...t2.stats!,
            attributes: {
                strength: 16,
                dexterity: 14,
                constitution: 12,
                intelligence: 10,
                wisdom: 8,
                charisma: 18
            },
            skills: {
                'stealth': 4,
                'perception': 1
            }
        };

        store.updateToken('t2', { stats: updatedStats });

        const token = useGameStore.getState().tokens[0];
        expect(token.stats?.attributes?.strength).toBe(16);
        expect(token.stats?.skills?.['stealth']).toBe(4);
    });

    it('should automatically apply Dead and Prone when HP hits 0', () => {
        const store = useGameStore.getState();
        const t3: Token = { id: 't3', x: 0, y: 0, size: 1, image: '', stats: { hp: 10, maxHp: 10, ac: 10 } };
        store.addToken(t3);

        // Drop to 0 HP
        store.updateToken('t3', { stats: { hp: 0, maxHp: 10, ac: 10 } });

        const token = useGameStore.getState().tokens.find(t => t.id === 't3')!;
        expect(token.conditions).toContain('Dead');
        expect(token.conditions).toContain('Prone');
    });

    it('should save auras array to token', () => {
        const store = useGameStore.getState();
        const t4: Token = { id: 't4', x: 0, y: 0, size: 1, image: '' };
        store.addToken(t4);

        store.updateToken('t4', { auras: [{ id: '1', radius: 10, color: '#ff0000' }] });

        const token = useGameStore.getState().tokens.find(t => t.id === 't4')!;
        expect(token.auras?.[0].color).toBe('#ff0000');
    });
});
