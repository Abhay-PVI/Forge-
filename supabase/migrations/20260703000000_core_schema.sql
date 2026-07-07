-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations Table (Multi-Tenancy Root)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. User Profiles Table (Linked to Supabase Auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    full_name TEXT,
    updated_at TIMESTAMPTZ
);

-- 3. Clients Table (Scoped by Organization)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Projects Table (Scoped by Client and Organization)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    county TEXT,
    state TEXT,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Reports Master Table (Scoped by Project and Organization)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    report_type TEXT NOT NULL,
    document_no TEXT,
    revision TEXT,
    prepared_date DATE,
    report_title TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Report Files Table (Supabase Storage reference files)
CREATE TABLE report_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
