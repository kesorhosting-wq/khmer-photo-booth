import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  fetchProducts: () => void;
}

export const MigrateImagesButton = ({ fetchProducts }: Props) => {
  const [open, setOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState("");

  const startMigration = async () => {
    setMigrating(true);
    setProgress(0);
    setCurrent(0);
    setStatus("Counting base64 images...");

    try {
      // Step 1: Count
      const { data: countData, error: countErr } = await supabase.functions.invoke("migrate-images", {
        body: { mode: "count" },
      });
      if (countErr) throw countErr;

      const totalImages = countData.total || 0;
      setTotal(totalImages);

      if (totalImages === 0) {
        setStatus("✅ No base64 images found. Everything is already on CDN!");
        setProgress(100);
        setMigrating(false);
        return;
      }

      let done = 0;

      // Step 2: Get list of base64 product IDs
      setStatus("Finding products with base64 images...");
      const { data: listData, error: listErr } = await supabase.functions.invoke("migrate-images", {
        body: { mode: "list-base64-products" },
      });
      if (listErr) throw listErr;

      const productIds: string[] = listData.ids || [];

      // Step 3: Migrate each product one by one
      for (const id of productIds) {
        setCurrent(done + 1);
        setStatus(`Uploading product image ${done + 1}/${totalImages}...`);
        
        const { error } = await supabase.functions.invoke("migrate-images", {
          body: { mode: "migrate-product", productId: id },
        });
        if (error) {
          console.error(`Failed product ${id}:`, error);
        }
        done++;
        setProgress(Math.round((done / totalImages) * 100));
      }

      // Step 4: Migrate site settings
      setStatus("Uploading site setting images...");
      const { data: settingsData, error: settingsErr } = await supabase.functions.invoke("migrate-images", {
        body: { mode: "migrate-settings" },
      });
      if (settingsErr) {
        console.error("Settings migration error:", settingsErr);
      } else {
        done += settingsData.migrated || 0;
      }

      setProgress(100);
      setStatus(`✅ Done! Migrated ${done} images to CDN.`);
      toast.success(`Migration complete! ${done} images moved to CDN.`);
      fetchProducts();
    } catch (e: any) {
      setStatus(`❌ Error: ${e.message}`);
      toast.error("Migration failed: " + e.message);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="border-gold/30 text-foreground hover:bg-gold/10 font-display gap-2"
        onClick={() => setOpen(true)}
      >
        🔄 Migrate Images to CDN
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!migrating) setOpen(v); }}>
        <DialogContent className="bg-card border-gold/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display flex items-center gap-2">
              🖼️ Image Migration
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This will convert all base64 images stored in the database to fast CDN URLs.
              Images will load much faster after migration.
            </p>

            {total > 0 || progress > 0 ? (
              <div className="space-y-3">
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{status}</span>
                  <span className="font-mono">{progress}%</span>
                </div>
              </div>
            ) : null}

            {!migrating && progress === 0 && (
              <Button
                onClick={startMigration}
                className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
              >
                🚀 Start Migration
              </Button>
            )}

            {!migrating && progress === 100 && (
              <Button
                onClick={() => { setOpen(false); setProgress(0); setTotal(0); setStatus(""); }}
                className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
              >
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
