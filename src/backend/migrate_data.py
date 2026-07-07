import sys
import os

from app.supabase_service import supabase_admin

def run_data_migration():
    print("🚀 Starting data migration...")
    
    # 1. Fetch all parent reports
    reports_res = supabase_admin.table("reports").select("*").execute()
    if not reports_res.data:
        print("ℹ️ No reports found to migrate.")
        return
        
    print(f"📦 Found {len(reports_res.data)} reports.")
    
    for r in reports_res.data:
        report_id = r["id"]
        project_id = r["project_id"]
        report_type = r["report_type"]
        meta_json = r.get("metadata_json") or {}
        
        if not meta_json:
            print(f"⚠️ Skip report {report_id} (empty metadata_json)")
            continue
            
        print(f"🔄 Migrating data for report {report_id} ({report_type})...")
        
        # --- A. Migrate Client Info ---
        # Get project to find client_id
        proj_res = supabase_admin.table("projects").select("client_id").eq("id", project_id).single().execute()
        if proj_res.data:
            client_id = proj_res.data["client_id"]
            client_payload = {
                "primary_contact": meta_json.get("clientContact"),
                "contact_email": meta_json.get("clientEmail"),
                "client_address": meta_json.get("clientAddress")
            }
            client_payload = {k: v for k, v in client_payload.items() if v is not None}
            if client_payload:
                supabase_admin.table("clients").update(client_payload).eq("id", client_id).execute()
                
        # --- B. Migrate Project Info ---
        latitude = meta_json.get("latitude")
        longitude = meta_json.get("longitude")
        if not latitude and meta_json.get("coordinates"):
            try:
                coords = meta_json.get("coordinates").split(",")
                if len(coords) == 2:
                    latitude = float(coords[0].strip())
                    longitude = float(coords[1].strip())
            except Exception:
                pass
                
        proj_payload = {
            "site_name": meta_json.get("projectSite") or meta_json.get("plant_name"),
            "latitude": float(latitude) if latitude else None,
            "longitude": float(longitude) if longitude else None,
            "consultant_epc": meta_json.get("consultant"),
            "ac_capacity_mw": float(meta_json.get("ac_capacity") or meta_json.get("projectCapacityMW") or 0) or None,
            "dc_capacity_mw": float(meta_json.get("dc_capacity") or meta_json.get("bessPowerRating") or 0) or None,
            "poi_voltage_kv": float(meta_json.get("poi_voltage") or meta_json.get("poiVoltage") or 0) or None,
            "mv_collection_voltage_kv": float(meta_json.get("mv_voltage") or meta_json.get("mvVoltage") or 0) or None,
            "lv_collection_voltage_v": float(meta_json.get("lv_voltage") or meta_json.get("lvVoltage") or 0) or None,
            "dc_voltage_v": float(meta_json.get("dc_voltage") or meta_json.get("dcVoltage") or 0) or None,
            "total_area_acres": float(meta_json.get("Total Area of the Plant") or meta_json.get("fenceArea") or 0) or None
        }
        proj_payload = {k: v for k, v in proj_payload.items() if v is not None}
        if proj_payload:
            supabase_admin.table("projects").update(proj_payload).eq("id", project_id).execute()
            
        # --- C. Migrate Site Conditions ---
        site_payload = {
            "project_id": project_id,
            "altitude_ft": float(meta_json.get("altitude") or 0) or None,
            "wind_speed_mph": float(meta_json.get("wind_speed") or meta_json.get("windSpeed") or 0) or None,
            "snow_load_psf": float(meta_json.get("snow_load") or meta_json.get("snowLoad") or 0) or None,
            "snow_depth_in": float(meta_json.get("snowDepth") or 0) or None,
            "risk_category": meta_json.get("risk_category") or meta_json.get("riskCategory"),
            "temp_min_c": float(meta_json.get("tempMin") or meta_json.get("minTemp") or 0) or None,
            "temp_max_c": float(meta_json.get("tempMax") or meta_json.get("maxTemp") or 0) or None,
            "design_temp_f": float(meta_json.get("tempDesign") or 0) or None,
            "utility_name": meta_json.get("utilityName") or meta_json.get("delivery_company"),
            "fence_area_acres": float(meta_json.get("fenceArea") or 0) or None,
            "road_width_ft": float(meta_json.get("roadWidth") or 0) or None,
            "fence_clearance_ft": float(meta_json.get("fenceClearance") or 0) or None
        }
        site_payload = {k: v for k, v in site_payload.items() if v is not None}
        if len(site_payload) > 1: # more than just project_id
            supabase_admin.table("project_site_conditions").upsert(site_payload, on_conflict="project_id").execute()
            
        # --- D. Migrate Equipment Specs (PCS & Transformers) ---
        pcs_id = None
        pcs_mfg = meta_json.get("pcsManufacturer")
        pcs_model = meta_json.get("pcsModel")
        if pcs_mfg and pcs_model:
            # Create or find PCS spec record
            pcs_payload = {
                "manufacturer": pcs_mfg,
                "model": pcs_model,
                "rating_kva": float(meta_json.get("pcsRating") or 0) or None,
                "ac_voltage_v": float(meta_json.get("pcsAcVoltage") or 0) or None,
                "dc_voltage_range": meta_json.get("pcsDcVoltageRange"),
                "frequency_hz": float(meta_json.get("pcsFrequency") or 0) or None,
                "efficiency_percent": float(meta_json.get("pcsEfficiency") or 0) or None,
                "thd_percent": float(meta_json.get("pcsThd") or 0) or None,
                "protection_rating": meta_json.get("pcsProtection"),
                "cooling_method": meta_json.get("pcsCooling"),
                "communication_interfaces": meta_json.get("pcsCommunication"),
                "dimensions": meta_json.get("pcsDimension"),
                "certifications": meta_json.get("pcsCertification")
            }
            pcs_res = supabase_admin.table("equipment_pcs").upsert(pcs_payload, on_conflict="manufacturer,model").execute()
            if pcs_res.data:
                pcs_id = pcs_res.data[0]["id"]
                
        xfmr_id = None
        xfmr_mfg = meta_json.get("mvtManufacturer")
        if xfmr_mfg:
            xfmr_payload = {
                "manufacturer": xfmr_mfg,
                "model": "Standard MVT",
                "rating_kva": float(meta_json.get("mvtRating") or 0) or None,
                "voltage_ratio": meta_json.get("transformerVoltageRating"),
                "winding_config": meta_json.get("winding_config") or meta_json.get("transformerWindingConfig"),
                "vector_group": meta_json.get("transformerVectorGroup"),
                "impedance_percent": float(meta_json.get("transformerImpedance") or 0) or None,
                "efficiency_percent": float(meta_json.get("transformerEfficiency") or 0) or None,
                "winding_material": meta_json.get("transformerWindingMaterial"),
                "cooling_class": meta_json.get("transformerCooling")
            }
            xfmr_res = supabase_admin.table("equipment_transformers").upsert(xfmr_payload, on_conflict="manufacturer,model").execute()
            if xfmr_res.data:
                xfmr_id = xfmr_res.data[0]["id"]
                
        # --- E. Update PV Reports Specific Typed Columns ---
        if report_type == "pv":
            pv_payload = {
                "report_id": report_id,
                "module_type": meta_json.get("module_type"),
                "module_pmax": float(meta_json.get("modulePmax") or 0) or None,
                "module_voc": float(meta_json.get("moduleVoc") or 0) or None,
                "module_vmp": float(meta_json.get("moduleVmp") or 0) or None,
                "module_isc": float(meta_json.get("moduleIsc") or 0) or None,
                "module_imp": float(meta_json.get("moduleImp") or 0) or None,
                "module_length_mm": float(meta_json.get("module_length") or 0) or None,
                "module_width_mm": float(meta_json.get("module_width") or 0) or None,
                "module_height_mm": float(meta_json.get("module_height") or 0) or None,
                "temp_coeff_voc_percent": float(meta_json.get("tempCoeffVoc") or meta_json.get("temp_coeff_voc") or 0) or None,
                "temp_coeff_pm_percent": float(meta_json.get("temp_coeff_pm") or 0) or None,
                "temp_coeff_isc_percent": float(meta_json.get("temp_coeff_isc") or 0) or None,
                "dc_ac_ratio_poi": float(meta_json.get("dc_ac_ratio_poi") or 0) or None,
                "dc_ac_ratio_inv": float(meta_json.get("dc_ac_ratio_inv") or 0) or None,
                "pcs_id": pcs_id,
                "transformer_id": xfmr_id
            }
            pv_payload = {k: v for k, v in pv_payload.items() if v is not None}
            supabase_admin.table("pv_reports").upsert(pv_payload, on_conflict="report_id").execute()
            
        # --- F. Update Battery Reports Specific Typed Columns & Normalize EGC ---
        elif report_type == "battery":
            bat_payload = {
                "report_id": report_id,
                "battery_min_voltage": float(meta_json.get("batteryMinVoltage") or 0) or None,
                "battery_max_voltage": float(meta_json.get("batteryMaxVoltage") or 0) or None,
                "battery_rated_voltage": float(meta_json.get("batteryRatedVoltage") or 0) or None,
                "battery_rated_current": float(meta_json.get("batteryRatedCurrent") or 0) or None,
                "bess_dimension": meta_json.get("bessDimension"),
                "bess_energy_per_enclosure_kwh": float(meta_json.get("bessEnergyPerEnclosure") or 0) or None,
                "no_of_enclosures": int(meta_json.get("noOfEnclosures") or 0) or None,
                "cooling_method": meta_json.get("coolingMethod"),
                "bess_design_life_years": int(meta_json.get("bessDesignLife") or 0) or None,
                "battery_charge_rate": meta_json.get("batteryChargeRate"),
                "battery_discharge_rate": meta_json.get("batteryDischargeRate"),
                "battery_max_power_mw": float(meta_json.get("batteryMaxPower") or 0) or None,
                "pcs_id": pcs_id,
                "transformer_id": xfmr_id
            }
            bat_payload = {k: v for k, v in bat_payload.items() if v is not None}
            bat_res = supabase_admin.table("battery_reports").upsert(bat_payload, on_conflict="report_id").execute()
            
            if bat_res.data:
                battery_report_row_id = bat_res.data[0]["id"]
                
                # Normalize EGC table rows (egc1 to egc10)
                egc_circuits = [
                    "Aux Xfmr -> Aux Panel",
                    "BESS Enclosure -> PCS Skid",
                    "Generator -> Tap Box",
                    "Aux Panel -> BESS Enclosure",
                    "Aux Panel -> Mini Power Center",
                    "Tap Box -> Aux Panel",
                    "Aux Panel -> PCS Skid",
                    "Aux Panel -> Light Poles",
                    "Mini Power Center -> Receptacle",
                    "Mini Power Center -> FNE"
                ]
                
                for idx, name in enumerate(egc_circuits, start=1):
                    ocpd = meta_json.get(f"egc{idx}Ocpd")
                    power_cable = meta_json.get(f"egc{idx}PowerCable")
                    egc = meta_json.get(f"egc{idx}Egc")
                    
                    if ocpd or power_cable or egc:
                        egc_payload = {
                            "battery_report_id": battery_report_row_id,
                            "row_index": idx,
                            "circuit_name": name,
                            "ocpd": ocpd or "",
                            "power_cable": power_cable or "",
                            "egc": egc or ""
                        }
                        supabase_admin.table("bess_egc_rows").upsert(egc_payload, on_conflict="battery_report_id,row_index").execute()

    print("🎉 Data migration complete!")

if __name__ == "__main__":
    run_data_migration()
