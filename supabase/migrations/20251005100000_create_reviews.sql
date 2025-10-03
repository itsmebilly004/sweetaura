-- ============================================================================
--          CREATE REVIEWS TABLE & POLICIES
-- ============================================================================

-- STEP 1: CREATE THE 'reviews' TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    -- Ensure a user can only review a product once
    CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
);
COMMENT ON TABLE public.reviews IS 'Stores user reviews for products.';


-- STEP 2: ENABLE ROW-LEVEL SECURITY
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;


-- STEP 3: CREATE RLS POLICIES FOR 'reviews'
-- 3.1: Anyone can view reviews.
DROP POLICY IF EXISTS "Public can read all reviews" ON public.reviews;
CREATE POLICY "Public can read all reviews"
ON public.reviews FOR SELECT
USING (true);

-- 3.2: Only authenticated users can create a review.
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
CREATE POLICY "Users can create their own reviews"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3.3: Users can only update their own review.
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- 3.4: Users can only delete their own review.
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE TO authenticated
USING (user_id = auth.uid());


-- STEP 4: Reload the schema cache.
NOTIFY pgrst, 'reload schema';

-- ============================================================================
--                          REVIEWS SETUP COMPLETE
-- ============================================================================