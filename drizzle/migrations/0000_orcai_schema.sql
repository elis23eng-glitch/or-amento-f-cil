-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.quote_status AS ENUM ('rascunho', 'publicado', 'aprovado', 'recusado', 'vencido');
CREATE TYPE public.lead_status AS ENUM ('novo', 'contatado', 'em_teste', 'pagante', 'inativo');
CREATE TYPE public.lead_interest AS ENUM ('testar', 'contratar');
CREATE TYPE public.client_kind AS ENUM ('pf', 'pj');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  trial_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
$$;

CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- signup trigger (trial controlled server-side, never reset by profile edits)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- protect trial columns from user updates
CREATE OR REPLACE FUNCTION public.protect_trial_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.trial_started_at := OLD.trial_started_at;
  NEW.trial_ends_at := OLD.trial_ends_at;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_protect_trial BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_trial_columns();

-- COMPANIES
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_name TEXT NOT NULL,
  responsible_name TEXT,
  whatsapp TEXT,
  city TEXT,
  logo_path TEXT,
  cnpj TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own company all" ON public.companies FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- CLIENTS
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  kind public.client_kind NOT NULL DEFAULT 'pf',
  city TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clients all" ON public.clients FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- CATALOG SERVICES
CREATE TABLE public.catalog_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'm2',
  unit_price_cents BIGINT NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_services TO authenticated;
GRANT ALL ON public.catalog_services TO service_role;
ALTER TABLE public.catalog_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own catalog all" ON public.catalog_services FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- QUOTES
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  status public.quote_status NOT NULL DEFAULT 'rascunho',
  quote_date DATE NOT NULL DEFAULT current_date,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT '',
  client_phone TEXT,
  client_kind public.client_kind NOT NULL DEFAULT 'pf',
  service_location TEXT,
  project_type TEXT,
  title TEXT,
  description TEXT,
  payment_terms TEXT,
  execution_term TEXT,
  valid_until DATE,
  inclusions TEXT,
  exclusions TEXT,
  notes TEXT,
  extra_costs_cents BIGINT NOT NULL DEFAULT 0 CHECK (extra_costs_cents >= 0),
  discount_cents BIGINT NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  tax_percent NUMERIC(6,3) NOT NULL DEFAULT 0 CHECK (tax_percent >= 0),
  bdi_percent NUMERIC(6,3) NOT NULL DEFAULT 0 CHECK (bdi_percent >= 0),
  subtotal_cents BIGINT NOT NULL DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  sent_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quotes all" ON public.quotes FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.next_quote_number(_owner UUID)
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(MAX(number), 0) + 1 FROM public.quotes WHERE owner_id = _owner
$$;

-- QUOTE ITEMS
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'm2',
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  unit_price_cents BIGINT NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
  total_cents BIGINT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own items all" ON public.quote_items FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- QUOTE VERSIONS (immutable snapshots)
CREATE TABLE public.quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  total_cents BIGINT NOT NULL,
  valid_until DATE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quote_id, version)
);
GRANT SELECT, INSERT ON public.quote_versions TO authenticated;
GRANT ALL ON public.quote_versions TO service_role;
ALTER TABLE public.quote_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own versions select" ON public.quote_versions FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own versions insert" ON public.quote_versions FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

-- SHARE TOKENS
CREATE TABLE public.share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES public.quote_versions(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.share_tokens TO authenticated;
GRANT ALL ON public.share_tokens TO service_role;
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tokens select" ON public.share_tokens FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own tokens insert" ON public.share_tokens FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own tokens update" ON public.share_tokens FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  profession TEXT,
  city TEXT,
  monthly_quotes TEXT,
  interest public.lead_interest NOT NULL DEFAULT 'testar',
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  status public.lead_status NOT NULL DEFAULT 'novo',
  admin_notes TEXT,
  source_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read leads" ON public.leads FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admins update leads" ON public.leads FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'solicitada',
  starts_on DATE,
  ends_on DATE,
  price_cents BIGINT NOT NULL DEFAULT 2990,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subscription select" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "admins write subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- MANUAL PAYMENTS
CREATE TABLE public.manual_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount_cents BIGINT NOT NULL DEFAULT 2990,
  paid_on DATE NOT NULL DEFAULT current_date,
  method TEXT,
  note TEXT,
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.manual_payments TO authenticated;
GRANT ALL ON public.manual_payments TO service_role;
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments select" ON public.manual_payments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "admins write payments" ON public.manual_payments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- REMINDERS
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  due_on DATE NOT NULL DEFAULT current_date,
  note TEXT NOT NULL DEFAULT '',
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reminders all" ON public.reminders FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ADMIN AUDIT
CREATE TABLE public.admin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit TO authenticated;
GRANT ALL ON public.admin_audit TO service_role;
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit" ON public.admin_audit FOR SELECT TO authenticated USING (public.is_admin());

-- APP SETTINGS
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read settings" ON public.app_settings FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admins write settings" ON public.app_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.app_settings (key, value) VALUES ('admin_whatsapp', NULL) ON CONFLICT DO NOTHING;

CREATE INDEX idx_quotes_owner_status ON public.quotes(owner_id, status);
CREATE INDEX idx_items_quote ON public.quote_items(quote_id, position);
CREATE INDEX idx_versions_quote ON public.quote_versions(quote_id, version DESC);
