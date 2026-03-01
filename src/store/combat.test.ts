import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('GameStore Combat & VFX', () => {
    beforeEach(() => {
        useGameStore.setState({
            tokens: [
                {
                    id: 't1',
                    x: 0,
                    y: 0,
                    size: 1,
                    image: '',
                    label: 'Hero',
                    stats: { hp: 20, maxHp: 20, ac: 15 },
                    conditions: []
                },
                {
                    id: 't2',
                    x: 2,
                    y: 2,
                    size: 1,
                    image: '',
                    label: 'Orc',
                    stats: { hp: 10, maxHp: 10, ac: 12 },
                    conditions: []
                }
            ],
            vfx: [],
            floatingTexts: []
        });
    });

    it('should update token target', () => {
        useGameStore.getState().setTarget('t1', 't2');
        const t1 = useGameStore.getState().tokens.find(t => t.id === 't1');
        expect(t1?.targetId).toBe('t2');
    });

    it('should clear token target', () => {
        useGameStore.getState().setTarget('t1', 't2');
        useGameStore.getState().setTarget('t1', null);
        const t1 = useGameStore.getState().tokens.find(t => t.id === 't1');
        expect(t1?.targetId).toBeUndefined();
    });

    it('should trigger VFX event', () => {
        const vfx = { id: 'v1', type: 'explosion' as const, x: 100, y: 100 };
        useGameStore.getState().triggerVFX(vfx);
        expect(useGameStore.getState().vfx).toContainEqual(vfx);
    });

    it('should remove VFX event', () => {
        const vfx = { id: 'v1', type: 'explosion' as const, x: 100, y: 100 };
        useGameStore.getState().triggerVFX(vfx);
        useGameStore.getState().removeVFX('v1');
        expect(useGameStore.getState().vfx).toHaveLength(0);
    });

    it('should add floating text', () => {
        const ft = { id: 'f1', x: 50, y: 50, text: '-5', color: 'red' };
        useGameStore.getState().addFloatingText(ft);
        expect(useGameStore.getState().floatingTexts).toContainEqual(ft);
    });

    it('should automate death state when HP reaching 0', () => {
        useGameStore.getState().updateToken('t2', { stats: { hp: 0, maxHp: 10, ac: 12 } });
        const t2 = useGameStore.getState().tokens.find(t => t.id === 't2');
        expect(t2?.conditions).toContain('Dead');
        expect(t2?.conditions).toContain('Prone');
    });
});
