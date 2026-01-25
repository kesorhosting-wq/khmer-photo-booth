import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Package, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ProductAccount } from "@/types/shop";

interface ProductAccountsManagerProps {
  productId: string;
}

const MAX_ACCOUNTS = 100;
const MAX_FIELDS = 10;
const MIN_FIELDS = 1;

export const ProductAccountsManager = ({ productId }: ProductAccountsManagerProps) => {
  const [accounts, setAccounts] = useState<ProductAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New account form state
  const [isAdding, setIsAdding] = useState(false);
  const [newFields, setNewFields] = useState<string[]>(['', '']);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAccounts();
  }, [productId]);

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_accounts")
      .select("*")
      .eq("product_id", productId)
      .eq("is_sold", false) // Only show unsold accounts
      .order("created_at", { ascending: true });

    if (data) {
      setAccounts(data as ProductAccount[]);
    }
    setLoading(false);
  };

  // Add a new field to the form
  const addField = () => {
    if (newFields.length < MAX_FIELDS) {
      setNewFields([...newFields, '']);
    }
  };

  // Remove a field from the form
  const removeField = (index: number) => {
    if (newFields.length > MIN_FIELDS) {
      setNewFields(newFields.filter((_, i) => i !== index));
    }
  };

  // Update field value
  const updateField = (index: number, value: string) => {
    const updated = [...newFields];
    updated[index] = value;
    setNewFields(updated);
  };

  // Save the new account
  const handleSaveAccount = async () => {
    const filledFields = newFields.filter(f => f.trim());
    
    if (filledFields.length < MIN_FIELDS) {
      toast.error(`Please fill at least ${MIN_FIELDS} field`);
      return;
    }

    if (accounts.length >= MAX_ACCOUNTS) {
      toast.error(`Maximum ${MAX_ACCOUNTS} accounts allowed`);
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("product_accounts")
      .insert({
        product_id: productId,
        account_details: filledFields,
      });

    if (error) {
      toast.error("Failed to add account");
    } else {
      toast.success("Account added!");
      setNewFields(['', '']);
      setIsAdding(false);
      fetchAccounts();
    }
    
    setSaving(false);
  };

  // Delete an account
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

  // Toggle account expand/collapse
  const toggleExpand = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const availableCount = accounts.length;

  return (
    <div className="space-y-4 border-t border-gold/20 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" />
          Account Stock
        </Label>
        <div className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300">
          {availableCount} available (max {MAX_ACCOUNTS})
        </div>
      </div>

      {/* Existing Accounts List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-gold/30 rounded-lg">
          <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No accounts added yet</p>
          <p className="text-xs text-muted-foreground">Click "Add Account" below to add accounts for sale</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {accounts.map((account, index) => (
            <div
              key={account.id}
              className="border border-gold/20 rounded-lg bg-card overflow-hidden"
            >
              {/* Account Header */}
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleExpand(account.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gold bg-gold/20 px-2 py-0.5 rounded">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-foreground">
                    {account.account_details[0]?.substring(0, 30)}
                    {(account.account_details[0]?.length || 0) > 30 ? '...' : ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({account.account_details.length} fields)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAccount(account.id);
                    }}
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {expandedAccounts.has(account.id) ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedAccounts.has(account.id) && (
                <div className="px-3 pb-3 pt-0 border-t border-gold/10">
                  <div className="space-y-1 mt-2">
                    {account.account_details.map((detail, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
                        <span className="text-sm text-foreground bg-muted/30 px-2 py-1 rounded flex-1">
                          {detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Account Section */}
      {isAdding ? (
        <div className="border border-gold/30 rounded-lg p-4 bg-muted/20 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-foreground font-medium">
              New Account #{accounts.length + 1}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewFields(['', '']);
              }}
              className="h-7 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Field Inputs */}
          <div className="space-y-2">
            {newFields.map((field, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12 text-right">
                  Field {index + 1}:
                </span>
                <Input
                  value={field}
                  onChange={(e) => updateField(index, e.target.value)}
                  placeholder={
                    index === 0 ? "e.g., email@example.com" :
                    index === 1 ? "e.g., password123" :
                    `Enter detail ${index + 1}`
                  }
                  className="flex-1 bg-input border-gold/30 text-foreground h-9"
                />
                {newFields.length > MIN_FIELDS && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(index)}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add Field Button */}
          {newFields.length < MAX_FIELDS && (
            <Button
              variant="ghost"
              size="sm"
              onClick={addField}
              className="text-gold hover:text-gold-dark w-full border border-dashed border-gold/30"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Field ({newFields.length}/{MAX_FIELDS})
            </Button>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSaveAccount}
            disabled={saving || newFields.filter(f => f.trim()).length < MIN_FIELDS}
            className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Account
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setIsAdding(true)}
          disabled={accounts.length >= MAX_ACCOUNTS}
          className="w-full bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        Each account can have 1-10 detail fields. Sold accounts are automatically removed.
      </p>
    </div>
  );
};
