// lib/uploadImage.ts
import { supabase } from './supabaseClient';

export async function uploadPostImage(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `posts/${fileName}`;

  // Subir archivo al bucket post-images
  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error al subir la imagen:', uploadError);
    throw uploadError;
  }

  // Obtener URL pública
  const { data } = supabase.storage
    .from('post-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
