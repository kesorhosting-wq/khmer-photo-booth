import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isBase64(str: string): boolean {
  return str.startsWith("data:");
}

function base64ToUint8Array(base64Str: string): { data: Uint8Array; mimeType: string; ext: string } {
  const match = base64Str.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid base64 string");
  
  const mimeType = match[1];
  const raw = atob(match[2]);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  
  const extMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico",
  };
  
  return { data: arr, mimeType, ext: extMap[mimeType] || "png" };
}

async function uploadBase64ToStorage(
  supabase: any,
  base64Str: string,
  folder: string,
  id: string
): Promise<string> {
  const { data, mimeType, ext } = base64ToUint8Array(base64Str);
  const fileName = `${folder}/${id}-${Date.now()}.${ext}`;
  
  const { error } = await supabase.storage
    .from("site-images")
    .upload(fileName, data, { contentType: mimeType, cacheControl: "31536000", upsert: false });
  
  if (error) throw error;
  
  const { data: urlData } = supabase.storage.from("site-images").getPublicUrl(fileName);
  return urlData.publicUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results = { products: 0, siteSettings: 0, errors: [] as string[] };

    // 1. Migrate product images
    const { data: products } = await supabase
      .from("products")
      .select("id, image_url")
      .not("image_url", "is", null);

    if (products) {
      for (const product of products) {
        if (product.image_url && isBase64(product.image_url)) {
          try {
            const newUrl = await uploadBase64ToStorage(supabase, product.image_url, "products", product.id);
            await supabase.from("products").update({ image_url: newUrl }).eq("id", product.id);
            results.products++;
          } catch (e: any) {
            results.errors.push(`Product ${product.id}: ${e.message}`);
          }
        }
      }
    }

    // 2. Migrate site_settings images
    const imageColumns = [
      "logo_url", "header_bg_url", "loading_image_url", "favicon_url",
      "body_bg_image_url", "product_card_bg_image_url", "dialog_bg_image_url",
      "dialog_facebook_icon_url", "dialog_tiktok_icon_url", "dialog_telegram_icon_url",
      "footer_facebook_icon_url", "footer_tiktok_icon_url", "footer_telegram_icon_url",
      "footer_payment_icon_url",
    ];

    const { data: settings } = await supabase
      .from("site_settings")
      .select(`id, ${imageColumns.join(", ")}`)
      .maybeSingle();

    if (settings) {
      const updates: Record<string, string> = {};
      for (const col of imageColumns) {
        const val = (settings as any)[col];
        if (val && isBase64(val)) {
          try {
            const newUrl = await uploadBase64ToStorage(supabase, val, "site", `${col}-${settings.id}`);
            updates[col] = newUrl;
            results.siteSettings++;
          } catch (e: any) {
            results.errors.push(`Setting ${col}: ${e.message}`);
          }
        }
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("site_settings").update(updates).eq("id", settings.id);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      migrated: { products: results.products, siteSettings: results.siteSettings },
      errors: results.errors,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
