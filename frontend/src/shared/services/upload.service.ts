/**
 * Cloudinary Upload Service
 * 
 * Uses unsigned upload preset for client-side direct upload.
 * Configure these in .env:
 *   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
 *   VITE_CLOUDINARY_UPLOAD_PRESET=ngalir-unsigned
 * 
 * Setup di Cloudinary Dashboard:
 * 1. Settings > Upload > Upload presets > Add unsigned preset
 * 2. Set folder: "ngalir/products" (or "ngalir/avatars")
 * 3. Copy preset name ke VITE_CLOUDINARY_UPLOAD_PRESET
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Upload file ke Cloudinary (unsigned preset, client-side).
 * Returns URL yang bisa disimpan ke database.
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'posify/products',
): Promise<UploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary belum dikonfigurasi. Set VITE_CLOUDINARY_CLOUD_NAME dan VITE_CLOUDINARY_UPLOAD_PRESET di .env',
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData },
  );

  if (!response.ok) {
    throw new Error('Upload gagal. Periksa konfigurasi Cloudinary.');
  }

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}

export default { uploadToCloudinary };
