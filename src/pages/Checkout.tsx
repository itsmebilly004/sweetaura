import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const checkoutSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(10, "A valid phone number is required"),
  address: z.string().min(1, "Delivery address is required"),
  paymentScreenshot: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, "Payment screenshot is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .png, and .webp formats are supported."
    ),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (user?.user_metadata.full_name) {
      form.setValue("fullName", user.user_metadata.full_name);
    }
  }, [user, form]);

  useEffect(() => {
    if (items.length === 0) {
      navigate("/products");
    }
  }, [items, navigate]);

  const onSubmit = (data: CheckoutFormData) => {
    // Logic for submission will be implemented later
    console.log("Order submitted:", data);
    toast.success("Order submitted successfully!", {
      description: "We will verify your payment and contact you shortly.",
    });
    // Placeholder logic: clear cart and redirect after submission
    // clearCart();
    // navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold mb-12">Checkout</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Payment</CardTitle>
                <CardDescription>
                  Please pay <span className="font-bold text-primary">Ksh {total.toFixed(2)}</span> via M-pesa.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">M-pesa Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Go to M-pesa on your phone</li>
                    <li>Select "Lipa na M-pesa"</li>
                    <li>Select "Buy Goods and Services"</li>
                    <li>
                      Enter Till Number: <strong className="text-foreground">3107416</strong>
                    </li>
                    <li>
                      Enter the exact amount: <strong className="text-foreground">Ksh {total.toFixed(2)}</strong>
                    </li>
                    <li>Enter your M-pesa PIN and send</li>
                    <li>You will receive a confirmation SMS from M-pesa</li>
                    <li>Upload a screenshot of the confirmation message below</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2: Delivery & Confirmation</CardTitle>
                <CardDescription>
                  Enter your delivery details and upload your payment proof.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 0712345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Please provide your full delivery address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentScreenshot"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proof of Payment Screenshot</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => field.onChange(e.target.files)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Submitting..." : "Submit Order"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 mb-4">
                {items.map(item => (
                   <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{item.name} x{item.quantity}</span>
                      <span className="text-muted-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                   </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;