import { supabase } from "@/integrations/supabase/client";

/**
 * Upload an image file to Supabase Storage and return its public URL.
 * If the value is already a URL (not base64), returns it as-is.
 */
export const uploadImageToStorage = async (
  file: File,
  folder: string = "general"
): Promise<string> => {
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

  const { error } = await supabase.storage
    .from("site-images")
    .upload(fileName, file, { cacheControl: "31536000", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage
    .from("site-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

/**
 * Check if a string is a base64 data URL
 */
export const isBase64 = (str: string | null): boolean => {
  if (!str) return false;
  return str.startsWith("data:");
};
