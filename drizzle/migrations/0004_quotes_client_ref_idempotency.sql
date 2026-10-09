ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS client_ref uuid;
CREATE UNIQUE INDEX IF NOT EXISTS quotes_owner_client_ref_key ON public.quotes(owner_id, client_ref) WHERE client_ref IS NOT NULL;
COMMENT ON COLUMN public.quotes.client_ref IS 'Identificador gerado pelo editor para evitar criar o mesmo orçamento duas vezes em cliques repetidos ou novas tentativas.';