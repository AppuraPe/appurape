export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File, label: string): string | null {
  if (!file.type.startsWith('image/')) {
    return `${label} debe ser una imagen.`;
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return `${label} no puede superar 5 MB.`;
  }

  return null;
}
