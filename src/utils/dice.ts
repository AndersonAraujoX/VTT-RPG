export const rollDice = (formula: string) => {
    // e.g. "1d20+5"
    const match = formula.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) return null;

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const mod = match[3] ? parseInt(match[3]) : 0;

    let total = 0;
    const rolls = [];
    for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        total += r;
    }
    total += mod;

    return { total, rolls, mod };
};
