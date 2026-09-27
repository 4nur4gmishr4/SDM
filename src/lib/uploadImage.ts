import { compressImage, type CompressionResult } from './imageCompression';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Universal Image Upload Utility with Client-Side SDK Integration
 * Compresses images client-side into lightweight WebP (~30-70KB)
 * and uploads directly to Supabase Storage bucket ('store-media')
 * via client-side SDK tokens, eliminating reliance on dev-only /api/upload.
 */

export interface UploadImageResult {
  url: string;
  compression?: CompressionResult;
}

export async function uploadImageFile(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    folder?: string;
    onCompressed?: (info: CompressionResult) => void;
  }
): Promise<string> {
  let processedFile: File | Blob = file;
  let fileData = '';
  let mimeType = file.type || 'image/jpeg';
  let fileName = file.name;
  let compressionInfo: CompressionResult | undefined;

  // 1. Automatically compress images (skip if video or svg)
  if (file.type.startsWith('image/') && !file.type.includes('svg')) {
    try {
      compressionInfo = await compressImage(file, {
        maxWidth: options?.maxWidth,
        maxHeight: options?.maxHeight,
        quality: options?.quality,
        targetMimeType: 'image/webp',
      });
      processedFile = compressionInfo.file;
      fileData = compressionInfo.base64;
      mimeType = compressionInfo.mimeType;
      fileName = compressionInfo.fileName;
      if (options?.onCompressed) {
        options.onCompressed(compressionInfo);
      }
    } catch (compErr) {
      console.warn('Client-side compression fallback to original file:', compErr);
    }
  }

  // 2. Primary Standardized Pipeline: Upload directly to Supabase Storage bucket 'store-media'
  if (isSupabaseConfigured) {
    try {
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const folder = options?.folder || 'uploads';
      const storagePath = `${folder}/${Date.now()}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('store-media')
        .upload(storagePath, processedFile, {
          contentType: mimeType,
          upsert: true,
          cacheControl: '3600',
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('store-media')
          .getPublicUrl(storagePath);

        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      } else if (error) {
        console.warn('Direct Supabase Storage upload error:', error.message);
      }
    } catch (supaErr) {
      console.warn('Direct Supabase Storage upload exception:', supaErr);
    }
  }

  // 3. Secondary Fallback: Dev-server Vite middleware (/api/upload)
  try {
    if (!fileData) {
      fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const commaIdx = result.indexOf(',');
          resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(processedFile as Blob);
      });
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        fileData,
        mimeType,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('Secondary /api/upload unavailable, using data URL fallback:', err);
  }

  // 4. Safe offline fallback: Base64 Data URL
  return `data:${mimeType};base64,${fileData}`;
}
