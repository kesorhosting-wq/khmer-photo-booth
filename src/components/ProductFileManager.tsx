import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, File, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ProductFile } from "@/types/shop";

interface ProductFileManagerProps {
  productId: string;
}

export const ProductFileManager = ({ productId }: ProductFileManagerProps) => {
  const [file, setFile] = useState<ProductFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFile();
  }, [productId]);

  const fetchFile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_files")
      .select("*")
      .eq("product_id", productId)
      .maybeSingle();

    if (data) {
      setFile(data as ProductFile);
    } else {
      setFile(null);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Max 50MB
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setUploading(true);

    try {
      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}.${fileExt}`;
      const filePath = `${productId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-files")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("product-files")
        .getPublicUrl(filePath);

      // Delete old file record if exists
      if (file) {
        await supabase.from("product_files").delete().eq("id", file.id);
        // Also delete old file from storage
        const oldPath = file.file_url.split('/product-files/')[1];
        if (oldPath) {
          await supabase.storage.from("product-files").remove([oldPath]);
        }
      }

      // Save file record
      const { error: dbError } = await supabase
        .from("product_files")
        .insert({
          product_id: productId,
          file_url: publicUrl,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
        });

      if (dbError) throw dbError;

      toast.success("File uploaded successfully!");
      fetchFile();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!file) return;

    try {
      // Delete from storage
      const filePath = file.file_url.split('/product-files/')[1];
      if (filePath) {
        await supabase.storage.from("product-files").remove([filePath]);
      }

      // Delete record
      const { error } = await supabase
        .from("product_files")
        .delete()
        .eq("id", file.id);

      if (error) throw error;

      toast.success("File deleted");
      setFile(null);
    } catch (error: any) {
      toast.error("Failed to delete file");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4 border-t border-gold/20 pt-4">
      <Label className="text-foreground font-semibold flex items-center gap-2">
        <Upload className="w-4 h-4" />
        Downloadable File
      </Label>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : file ? (
        <div className="flex items-center gap-3 p-3 bg-input/50 rounded-lg border border-gold/20">
          <File className="w-8 h-8 text-gold flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{file.file_name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteFile}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/60 transition-colors bg-input/50">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-gold animate-spin mb-2" />
              <span className="text-muted-foreground text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gold/50 mb-2" />
              <span className="text-muted-foreground text-sm">Click to upload file (max 50MB)</span>
              <span className="text-muted-foreground text-xs mt-1">
                This file will be available for download after purchase
              </span>
            </>
          )}
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
};
