-- Create a bucket for product images with public read access.
-- Max file size is set to 5MB, and allowed types are common image formats.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- POLICIES FOR STORAGE BUCKET

-- Allow anonymous users to view images. This is necessary for them to show up on your website.
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING ( bucket_id = 'product-images' );

-- Allow authenticated users (admins) to upload images.
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

-- Allow authenticated users (admins) to update images.
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-images' );

-- Allow authenticated users (admins) to delete images.
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'product-images' );