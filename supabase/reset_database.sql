-- ============================================================================
-- FORGE DATABASE WIPE & FRESH REBUILD SCRIPT (CONSOLIDATED MIGRATIONS)
-- ============================================================================

-- 1. DANGER: WIPE EVERYTHING IN THE SCHEMA
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Grant standard permissions back
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Set default privileges for future objects created in the schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- 2. CLEAR ALL AUTH USERS (Allows starting fresh with signups)
TRUNCATE auth.users CASCADE;

-- 3. CORE SCHEMAS

-- 3.1 Organizations Table (Multi-Tenancy Root)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.2 User Profiles Table (Linked to Supabase Auth)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    full_name TEXT,
    department TEXT,
    updated_at TIMESTAMPTZ
);

-- 3.3 Clients Table (Scoped by Organization)
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    primary_contact TEXT,
    contact_email TEXT,
    client_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.4 Projects Table (Scoped by Client and Organization)
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    site_name TEXT,
    county TEXT,
    state TEXT,
    country TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    consultant_epc TEXT,
    ac_capacity_mw NUMERIC,
    dc_capacity_mw NUMERIC,
    poi_voltage_kv NUMERIC,
    mv_collection_voltage_kv NUMERIC,
    lv_collection_voltage_v NUMERIC,
    dc_voltage_v NUMERIC,
    total_area_acres NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.5 Reports Master Table (Scoped by Project and Organization)
CREATE TABLE public.reports (
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

-- 3.6 Report Files Table (Supabase Storage reference files)
CREATE TABLE public.report_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.7 New project_site_conditions table
CREATE TABLE public.project_site_conditions (
    project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    altitude_ft NUMERIC,
    wind_speed_mph NUMERIC,
    snow_load_psf NUMERIC,
    snow_depth_in NUMERIC,
    risk_category TEXT,
    temp_min_c NUMERIC,
    temp_max_c NUMERIC,
    design_temp_f NUMERIC,
    utility_name TEXT,
    fence_area_acres NUMERIC,
    road_width_ft NUMERIC,
    fence_clearance_ft NUMERIC
);

-- 4. EQUIPMENT CATALOGS

CREATE TABLE public.equipment_pcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    rating_kva NUMERIC,
    ac_voltage_v NUMERIC,
    dc_voltage_range TEXT,
    frequency_hz NUMERIC,
    efficiency_percent NUMERIC,
    thd_percent NUMERIC,
    protection_rating TEXT,
    cooling_method TEXT,
    communication_interfaces TEXT,
    dimensions TEXT,
    certifications TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(manufacturer, model)
);

CREATE TABLE public.equipment_transformers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    rating_kva NUMERIC,
    voltage_ratio TEXT,
    winding_config TEXT,
    vector_group TEXT,
    impedance_percent NUMERIC,
    efficiency_percent NUMERIC,
    winding_material TEXT,
    cooling_class TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(manufacturer, model)
);

CREATE TABLE public.equipment_cables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cable_class TEXT CHECK (cable_class IN ('dc_cable', 'trunk_cable', 'mv_cable', 'aux_cable')),
    conductor_material TEXT,
    insulation_type TEXT,
    voltage_rating_v NUMERIC,
    cable_size TEXT,
    temp_rating_c NUMERIC,
    certifications TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.report_cables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
    cable_purpose TEXT NOT NULL,
    cable_spec_id UUID REFERENCES equipment_cables(id) ON DELETE RESTRICT NOT NULL,
    no_of_runs INT DEFAULT 1,
    burial_depth_ft NUMERIC,
    installation_method TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. REPORT SPECIFIC TABLES

-- 5.1 PV Report specific inputs
CREATE TABLE public.pv_reports (
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
    site_conditions JSONB DEFAULT '{}'::jsonb,
    module_type TEXT,
    module_pmax NUMERIC,
    module_voc NUMERIC,
    module_vmp NUMERIC,
    module_isc NUMERIC,
    module_imp NUMERIC,
    module_length_mm NUMERIC,
    module_width_mm NUMERIC,
    module_height_mm NUMERIC,
    temp_coeff_voc_percent NUMERIC,
    temp_coeff_pm_percent NUMERIC,
    temp_coeff_isc_percent NUMERIC,
    dc_ac_ratio_poi NUMERIC,
    dc_ac_ratio_inv NUMERIC,
    pcs_id UUID REFERENCES equipment_pcs(id) ON DELETE RESTRICT,
    transformer_id UUID REFERENCES equipment_transformers(id) ON DELETE RESTRICT
);

-- One-to-many dynamic engineering table for PV String Sizing
CREATE TABLE public.pv_string_sizing_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pv_report_id UUID REFERENCES pv_reports(id) ON DELETE CASCADE NOT NULL,
    inverter_channel_id TEXT NOT NULL,
    strings_per_mppt INT NOT NULL,
    modules_per_string INT NOT NULL,
    voc_min_temp NUMERIC,
    vmp_max_temp NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5.2 Battery Report inputs
CREATE TABLE public.battery_reports (
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
    operating_conditions JSONB DEFAULT '{}'::jsonb,
    battery_min_voltage NUMERIC,
    battery_max_voltage NUMERIC,
    battery_rated_voltage NUMERIC,
    battery_rated_current NUMERIC,
    bess_dimension TEXT,
    bess_energy_per_enclosure_kwh NUMERIC,
    no_of_enclosures INT,
    cooling_method TEXT,
    bess_design_life_years INT,
    battery_charge_rate TEXT,
    battery_discharge_rate TEXT,
    battery_max_power_mw NUMERIC,
    pcs_id UUID REFERENCES equipment_pcs(id) ON DELETE RESTRICT,
    transformer_id UUID REFERENCES equipment_transformers(id) ON DELETE RESTRICT
);

-- 5.3 bess_egc_rows Table
CREATE TABLE public.bess_egc_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battery_report_id UUID REFERENCES battery_reports(id) ON DELETE CASCADE NOT NULL,
    row_index INT NOT NULL,
    circuit_name TEXT NOT NULL,
    ocpd TEXT NOT NULL,
    power_cable TEXT NOT NULL,
    egc TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(battery_report_id, row_index)
);

-- 5.4 PCS Report inputs
CREATE TABLE public.pcs_reports (
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

-- 5.5 Inverter Report inputs
CREATE TABLE public.inverter_reports (
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

-- 5.6 Transformer Report inputs
CREATE TABLE public.transformer_reports (
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

-- 5.7 Switchgear Report inputs
CREATE TABLE public.switchgear_reports (
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

-- 5.8 Cable Report inputs
CREATE TABLE public.cable_reports (
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

-- 5.9 Relay Protection Report inputs
CREATE TABLE public.relay_protection_reports (
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

-- 5.10 Electrical Design Report inputs
CREATE TABLE public.electrical_design_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    system_frequency_hz NUMERIC,
    short_circuit_level_ka NUMERIC,
    max_voltage_drop_percent NUMERIC,
    grounding_system_type TEXT,
    design_standards JSONB DEFAULT '{}'::jsonb,
    key_design_parameters JSONB DEFAULT '{}'::jsonb
);

-- 5.11 Structural Report inputs
CREATE TABLE public.structural_reports (
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

-- 5.12 Grounding Report inputs
CREATE TABLE public.grounding_reports (
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

-- 5.13 High Voltage Report inputs (hv_reports)
CREATE TABLE public.hv_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    poi_voltage NUMERIC,
    substation_voltage NUMERIC,
    collection_voltage NUMERIC,
    system_frequency NUMERIC,
    fault_level NUMERIC,
    bil_rating NUMERIC,
    mpt_manufacturer TEXT,
    mpt_model TEXT,
    mpt_rating_mva NUMERIC,
    mpt_voltage_ratio TEXT,
    mpt_impedance NUMERIC,
    mpt_vector_group TEXT,
    mpt_cooling_class TEXT,
    hv_breaker_type TEXT,
    hv_breaker_rating NUMERIC,
    hv_disconnect_type TEXT,
    hv_disconnect_rating NUMERIC,
    bus_bar_type TEXT,
    bus_bar_rating NUMERIC,
    relay_codes TEXT,
    ground_conductor TEXT,
    ground_software TEXT,
    scada_protocol TEXT
);

-- 6. USER PROFILE PROFILE CREATION TRIGGER

-- Automatically synchronize auth.users entries with public.profiles on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, organization_id, role, full_name, department, updated_at)
  VALUES (
    new.id,
    NULL, -- Filled by backend during signup
    'member',
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Engineering User'),
    NULLIF(new.raw_user_meta_data->>'department', ''),
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


-- 7. ROW LEVEL SECURITY (RLS) POLICIES

-- 7.1 Enable RLS on reports and detail tables
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pv_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pv_string_sizing_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battery_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bess_egc_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcs_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inverter_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transformer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.switchgear_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cable_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_protection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electrical_design_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.structural_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grounding_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_reports ENABLE ROW LEVEL SECURITY;

-- 7.2 Reports Table Policies (Owner isolation)
CREATE POLICY "Reports SELECT owner isolation" ON public.reports
    FOR SELECT TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Reports INSERT owner isolation" ON public.reports
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Reports UPDATE owner isolation" ON public.reports
    FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "Reports DELETE owner isolation" ON public.reports
    FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 7.3 Report Files and Detail Tables Policies (Linked back to reports creator)
CREATE POLICY "Report Files owner isolation" ON public.report_files
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );

CREATE POLICY "PV Reports owner isolation" ON public.pv_reports
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );

CREATE POLICY "PV String Sizing owner isolation" ON public.pv_string_sizing_rows
    FOR ALL TO authenticated USING (
        pv_report_id IN (
            SELECT id FROM public.pv_reports WHERE report_id IN (
                SELECT id FROM public.reports WHERE created_by = auth.uid()
            )
        )
    ) WITH CHECK (
        pv_report_id IN (
            SELECT id FROM public.pv_reports WHERE report_id IN (
                SELECT id FROM public.reports WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Battery Reports owner isolation" ON public.battery_reports
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );

CREATE POLICY "BESS EGC Rows owner isolation" ON public.bess_egc_rows
    FOR ALL TO authenticated USING (
        battery_report_id IN (
            SELECT id FROM public.battery_reports WHERE report_id IN (
                SELECT id FROM public.reports WHERE created_by = auth.uid()
            )
        )
    ) WITH CHECK (
        battery_report_id IN (
            SELECT id FROM public.battery_reports WHERE report_id IN (
                SELECT id FROM public.reports WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "PCS Reports owner isolation" ON public.pcs_reports
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Inverter Reports owner isolation" ON public.inverter_reports
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Transformer Reports owner isolation" ON public.transformer_reports
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Switchgear Reports owner isolation" ON public.switchgear_reports
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Cable Reports owner isolation" ON public.cable_reports
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Relay Protection Reports owner isolation" ON public.relay_protection_reports
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Electrical Design Reports owner isolation" ON public.electrical_design_reports
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Structural Reports owner isolation" ON public.structural_reports
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Grounding Reports owner isolation" ON public.grounding_reports
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );

CREATE POLICY "HV Reports owner isolation" ON public.hv_reports
    FOR ALL TO authenticated USING (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    ) WITH CHECK (
        report_id IN (SELECT id FROM public.reports WHERE created_by = auth.uid())
    );


-- 8. PERFORMANCE INDEXES

CREATE INDEX IF NOT EXISTS idx_profiles_organization ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_organization ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_project ON public.reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_organization ON public.reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_pv_reports_ref ON public.pv_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_pv_string_sizing_ref ON public.pv_string_sizing_rows(pv_report_id);
CREATE INDEX IF NOT EXISTS idx_battery_reports_ref ON public.battery_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_pcs_reports_ref ON public.pcs_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_inverter_reports_ref ON public.inverter_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_transformer_reports_ref ON public.transformer_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_switchgear_reports_ref ON public.switchgear_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_cable_reports_ref ON public.cable_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_relay_protection_reports_ref ON public.relay_protection_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_electrical_design_reports_ref ON public.electrical_design_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_structural_reports_ref ON public.structural_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_grounding_reports_ref ON public.grounding_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_report_files_ref ON public.report_files(report_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_by_type_created_at ON public.reports(created_by, report_type, created_at DESC);


-- 9. SQL VIEWS FOR DASHBOARDS

CREATE OR REPLACE VIEW public.report_dashboard_view AS
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
FROM public.reports r
JOIN public.projects p ON r.project_id = p.id
JOIN public.clients c ON p.client_id = c.id;


-- 10. STORED PROCEDURES (RETRIEVAL UTILITY)

-- Single-query report compiler to pull all metadata and child inputs as a nested JSON
CREATE OR REPLACE FUNCTION public.get_complete_report_data(target_report_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    v_report_type TEXT;
BEGIN
    -- 1. Resolve report type
    SELECT report_type INTO v_report_type FROM public.reports WHERE id = target_report_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- 2. Compile nested JSON based on report type
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
                            (SELECT jsonb_agg(ss.*) FROM public.pv_string_sizing_rows ss WHERE ss.pv_report_id = pv.id),
                            '[]'::jsonb
                        )
                    )
                    FROM public.pv_reports pv WHERE pv.report_id = r.id
                )
            ) INTO result
            FROM public.reports r
            JOIN public.projects p ON r.project_id = p.id
            JOIN public.clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;

        WHEN 'battery' THEN
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', (SELECT to_jsonb(bat.*) FROM public.battery_reports bat WHERE bat.report_id = r.id)
            ) INTO result
            FROM public.reports r
            JOIN public.projects p ON r.project_id = p.id
            JOIN public.clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;

        WHEN 'pcs' THEN
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', (SELECT to_jsonb(pcs.*) FROM public.pcs_reports pcs WHERE pcs.report_id = r.id)
            ) INTO result
            FROM public.reports r
            JOIN public.projects p ON r.project_id = p.id
            JOIN public.clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;

        WHEN 'grounding' THEN
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', (SELECT to_jsonb(gr.*) FROM public.grounding_reports gr WHERE gr.report_id = r.id)
            ) INTO result
            FROM public.reports r
            JOIN public.projects p ON r.project_id = p.id
            JOIN public.clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;

        WHEN 'cable' THEN
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', (SELECT to_jsonb(cab.*) FROM public.cable_reports cab WHERE cab.report_id = r.id)
            ) INTO result
            FROM public.reports r
            JOIN public.projects p ON r.project_id = p.id
            JOIN public.clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;

        WHEN 'hv-dbr' THEN
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', (SELECT to_jsonb(hv.*) FROM public.hv_reports hv WHERE hv.report_id = r.id)
            ) INTO result
            FROM public.reports r
            JOIN public.projects p ON r.project_id = p.id
            JOIN public.clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;

        -- Fallback default response for generic/custom reports
        ELSE
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', r.metadata_json
            ) INTO result
            FROM public.reports r
            JOIN public.projects p ON r.project_id = p.id
            JOIN public.clients c ON p.client_id = c.id
            WHERE r.id = target_report_id;
    END CASE;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant privileges on all existing objects in public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
