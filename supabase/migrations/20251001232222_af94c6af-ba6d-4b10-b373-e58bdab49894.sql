-- Create categories table for cake types
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table for cakes
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  images TEXT[], -- Array of additional images
  in_stock BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (e-commerce is public-facing)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

-- Create index for better query performance
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_featured ON public.products(featured) WHERE featured = true;

-- Insert sample categories
INSERT INTO public.categories (name, description, slug, image_url) VALUES
  ('Birthday Cakes', 'Celebrate special moments with our custom birthday cakes', 'birthday-cakes', 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800'),
  ('Wedding Cakes', 'Elegant multi-tier cakes for your perfect day', 'wedding-cakes', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800'),
  ('Cupcakes', 'Delightful individual treats in various flavors', 'cupcakes', 'https://images.unsplash.com/photo-1426869981800-95ebf51ce900?w=800'),
  ('Custom Cakes', 'Bring your dream cake to life with our custom designs', 'custom-cakes', 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800');

-- Insert sample products
INSERT INTO public.products (name, description, price, category_id, image_url, featured, in_stock) 
SELECT 
  'Vanilla Dream Cake',
  'Classic vanilla sponge with buttercream frosting and fresh berries',
  45.00,
  id,
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
  true,
  true
FROM public.categories WHERE slug = 'birthday-cakes'
UNION ALL
SELECT 
  'Chocolate Bliss',
  'Rich chocolate layers with ganache and chocolate shavings',
  52.00,
  id,
  'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800',
  true,
  true
FROM public.categories WHERE slug = 'birthday-cakes'
UNION ALL
SELECT 
  'Elegant Rose Tier',
  'Three-tier white cake with delicate rose decorations',
  285.00,
  id,
  'https://images.unsplash.com/photo-1519666505756-2a7d4bdcb1f4?w=800',
  true,
  true
FROM public.categories WHERE slug = 'wedding-cakes'
UNION ALL
SELECT 
  'Assorted Cupcake Box',
  'Box of 12 gourmet cupcakes in assorted flavors',
  36.00,
  id,
  'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=800',
  false,
  true
FROM public.categories WHERE slug = 'cupcakes';

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();