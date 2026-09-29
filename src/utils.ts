/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const fetchWithRetry = async (url: string, options: RequestInit) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i <= delays.length; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (i === delays.length) return response; 
    } catch (error) {
      if (i === delays.length) throw error;
    }
    if (i < delays.length) {
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};

export const playClick = () => {
  // Sound effects removed per user request
};

export const playStartupSound = () => {
  // Sound effects removed per user request
};

export const safeCopyToClipboard = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try { document.execCommand('copy'); } catch (err) { console.error('Fallback copy failed', err); }
  document.body.removeChild(textArea);
};

export const processImageForDownload = (base64: string, ratioStr: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let targetRatio;
      if (ratioStr === '16:9') targetRatio = 16/9;
      else if (ratioStr === '9:16') targetRatio = 9/16;
      else targetRatio = 1;

      const srcRatio = img.width / img.height;
      let renderWidth, renderHeight, offsetX, offsetY;

      if (srcRatio > targetRatio) {
        renderHeight = img.height;
        renderWidth = img.height * targetRatio;
        offsetX = (img.width - renderWidth) / 2;
        offsetY = 0;
      } else {
        renderWidth = img.width;
        renderHeight = img.width / targetRatio;
        offsetX = 0;
        if (targetRatio > 1) { offsetY = (img.height - renderHeight) / 2; } 
        else { offsetY = (img.height - renderHeight) * 0.1; }
      }

      canvas.width = Math.floor(renderWidth);
      canvas.height = Math.floor(renderHeight);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight, 0, 0, canvas.width, canvas.height);
      }
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = base64;
  });
};

export const resizeImage = (base64: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = base64;
  });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

export const base64ToWavUrl = (base64PCM: string) => {
  const binaryString = window.atob(base64PCM);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const sampleRate = 24000; 
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = bytes.length;
  
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); 
  view.setUint16(20, 1, true); 
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmData = new Uint8Array(buffer, 44);
  pcmData.set(bytes);

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};
