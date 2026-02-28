export const processImageUpload = (file: File, isMap: boolean): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxW = isMap ? 2048 : 256;
                const maxH = isMap ? 2048 : 256;
                let w = img.width || maxW;
                let h = img.height || maxH;

                if (w > maxW || h > maxH) {
                    const ratio = Math.min(maxW / w, maxH / h);
                    w = Math.floor(w * ratio);
                    h = Math.floor(h * ratio);
                }

                // Protect against 0x0
                w = Math.max(1, w);
                h = Math.max(1, h);

                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Fill background to avoid transparent black artifacts on JPEG
                    if (isMap) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, w, h);
                    }
                    ctx.drawImage(img, 0, 0, w, h);
                }

                const resultBase64 = canvas.toDataURL(isMap ? 'image/jpeg' : 'image/png', isMap ? 0.8 : undefined);
                console.log(`processImageUpload ${isMap ? 'Map' : 'Token'} Generated size:`, resultBase64.length, 'bytes');
                resolve(resultBase64);
            };
            img.onerror = () => {
                console.warn('Image onload failed, falling back to raw dataUrl');
                resolve(dataUrl); // fallback
            }
            img.src = dataUrl;
        };
        reader.onerror = () => {
            console.error('FileReader failed to read file');
            resolve('');
        };
        reader.readAsDataURL(file);
    });
};
