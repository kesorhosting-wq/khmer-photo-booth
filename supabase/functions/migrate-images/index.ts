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
    "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg",
    "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg",
    "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico",
  };
  
  return { data: arr, mimeType, ext: extMap[mimeType] || "png" };
}

async function uploadBase64(supabase: any, base64Str: string, folder: string, id: string): Promise<string> {
  const { data, mimeType, ext } = base64ToUint8Array(base64Str);
  const fileName = `${folder}/${id}-${Date.now()}.${ext}`;
  
  const { error } = await supabase.storage
    .from("site-images")
    .upload(fileName, data, { contentType: mimeType, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  
  const { data: urlData } = supabase.storage.from("site-images").getPublicUrl(fileName);
  return urlData.publicUrl;
}

const SITE_IMAGE_COLS = [
  "logo_url", "header_bg_url", "loading_image_url", "favicon_url",
  "body_bg_image_url", "product_card_bg_image_url", "dialog_bg_image_url",
  "dialog_facebook_icon_url", "dialog_tiktok_icon_url", "dialog_telegram_icon_url",
  "footer_facebook_icon_url", "footer_tiktok_icon_url", "footer_telegram_icon_url",
  "footer_payment_icon_url",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "count";

    if (mode === "count") {
      // Count how many base64 images exist
      let total = 0;
      const { data: products } = await supabase.from("products").select("id, image_url");
      if (products) {
        total += products.filter((p: any) => p.image_url && isBase64(p.image_url)).length;
      }

      const { data: settings } = await supabase
        .from("site_settings")
        .select(`id, ${SITE_IMAGE_COLS.join(", ")}`)
        .maybeSingle();

      if (settings) {
        for (const col of SITE_IMAGE_COLS) {
          if ((settings as any)[col] && isBase64((settings as any)[col])) total++;
        }
      }

      return new Response(JSON.stringify({ total }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "migrate-product") {
      const productId = body.productId;
      const { data: product } = await supabase
        .from("products")
        .select("id, image_url")
        .eq("id", productId)
        .single();

      if (product?.image_url && isBase64(product.image_url)) {
        const newUrl = await uploadBase64(supabase, product.image_url, "products", product.id);
        await supabase.from("products").update({ image_url: newUrl }).eq("id", product.id);
        return new Response(JSON.stringify({ success: true, newUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "migrate-settings") {
      const { data: settings } = await supabase
        .from("site_settings")
        .select(`id, ${SITE_IMAGE_COLS.join(", ")}`)
        .maybeSingle();

      if (!settings) {
        return new Response(JSON.stringify({ success: true, migrated: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, string> = {};
      let migrated = 0;
      for (const col of SITE_IMAGE_COLS) {
        const val = (settings as any)[col];
        if (val && isBase64(val)) {
          const newUrl = await uploadBase64(supabase, val, "site", `${col}-${settings.id}`);
          updates[col] = newUrl;
          migrated++;
        }
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("site_settings").update(updates).eq("id", settings.id);
      }

      return new Response(JSON.stringify({ success: true, migrated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "list-base64-products") {
      const { data: products } = await supabase.from("products").select("id");
      const ids = (products || [])
        .map((p: any) => p.id);
      
      // Need to check which ones have base64 — fetch image_url for each
      const base64Ids: string[] = [];
      for (const id of ids) {
        const { data } = await supabase.from("products").select("image_url").eq("id", id).single();
        if (data?.image_url && isBase64(data.image_url)) {
          base64Ids.push(id);
        }
      }
      return new Response(JSON.stringify({ ids: base64Ids }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
