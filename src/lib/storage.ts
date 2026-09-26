import { supabase } from './supabase';

const MEDIA_BUCKET = 'portfolio-media';

export function getPublicAssetUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return path;
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadPortfolioAsset(file: File, folder: string): Promise<string> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('You must be signed in to upload files.');

  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : 'bin';
  const safeExtension = extension && /^[a-z0-9]+$/.test(extension) ? extension : 'bin';
  const path = `${authData.user.id}/${folder}/${crypto.randomUUID()}.${safeExtension}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;
  return path;
}
