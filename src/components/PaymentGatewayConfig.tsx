import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard, Save, ExternalLink } from "lucide-react";

interface PaymentGatewayConfig {
  node_api_url?: string;
  websocket_url?: string;
  webhook_secret?: string;
  bakong_account?: string;
  [key: string]: string | undefined;
}

interface PaymentGateway {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  config: PaymentGatewayConfig;
}

export const PaymentGatewayConfigDialog = () => {
  const [gateway, setGateway] = useState<PaymentGateway | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [isActive, setIsActive] = useState(true);
  const [nodeApiUrl, setNodeApiUrl] = useState("");
  const [websocketUrl, setWebsocketUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [bakongAccount, setBakongAccount] = useState("");

  useEffect(() => {
    if (dialogOpen) {
      fetchGateway();
    }
  }, [dialogOpen]);

  const fetchGateway = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_gateways")
      .select("*")
      .eq("slug", "ikhode-bakong")
      .maybeSingle();

    if (data) {
      const gatewayData = {
        ...data,
        config: (data.config || {}) as PaymentGatewayConfig
      };
      setGateway(gatewayData);
      setIsActive(data.is_active);
      const config = gatewayData.config;
      setNodeApiUrl(config?.node_api_url || "");
      setWebsocketUrl(config?.websocket_url || "");
      setWebhookSecret(config?.webhook_secret || "");
      setBakongAccount(config?.bakong_account || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const configData = {
      node_api_url: nodeApiUrl || "",
      websocket_url: websocketUrl || "",
      webhook_secret: webhookSecret || "",
      bakong_account: bakongAccount || "",
    };

    try {
      if (gateway) {
        // Update existing
        const { error } = await supabase
          .from("payment_gateways")
          .update({
            is_active: isActive,
            config: configData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", gateway.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from("payment_gateways").insert([{
          slug: "ikhode-bakong",
          name: "iKhode Bakong KHQR",
          is_active: isActive,
          config: configData,
        }]);

        if (error) throw error;
      }

      toast.success("Payment gateway configuration saved!");
      fetchGateway();
    } catch (error: any) {
      toast.error(error.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gold/30 text-foreground hover:bg-gold/10 gap-2">
          <CreditCard className="w-4 h-4" />
          Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-gold/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="gold-text text-xl font-display flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Bakong KHQR Configuration
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Enable Payment Gateway</Label>
                <p className="text-xs text-muted-foreground">Turn on to accept KHQR payments</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {/* API Configuration */}
            <div className="space-y-4 border-t border-gold/20 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-semibold">API Configuration</Label>
                <a
                  href="https://github.com/kesorhosting-wq/kesortopup1/tree/aba7c550474f155c27b7f03239a1abf2ef91ac43/supabase/functions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gold hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View iKhode docs
                </a>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Node API URL</Label>
                <Input
                  value={nodeApiUrl}
                  onChange={(e) => setNodeApiUrl(e.target.value)}
                  placeholder="https://your-bakong-api.example.com"
                  className="bg-input border-gold/30 text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  The base URL of your KHQR API server (e.g., your deployed Node.js API)
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">WebSocket URL (Optional)</Label>
                <Input
                  value={websocketUrl}
                  onChange={(e) => setWebsocketUrl(e.target.value)}
                  placeholder="wss://your-bakong-api.example.com/ws"
                  className="bg-input border-gold/30 text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  For real-time payment status updates
                </p>
              </div>

              {/* Removed Bakong Account - it's configured on the Node.js server side */}

              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Webhook Secret (Optional)</Label>
                <Input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="••••••••"
                  className="bg-input border-gold/30 text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Secret key to verify webhook callbacks
                </p>
              </div>
            </div>

            {/* Webhook URL Display */}
            <div className="bg-muted/50 border border-gold/20 rounded-lg p-3">
              <Label className="text-muted-foreground text-xs">Your Webhook URL:</Label>
              <code className="block mt-1 text-xs text-gold bg-background p-2 rounded break-all">
                {import.meta.env.VITE_SUPABASE_URL}/functions/v1/khqr-webhook/{'{order_id}'}
              </code>
              <p className="text-xs text-muted-foreground mt-1">
                Configure this in your Node.js API as the callbackUrl pattern
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
              <h4 className="text-gold font-semibold text-sm mb-2">How it works:</h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Customer adds items to cart and proceeds to checkout</li>
                <li>System generates a KHQR code for payment</li>
                <li>Customer scans with Bakong app and pays</li>
                <li>Webhook notifies your system of successful payment</li>
                <li>Order is marked as paid and customer receives the product</li>
              </ol>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
