import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Ticket, Plus, Trash2, Edit, X, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  is_single_use: boolean;
  is_one_per_user: boolean;
  for_everyone: boolean;
  allowed_email: string | null;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  created_at: string;
}

export const CouponManager = () => {
  const [open, setOpen] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSingleUse, setIsSingleUse] = useState(false);
  const [isOnePerUser, setIsOnePerUser] = useState(true);
  const [forEveryone, setForEveryone] = useState(true);
  const [allowedEmail, setAllowedEmail] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (open) fetchCoupons();
  }, [open]);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCoupons(data);
    if (error) toast.error("Failed to load coupons");
    setLoading(false);
  };

  const resetForm = () => {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setIsActive(true);
    setIsSingleUse(false);
    setIsOnePerUser(true);
    setForEveryone(true);
    setAllowedEmail("");
    setMaxUses("");
    setExpiresAt("");
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!code || !discountValue) {
      toast.error("Code and discount value are required");
      return;
    }

    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      toast.error("Invalid discount value");
      return;
    }

    if (discountType === "percentage" && val > 100) {
      toast.error("Percentage cannot exceed 100%");
      return;
    }

    const payload = {
      code: code.toUpperCase(),
      discount_type: discountType,
      discount_value: val,
      is_active: isActive,
      is_single_use: isSingleUse,
      is_one_per_user: isOnePerUser,
      for_everyone: forEveryone,
      allowed_email: forEveryone ? null : allowedEmail || null,
      max_uses: maxUses ? parseInt(maxUses) : null,
      expires_at: expiresAt || null,
    };

    if (editingId) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Coupon updated! 🎀");
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Coupon created! 🎉");
    }

    resetForm();
    fetchCoupons();
  };

  const handleEdit = (c: Coupon) => {
    setEditingId(c.id);
    setCode(c.code);
    setDiscountType(c.discount_type as "percentage" | "fixed");
    setDiscountValue(String(c.discount_value));
    setIsActive(c.is_active);
    setIsSingleUse(c.is_single_use);
    setIsOnePerUser(c.is_one_per_user);
    setForEveryone(c.for_everyone);
    setAllowedEmail(c.allowed_email || "");
    setMaxUses(c.max_uses ? String(c.max_uses) : "");
    setExpiresAt(c.expires_at ? c.expires_at.slice(0, 16) : "");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Coupon deleted");
    fetchCoupons();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from("coupons").update({ is_active: !current }).eq("id", id);
    fetchCoupons();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-pink-300 text-pink-600 hover:bg-pink-50 gap-2">
          <Ticket className="w-4 h-4" />
          Coupons 🎀
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-pink-200 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-pink-600 text-xl flex items-center gap-2">
            🎟️ Coupon Manager
          </DialogTitle>
        </DialogHeader>

        {/* Form */}
        <div className="space-y-3 p-3 bg-pink-50/50 rounded-xl border border-pink-100">
          <h3 className="font-semibold text-sm text-pink-700">
            {editingId ? "✏️ Edit Coupon" : "➕ Create Coupon"}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Code</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} placeholder="SAVE20" className="uppercase" />
            </div>
            <div>
              <Label className="text-xs">Discount Type</Label>
              <Select value={discountType} onValueChange={(v: "percentage" | "fixed") => setDiscountType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">% Percentage</SelectItem>
                  <SelectItem value="fixed">💰 Fixed Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Value {discountType === "percentage" ? "(%)" : "(amount)"}</Label>
              <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "20" : "5.00"} />
            </div>
            <div>
              <Label className="text-xs">Max Uses (empty = unlimited)</Label>
              <Input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="∞" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Expires At (optional)</Label>
            <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Single use (total, one time ever)</Label>
              <Switch checked={isSingleUse} onCheckedChange={setIsSingleUse} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">One use per user</Label>
              <Switch checked={isOnePerUser} onCheckedChange={setIsOnePerUser} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">For everyone</Label>
              <Switch checked={forEveryone} onCheckedChange={setForEveryone} />
            </div>
          </div>

          {!forEveryone && (
            <div>
              <Label className="text-xs">Allowed Email</Label>
              <Input type="email" value={allowedEmail} onChange={e => setAllowedEmail(e.target.value)} placeholder="user@email.com" />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white gap-1">
              <Save className="w-3 h-3" /> {editingId ? "Update" : "Create"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm} className="gap-1">
                <X className="w-3 h-3" /> Cancel
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-2 mt-2">
          <h3 className="font-semibold text-sm text-pink-700">📋 Existing Coupons</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : coupons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No coupons yet</p>
          ) : (
            coupons.map(c => (
              <div key={c.id} className={`p-3 rounded-lg border text-sm ${c.is_active ? 'bg-white border-pink-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-pink-600">{c.code}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleToggleActive(c.id, c.is_active)}>
                      {c.is_active ? "✅" : "❌"}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(c)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>{c.discount_type === "percentage" ? `${c.discount_value}% off` : `${c.discount_value} off (fixed)`}</p>
                  <p>{c.for_everyone ? "🌍 Everyone" : `📧 ${c.allowed_email}`} • Used: {c.times_used}{c.max_uses ? `/${c.max_uses}` : ""}</p>
                  <p>{c.is_single_use ? "🔒 Single use" : "♻️ Multi-use"} • {c.is_one_per_user ? "👤 1/user" : "👥 Unlimited/user"}</p>
                  {c.expires_at && <p>⏰ Expires: {new Date(c.expires_at).toLocaleString()}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
