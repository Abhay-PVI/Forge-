-- ─── 1. USER PROFILE PROFILE CREATION TRIGGER ──────────────────────────────

-- Automatically synchronize auth.users entries with public.profiles on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, organization_id, role, full_name, updated_at)
  VALUES (
    new.id,
    NULL, -- Map to organization post-signup or assign to default organizational workspace
    'member',
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Engineering User'),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── 2. ROW LEVEL SECURITY (RLS) POLICIES ──────────────────────────────────

-- Enable RLS on core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_files ENABLE ROW LEVEL SECURITY;

-- Enable RLS on report-specific tables
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

-- 2.1 Policies for organizations
CREATE POLICY "Users can read their own organization details" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
    );

-- 2.2 Policies for profiles
CREATE POLICY "Users can view profiles within the same organization" ON profiles
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
    );

CREATE POLICY "Users can edit their own profile details" ON profiles
    FOR UPDATE USING (
        id = auth.uid()
    );

-- 2.3 General Helper Macro for Organization Matching
-- RLS Policy: Clients
CREATE POLICY "Clients isolation policy" ON clients
    AS RESTRICTIVE
    USING (organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

-- RLS Policy: Projects
CREATE POLICY "Projects isolation policy" ON projects
    AS RESTRICTIVE
    USING (organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

-- RLS Policy: Reports
CREATE POLICY "Reports isolation policy" ON reports
    AS RESTRICTIVE
    USING (organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

-- RLS Policy: Report Files
CREATE POLICY "Report Files isolation policy" ON report_files
    FOR ALL USING (
        report_id IN (
            SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
        )
    );

-- 2.4 Policies for report details (linked back to parent reports table)
CREATE POLICY "PV Reports access control" ON pv_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

CREATE POLICY "PV String Sizing access control" ON pv_string_sizing_rows
    FOR ALL USING (
        pv_report_id IN (
            SELECT id FROM pv_reports WHERE report_id IN (
                SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
            )
        )
    );

CREATE POLICY "Battery Reports access control" ON battery_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

CREATE POLICY "PCS Reports access control" ON pcs_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

CREATE POLICY "Inverter Reports access control" ON inverter_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

CREATE POLICY "Transformer Reports access control" ON transformer_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

CREATE POLICY "Switchgear Reports access control" ON switchgear_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

CREATE POLICY "Cable Reports access control" ON cable_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

CREATE POLICY "Relay Protection Reports access control" ON relay_protection_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

CREATE POLICY "Electrical Design Reports access control" ON electrical_design_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

CREATE POLICY "Structural Reports access control" ON structural_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );

CREATE POLICY "Grounding Reports access control" ON grounding_reports
    FOR ALL USING (
        report_id IN (SELECT id FROM reports WHERE organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()))
    );


-- ─── 3. PERFORMANCE INDEXES ────────────────────────────────────────────────

-- Core metadata indexes
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_reports_project ON reports(project_id);
CREATE INDEX idx_reports_organization ON reports(organization_id);
CREATE INDEX idx_reports_type ON reports(report_type);

-- Report-specific foreign key indexes
CREATE INDEX idx_pv_reports_ref ON pv_reports(report_id);
CREATE INDEX idx_pv_string_sizing_ref ON pv_string_sizing_rows(pv_report_id);
CREATE INDEX idx_battery_reports_ref ON battery_reports(report_id);
CREATE INDEX idx_pcs_reports_ref ON pcs_reports(report_id);
CREATE INDEX idx_inverter_reports_ref ON inverter_reports(report_id);
CREATE INDEX idx_transformer_reports_ref ON transformer_reports(report_id);
CREATE INDEX idx_switchgear_reports_ref ON switchgear_reports(report_id);
CREATE INDEX idx_cable_reports_ref ON cable_reports(report_id);
CREATE INDEX idx_relay_protection_reports_ref ON relay_protection_reports(report_id);
CREATE INDEX idx_electrical_design_reports_ref ON electrical_design_reports(report_id);
CREATE INDEX idx_structural_reports_ref ON structural_reports(report_id);
CREATE INDEX idx_grounding_reports_ref ON grounding_reports(report_id);
CREATE INDEX idx_report_files_ref ON report_files(report_id);


-- ─── 4. SQL VIEWS FOR DASHBOARDS ───────────────────────────────────────────

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


-- ─── 5. STORED PROCEDURES (RETRIEVAL UTILITY) ──────────────────────────────

-- Single-query report compiler to pull all metadata and child inputs as a nested JSON
CREATE OR REPLACE FUNCTION get_complete_report_data(target_report_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    v_report_type TEXT;
BEGIN
    -- 1. Resolve report type
    SELECT report_type INTO v_report_type FROM reports WHERE id = target_report_id;
    
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

        -- Fallback default response for generic/custom reports
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
