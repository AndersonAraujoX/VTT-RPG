import { describe, it, expect } from 'vitest';
import { rollDice } from './dice';

describe('Dice Roller', () => {
    it('should roll a single die correctly', () => {
        const result = rollDice('1d20');
        expect(result).not.toBeNull();
        expect(result?.total).toBeGreaterThanOrEqual(1);
        expect(result?.total).toBeLessThanOrEqual(20);
        expect(result?.rolls.length).toBe(1);
    });

    it('should roll multiple dice correctly', () => {
        const result = rollDice('2d6');
        expect(result).not.toBeNull();
        expect(result?.total).toBeGreaterThanOrEqual(2);
        expect(result?.total).toBeLessThanOrEqual(12);
        expect(result?.rolls.length).toBe(2);
    });

    it('should apply modifiers correctly', () => {
        const result = rollDice('1d4+2');
        expect(result).not.toBeNull();
        expect(result?.total).toBeGreaterThanOrEqual(3); // 1+2
        expect(result?.total).toBeLessThanOrEqual(6); // 4+2
        expect(result?.mod).toBe(2);
    });

    it('should handle negative modifiers', () => {
        const result = rollDice('1d20-1');
        expect(result).not.toBeNull();
        expect(result?.mod).toBe(-1);
    });

    it('should return null for invalid formulas', () => {
        expect(rollDice('invalid')).toBeNull();
        expect(rollDice('d20')).toBeNull(); // Requires count
    });
});
