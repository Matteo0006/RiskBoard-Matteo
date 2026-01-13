
-- Enum per i ruoli aziendali
CREATE TYPE public.company_role AS ENUM ('owner', 'admin', 'viewer');

-- Tabella membri azienda (ruoli per azienda)
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role company_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Tabella inviti
CREATE TABLE public.company_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role company_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, email, token)
);

-- Tabella commenti obblighi (per Viewer)
CREATE TABLE public.obligation_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_id UUID NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligation_comments ENABLE ROW LEVEL SECURITY;

-- Funzione helper: verifica se utente è membro di un'azienda
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- Funzione helper: ottieni ruolo utente in un'azienda
CREATE OR REPLACE FUNCTION public.get_company_role(_user_id UUID, _company_id UUID)
RETURNS company_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.company_members
  WHERE user_id = _user_id AND company_id = _company_id
  LIMIT 1
$$;

-- Funzione helper: può gestire azienda (owner o admin)
CREATE OR REPLACE FUNCTION public.can_manage_company(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id 
    AND company_id = _company_id 
    AND role IN ('owner', 'admin')
  )
$$;

-- RLS Policies per company_members
CREATE POLICY "Members can view their company members"
  ON public.company_members FOR SELECT
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Owners and admins can add members"
  ON public.company_members FOR INSERT
  WITH CHECK (can_manage_company(auth.uid(), company_id));

CREATE POLICY "Owners and admins can update members"
  ON public.company_members FOR UPDATE
  USING (can_manage_company(auth.uid(), company_id))
  WITH CHECK (can_manage_company(auth.uid(), company_id));

CREATE POLICY "Owners and admins can remove members"
  ON public.company_members FOR DELETE
  USING (can_manage_company(auth.uid(), company_id));

-- RLS Policies per company_invitations
CREATE POLICY "Members can view company invitations"
  ON public.company_invitations FOR SELECT
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Owners and admins can create invitations"
  ON public.company_invitations FOR INSERT
  WITH CHECK (can_manage_company(auth.uid(), company_id));

CREATE POLICY "Owners and admins can delete invitations"
  ON public.company_invitations FOR DELETE
  USING (can_manage_company(auth.uid(), company_id));

-- RLS Policies per obligation_comments
CREATE POLICY "Members can view obligation comments"
  ON public.obligation_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.obligations o
      WHERE o.id = obligation_id
      AND is_company_member(auth.uid(), o.company_id)
    )
  );

CREATE POLICY "Members can add comments"
  ON public.obligation_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.obligations o
      WHERE o.id = obligation_id
      AND is_company_member(auth.uid(), o.company_id)
    )
  );

CREATE POLICY "Users can update own comments"
  ON public.obligation_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.obligation_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger per aggiungere owner automaticamente quando si crea un'azienda
CREATE OR REPLACE FUNCTION public.add_company_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_members (company_id, user_id, role, accepted_at)
  VALUES (NEW.id, NEW.user_id, 'owner', now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.add_company_owner();

-- Trigger updated_at
CREATE TRIGGER update_company_members_updated_at
  BEFORE UPDATE ON public.company_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_obligation_comments_updated_at
  BEFORE UPDATE ON public.obligation_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Aggiorna RLS per companies (membri possono vedere)
DROP POLICY IF EXISTS "Users can CRUD own companies" ON public.companies;

CREATE POLICY "Owner can manage company"
  ON public.companies FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Members can view company"
  ON public.companies FOR SELECT
  USING (is_company_member(auth.uid(), id));

-- Aggiorna RLS per obligations (membri possono vedere, admin+ possono modificare)
DROP POLICY IF EXISTS "Users can CRUD own obligations" ON public.obligations;

CREATE POLICY "Members can view obligations"
  ON public.obligations FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_company_member(auth.uid(), company_id)
  );

CREATE POLICY "Owners and admins can manage obligations"
  ON public.obligations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    can_manage_company(auth.uid(), company_id)
  );

CREATE POLICY "Owners and admins can update obligations"
  ON public.obligations FOR UPDATE
  USING (
    auth.uid() = user_id OR
    can_manage_company(auth.uid(), company_id)
  );

CREATE POLICY "Owners and admins can delete obligations"
  ON public.obligations FOR DELETE
  USING (
    auth.uid() = user_id OR
    can_manage_company(auth.uid(), company_id)
  );
