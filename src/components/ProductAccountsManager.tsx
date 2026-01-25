import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Package, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ProductAccount } from "@/types/shop";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProductAccountsManagerProps {
  productId: string;
}

const MAX_ACCOUNTS = 100;
const MAX_LINES_PER_ACCOUNT = 10;
const MIN_LINES_PER_ACCOUNT = 1;

export const ProductAccountsManager = ({ productId }: ProductAccountsManagerProps) => {
  const [accounts, setAccounts] = useState<ProductAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAccountDetails, setNewAccountDetails] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState("");

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
    if (accounts.length >= MAX_ACCOUNTS) {
      toast.error(`Maximum ${MAX_ACCOUNTS} accounts allowed per product`);
      return;
    }

    const lines = newAccountDetails.trim().split('\n').filter(line => line.trim());
    
    if (lines.length < MIN_LINES_PER_ACCOUNT || lines.length > MAX_LINES_PER_ACCOUNT) {
      toast.error(`Please enter ${MIN_LINES_PER_ACCOUNT}-${MAX_LINES_PER_ACCOUNT} lines of account details`);
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

  const handleBulkAdd = async () => {
    // Parse bulk input - accounts separated by double newline or "---"
    const accountBlocks = bulkInput
      .split(/\n\s*\n|\n---\n/)
      .map(block => block.trim())
      .filter(block => block.length > 0);

    if (accountBlocks.length === 0) {
      toast.error("No accounts found in input");
      return;
    }

    const remainingSlots = MAX_ACCOUNTS - accounts.length;
    if (accountBlocks.length > remainingSlots) {
      toast.error(`Can only add ${remainingSlots} more accounts (max ${MAX_ACCOUNTS})`);
      return;
    }

    const accountsToAdd = accountBlocks.map(block => {
      const lines = block.split('\n').filter(line => line.trim()).slice(0, MAX_LINES_PER_ACCOUNT);
      return {
        product_id: productId,
        account_details: lines,
      };
    });

    const { error } = await supabase
      .from("product_accounts")
      .insert(accountsToAdd);

    if (error) {
      toast.error("Failed to add accounts");
    } else {
      toast.success(`${accountsToAdd.length} accounts added!`);
      setBulkInput("");
      setBulkMode(false);
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
  const totalCount = accounts.length;

  return (
    <div className="space-y-4 border-t border-gold/20 pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" />
          Account Stock Management
        </Label>
        <div className="text-xs text-muted-foreground">
          {availableCount} available / {soldCount} sold / {totalCount} total (max {MAX_ACCOUNTS})
        </div>
      </div>

      {/* Warning if near limit */}
      {totalCount >= MAX_ACCOUNTS * 0.9 && (
        <div className="flex items-center gap-2 p-2 bg-gold/10 border border-gold/30 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 text-gold" />
          <span className="text-foreground">
            {totalCount >= MAX_ACCOUNTS 
              ? "Maximum account limit reached" 
              : `Only ${MAX_ACCOUNTS - totalCount} slots remaining`}
          </span>
        </div>
      )}

      {/* Toggle between single and bulk mode */}
      <div className="flex gap-2">
        <Button
          variant={!bulkMode ? "default" : "outline"}
          size="sm"
          onClick={() => setBulkMode(false)}
          className={!bulkMode ? "bg-gold text-primary-foreground" : "border-gold/30"}
        >
          Single Add
        </Button>
        <Button
          variant={bulkMode ? "default" : "outline"}
          size="sm"
          onClick={() => setBulkMode(true)}
          className={bulkMode ? "bg-gold text-primary-foreground" : "border-gold/30"}
        >
          Bulk Add
        </Button>
      </div>

      {/* Single Account Add */}
      {!bulkMode && (
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">
            Add Account ({MIN_LINES_PER_ACCOUNT}-{MAX_LINES_PER_ACCOUNT} lines per account)
          </Label>
          <Textarea
            value={newAccountDetails}
            onChange={(e) => setNewAccountDetails(e.target.value)}
            placeholder={`Enter account details (one item per line)\nExample:\nUsername: user123\nPassword: pass456\nEmail: user@example.com\nServer: US-1\nLevel: 50`}
            className="bg-input border-gold/30 text-foreground min-h-[140px]"
            rows={6}
          />
          <Button
            onClick={handleAddAccount}
            disabled={!newAccountDetails.trim() || totalCount >= MAX_ACCOUNTS}
            size="sm"
            className="bg-gold text-primary-foreground hover:bg-gold-dark"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Account
          </Button>
        </div>
      )}

      {/* Bulk Add */}
      {bulkMode && (
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">
            Bulk Add Accounts (separate each account with blank line or ---)
          </Label>
          <Textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder={`Account 1:\nUsername: user1\nPassword: pass1\n\nAccount 2:\nUsername: user2\nPassword: pass2\n\n---\n\nAccount 3:\nUsername: user3\nPassword: pass3`}
            className="bg-input border-gold/30 text-foreground min-h-[200px]"
            rows={10}
          />
          <Button
            onClick={handleBulkAdd}
            disabled={!bulkInput.trim() || totalCount >= MAX_ACCOUNTS}
            size="sm"
            className="bg-gold text-primary-foreground hover:bg-gold-dark"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add All Accounts
          </Button>
        </div>
      )}

      {/* Existing Accounts */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-gold/20 rounded-lg">
          No accounts added yet. Add accounts above for customers to purchase.
        </p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="accounts" className="border-gold/20">
            <AccordionTrigger className="text-foreground hover:no-underline">
              View All Accounts ({accounts.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};
