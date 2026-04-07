import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { uploadImageToStorage, isBase64 } from "@/lib/uploadImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { 
  Plus, LogOut, Trash2, ImagePlus, Home, Edit, Save, X, Upload, Copy 
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
import { ProductAccountsManager } from "@/components/ProductAccountsManager";
import { ProductFileManager } from "@/components/ProductFileManager";
import { OrderManagement } from "@/components/OrderManagement";
import { PaymentGatewayConfigDialog } from "@/components/PaymentGatewayConfig";
import { OrderStatsDashboard } from "@/components/OrderStatsDashboard";
import { DatabaseExportImport } from "@/components/DatabaseExportImport";
import { CouponManager } from "@/components/CouponManager";
import khmerMandala from "@/assets/khmer-mandala.jpg";
import type { CategoryFunction } from "@/types/shop";

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
  function_type: CategoryFunction;
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
      setCategories(data.map(c => ({
        ...c,
        function_type: (c.function_type as CategoryFunction) || 'link'
      })));
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

  const pendingImageFile = useRef<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      pendingImageFile.current = file;
      // Show local preview instantly
      const url = URL.createObjectURL(file);
      setPreview(url);
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
      
      // Upload image to storage if it's a new file
      let imageUrl = preview;
      if (pendingImageFile.current) {
        imageUrl = await uploadImageToStorage(pendingImageFile.current, "products");
        pendingImageFile.current = null;
      }
      
      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update({
            name,
            image_url: imageUrl,
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
            image_url: imageUrl,
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

  const handleClone = async (product: Product) => {
    try {
      // Clone the product with a new name
      const { data: newProduct, error } = await supabase
        .from("products")
        .insert({
          name: `${product.name} (Copy)`,
          image_url: product.image_url,
          price: product.price,
          description: product.description,
          category_id: product.category_id,
          facebook_url: product.facebook_url,
          tiktok_url: product.tiktok_url,
          telegram_url: product.telegram_url,
          order_url: product.order_url,
          image_fit: product.image_fit,
          image_custom_width: product.image_custom_width,
          image_custom_height: product.image_custom_height,
        })
        .select()
        .single();

      if (error) throw error;

      // Clone product categories
      if (newProduct) {
        const { data: productCats } = await supabase
          .from("product_categories")
          .select("category_id")
          .eq("product_id", product.id);

        if (productCats && productCats.length > 0) {
          await supabase.from("product_categories").insert(
            productCats.map(pc => ({ 
              product_id: newProduct.id, 
              category_id: pc.category_id 
            }))
          );
        }
      }

      toast.success("Product cloned! Edit the copy to customize it.");
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to clone product");
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
            <OrderManagement />
            <OrderStatsDashboard />
            <PaymentGatewayConfigDialog />
            <DatabaseExportImport />
            <CouponManager />
            <MigrateImagesButton fetchProducts={fetchProducts} />
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

                {/* Price - Only show for Account/Upload categories */}
                {(() => {
                  const selectedCategory = categories.find(c => c.id === categoryIds[0]);
                  const showPrice = !selectedCategory || selectedCategory.function_type !== 'link';
                  
                  if (!showPrice) return null;
                  
                  return (
                    <div className="space-y-2">
                      <Label className="text-foreground">Price *</Label>
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
                      <p className="text-xs text-muted-foreground">Required for checkout products</p>
                    </div>
                  );
                })()}

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

                {/* Category Dropdown */}
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-foreground">Category *</Label>
                    <select
                      value={categoryIds[0] || ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          setCategoryIds([e.target.value]);
                        } else {
                          setCategoryIds([]);
                        }
                      }}
                      className="w-full h-10 px-3 rounded-md border border-gold/30 bg-card text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50"
                      style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d4af37' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center'
                      }}
                    >
                      <option value="" className="bg-card text-muted-foreground">-- Select Category --</option>
                      {categories.map((cat) => (
                        <option 
                          key={cat.id} 
                          value={cat.id}
                          className="bg-card text-foreground py-2"
                        >
                          {cat.name} ({cat.function_type === 'link' ? '🔗 Link' : cat.function_type === 'account' ? '🔑 Account' : '📁 Upload'})
                        </option>
                      ))}
                    </select>
                    
                    {/* Category Info */}
                    {categoryIds.length > 0 && (() => {
                      const selectedCategory = categories.find(c => c.id === categoryIds[0]);
                      return selectedCategory && (
                        <div className={`p-3 rounded-lg text-sm ${
                          selectedCategory.function_type === 'link' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30' :
                          selectedCategory.function_type === 'account' ? 'bg-green-500/10 text-green-300 border border-green-500/30' :
                          'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                        }`}>
                          {selectedCategory.function_type === 'link' && (
                            <div className="flex items-start gap-2">
                              <span className="text-lg">🔗</span>
                              <div>
                                <strong>Link Product</strong>
                                <p className="text-xs opacity-80 mt-0.5">Shows "Order Now" button that opens external link. No cart or checkout.</p>
                              </div>
                            </div>
                          )}
                          {selectedCategory.function_type === 'account' && (
                            <div className="flex items-start gap-2">
                              <span className="text-lg">🔑</span>
                              <div>
                                <strong>Account Product</strong>
                                <p className="text-xs opacity-80 mt-0.5">Sells account details. Save product first, then add accounts to sell.</p>
                              </div>
                            </div>
                          )}
                          {selectedCategory.function_type === 'upload' && (
                            <div className="flex items-start gap-2">
                              <span className="text-lg">📁</span>
                              <div>
                                <strong>Download Product</strong>
                                <p className="text-xs opacity-80 mt-0.5">Sells a downloadable file. Save product first, then upload file.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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

                {/* Order Now Link - Only show for Link categories */}
                {(() => {
                  const selectedCategory = categories.find(c => c.id === categoryIds[0]);
                  const showOrderUrl = selectedCategory?.function_type === 'link';
                  
                  if (!showOrderUrl) return null;
                  
                  return (
                    <div className="space-y-2 border-t border-gold/20 pt-4">
                      <Label className="text-foreground font-semibold">Order Now Link *</Label>
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
                      <p className="text-xs text-muted-foreground">URL will open when user clicks "Order Now"</p>
                    </div>
                  );
                })()}

                {/* Account/File Managers or Save First Message */}
                {categoryIds.length > 0 && (() => {
                  const selectedCategory = categories.find(c => c.id === categoryIds[0]);
                  const functionType = selectedCategory?.function_type;
                  
                  if (functionType === 'account') {
                    if (editingId) {
                      return <ProductAccountsManager productId={editingId} />;
                    } else {
                      return (
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                          <div className="text-3xl mb-2">🔑</div>
                          <p className="text-sm text-green-300">
                            <strong>Save the product first</strong>, then edit it to add account details for sale.
                          </p>
                        </div>
                      );
                    }
                  }
                  
                  if (functionType === 'upload') {
                    if (editingId) {
                      return <ProductFileManager productId={editingId} />;
                    } else {
                      return (
                        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
                          <div className="text-3xl mb-2">📁</div>
                          <p className="text-sm text-purple-300">
                            <strong>Save the product first</strong>, then edit it to upload the downloadable file.
                          </p>
                        </div>
                      );
                    }
                  }
                  
                  return null;
                })()}

                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={(() => {
                      if (!name || !preview) return true;
                      if (submitting) return true;
                      
                      // Validate based on category type
                      const selectedCategory = categories.find(c => c.id === categoryIds[0]);
                      if (selectedCategory?.function_type === 'link' && !orderUrl) return true;
                      if (selectedCategory?.function_type === 'account' && !price) return true;
                      if (selectedCategory?.function_type === 'upload' && !price) return true;
                      
                      return false;
                    })()}
                    className="flex-1 bg-gold text-primary-foreground hover:bg-gold-dark font-display"
                  >
                    {submitting ? "Saving..." : editingId ? "Update Product" : "Save Product"}
                  </Button>
                  {editingId && (
                    <Button variant="ghost" onClick={resetForm} className="text-foreground">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Validation hints */}
                {(() => {
                  const selectedCategory = categories.find(c => c.id === categoryIds[0]);
                  const hints: string[] = [];
                  
                  if (!name) hints.push("Product name is required");
                  if (!preview) hints.push("Product image is required");
                  if (selectedCategory?.function_type === 'link' && !orderUrl) {
                    hints.push("Order Now link is required for Link products");
                  }
                  if ((selectedCategory?.function_type === 'account' || selectedCategory?.function_type === 'upload') && !price) {
                    hints.push("Price is required for checkout products");
                  }
                  
                  if (hints.length === 0) return null;
                  
                  return (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {hints.map((hint, i) => (
                        <p key={i}>⚠️ {hint}</p>
                      ))}
                    </div>
                  );
                })()}
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
            {products.map((product) => {
              // Get category function type for this product
              const productCategory = categories.find(c => c.id === product.category_id);
              const functionType = productCategory?.function_type;
              
              return (
                <div key={product.id} className="product-frame rounded-lg p-3 group">
                  <div className="relative overflow-hidden rounded-md aspect-square mb-3">
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Category Type Badge */}
                    {functionType && (
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-medium ${
                        functionType === 'link' ? 'bg-blue-500/80 text-white' :
                        functionType === 'account' ? 'bg-green-500/80 text-white' :
                        'bg-purple-500/80 text-white'
                      }`}>
                        {functionType === 'link' && '🔗 Link'}
                        {functionType === 'account' && '🔑 Account'}
                        {functionType === 'upload' && '📁 Upload'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        onClick={() => handleEdit(product)}
                        className="bg-gold text-primary-foreground hover:bg-gold-dark"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={() => handleClone(product)}
                        className="bg-gold/80 text-primary-foreground hover:bg-gold"
                        title="Clone"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(product.id)}
                        title="Delete"
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
                    {productCategory && (
                      <p className="text-xs text-muted-foreground truncate">
                        {productCategory.name}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
