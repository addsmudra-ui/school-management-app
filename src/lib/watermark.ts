/**
 * Utility to add a watermark to an image string (base64).
 * Positions the watermark in the top-left corner with transparency.
 */
export async function addWatermark(
  base64Image: string, 
  text: string, 
  logoBase64?: string | null
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Image;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Image);
        return;
      }

      // Use original image dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Watermark styling
      const padding = canvas.width * 0.04; // 4% padding
      
      if (logoBase64) {
        const logoImg = new Image();
        logoImg.src = logoBase64;
        logoImg.onload = () => {
          const logoWidth = canvas.width * 0.2; // 20% of width
          const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
          
          ctx.globalAlpha = 0.5; // 50% Transparency
          ctx.drawImage(logoImg, padding, padding, logoWidth, logoHeight);
          ctx.globalAlpha = 1.0;
          
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        logoImg.onerror = () => {
          drawTextWatermark(ctx, canvas, text, padding);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
      } else {
        drawTextWatermark(ctx, canvas, text, padding);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      }
    };
    img.onerror = () => resolve(base64Image);
  });
}

function drawTextWatermark(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, text: string, padding: number) {
  const fontSize = Math.max(24, Math.floor(canvas.width / 15));
  ctx.font = `black ${fontSize}px sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // 50% Transparency
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Shadow for readability on light backgrounds
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 10;
  
  ctx.fillText(text, padding, padding);
}
