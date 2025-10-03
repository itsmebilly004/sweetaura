import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ShoppingCart, Star } from "lucide-react";
import ReviewCard from "@/components/ReviewCard";
import StarRating from "@/components/StarRating";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters long."),
});
type ReviewFormData = z.infer<typeof reviewSchema>;

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addItem } = useCart();
  const { user } = useAuth();

  // --- Data Fetching ---
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, category:categories(name)`)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`*, author:profiles(full_name, avatar_url, email)`) // MODIFIED: Fetches email
        .eq("product_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // --- Review Form ---
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: "" },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      if (!user || !id) throw new Error("You must be logged in to post a review.");
      const { error } = await supabase.from("reviews").insert({
        ...data,
        user_id: user.id,
        product_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      form.reset();
    },
    onError: (error: any) => {
      if (error.code === '23505') { // Unique constraint violation
        toast.error("You have already reviewed this product.");
      } else {
        toast.error(`Failed to submit review: ${error.message}`);
      }
    },
  });
  
  const onSubmitReview = (data: ReviewFormData) => {
    reviewMutation.mutate(data);
  };
  
  // --- UI Logic ---
  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: product.image_url || undefined,
    });
  };

  const averageRating = reviews && reviews.length > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0;

  if (isLoadingProduct) {
    return <div>Loading...</div>; // Simplified loading state
  }
  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Details */}
          <div className="aspect-square overflow-hidden rounded-lg bg-muted shadow-[var(--shadow-card)]">
            <img src={product.image_url || ''} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="font-bold">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviews?.length || 0} reviews)</span>
            </div>
            <p className="text-4xl font-bold text-primary mb-6">${Number(product.price).toFixed(2)}</p>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
            <Button onClick={handleAddToCart} disabled={!product.in_stock} size="lg" className="w-full md:w-auto">
              <ShoppingCart className="mr-2 h-5 w-5" /> {product.in_stock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>

        <Separator className="my-12" />

        {/* Reviews Section */}
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-3xl font-bold">Customer Reviews</h2>
            {isLoadingReviews ? (
              <p>Loading reviews...</p>
            ) : reviews && reviews.length > 0 ? (
              reviews.map(review => (
                <ReviewCard
                  key={review.id}
                  // MODIFIED: Fallback from full_name to email
                  authorName={review.author?.full_name || review.author?.email || 'Anonymous'}
                  rating={review.rating}
                  comment={review.comment}
                  createdAt={review.created_at}
                />
              ))
            ) : (
              <p className="text-muted-foreground">No reviews yet. Be the first to write one!</p>
            )}
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitReview)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Rating</FormLabel>
                            <FormControl>
                              <StarRating value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="comment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Review</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Tell us what you think..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={reviewMutation.isLoading}>
                        {reviewMutation.isLoading ? "Submitting..." : "Submit Review"}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p className="mb-4">You must be logged in to write a review.</p>
                    <Button asChild className="w-full">
                      <a href={`/login?redirect=/product/${id}`}>Login to Review</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;