import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, Database, Loader2, AlertTriangle } from "lucide-react";

interface TableOption {
  name: string;
  label: string;
  description: string;
  checked: boolean;
}

const EXPORTABLE_TABLES: TableOption[] = [
  { name: "categories", label: "Categories", description: "Product categories with function types", checked: true },
  { name: "products", label: "Products", description: "All product information", checked: true },
  { name: "product_categories", label: "Product-Category Links", description: "Links between products and categories", checked: true },
  { name: "product_accounts", label: "Product Accounts", description: "Account details for account-type products", checked: true },
  { name: "product_files", label: "Product Files", description: "File metadata for upload-type products", checked: true },
  { name: "site_settings", label: "Site Settings", description: "All site customization settings", checked: true },
  { name: "payment_gateways", label: "Payment Gateways", description: "Payment configuration (secrets excluded)", checked: true },
];

export const DatabaseExportImport = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("export");
  const [tables, setTables] = useState<TableOption[]>(EXPORTABLE_TABLES);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, number> | null>(null);

  const toggleTable = (tableName: string) => {
    setTables(tables.map(t => 
      t.name === tableName ? { ...t, checked: !t.checked } : t
    ));
  };

  const selectAll = () => {
    setTables(tables.map(t => ({ ...t, checked: true })));
  };

  const selectNone = () => {
    setTables(tables.map(t => ({ ...t, checked: false })));
  };

  const handleExport = async () => {
    const selectedTables = tables.filter(t => t.checked).map(t => t.name);
    
    if (selectedTables.length === 0) {
      toast.error("Please select at least one table to export");
      return;
    }

    setExporting(true);

    try {
      const exportData: Record<string, unknown[]> = {
        _meta: [{
          exportedAt: new Date().toISOString(),
          tables: selectedTables,
          version: "1.0",
        }],
      };

      // Export each selected table
      for (const tableName of selectedTables) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select("*");

        if (error) {
          console.error(`Error exporting ${tableName}:`, error);
          toast.error(`Failed to export ${tableName}: ${error.message}`);
          continue;
        }

        // For payment_gateways, exclude sensitive config data
        if (tableName === "payment_gateways" && data) {
          exportData[tableName] = data.map((row: any) => ({
            ...row,
            config: {
              ...row.config,
              webhook_secret: "[REDACTED]",
            },
          }));
        } else {
          exportData[tableName] = data || [];
        }
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${selectedTables.length} tables successfully!`);
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export database");
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Preview what will be imported
      const preview: Record<string, number> = {};
      for (const key of Object.keys(data)) {
        if (key !== "_meta" && Array.isArray(data[key])) {
          preview[key] = data[key].length;
        }
      }
      setImportPreview(preview);
    } catch (error) {
      toast.error("Invalid JSON file");
      setImportFile(null);
      setImportPreview(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }

    setImporting(true);

    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      // Import order matters due to foreign keys
      const importOrder = [
        "site_settings",
        "payment_gateways",
        "categories",
        "products",
        "product_categories",
        "product_accounts",
        "product_files",
      ];

      let totalImported = 0;

      for (const tableName of importOrder) {
        if (!data[tableName] || !Array.isArray(data[tableName]) || data[tableName].length === 0) {
          continue;
        }

        const rows = data[tableName];

        // For each table, upsert data
        const { error } = await supabase
          .from(tableName as any)
          .upsert(rows, { 
            onConflict: "id",
            ignoreDuplicates: false,
          });

        if (error) {
          console.error(`Error importing ${tableName}:`, error);
          toast.error(`Failed to import ${tableName}: ${error.message}`);
        } else {
          totalImported += rows.length;
          console.log(`Imported ${rows.length} rows to ${tableName}`);
        }
      }

      toast.success(`Imported ${totalImported} records successfully! Refresh the page to see changes.`);
      setImportFile(null);
      setImportPreview(null);
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import database");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gold/30 text-foreground hover:bg-gold/10 gap-2">
          <Database className="w-4 h-4" />
          Export/Import
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-gold/30 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gold-text text-xl font-display flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Backup
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/30">
            <TabsTrigger value="export" className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
              <Download className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Export your database to a JSON file. You can import this backup when you remix the project.
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-gold hover:text-gold-dark">
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={selectNone} className="text-muted-foreground">
                Select None
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {tables.map((table) => (
                <div 
                  key={table.name}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    table.checked 
                      ? "border-gold/50 bg-gold/5" 
                      : "border-border hover:border-gold/30"
                  }`}
                  onClick={() => toggleTable(table.name)}
                >
                  <Checkbox 
                    checked={table.checked}
                    onCheckedChange={() => toggleTable(table.name)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label className="text-foreground font-medium cursor-pointer">
                      {table.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{table.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleExport}
              disabled={exporting || tables.filter(t => t.checked).length === 0}
              className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {tables.filter(t => t.checked).length} Tables
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Import a previously exported database backup. This will merge with existing data.
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <strong>Warning:</strong> Importing will overwrite existing records with matching IDs. 
                Make sure to export a backup first if needed.
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Select Backup File</Label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gold file:text-primary-foreground hover:file:bg-gold-dark file:cursor-pointer cursor-pointer"
              />
            </div>

            {importPreview && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <h4 className="text-sm font-medium text-foreground mb-2">Import Preview:</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Object.entries(importPreview).map(([table, count]) => (
                    <div key={table} className="flex justify-between">
                      <span className="text-muted-foreground">{table}:</span>
                      <span className="text-gold">{count} records</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleImport}
              disabled={importing || !importFile}
              className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Backup
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
