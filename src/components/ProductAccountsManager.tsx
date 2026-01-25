import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ProductAccount } from "@/types/shop";

interface ProductAccountsManagerProps {
  productId: string;
}

export const ProductAccountsManager = ({ productId }: ProductAccountsManagerProps) => {
  const [accounts, setAccounts] = useState<ProductAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAccountDetails, setNewAccountDetails] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, [productId]);

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_accounts")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (data) {
      setAccounts(data as ProductAccount[]);
    }
    setLoading(false);
  };

  const handleAddAccount = async () => {
    const lines = newAccountDetails.trim().split('\n').filter(line => line.trim());
    
    if (lines.length < 1 || lines.length > 10) {
      toast.error("Please enter 1-10 lines of account details");
      return;
    }

    const { error } = await supabase
      .from("product_accounts")
      .insert({
        product_id: productId,
        account_details: lines,
      });

    if (error) {
      toast.error("Failed to add account");
    } else {
      toast.success("Account added!");
      setNewAccountDetails("");
      fetchAccounts();
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    const { error } = await supabase
      .from("product_accounts")
      .delete()
      .eq("id", accountId);

    if (error) {
      toast.error("Failed to delete account");
    } else {
      toast.success("Account deleted");
      fetchAccounts();
    }
  };

  const availableCount = accounts.filter(a => !a.is_sold).length;
  const soldCount = accounts.filter(a => a.is_sold).length;

  return (
    <div className="space-y-4 border-t border-gold/20 pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" />
          Account Stock Management
        </Label>
        <div className="text-xs text-muted-foreground">
          {availableCount} available / {soldCount} sold
        </div>
      </div>

      {/* Add New Account */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-sm">Add New Account (1-10 lines)</Label>
        <Textarea
          value={newAccountDetails}
          onChange={(e) => setNewAccountDetails(e.target.value)}
          placeholder="Enter account details (one item per line)&#10;Example:&#10;Username: user123&#10;Password: pass456&#10;Email: user@example.com"
          className="bg-input border-gold/30 text-foreground min-h-[120px]"
          rows={5}
        />
        <Button
          onClick={handleAddAccount}
          disabled={!newAccountDetails.trim()}
          size="sm"
          className="bg-gold text-primary-foreground hover:bg-gold-dark"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Account
        </Button>
      </div>

      {/* Existing Accounts */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-gold/20 rounded-lg">
          No accounts added yet. Add accounts above for customers to purchase.
        </p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {accounts.map((account, index) => (
            <div
              key={account.id}
              className={`flex items-start gap-2 p-3 rounded-lg border ${
                account.is_sold 
                  ? 'bg-muted/30 border-muted opacity-60' 
                  : 'bg-input/50 border-gold/20'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{index + 1}
                  </span>
                  {account.is_sold && (
                    <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive">
                      Sold
                    </span>
                  )}
                </div>
                <div className="text-sm text-foreground space-y-0.5">
                  {account.account_details.slice(0, 3).map((detail, i) => (
                    <p key={i} className="truncate">{detail}</p>
                  ))}
                  {account.account_details.length > 3 && (
                    <p className="text-muted-foreground">
                      +{account.account_details.length - 3} more lines
                    </p>
                  )}
                </div>
              </div>
              {!account.is_sold && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteAccount(account.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
