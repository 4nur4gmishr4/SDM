/**
 * Universal Image Upload Utility
 * Handles uploading local image files to Supabase Storage via /api/upload
 * with seamless fallback to Base64 Data URL.
 */

export async function uploadImageFile(file: File): Promise<string> {
  // Convert file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 without prefix: "data:image/png;base64,..." -> "..."
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  // 1. Try uploading to /api/upload (which puts it in Supabase Storage or /uploads/)
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileData: base64Data,
        mimeType: file.type || 'image/jpeg',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('Network upload to /api/upload failed, falling back to data URL:', err);
  }

  // 2. Fallback: Return standard Data URL
  return `data:${file.type || 'image/jpeg'};base64,${base64Data}`;
}
