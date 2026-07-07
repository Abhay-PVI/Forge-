-- 1. PV Report specific inputs
CREATE TABLE pv_reports (
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
CREATE TABLE pv_string_sizing_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pv_report_id UUID REFERENCES pv_reports(id) ON DELETE CASCADE NOT NULL,
    inverter_channel_id TEXT NOT NULL,
    strings_per_mppt INT NOT NULL,
    modules_per_string INT NOT NULL,
    voc_min_temp NUMERIC,
    vmp_max_temp NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Battery Report inputs
CREATE TABLE battery_reports (
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

-- 3. PCS Report inputs
CREATE TABLE pcs_reports (
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

-- 4. Inverter Report inputs
CREATE TABLE inverter_reports (
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

-- 5. Transformer Report inputs
CREATE TABLE transformer_reports (
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

-- 6. Switchgear Report inputs
CREATE TABLE switchgear_reports (
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

-- 7. Cable Report inputs
CREATE TABLE cable_reports (
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

-- 8. Relay Protection Report inputs
CREATE TABLE relay_protection_reports (
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

-- 9. Electrical Design Report inputs
CREATE TABLE electrical_design_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    system_frequency_hz NUMERIC,
    short_circuit_level_ka NUMERIC,
    max_voltage_drop_percent NUMERIC,
    grounding_system_type TEXT,
    design_standards JSONB DEFAULT '{}'::jsonb,
    key_design_parameters JSONB DEFAULT '{}'::jsonb
);

-- 10. Structural Report inputs
CREATE TABLE structural_reports (
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

-- 11. Grounding Report inputs
CREATE TABLE grounding_reports (
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
