import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { Package } from "lucide-react";

type Category = Tables<'categories'>;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  category_id: z.string().uuid("Please select a category").nullable(),
  image_url: z.string().optional(),
  image_file: z.instanceof(FileList).optional()
    .refine((files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine((files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type), 'Only .jpg, .png, and .webp formats are supported.'),
  in_stock: z.boolean(),
  featured: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

const ProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category_id: null,
      image_url: "",
      in_stock: true,
      featured: false,
    },
  });

  const imageFile = watch("image_file");

  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (product?.image_url) {
      setImagePreview(product.image_url);
    } else {
      setImagePreview(null);
    }
  }, [imageFile, product]);

  useEffect(() => {
    if (isEditMode && product) {
      reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        category_id: product.category_id,
        image_url: product.image_url || "",
        in_stock: product.in_stock,
        featured: product.featured,
      });
    }
  }, [product, isEditMode, reset]);
  
  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      let imageUrl = product?.image_url || null;

      if (data.image_file && data.image_file.length > 0) {
        const file = data.image_file[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        
        imageUrl = urlData.publicUrl;

        if (isEditMode && product?.image_url) {
          const urlParts = product.image_url.split('/product-images/');
          const oldImagePath = urlParts[1];
          if (oldImagePath) {
            const { error: removeError } = await supabase.storage
              .from('product-images')
              .remove([oldImagePath]);
            if (removeError) console.error("Failed to delete old image:", removeError.message);
          }
        }
      }

      const { image_file, ...dbData } = data;
      const dataToSubmit = { ...dbData, image_url: imageUrl };

      if (isEditMode) {
        const { error } = await supabase.from("products").update(dataToSubmit).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(dataToSubmit);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Product ${isEditMode ? "updated" : "created"} successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      navigate("/admin/dashboard/products");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };
  
  if (isLoadingProduct || isLoadingCategories) {
    return <div>Loading form...</div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Product" : "Add New Product"}</CardTitle>
          <CardDescription>
            Fill in the details for the product.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" type="number" step="0.01" {...register("price")} />
                  {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="category">Category</Label>
                  <Controller
                    name="category_id"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((cat: Category) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="in_stock"
                    control={control}
                    render={({ field }) => (
                      <Switch id="in_stock" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label htmlFor="in_stock">In Stock</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="featured"
                    control={control}
                    render={({ field }) => (
                      <Switch id="featured" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              </div>
            </div>
            <div className="grid gap-3">
              <Label>Product Image</Label>
              <div className="aspect-square rounded-md border border-dashed flex items-center justify-center relative">
                {imagePreview ? (
                  <img src={imagePreview} alt="Product preview" className="w-full h-full object-cover rounded-md" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto" />
                    <p className="mt-2 text-sm">Upload an image</p>
                  </div>
                )}
              </div>
              <Input id="image_file" type="file" {...register("image_file")} accept="image/*" />
              {errors.image_file && <p className="text-sm text-destructive">{errors.image_file.message}</p>}
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => navigate("/admin/dashboard/products")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default ProductForm;