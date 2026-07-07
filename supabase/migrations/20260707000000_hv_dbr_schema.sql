-- 1. Create table hv_reports
CREATE TABLE IF NOT EXISTS hv_reports (
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

-- 2. Enable Row Level Security (RLS)
ALTER TABLE hv_reports ENABLE ROW LEVEL SECURITY;

-- 3. Setup RLS policies
DROP POLICY IF EXISTS "Allow select for organization members" ON hv_reports;
CREATE POLICY "Allow select for organization members" ON hv_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for organization members" ON hv_reports;
CREATE POLICY "Allow insert for organization members" ON hv_reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for organization members" ON hv_reports;
CREATE POLICY "Allow update for organization members" ON hv_reports FOR UPDATE USING (true);

-- 4. Restrictive created_by isolation policy (personal dashboard security)
DROP POLICY IF EXISTS "HV Reports created_by isolation" ON hv_reports;
CREATE POLICY "HV Reports created_by isolation" ON hv_reports
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

-- 5. Update compilation function to include 'hv-dbr' case
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

        WHEN 'hv-dbr' THEN
            SELECT jsonb_build_object(
                'metadata', r.*,
                'project', p.*,
                'client', c.*,
                'inputs', (SELECT to_jsonb(hv.*) FROM hv_reports hv WHERE hv.report_id = r.id)
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
