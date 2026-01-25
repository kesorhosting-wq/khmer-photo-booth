import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FolderOpen, Plus, Trash2, ChevronUp, ChevronDown, Link, User, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryFunction } from "@/types/shop";

interface Category {
  id: string;
  name: string;
  sort_order: number;
  function_type: CategoryFunction;
}

const FUNCTION_OPTIONS: { value: CategoryFunction; label: string; icon: any; description: string }[] = [
  { value: 'link', label: 'Link', icon: Link, description: 'Opens external order link' },
  { value: 'account', label: 'Account', icon: User, description: 'Sell account details (1-100 per product)' },
  { value: 'upload', label: 'Upload', icon: Upload, description: 'Sell downloadable files' },
];

export const CategoryEditDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryFunction, setNewCategoryFunction] = useState<CategoryFunction>('link');

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (data) {
      setCategories(data.map(c => ({
        ...c,
        function_type: (c.function_type as CategoryFunction) || 'link'
      })));
    }
    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    const maxOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.sort_order)) 
      : 0;

    const { error } = await supabase
      .from("categories")
      .insert({ 
        name: newCategoryName.trim(),
        sort_order: maxOrder + 1,
        function_type: newCategoryFunction,
      });

    if (error) {
      toast.error("Failed to add category");
    } else {
      toast.success("Category added!");
      setNewCategoryName("");
      setNewCategoryFunction('link');
      fetchCategories();
    }
  };

  const handleUpdateCategory = async (id: string, name: string, functionType?: CategoryFunction) => {
    const updateData: any = { name };
    if (functionType) {
      updateData.function_type = functionType;
    }
    
    const { error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update category");
    } else {
      toast.success("Category updated!");
    }
  };

  const handleCategoryFunctionChange = (id: string, functionType: CategoryFunction) => {
    setCategories(prev => 
      prev.map(c => c.id === id ? { ...c, function_type: functionType } : c)
    );
    handleUpdateCategory(id, categories.find(c => c.id === id)?.name || '', functionType);
  };


  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete category");
    } else {
      toast.success("Category deleted!");
      fetchCategories();
    }
  };

  const handleCategoryNameChange = (id: string, name: string) => {
    setCategories(prev => 
      prev.map(c => c.id === id ? { ...c, name } : c)
    );
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const currentCategory = categories[index];
    const swapCategory = categories[swapIndex];

    // Swap sort_order values in database
    const updates = [
      supabase.from("categories").update({ sort_order: swapCategory.sort_order }).eq("id", currentCategory.id),
      supabase.from("categories").update({ sort_order: currentCategory.sort_order }).eq("id", swapCategory.id),
    ];

    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);

    if (hasError) {
      toast.error("Failed to reorder categories");
    } else {
      fetchCategories();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gold/80 text-primary-foreground hover:bg-gold font-display gap-2">
          <FolderOpen className="w-4 h-4" />
          Edit Category
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-gold/30 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gold-text text-xl font-display">
            Manage Categories
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-5 py-4">
            {/* Add New Category */}
            <div className="space-y-3">
              <Label className="text-foreground">Add New Category</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="bg-input border-gold/30 text-foreground"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              
              {/* Function Type Selection */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Category Function</Label>
                <div className="grid grid-cols-3 gap-2">
                  {FUNCTION_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewCategoryFunction(option.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                          newCategoryFunction === option.value
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-gold/20 text-muted-foreground hover:border-gold/40'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {FUNCTION_OPTIONS.find(o => o.value === newCategoryFunction)?.description}
                </p>
              </div>

              <Button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>

            {/* Existing Categories */}
            <div className="space-y-2">
              <Label className="text-foreground">Existing Categories</Label>
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No categories yet. Add your first category above.
                </p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category, index) => (
                    <div 
                      key={category.id} 
                      className="flex items-center gap-2 p-2 bg-input/50 rounded-md border border-gold/20"
                    >
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveCategory(index, 'up')}
                          disabled={index === 0}
                          className="h-5 w-5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveCategory(index, 'down')}
                          disabled={index === categories.length - 1}
                          className="h-5 w-5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <Input
                        value={category.name}
                        onChange={(e) => handleCategoryNameChange(category.id, e.target.value)}
                        onBlur={() => handleUpdateCategory(category.id, category.name)}
                        className="bg-transparent border-none text-foreground flex-1 h-8"
                      />
                      
                      {/* Function Type Indicator */}
                      <div className="flex gap-1">
                        {FUNCTION_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          const isActive = category.function_type === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleCategoryFunctionChange(category.id, option.value)}
                              className={`p-1.5 rounded transition-all ${
                                isActive
                                  ? 'bg-gold/20 text-gold'
                                  : 'text-muted-foreground/50 hover:text-muted-foreground'
                              }`}
                              title={option.description}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Categories will appear as filter buttons on the homepage. Products can be assigned to categories.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
