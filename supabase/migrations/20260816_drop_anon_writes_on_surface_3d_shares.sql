-- New writes go through publish-surface-3d-share (service role).
-- Public SELECT stays so share.html can keep reading existing ids.

DROP POLICY IF EXISTS "Anyone can create" ON public.surface_3d_shares;
DROP POLICY IF EXISTS surface_3d_shares_insert ON public.surface_3d_shares;
