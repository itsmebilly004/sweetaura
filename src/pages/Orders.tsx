import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Package } from "lucide-react";

const Orders = () => {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            price_at_purchase,
            products ( name, image_url )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', description: 'Your order is pending confirmation.' };
      case 'approved':
        return { text: 'Approved', description: 'Your order has been approved and is waiting for delivery.' };
      case 'delivered':
        return { text: 'Delivered', description: 'Your order has been delivered.' };
      default:
        return { text: status, description: '' };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold mb-12">My Orders</h1>

        {isLoading ? (
          <p>Loading your orders...</p>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-8">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <Card key={order.id}>
                  <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                      <CardTitle>Order #{order.id.substring(0, 8)}</CardTitle>
                      <CardDescription>
                        Placed on {format(new Date(order.created_at), "PPP")} - {statusInfo.description}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("w-fit mt-2 sm:mt-0 capitalize", {
                        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700": order.status === 'delivered',
                        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700": order.status === 'approved',
                        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700": order.status === 'pending',
                      })}
                    >
                      {statusInfo.text}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.order_items.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <img
                            src={item.products?.image_url || ''}
                            alt={item.products?.name || 'Product'}
                            className="h-16 w-16 rounded-md object-cover bg-muted"
                          />
                          <div className="flex-grow">
                            <p className="font-medium">{item.products?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium">
                            Ksh {(item.price_at_purchase * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 px-6 py-3 flex justify-end font-bold">
                    Total: Ksh {order.total_amount.toFixed(2)}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 border-dashed border-2 rounded-lg">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders. Let's change that!
            </p>
            <Button asChild>
              <Link to="/products">Start Shopping</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;