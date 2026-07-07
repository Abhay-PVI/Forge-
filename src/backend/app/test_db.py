# test_db.py
from database import (
    init_db,
    SessionLocal,
    PVModule,
    PVVariant,
    Client,
    Project,
    Report,
    GroundingReport,
    BatteryReport,
    engine,
    Base
)

def verify_comprehensive_schema():
    print("🧹 Dropping old outdated tables...")
    Base.metadata.drop_all(bind=engine) # This clears out the old table structures
    
    # Now create the fresh ones with all columns
    init_db()
    
    db = SessionLocal()
    
    try:
        # Existing PVModule & PVVariant verification (Retained for regression safety)
        test_model = "JKM550-72HL4-BDV-MAX"
        existing = db.query(PVModule).filter(PVModule.module_model == test_model).first()
        if existing:
            db.delete(existing)
            db.commit()

        # 1. Store everything inside the Master Parent Model row
        parent = PVModule(
            manufacturer="JINKO SOLAR",
            module_model=test_model,
            bifacial_coefficient="70±5%",
            noct="45±2℃",
            series_fuse_rating="30A",
            operating_temperature_range="-40℃~+85℃",
            dimensions_mm="2278×1134×30mm",
            weight_kg="32.0kg",
            cells_count="144 (6×24)",
            cell_type="N-type Mono-crystalline",
            front_glass="2.0mm High Transmission, Anti-Reflection",
            back_glass="2.0mm Heat Strengthened Glass",
            output_cable="4.0mm2, Custom Lengths",
            connector="MC4-EVO2 Compatible",
            junction_box="IP68 rated",
            temperature_coefficients={
                "isc_alpha": "+0.045%/℃",
                "voc_beta": "-0.25%/℃",
                "pm_gamma": "-0.29%/℃"
            },
            load_rating={
                "wind": "2400Pa",
                "snow": "5400Pa"
            },
            degradation={
                "first_year": "1.0%",
                "yearly": "0.4%",
                "year_30": "87.4%"
            },
            warranty={
                "product": "12 Years",
                "performance": "30 Years Linear Warranty"
            }
        )
        db.add(parent)
        db.commit()
        db.refresh(parent)

        # 2. Assign the structural electrical matrix items
        variant_550 = PVVariant(
            module_id=parent.id, pmax="550", pstc="550", voc="49.86", vmp="41.51", isc="14.01", imp="13.25", efficiency="21.29"
        )
        variant_555 = PVVariant(
            module_id=parent.id, pmax="555", pstc="555", voc="50.01", vmp="41.64", isc="14.07", imp="13.33", efficiency="21.48"
        )
        db.add(variant_550)
        db.add(variant_555)
        db.commit()

        print("\n🎉 PV Module & Variant Verification Check Completed Successfully!")
        print("-" * 75)


        # ─── REPORT-SPECIFIC SCHEMAS VERIFICATION ───────────────────────────

        print("\n📝 Creating relational metadata entities...")
        # 1. Create client
        client = Client(name="Aurora Energy Storage LLC")
        db.add(client)
        db.commit()
        db.refresh(client)
        print(f"✅ Created Client: {client.name} (ID: {client.id})")

        # 2. Create project
        project = Project(
            client_id=client.id,
            name="Sunbelt BESS — Phase I",
            county="Maricopa",
            state="AZ",
            country="USA"
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        print(f"✅ Created Project: {project.name} (ID: {project.id}) under Client ID {project.client_id}")

        # 3. Create a master Report row for Grounding Design
        report_grounding = Report(
            project_id=project.id,
            report_type="grounding",
            document_no="PVI-BESS-GRN-001",
            revision="A",
            prepared_date="2026-07-03",
            report_title="Grounding Design Basis Report",
            status="draft"
        )
        db.add(report_grounding)
        db.commit()
        db.refresh(report_grounding)
        print(f"✅ Created Master Report metadata entry: {report_grounding.report_title} (ID: {report_grounding.id})")

        # 4. Create child grounding-specific input record
        grounding_inputs = GroundingReport(
            report_id=report_grounding.id,
            grounding_software="WinIGS",
            ground_conductor_bess="500 KCMil Bare Stranded Cu",
            ground_conductor_pcs="600 KCMil Bare Stranded Cu",
            ground_conductor_aux="4/0 AWG Bare Stranded Cu",
            ground_conductor_misc="#6 AWG Bare Stranded Cu",
            grounding_layout_drawing_no="E-080",
            grounding_analysis_report_no="REP-GRN-01",
            safety_body_weight_kg=50.0,
            safety_shock_duration_sec=0.5,
            soil_resistivity_model={"layers": 2, "resistivity_ohm_m": [150.0, 500.0], "depths_ft": [4.0]}
        )
        db.add(grounding_inputs)
        db.commit()
        db.refresh(grounding_inputs)
        print(f"✅ Created GroundingReport specific inputs table record (ID: {grounding_inputs.id})")

        # 5. Create another master Report row for Battery sizing
        report_battery = Report(
            project_id=project.id,
            report_type="battery",
            document_no="PVI-BESS-BAT-001",
            revision="A",
            prepared_date="2026-07-03",
            report_title="BESS Battery Sizing Design Basis",
            status="draft"
        )
        db.add(report_battery)
        db.commit()
        db.refresh(report_battery)

        # 6. Create child battery-specific inputs
        battery_inputs = BatteryReport(
            report_id=report_battery.id,
            battery_manufacturer="CATL",
            battery_model="EnerOne 372.7kWh LFP",
            cell_chemistry="LFP (Lithium Iron Phosphate)",
            charge_characteristics={"max_charge_rate": "0.5C", "nominal_efficiency": 94.0},
            discharge_characteristics={"max_discharge_rate": "1.0C", "duration_hours": 4.0},
            thermal_limits={"operating_range_c": [15, 35], "max_temp_c": 50.0},
            protection_settings={"overvoltage_threshold_v": 1500.0, "undervoltage_threshold_v": 1000.0},
            cycle_life=6000,
            operating_conditions={"ambient_temp_selected": 25.0}
        )
        db.add(battery_inputs)
        db.commit()
        db.refresh(battery_inputs)
        print(f"✅ Created BatteryReport specific inputs table record (ID: {battery_inputs.id})")


        # ─── READBACK RELATION VERIFICATION ────────────────────────────────

        print("\n🔍 Verifying schema retrieval and entity relations...")
        print("-" * 75)
        
        # Query project back with reports
        proj_record = db.query(Project).filter(Project.id == project.id).first()
        print(f"PROJECT NAME: {proj_record.name} | CLIENT: {proj_record.client.name}")
        
        print("\nREPORTS IN THIS PROJECT:")
        for r in proj_record.reports:
            print(f" - [{r.report_type.upper()}] Doc No: {r.document_no} | Rev: {r.revision} | Title: {r.report_title}")
            
            # Fetch report-specific details dynamically
            if r.report_type == "grounding":
                details = r.grounding_details
                print(f"   ↳ GROUND GRID DETAILS: Software={details.grounding_software} | Bess Conductor={details.ground_conductor_bess} | Safety Duration={details.safety_shock_duration_sec} sec")
                print(f"   ↳ SOIL MODEL: {details.soil_resistivity_model}")
            elif r.report_type == "battery":
                details = r.battery_details
                print(f"   ↳ BATTERY DETAILS: Manufacturer={details.battery_manufacturer} | Chemistry={details.cell_chemistry} | Cycle Life={details.cycle_life} cycles")
                print(f"   ↳ CHARGE SPECS: {details.charge_characteristics}")

        print("-" * 75)
        print("🎉 Relational Report-Specific Database Mappings Verified Successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Relational database mapping failure: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_comprehensive_schema()