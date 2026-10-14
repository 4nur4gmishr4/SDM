/**
 * Client-Side Image Compression Engine
 * Compresses images before uploading to Supabase Storage.
 * Converts high-res (3-15MB) camera/phone photos into lightweight, crystal-sharp WebP
 * (~30KB-70KB), saving 95%+ Supabase storage space and network bandwidth.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetMimeType?: 'image/webp' | 'image/jpeg';
}

export interface CompressionResult {
  file: File;
  dataUrl: string;
  base64: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  width: number;
  height: number;
  mimeType: string;
  fileName: string;
}

/**
 * Compresses any image File in the browser using Canvas 2D
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.82,
    targetMimeType = 'image/webp',
  } = options;

  // Don't compress SVGs or videos
  if (file.type.includes('svg') || file.type.startsWith('video/')) {
    const base64 = await fileToBase64(file);
    return {
      file,
      dataUrl: `data:${file.type};base64,${base64}`,
      base64,
      originalSize: file.size,
      compressedSize: file.size,
      savingsPercent: 0,
      width: 0,
      height: 0,
      mimeType: file.type,
      fileName: file.name,
    };
  }

  // Load image into an HTMLImageElement
  const img = await loadImageFromFile(file);

  // Calculate proportional dimensions
  let { width, height } = img;
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Draw onto canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true });

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Better downsampling quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Export to Blob
  let blob: Blob | null = null;
  let finalMime = targetMimeType;

  try {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), targetMimeType, quality);
    });
  } catch (e) {
    console.warn('WebP export failed, trying JPEG fallback:', e);
  }

  // Fallback to jpeg if webp not supported
  if (!blob || blob.size === 0) {
    finalMime = 'image/jpeg';
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });
  }

  if (!blob) {
    throw new Error('Failed to compress image onto canvas blob');
  }

  // If compressed file ended up larger than original (rare, e.g. tiny thumbnail), keep original
  let finalBlob = blob;
  let finalSize = blob.size;
  let usedCompressed = true;

  if (file.size <= blob.size && file.type === finalMime) {
    finalBlob = file;
    finalSize = file.size;
    usedCompressed = false;
  }

  // Construct new file name with .webp or .jpg
  const ext = finalMime === 'image/webp' ? '.webp' : '.jpg';
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const newFileName = `${baseName}${ext}`;

  const compressedFile = new File([finalBlob], newFileName, {
    type: finalMime,
    lastModified: Date.now(),
  });

  // Convert to base64
  const base64 = await fileToBase64(compressedFile);
  const dataUrl = `data:${finalMime};base64,${base64}`;

  const savingsPercent = usedCompressed
    ? Math.max(0, Math.round(((file.size - finalSize) / file.size) * 100))
    : 0;

  return {
    file: compressedFile,
    dataUrl,
    base64,
    originalSize: file.size,
    compressedSize: finalSize,
    savingsPercent,
    width,
    height,
    mimeType: finalMime,
    fileName: newFileName,
  };
}

/**
 * Format bytes into human-readable string (e.g. 4.2 MB, 48 KB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const comma = res.indexOf(',');
      resolve(comma >= 0 ? res.slice(comma + 1) : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
