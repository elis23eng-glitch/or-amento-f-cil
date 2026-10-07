ALTER TABLE public.companies
  ADD COLUMN proposal_header_text text,
  ADD COLUMN proposal_footer_text text;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_proposal_header_text_length CHECK (proposal_header_text IS NULL OR char_length(proposal_header_text) <= 180) NOT VALID,
  ADD CONSTRAINT companies_proposal_footer_text_length CHECK (proposal_footer_text IS NULL OR char_length(proposal_footer_text) <= 500) NOT VALID;