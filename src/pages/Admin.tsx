import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { 
  Plus, LogOut, Trash2, ImagePlus, Home, Edit, Save, X, Upload 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HomeEditDialog } from "@/components/HomeEditDialog";
import { CategoryEditDialog } from "@/components/CategoryEditDialog";
import { ReloadEditDialog } from "@/components/ReloadEditDialog";
import khmerMandala from "@/assets/khmer-mandala.jpg";

interface Product {
  id: string;
  name: string;
  image_url: string;
  price: string | null;
  description: string | null;
  category_id: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  telegram_url: string | null;
  order_url: string | null;
  image_fit: string | null;
  image_custom_width: number | null;
  image_custom_height: number | null;
}

interface Category {
  id: string;
  name: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [loadingImageUrl, setLoadingImageUrl] = useState<string | null>(null);

  // Fetch loading image on mount
  useEffect(() => {
    const fetchLoadingImage = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("loading_image_url")
        .limit(1)
        .maybeSingle();
      if (data?.loading_image_url) {
        setLoadingImageUrl(data.loading_image_url);
      }
    };
    fetchLoadingImage();
  }, []);
  
  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("$");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [orderUrl, setOrderUrl] = useState("");
  const [imageFit, setImageFit] = useState("cover");
  const [imageCustomWidth, setImageCustomWidth] = useState<number | null>(null);
  const [imageCustomHeight, setImageCustomHeight] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Get unique previously used URLs for suggestions
  const usedFacebookUrls = [...new Set(products.map(p => p.facebook_url).filter(Boolean))];
  const usedTiktokUrls = [...new Set(products.map(p => p.tiktok_url).filter(Boolean))];
  const usedTelegramUrls = [...new Set(products.map(p => p.telegram_url).filter(Boolean))];
  const usedOrderUrls = [...new Set(products.map(p => p.order_url).filter(Boolean))];

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (data) {
      setIsAdmin(true);
      fetchProducts();
      fetchCategories();
    } else {
      toast.error("You don't have admin permissions");
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (data) {
      setCategories(data);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch products");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!name || !preview) {
      toast.error("Name and image are required");
      return;
    }

    setSubmitting(true);

    try {
      const fullPrice = price ? `${price}${currency}` : null;
      
      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update({
            name,
            image_url: preview,
            price: fullPrice,
            description: description || null,
            category_id: categoryIds.length > 0 ? categoryIds[0] : null,
            facebook_url: facebookUrl || null,
            tiktok_url: tiktokUrl || null,
            telegram_url: telegramUrl || null,
            order_url: orderUrl || null,
            image_fit: imageFit,
            image_custom_width: imageFit === "custom" ? imageCustomWidth : null,
            image_custom_height: imageFit === "custom" ? imageCustomHeight : null,
          })
          .eq("id", editingId);

        if (error) throw error;

        // Update product categories
        await supabase.from("product_categories").delete().eq("product_id", editingId);
        if (categoryIds.length > 0) {
          await supabase.from("product_categories").insert(
            categoryIds.map(catId => ({ product_id: editingId, category_id: catId }))
          );
        }

        toast.success("Product updated!");
      } else {
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert({
            name,
            image_url: preview,
            price: fullPrice,
            description: description || null,
            category_id: categoryIds.length > 0 ? categoryIds[0] : null,
            facebook_url: facebookUrl || null,
            tiktok_url: tiktokUrl || null,
            telegram_url: telegramUrl || null,
            order_url: orderUrl || null,
            image_fit: imageFit,
            image_custom_width: imageFit === "custom" ? imageCustomWidth : null,
            image_custom_height: imageFit === "custom" ? imageCustomHeight : null,
          })
          .select()
          .single();

        if (error) throw error;

        // Insert product categories
        if (categoryIds.length > 0 && newProduct) {
          await supabase.from("product_categories").insert(
            categoryIds.map(catId => ({ product_id: newProduct.id, category_id: catId }))
          );
        }

        toast.success("Product added!");
      }

      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    
    // Parse price and currency (symbol at end)
    const priceStr = product.price || "";
    if (priceStr.endsWith("៛")) {
      setCurrency("៛");
      setPrice(priceStr.slice(0, -1));
    } else if (priceStr.endsWith("$")) {
      setCurrency("$");
      setPrice(priceStr.slice(0, -1));
    } else {
      setCurrency("$");
      setPrice(priceStr);
    }
    
    setDescription(product.description || "");
    setPreview(product.image_url);
    
    // Fetch product categories
    const { data: productCats } = await supabase
      .from("product_categories")
      .select("category_id")
      .eq("product_id", product.id);
    
    if (productCats && productCats.length > 0) {
      setCategoryIds(productCats.map(pc => pc.category_id));
    } else if (product.category_id) {
      setCategoryIds([product.category_id]);
    } else {
      setCategoryIds([]);
    }
    
    setFacebookUrl(product.facebook_url || "");
    setTiktokUrl(product.tiktok_url || "");
    setTelegramUrl(product.telegram_url || "");
    setOrderUrl(product.order_url || "");
    setImageFit(product.image_fit || "cover");
    setImageCustomWidth(product.image_custom_width);
    setImageCustomHeight(product.image_custom_height);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted");
      fetchProducts();
    }
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setCurrency("$");
    setDescription("");
    setPreview(null);
    setCategoryIds([]);
    setFacebookUrl("");
    setTiktokUrl("");
    setTelegramUrl("");
    setOrderUrl("");
    setImageFit("cover");
    setImageCustomWidth(null);
    setImageCustomHeight(null);
    setEditingId(null);
    setOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    if (loadingImageUrl) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <img 
            src={loadingImageUrl} 
            alt="Loading" 
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="bg-card border-b border-gold/20 py-4 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={khmerMandala} alt="" className="w-10 h-10 ornament-glow" />
            <h1 className="text-xl md:text-2xl font-display gold-text">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-foreground hover:text-gold"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h2 className="text-xl font-display text-foreground">Manage Products</h2>
          <div className="flex gap-2 flex-wrap">
            <HomeEditDialog />
            <CategoryEditDialog />
            <ReloadEditDialog />
            <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gold text-primary-foreground hover:bg-gold-dark font-display gap-2">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-gold/30 max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="gold-text text-xl font-display">
                  {editingId ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-foreground">Product Image *</Label>
                  {preview ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gold/30">
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="w-full h-full"
                        style={{
                          objectFit: imageFit === "custom" ? "contain" : imageFit as any,
                          width: imageFit === "custom" && imageCustomWidth ? `${imageCustomWidth}px` : "100%",
                          height: imageFit === "custom" && imageCustomHeight ? `${imageCustomHeight}px` : "100%",
                        }}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setPreview(null)}
                        className="absolute top-2 right-2 bg-background/80 text-foreground"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/60 transition-colors bg-input/50">
                      <ImagePlus className="w-10 h-10 text-gold/50 mb-2" />
                      <span className="text-muted-foreground text-sm">Click to upload image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Image Size Options */}
                <div className="space-y-2">
                  <Label className="text-foreground">Image Size</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "cover", label: "Fill" },
                      { value: "contain", label: "Fit" },
                      { value: "fill", label: "Full" },
                      { value: "custom", label: "Custom" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={imageFit === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setImageFit(option.value)}
                        className={imageFit === option.value 
                          ? "bg-gold text-primary-foreground hover:bg-gold-dark" 
                          : "border-gold/30 text-foreground hover:bg-gold/10"
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Custom Size Inputs */}
                  {imageFit === "custom" && (
                    <div className="flex gap-2 mt-2">
                      <div className="flex-1">
                        <Label className="text-muted-foreground text-xs">Width (px)</Label>
                        <Input 
                          type="number"
                          value={imageCustomWidth || ""}
                          onChange={(e) => setImageCustomWidth(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="e.g., 200"
                          className="bg-input border-gold/30 text-foreground"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-muted-foreground text-xs">Height (px)</Label>
                        <Input 
                          type="number"
                          value={imageCustomHeight || ""}
                          onChange={(e) => setImageCustomHeight(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="e.g., 200"
                          className="bg-input border-gold/30 text-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Name */}
                <div className="space-y-2">
                  <Label className="text-foreground">Product Name *</Label>
                  <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter product name"
                    className="bg-input border-gold/30 text-foreground"
                  />
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label className="text-foreground">Price (Optional)</Label>
                  <div className="flex gap-2">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="h-10 px-3 rounded-md border border-gold/30 bg-input text-foreground w-20"
                    >
                      <option value="$">$</option>
                      <option value="៛">៛</option>
                    </select>
                    <Input 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g., 29.99"
                      className="bg-input border-gold/30 text-foreground flex-1"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-foreground">Description (Optional)</Label>
                  <Textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief product description"
                    className="bg-input border-gold/30 text-foreground resize-none"
                    rows={3}
                  />
                </div>

                {/* Categories (Multi-select) */}
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-foreground">Categories (Optional)</Label>
                    <div className="flex flex-wrap gap-2 p-3 rounded-md border border-gold/30 bg-input min-h-[60px]">
                      {categories.map((cat) => (
                        <Button
                          key={cat.id}
                          type="button"
                          size="sm"
                          variant={categoryIds.includes(cat.id) ? "default" : "outline"}
                          onClick={() => {
                            if (categoryIds.includes(cat.id)) {
                              setCategoryIds(categoryIds.filter(id => id !== cat.id));
                            } else {
                              setCategoryIds([...categoryIds, cat.id]);
                            }
                          }}
                          className={categoryIds.includes(cat.id)
                            ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                            : "border-gold/30 text-foreground hover:bg-gold/10"
                          }
                        >
                          {cat.name}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Click to select multiple categories</p>
                  </div>
                )}

                {/* Social Media Links */}
                <div className="space-y-3 border-t border-gold/20 pt-4">
                  <Label className="text-foreground font-semibold">Social Media Links (Optional)</Label>
                  
                  {/* Facebook */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Facebook URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        placeholder="https://facebook.com/..."
                        className="bg-input border-gold/30 text-foreground flex-1"
                      />
                      {usedFacebookUrls.length > 0 && (
                        <select
                          onChange={(e) => e.target.value && setFacebookUrl(e.target.value)}
                          className="h-10 px-2 rounded-md border border-gold/30 bg-input text-foreground text-xs"
                        >
                          <option value="">Recent</option>
                          {usedFacebookUrls.map((url, i) => (
                            <option key={i} value={url || ""}>{url?.slice(0, 30)}...</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* TikTok */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">TikTok URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={tiktokUrl}
                        onChange={(e) => setTiktokUrl(e.target.value)}
                        placeholder="https://tiktok.com/..."
                        className="bg-input border-gold/30 text-foreground flex-1"
                      />
                      {usedTiktokUrls.length > 0 && (
                        <select
                          onChange={(e) => e.target.value && setTiktokUrl(e.target.value)}
                          className="h-10 px-2 rounded-md border border-gold/30 bg-input text-foreground text-xs"
                        >
                          <option value="">Recent</option>
                          {usedTiktokUrls.map((url, i) => (
                            <option key={i} value={url || ""}>{url?.slice(0, 30)}...</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Telegram */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Telegram URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={telegramUrl}
                        onChange={(e) => setTelegramUrl(e.target.value)}
                        placeholder="https://t.me/..."
                        className="bg-input border-gold/30 text-foreground flex-1"
                      />
                      {usedTelegramUrls.length > 0 && (
                        <select
                          onChange={(e) => e.target.value && setTelegramUrl(e.target.value)}
                          className="h-10 px-2 rounded-md border border-gold/30 bg-input text-foreground text-xs"
                        >
                          <option value="">Recent</option>
                          {usedTelegramUrls.map((url, i) => (
                            <option key={i} value={url || ""}>{url?.slice(0, 30)}...</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Now Link */}
                <div className="space-y-2 border-t border-gold/20 pt-4">
                  <Label className="text-foreground font-semibold">Order Now Link (Optional)</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={orderUrl}
                      onChange={(e) => setOrderUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-input border-gold/30 text-foreground flex-1"
                    />
                    {usedOrderUrls.length > 0 && (
                      <select
                        onChange={(e) => e.target.value && setOrderUrl(e.target.value)}
                        className="h-10 px-2 rounded-md border border-gold/30 bg-input text-foreground text-xs"
                      >
                        <option value="">Recent</option>
                        {usedOrderUrls.map((url, i) => (
                          <option key={i} value={url || ""}>{url?.slice(0, 30)}...</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!name || !preview || submitting}
                    className="flex-1 bg-gold text-primary-foreground hover:bg-gold-dark font-display"
                  >
                    {submitting ? "Saving..." : editingId ? "Update Product" : "Add Product"}
                  </Button>
                  {editingId && (
                    <Button variant="ghost" onClick={resetForm} className="text-foreground">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="khmer-border p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📦</span>
            </div>
            <h3 className="text-xl font-display text-gold-light mb-2">No Products Yet</h3>
            <p className="text-muted-foreground">Click "Add Product" to add your first product.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div key={product.id} className="product-frame rounded-lg p-3 group">
                <div className="relative overflow-hidden rounded-md aspect-square mb-3">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      onClick={() => handleEdit(product)}
                      className="bg-gold text-primary-foreground hover:bg-gold-dark"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-display text-gold-light font-semibold truncate">
                    {product.name}
                  </h3>
                  {product.price && (
                    <p className="text-gold font-bold">{product.price}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
