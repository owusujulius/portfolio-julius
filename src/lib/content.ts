import { supabase } from './supabase';
import { getPublicAssetUrl } from './storage';

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string;
  tech_stack: string[];
  live_url?: string | null;
  github_url?: string | null;
  image_path?: string | null;
  imageUrl: string;
  status: 'draft' | 'published';
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  cover_image_path?: string | null;
  coverImageUrl: string;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  read_at?: string | null;
  archived: boolean;
}

function mapProject(row: any): Project {
  return {
    ...row,
    tech_stack: row.tech_stack || [],
    imageUrl: getPublicAssetUrl(row.image_path),
  } as Project;
}

function mapPost(row: any): Post {
  return {
    ...row,
    tags: row.tags || [],
    coverImageUrl: getPublicAssetUrl(row.cover_image_path),
  } as Post;
}

export async function fetchProjects(options: { publishedOnly?: boolean; limit?: number } = {}): Promise<Project[]> {
  let query = supabase.from('projects').select('*');
  if (options.publishedOnly !== false) query = query.eq('status', 'published');
  query = query.order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapProject);
}

export async function fetchPosts(options: { publishedOnly?: boolean; limit?: number } = {}): Promise<Post[]> {
  let query = supabase.from('posts').select('*');
  if (options.publishedOnly !== false) query = query.eq('status', 'published');
  query = query.order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapPost);
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase.from('posts').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data ? mapPost(data) : null;
}
