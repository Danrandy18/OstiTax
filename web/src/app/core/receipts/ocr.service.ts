import { Injectable } from '@angular/core';

export interface OcrResult {
  text: string;
  /** Miniatura JPEG reducida del recibo. */
  thumbnail: string | null;
}

/**
 * OCR en el navegador con Tesseract.js: la imagen no sale del dispositivo. La libreria y los
 * datos de idioma (aleman + ingles) se descargan la primera vez que se usa, no antes.
 */
@Injectable({ providedIn: 'root' })
export class OcrService {
  async recognize(file: File, onProgress: (ratio: number) => void): Promise<OcrResult> {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker(['deu', 'eng'], 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') onProgress(m.progress);
      },
    });
    try {
      const { data } = await worker.recognize(file);
      return { text: data.text, thumbnail: await this.thumbnail(file) };
    } finally {
      await worker.terminate();
    }
  }

  private async thumbnail(file: File): Promise<string | null> {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 160 / bitmap.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.6);
    } catch {
      return null;
    }
  }
}
