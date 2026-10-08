DROP POLICY IF EXISTS "own items all" ON public.quote_items;
CREATE POLICY "own items all" ON public.quote_items FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.owner_id = auth.uid()));

DROP POLICY IF EXISTS "own versions insert" ON public.quote_versions;
CREATE POLICY "own versions insert" ON public.quote_versions FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.owner_id = auth.uid()));

DROP POLICY IF EXISTS "own tokens insert" ON public.share_tokens;
CREATE POLICY "own tokens insert" ON public.share_tokens FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.quote_versions v WHERE v.id = version_id AND v.quote_id = share_tokens.quote_id AND v.owner_id = auth.uid()));