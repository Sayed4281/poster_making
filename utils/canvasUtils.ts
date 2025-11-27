import { Rect, ProcessingOptions } from '../types';

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
};

/**
 * Compresses and resizes an image to ensure it fits in LocalStorage/Database.
 * Max width/height set to 1024px by default.
 */
export const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        } else {
          width = (width * maxWidth) / height;
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context error'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (err) => reject(err);
  });
};

/**
 * Merges the user face onto the template based on the defined rectangle.
 */
export const mergeImages = async (
  templateSrc: string,
  faceSrc: string,
  rect: Rect,
  options: ProcessingOptions
): Promise<string> => {
  const [templateImg, faceImg] = await Promise.all([
    loadImage(templateSrc),
    loadImage(faceSrc),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = templateImg.width;
  canvas.height = templateImg.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Draw Template
  ctx.drawImage(templateImg, 0, 0);

  // 2. Prepare Face Image (Offscreen canvas for rotation/adjustments)
  const faceCanvas = document.createElement('canvas');
  // Make the face canvas large enough to hold the rotated image
  const maxDim = Math.sqrt(Math.pow(faceImg.width, 2) + Math.pow(faceImg.height, 2));
  faceCanvas.width = maxDim;
  faceCanvas.height = maxDim;
  const fCtx = faceCanvas.getContext('2d');
  if (!fCtx) throw new Error('Could not get face context');

  // Center and Rotate
  fCtx.translate(maxDim / 2, maxDim / 2);
  fCtx.rotate((options.rotation * Math.PI) / 180);
  fCtx.drawImage(faceImg, -faceImg.width / 2, -faceImg.height / 2);

  // Calculate destination coordinates
  const destX = (rect.x / 100) * canvas.width;
  const destY = (rect.y / 100) * canvas.height;
  const destW = (rect.width / 100) * canvas.width;
  const destH = (rect.height / 100) * canvas.height;

  // Save context state before applying filters or clipping
  ctx.save();

  // Apply Clipping if Shape is Circle/Ellipse
  if (rect.shape === 'circle') {
    ctx.beginPath();
    // Ellipse allows for oval shapes if width != height, which fits the selection box UI
    ctx.ellipse(
      destX + destW / 2,
      destY + destH / 2,
      destW / 2,
      destH / 2,
      0, 0, 2 * Math.PI
    );
    ctx.clip();
  }

  // Apply filters
  // Note: ctx.filter applies to drawImage operations
  const brightness = 100 + options.brightness; // 100 is default
  const contrast = 100 + options.contrast;
  const saturate = 100 + options.saturation;
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;

  // We want to "Crop to Fit" or "Fill" the destination rect with our face
  // Simple approach: Stretch to fit (User acts as the cropper in the UI)
  ctx.drawImage(
    faceCanvas,
    (maxDim - faceImg.width) / 2, (maxDim - faceImg.height) / 2, faceImg.width, faceImg.height, // Source crop (rough center)
    destX, destY, destW, destH // Dest
  );

  // Restore state (removes clip and filter)
  ctx.restore();

  // Optional: Feathering edges could be added here with a globalCompositeOperation 'destination-in' gradient

  return canvas.toDataURL('image/png');
};

/**
 * Crops an image based on the provided rectangle (percentages).
 */
export const cropImage = async (src: string, cropRect: Rect): Promise<string> => {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No context');

  // Calculate pixel values
  const sx = (cropRect.x / 100) * img.width;
  const sy = (cropRect.y / 100) * img.height;
  const sWidth = (cropRect.width / 100) * img.width;
  const sHeight = (cropRect.height / 100) * img.height;

  // Set canvas size to the cropped size
  canvas.width = sWidth;
  canvas.height = sHeight;

  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

  return canvas.toDataURL('image/png');
};
