-- ============================================================================
-- CREATED_BY-SCOPED RLS (personal dashboard)
-- ============================================================================
-- These are RESTRICTIVE policies, so Postgres ANDs them with the existing
-- organization-scoped RESTRICTIVE policies from 20260703000002_rls_and_triggers.sql
-- — this only ever narrows access further, never widens it.
--
-- NOTE: as of this migration, the FastAPI backend (src/backend/main.py) talks to
-- Supabase exclusively through the service-role client (supabase_admin), which
-- bypasses RLS entirely. Today's actual enforcement is the explicit created_by
-- checks added in main.py alongside this migration. These policies have no
-- effect until requests flow through a per-user JWT (SupabaseReportService's
-- user-scoped client / get_current_user in supabase_service.py) instead of the
-- service-role client — they exist now so that switch-over doesn't require a
-- second migration.

-- Reports (parent table)
CREATE POLICY "Reports created_by isolation" ON reports
    AS RESTRICTIVE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Report Files
CREATE POLICY "Report Files created_by isolation" ON report_files
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

-- Per-type report detail tables
CREATE POLICY "PV Reports created_by isolation" ON pv_reports
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

CREATE POLICY "PV String Sizing created_by isolation" ON pv_string_sizing_rows
    AS RESTRICTIVE
    USING (
        pv_report_id IN (
            SELECT id FROM pv_reports WHERE report_id IN (
                SELECT id FROM reports WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Battery Reports created_by isolation" ON battery_reports
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

CREATE POLICY "PCS Reports created_by isolation" ON pcs_reports
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Inverter Reports created_by isolation" ON inverter_reports
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Transformer Reports created_by isolation" ON transformer_reports
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Switchgear Reports created_by isolation" ON switchgear_reports
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Cable Reports created_by isolation" ON cable_reports
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Relay Protection Reports created_by isolation" ON relay_protection_reports
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Electrical Design Reports created_by isolation" ON electrical_design_reports
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Structural Reports created_by isolation" ON structural_reports
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

CREATE POLICY "Grounding Reports created_by isolation" ON grounding_reports
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

-- Tables added in 20260706000000_schema_restructuring.sql
CREATE POLICY "Report Cables created_by isolation" ON report_cables
    AS RESTRICTIVE
    USING (
        report_id IN (SELECT id FROM reports WHERE created_by = auth.uid())
    );

CREATE POLICY "BESS EGC Rows created_by isolation" ON bess_egc_rows
    AS RESTRICTIVE
    USING (
        battery_report_id IN (
            SELECT id FROM battery_reports WHERE report_id IN (
                SELECT id FROM reports WHERE created_by = auth.uid()
            )
        )
    );
