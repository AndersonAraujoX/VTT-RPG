import DiceBox from '@3d-dice/dice-box';

class DiceService {
    private box: any = null;
    private isInitialized = false;

    async init() {
        if (this.isInitialized) return;

        // Construct absolute asset path based on current window location
        // This solves GitHub pages dropping the repo name from the path if there is no trailing slash
        let path = window.location.pathname;
        if (path.includes('.html')) {
            path = path.substring(0, path.lastIndexOf('/'));
        }
        if (!path.endsWith('/')) path += '/';
        const absoluteAssetPath = window.location.origin + path + 'dice-box/';

        this.box = new DiceBox({
            container: "#dice-box-container",
            assetPath: absoluteAssetPath,
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
