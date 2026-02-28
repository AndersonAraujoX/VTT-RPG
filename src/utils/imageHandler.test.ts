import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processImageUpload } from './imageHandler';

describe('processImageUpload', () => {
    beforeEach(() => {
        // Mock FileReader completely
        const mockFileReader = {
            readAsDataURL: vi.fn(function (this: any, file: File) {
                // Determine mock result based on file name or size
                if (file.name === 'error.png') {
                    if (this.onerror) this.onerror(new Event('error'));
                } else {
                    this.result = `data:image/png;base64,mocked_${file.name}`;
                    if (this.onload) this.onload({ target: this } as any);
                }
            }),
            onload: null as any,
            onerror: null as any,
            result: null as any,
        };
        vi.stubGlobal('FileReader', vi.fn(function () { return mockFileReader; }) as any);

        // Mock Image completely
        const mockImage = {
            onload: null as any,
            onerror: null as any,
            src: '',
            width: 800,
            height: 600,
        };

        // Define setter/getter for src to trigger onload synchronously for the test
        Object.defineProperty(mockImage, 'src', {
            get() { return this._src; },
            set(val) {
                this._src = val;
                if (val.includes('error')) {
                    if (this.onerror) setTimeout(() => this.onerror(new Event('error')), 0);
                } else {
                    if (this.onload) setTimeout(() => this.onload(new Event('load')), 0);
                }
            }
        });

        vi.stubGlobal('Image', vi.fn(function () { return mockImage; }) as any);

        // Mock Canvas completely
        const mockContext = {
            drawImage: vi.fn(),
            fillStyle: '',
            fillRect: vi.fn(),
        };

        const mockCanvas = {
            getContext: vi.fn(() => mockContext),
            toDataURL: vi.fn((type, _quality) => `data:${type};base64,compressed_mock`),
            width: 0,
            height: 0,
        };

        vi.stubGlobal('document', {
            createElement: vi.fn((tag) => {
                if (tag === 'canvas') return mockCanvas;
                return {};
            }) as any
        });
    });

    it('should process a map image and return a compressed JPEG base64', async () => {
        const file = new File(['dummy content'], 'map.png', { type: 'image/png' });
        const result = await processImageUpload(file, true);

        expect(result).toBe('data:image/jpeg;base64,compressed_mock');
    });

    it('should process a token image and return a compressed PNG base64', async () => {
        const file = new File(['dummy content'], 'token.png', { type: 'image/png' });
        const result = await processImageUpload(file, false);

        expect(result).toBe('data:image/png;base64,compressed_mock');
    });

    it('should handle image loading errors by returning the raw Data URL fallback', async () => {
        const file = new File(['dummy content'], 'error_img.png', { type: 'image/png' });
        // Setting up the mock reader to return a specific data URL, but image throws error
        const result = await processImageUpload(file, true);

        // Because the file name isn't 'error.png', FileReader succeeds, but the image mock will throw because 'error_img.png' is in the src?
        // Wait, the Image mock checks `.includes('error')` on `src`.
        // The Data URL will be `data:image/png;base64,mocked_error_img.png` which includes 'error'.
        expect(result).toBe('data:image/png;base64,mocked_error_img.png');
    });

    it('should fail gracefully if FileReader errors out', async () => {
        const file = new File(['dummy content'], 'error.png', { type: 'image/png' });
        const result = await processImageUpload(file, true);

        expect(result).toBe('');
    });
});
