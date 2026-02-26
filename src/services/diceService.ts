import DiceBox from '@3d-dice/dice-box';

class DiceService {
    private box: any = null;
    private isInitialized = false;

    async init() {
        if (this.isInitialized) return;

        this.box = new DiceBox("#dice-box-container", {
            assetPath: 'https://unpkg.com/@3d-dice/dice-box@1.1.4/dist/assets/',
            theme: 'default',
            themeColor: '#8b5cf6', // purple-500
            scale: 6,
            spinForce: 6,
            throwForce: 6,
            startingHeight: 8,
            lightIntensity: 1,
            shadows: true,
            gravity: 1
        });

        await this.box.init();
        this.isInitialized = true;
    }

    async roll(formula: string): Promise<any> {
        if (!this.isInitialized) await this.init();

        try {
            // DiceBox roll returns an array of result groups
            const result = await this.box.roll(formula);
            return result;
        } catch (e) {
            console.error("Dice roll failed:", e);
            throw e;
        }
    }

    clear() {
        if (this.isInitialized && this.box) {
            this.box.clear();
        }
    }
}

export const diceService = new DiceService();
