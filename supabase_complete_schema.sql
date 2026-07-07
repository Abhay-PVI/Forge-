-- ============================================================================
-- SUPABASE COMPLETE SYSTEM SCHEMA & MIGRATION SCRIPT
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────────────────────
-- 1. CORE METADATA SCHEMAS
-- ────────────────────────────────────────────────────────────────────────────

-- 1.1 Organizations Table (Multi-Tenancy Root)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.2 User Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    full_name TEXT,
    updated_at TIMESTAMPTZ
);

-- 1.3 Clients Table (Scoped by Organization)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.4 Projects Table (Scoped by Client and Organization)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    county TEXT,
    state TEXT,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.5 Reports Master Table (Scoped by Project and Organization)
CREATE TABLE IF NOT EXISTS reports (
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

-- 1.6 Report Files Table (Supabase Storage reference files)
CREATE TABLE IF NOT EXISTS report_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. REPORT-SPECIFIC CHILD SCHEMAS
-- ────────────────────────────────────────────────────────────────────────────

-- 2.1 PV Report specific inputs
CREATE TABLE IF NOT EXISTS pv_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    module_manufacturer TEXT,
    module_model TEXT,
    electrical_characteristics JSONB DEFAULT '{}'::jsonb,
    mechanical_characteristics JSONB DEFAULT '{}'::jsonb,
    temperature_coefficients JSONB DEFAULT '{}'::jsonb,
    pvsyst_results JSONB DEFAULT '{}'::jsonb,
    irradiation_data JSONB DEFAULT '{}'::jsonb,
    energy_yield JSONB DEFAULT '{}'::jsonb,
    loss_analysis JSONB DEFAULT '{}'::jsonb,
    voc_calculations JSONB DEFAULT '{}'::jsonb,
    isc_calculations JSONB DEFAULT '{}'::jsonb,
    degradation_tables JSONB DEFAULT '{}'::jsonb,
    site_conditions JSONB DEFAULT '{}'::jsonb
);

-- One-to-many dynamic engineering table for PV String Sizing
CREATE TABLE IF NOT EXISTS pv_string_sizing_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pv_report_id UUID REFERENCES pv_reports(id) ON DELETE CASCADE NOT NULL,
    inverter_channel_id TEXT NOT NULL,
    strings_per_mppt INT NOT NULL,
    modules_per_string INT NOT NULL,
    voc_min_temp NUMERIC,
    vmp_max_temp NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.2 Battery Report inputs
CREATE TABLE IF NOT EXISTS battery_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    battery_manufacturer TEXT,
    battery_model TEXT,
    cell_chemistry TEXT,
    charge_characteristics JSONB DEFAULT '{}'::jsonb,
    discharge_characteristics JSONB DEFAULT '{}'::jsonb,
    thermal_limits JSONB DEFAULT '{}'::jsonb,
    protection_settings JSONB DEFAULT '{}'::jsonb,
    cycle_life INT,
    operating_conditions JSONB DEFAULT '{}'::jsonb
);

-- 2.3 PCS Report inputs
CREATE TABLE IF NOT EXISTS pcs_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    pcs_manufacturer TEXT,
    pcs_model TEXT,
    voltage_limits JSONB DEFAULT '{}'::jsonb,
    current_limits JSONB DEFAULT '{}'::jsonb,
    mppt_details JSONB DEFAULT '{}'::jsonb,
    ac_specifications JSONB DEFAULT '{}'::jsonb,
    dc_specifications JSONB DEFAULT '{}'::jsonb,
    efficiency_curves JSONB DEFAULT '{}'::jsonb,
    communication_interfaces JSONB DEFAULT '{}'::jsonb,
    protection_features JSONB DEFAULT '{}'::jsonb
);

-- 2.4 Inverter Report inputs
CREATE TABLE IF NOT EXISTS inverter_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    inverter_manufacturer TEXT,
    inverter_model TEXT,
    voltage_limits JSONB DEFAULT '{}'::jsonb,
    current_limits JSONB DEFAULT '{}'::jsonb,
    mppt_details JSONB DEFAULT '{}'::jsonb,
    ac_specifications JSONB DEFAULT '{}'::jsonb,
    dc_specifications JSONB DEFAULT '{}'::jsonb,
    efficiency_curves JSONB DEFAULT '{}'::jsonb
);

-- 2.5 Transformer Report inputs
CREATE TABLE IF NOT EXISTS transformer_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    transformer_manufacturer TEXT,
    transformer_model TEXT,
    capacity_kva NUMERIC,
    voltage_ratio TEXT,
    impedance_percent NUMERIC,
    cooling_class TEXT,
    losses_no_load_w NUMERIC,
    losses_load_w NUMERIC
);

-- 2.6 Switchgear Report inputs
CREATE TABLE IF NOT EXISTS switchgear_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    switchgear_manufacturer TEXT,
    switchgear_model TEXT,
    rated_voltage_kv NUMERIC,
    rated_current_a NUMERIC,
    short_circuit_withstand_ka NUMERIC,
    busbar_material TEXT,
    ip_rating TEXT
);

-- 2.7 Cable Report inputs
CREATE TABLE IF NOT EXISTS cable_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    conductor_material TEXT,
    insulation_type TEXT,
    voltage_rating TEXT,
    cable_size TEXT,
    no_of_runs INT,
    installation_method TEXT,
    soil_thermal_resistivity NUMERIC,
    soil_temperature NUMERIC,
    load_factor NUMERIC,
    derated_ampacity NUMERIC
);

-- 2.8 Relay Protection Report inputs
CREATE TABLE IF NOT EXISTS relay_protection_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    relay_manufacturer TEXT,
    relay_model TEXT,
    ansi_codes TEXT,
    ct_ratio TEXT,
    pt_ratio TEXT,
    pickup_settings JSONB DEFAULT '{}'::jsonb,
    delay_settings JSONB DEFAULT '{}'::jsonb
);

-- 2.9 Electrical Design Report inputs
CREATE TABLE IF NOT EXISTS electrical_design_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    system_frequency_hz NUMERIC,
    short_circuit_level_ka NUMERIC,
    max_voltage_drop_percent NUMERIC,
    grounding_system_type TEXT,
    design_standards JSONB DEFAULT '{}'::jsonb,
    key_design_parameters JSONB DEFAULT '{}'::jsonb
);

-- 2.10 Structural Report inputs
CREATE TABLE IF NOT EXISTS structural_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    wind_load_mph NUMERIC,
    snow_load_psf NUMERIC,
    seismic_design_category TEXT,
    foundation_type TEXT,
    soil_bearing_capacity TEXT,
    structural_steel_grade TEXT,
    concrete_strength_psi NUMERIC
);

-- 2.11 Grounding Report inputs
CREATE TABLE IF NOT EXISTS grounding_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    grounding_software TEXT,
    ground_conductor_bess TEXT,
    ground_conductor_pcs TEXT,
    ground_conductor_aux TEXT,
    ground_conductor_misc TEXT,
    grounding_layout_drawing_no TEXT,
    grounding_analysis_report_no TEXT,
    safety_body_weight_kg NUMERIC,
    safety_shock_duration_sec NUMERIC,
    soil_resistivity_model JSONB DEFAULT '{}'::jsonb
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. USER PROFILE CREATION AUTOMATION TRIGGER
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, organization_id, role, full_name, updated_at)
  VALUES (
    new.id,
    NULL,
    'member',
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Engineering User'),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE pv_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pv_string_sizing_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcs_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE inverter_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE switchgear_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cable_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE relay_protection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE electrical_design_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE structural_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE grounding_reports ENABLE ROW LEVEL SECURITY;

-- 4.1 Policies for organizations
DROP POLICY IF EXISTS "Users can read their own organization details" ON organizations;
CREATE POLICY "Users can read their own organization details" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
    );

-- 4.2 Policies for profiles
DROP POLICY IF EXISTS "Users can view profiles within the same organization" ON profiles;
CREATE POLICY "Users can view profiles within the same organization" ON profiles
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can edit their own profile details" ON profiles;
CREATE POLICY "Users can edit their own profile details" ON profiles
    FOR UPDATE USING (
        id = auth.uid()
    );

-- 4.3 Tenant Policies (using active profile scope)
DROP POLICY IF EXISTS "Clients isolation policy" ON clients;
CREATE POLICY "Clients isolation policy" ON clients
    FOR ALL
    USING (organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Projects isolation policy" ON projects;
CREATE POLICY "Projects isolation policy" ON projects
    FOR ALL
    USING (organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Reports isolation policy" ON reports;
CREATE POLICY "Reports isolation policy" ON reports
    FOR ALL
    USING (organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Report Files isolation policy" ON report_files;
CREATE POLICY "Report Files isolation policy" ON report_files
    FOR ALL USING (
        report_id IN (
            SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
        )
    );

-- 4.4 Child Tables (relational check)
DROP POLICY IF EXISTS "PV Reports access control" ON pv_reports;
CREATE POLICY "PV Reports access control" ON pv_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

DROP POLICY IF EXISTS "PV String Sizing access control" ON pv_string_sizing_rows;
CREATE POLICY "PV String Sizing access control" ON pv_string_sizing_rows
    FOR ALL USING (
        pv_report_id IN (
            SELECT id FROM pv_reports WHERE report_id IN (
                SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Battery Reports access control" ON battery_reports;
CREATE POLICY "Battery Reports access control" ON battery_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

DROP POLICY IF EXISTS "PCS Reports access control" ON pcs_reports;
CREATE POLICY "PCS Reports access control" ON pcs_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

DROP POLICY IF EXISTS "Inverter Reports access control" ON inverter_reports;
CREATE POLICY "Inverter Reports access control" ON inverter_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

DROP POLICY IF EXISTS "Transformer Reports access control" ON transformer_reports;
CREATE POLICY "Transformer Reports access control" ON transformer_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

DROP POLICY IF EXISTS "Switchgear Reports access control" ON switchgear_reports;
CREATE POLICY "Switchgear Reports access control" ON switchgear_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

DROP POLICY IF EXISTS "Cable Reports access control" ON cable_reports;
CREATE POLICY "Cable Reports access control" ON cable_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

DROP POLICY IF EXISTS "Relay Protection Reports access control" ON relay_protection_reports;
CREATE POLICY "Relay Protection Reports access control" ON relay_protection_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

DROP POLICY IF EXISTS "Electrical Design Reports access control" ON electrical_design_reports;
CREATE POLICY "Electrical Design Reports access control" ON electrical_design_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

DROP POLICY IF EXISTS "Structural Reports access control" ON structural_reports;
CREATE POLICY "Structural Reports access control" ON structural_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

DROP POLICY IF EXISTS "Grounding Reports access control" ON grounding_reports;
CREATE POLICY "Grounding Reports access control" ON grounding_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

-- ────────────────────────────────────────────────────────────────────────────
-- 5. PERFORMANCE INDEXES
-- ────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_project ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_organization ON reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_pv_reports_ref ON pv_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_pv_string_sizing_ref ON pv_string_sizing_rows(pv_report_id);
CREATE INDEX IF NOT EXISTS idx_battery_reports_ref ON battery_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_pcs_reports_ref ON pcs_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_inverter_reports_ref ON inverter_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_transformer_reports_ref ON transformer_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_switchgear_reports_ref ON switchgear_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_cable_reports_ref ON cable_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_relay_protection_reports_ref ON relay_protection_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_electrical_design_reports_ref ON electrical_design_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_structural_reports_ref ON structural_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_grounding_reports_ref ON grounding_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_report_files_ref ON report_files(report_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. SQL VIEWS FOR DASHBOARDS
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW report_dashboard_view AS
SELECT
    r.id AS report_id,
    r.document_no,
    r.revision,
    r.prepared_date,
    r.report_title,
    r.report_type,
    r.status AS report_status,
    p.name AS project_name,
    p.county AS project_county,
    p.state AS project_state,
    c.name AS client_name,
    r.organization_id
FROM reports r
JOIN projects p ON r.project_id = p.id
JOIN clients c ON p.client_id = c.id;

-- ────────────────────────────────────────────────────────────────────────────
-- 7. STORED PROCEDURES (RETRIEVAL UTILITY)
-- ────────────────────────────────────────────────────────────────────────────

-- Single-query report compiler to pull all metadata and child inputs as a nested JSON
CREATE OR REPLACE FUNCTION get_complete_report_data(target_report_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    v_report_type TEXT;
BEGIN
    SELECT report_type INTO v_report_type FROM reports WHERE id = target_report_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    CASE v_report_type
        WHEN 'pv' THEN
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', (
                    SELECT jsonb_build_object(
                        'details', pv.*,
                        'string_sizing_table', COALESCE(
                            (SELECT jsonb_agg(ss.*) FROM pv_string_sizing_rows ss WHERE ss.pv_report_id = pv.id),
                            '[]'::jsonb
                        )
                    )
                    FROM pv_reports pv WHERE pv.report_id = r.id
                )
            ) INTO result
            FROM reports r
            JOIN projects p ON r.project_id = p.id
            JOIN clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;

        WHEN 'battery' THEN
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', (SELECT to_jsonb(bat.*) FROM battery_reports bat WHERE bat.report_id = r.id)
            ) INTO result
            FROM reports r
            JOIN projects p ON r.project_id = p.id
            JOIN clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;

        WHEN 'pcs' THEN
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', (SELECT to_jsonb(pcs.*) FROM pcs_reports pcs WHERE pcs.report_id = r.id)
            ) INTO result
            FROM reports r
            JOIN projects p ON r.project_id = p.id
            JOIN clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;

        WHEN 'grounding' THEN
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', (SELECT to_jsonb(gr.*) FROM grounding_reports gr WHERE gr.report_id = r.id)
            ) INTO result
            FROM reports r
            JOIN projects p ON r.project_id = p.id
            JOIN clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;

        WHEN 'cable' THEN
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', (SELECT to_jsonb(cab.*) FROM cable_reports cab WHERE cab.report_id = r.id)
            ) INTO result
            FROM reports r
            JOIN projects p ON r.project_id = p.id
            JOIN clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;

        ELSE
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', r.metadata_json
            ) INTO result
            FROM reports r
            JOIN projects p ON r.project_id = p.id
            JOIN clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;
    END CASE;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
