-- ============================================================================
-- FORGE DATABASE SCHEMA RESTRUCTURING MIGRATION
-- ============================================================================

-- 1. Clients Table Modifications
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS primary_contact TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT;

-- 2. Projects Table Modifications
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS site_name TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS consultant_epc TEXT,
ADD COLUMN IF NOT EXISTS ac_capacity_mw NUMERIC,
ADD COLUMN IF NOT EXISTS dc_capacity_mw NUMERIC,
ADD COLUMN IF NOT EXISTS poi_voltage_kv NUMERIC,
ADD COLUMN IF NOT EXISTS mv_collection_voltage_kv NUMERIC,
ADD COLUMN IF NOT EXISTS lv_collection_voltage_v NUMERIC,
ADD COLUMN IF NOT EXISTS dc_voltage_v NUMERIC,
ADD COLUMN IF NOT EXISTS total_area_acres NUMERIC;

-- 3. New project_site_conditions table
CREATE TABLE IF NOT EXISTS project_site_conditions (
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

-- 4. Equipment Catalogs
CREATE TABLE IF NOT EXISTS equipment_pcs (
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

CREATE TABLE IF NOT EXISTS equipment_transformers (
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

CREATE TABLE IF NOT EXISTS equipment_cables (
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

CREATE TABLE IF NOT EXISTS report_cables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
    cable_purpose TEXT NOT NULL,
    cable_spec_id UUID REFERENCES equipment_cables(id) ON DELETE RESTRICT NOT NULL,
    no_of_runs INT DEFAULT 1,
    burial_depth_ft NUMERIC,
    installation_method TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. PV Reports Modifications (Typed Columns)
ALTER TABLE pv_reports
ADD COLUMN IF NOT EXISTS module_type TEXT,
ADD COLUMN IF NOT EXISTS module_pmax NUMERIC,
ADD COLUMN IF NOT EXISTS module_voc NUMERIC,
ADD COLUMN IF NOT EXISTS module_vmp NUMERIC,
ADD COLUMN IF NOT EXISTS module_isc NUMERIC,
ADD COLUMN IF NOT EXISTS module_imp NUMERIC,
ADD COLUMN IF NOT EXISTS module_length_mm NUMERIC,
ADD COLUMN IF NOT EXISTS module_width_mm NUMERIC,
ADD COLUMN IF NOT EXISTS module_height_mm NUMERIC,
ADD COLUMN IF NOT EXISTS temp_coeff_voc_percent NUMERIC,
ADD COLUMN IF NOT EXISTS temp_coeff_pm_percent NUMERIC,
ADD COLUMN IF NOT EXISTS temp_coeff_isc_percent NUMERIC,
ADD COLUMN IF NOT EXISTS dc_ac_ratio_poi NUMERIC,
ADD COLUMN IF NOT EXISTS dc_ac_ratio_inv NUMERIC,
ADD COLUMN IF NOT EXISTS pcs_id UUID REFERENCES equipment_pcs(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS transformer_id UUID REFERENCES equipment_transformers(id) ON DELETE RESTRICT;

-- 6. Battery Reports Modifications (Typed Columns)
ALTER TABLE battery_reports
ADD COLUMN IF NOT EXISTS battery_min_voltage NUMERIC,
ADD COLUMN IF NOT EXISTS battery_max_voltage NUMERIC,
ADD COLUMN IF NOT EXISTS battery_rated_voltage NUMERIC,
ADD COLUMN IF NOT EXISTS battery_rated_current NUMERIC,
ADD COLUMN IF NOT EXISTS bess_dimension TEXT,
ADD COLUMN IF NOT EXISTS bess_energy_per_enclosure_kwh NUMERIC,
ADD COLUMN IF NOT EXISTS no_of_enclosures INT,
ADD COLUMN IF NOT EXISTS cooling_method TEXT,
ADD COLUMN IF NOT EXISTS bess_design_life_years INT,
ADD COLUMN IF NOT EXISTS battery_charge_rate TEXT,
ADD COLUMN IF NOT EXISTS battery_discharge_rate TEXT,
ADD COLUMN IF NOT EXISTS battery_max_power_mw NUMERIC,
ADD COLUMN IF NOT EXISTS pcs_id UUID REFERENCES equipment_pcs(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS transformer_id UUID REFERENCES equipment_transformers(id) ON DELETE RESTRICT;

-- 7. bess_egc_rows Table
CREATE TABLE IF NOT EXISTS bess_egc_rows (
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

-- 8. Enable Row Level Security (RLS)
ALTER TABLE project_site_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_pcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_transformers ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_cables ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_cables ENABLE ROW LEVEL SECURITY;
ALTER TABLE bess_egc_rows ENABLE ROW LEVEL SECURITY;

-- 9. Setup RLS policies (allow authenticated access)
DROP POLICY IF EXISTS "Allow read for authenticated" ON project_site_conditions;
CREATE POLICY "Allow read for authenticated" ON project_site_conditions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for authenticated" ON project_site_conditions;
CREATE POLICY "Allow insert for authenticated" ON project_site_conditions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for authenticated" ON project_site_conditions;
CREATE POLICY "Allow update for authenticated" ON project_site_conditions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow read for authenticated" ON equipment_pcs;
CREATE POLICY "Allow read for authenticated" ON equipment_pcs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for authenticated" ON equipment_pcs;
CREATE POLICY "Allow insert for authenticated" ON equipment_pcs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for authenticated" ON equipment_pcs;
CREATE POLICY "Allow update for authenticated" ON equipment_pcs FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow read for authenticated" ON equipment_transformers;
CREATE POLICY "Allow read for authenticated" ON equipment_transformers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for authenticated" ON equipment_transformers;
CREATE POLICY "Allow insert for authenticated" ON equipment_transformers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for authenticated" ON equipment_transformers;
CREATE POLICY "Allow update for authenticated" ON equipment_transformers FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow read for authenticated" ON equipment_cables;
CREATE POLICY "Allow read for authenticated" ON equipment_cables FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for authenticated" ON equipment_cables;
CREATE POLICY "Allow insert for authenticated" ON equipment_cables FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for authenticated" ON equipment_cables;
CREATE POLICY "Allow update for authenticated" ON equipment_cables FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow read for authenticated" ON report_cables;
CREATE POLICY "Allow read for authenticated" ON report_cables FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for authenticated" ON report_cables;
CREATE POLICY "Allow insert for authenticated" ON report_cables FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for authenticated" ON report_cables;
CREATE POLICY "Allow update for authenticated" ON report_cables FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow read for authenticated" ON bess_egc_rows;
CREATE POLICY "Allow read for authenticated" ON bess_egc_rows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for authenticated" ON bess_egc_rows;
CREATE POLICY "Allow insert for authenticated" ON bess_egc_rows FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for authenticated" ON bess_egc_rows;
CREATE POLICY "Allow update for authenticated" ON bess_egc_rows FOR UPDATE USING (true);
