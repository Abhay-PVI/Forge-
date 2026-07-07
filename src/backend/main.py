import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import os as _os
from dotenv import load_dotenv
_root = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", ".."))
load_dotenv(_os.path.join(_root, ".env.local"))
load_dotenv(_os.path.join(_root, ".env"))

from fastapi import FastAPI, UploadFile, File
import tempfile
import os
import traceback
from pydantic import BaseModel
from fastapi.responses import StreamingResponse, JSONResponse
import io
import traceback

from calculationRepo.generateSolarReport import build_solar_report_data, build_solar_report_pdf 
from Ashrae.ashrae_service import process_and_populate_report

from parsers.pvsyst_parser import extract_pvsyst_data

from pdf_utils import generate_pdf_from_html, generate_pdf_with_toc



app = FastAPI()

from pydantic import BaseModel

class AshraeRequest(BaseModel):
    latitude: float
    longitude: float
    
class SolarReportRequest(BaseModel):
    values: dict    

@app.post("/extract/pvsyst")
async def extract_pvsyst(file: UploadFile = File(...)):

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf"
    ) as temp_file:

        contents = await file.read()
        temp_file.write(contents)

        temp_path = temp_file.name

    try:
        result = extract_pvsyst_data(temp_path)

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        traceback.print_exc()

        return {
            "success": False,
            "error": str(e)
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

from fastapi.middleware.cors import CORSMiddleware
import os

allowed_origins = [
    "http://localhost:5173",
    "https://forge-six-green.vercel.app",
    "https://forge-i4alqi129-abhi-pvinsights-projects.vercel.app",
]

env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    allowed_origins.extend([origin.strip() for origin in env_origins.split(",") if origin.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/ashrae")
def generate_ashrae(data: AshraeRequest):

    try:
        data_map = process_and_populate_report(
            data.latitude,
            data.longitude
        )

        return {
            "success": True,
            "message": "ASHRAE data generated",
            "data": data_map
        }

    except Exception as e:
        traceback.print_exc()

        return {
            "success": False,
            "error": str(e)
        }
        
class SolarReportRequest(BaseModel):
    values: dict

@app.post("/generate-solar-report-data")
async def generate_solar_report_data_endpoint(payload: SolarReportRequest):
    report_data = build_solar_report_data(payload.values)
    return {
        "success": True,
        "calc_table": report_data["calc_table"],
        "calc_values": report_data["calc_values"]
    }

@app.post("/generate-solar-report-pdf")
async def generate_solar_report_pdf_endpoint(payload: SolarReportRequest):
    # 1. Compute pure numbers logic
    report_data = build_solar_report_data(payload.values)
    
    # 2. Build PDF completely decoupled into a dynamic buffer stream
    pdf_buffer = io.BytesIO()
    build_solar_report_pdf(report_data, pdf_buffer)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=Solar_String_Sizing_Report.pdf"}
    )        
        
# @app.post("/generate-solar-report")
# def generate_solar_report_api(payload: SolarReportRequest):
    try:
        react_data = payload.values

        print("RECEIVED VALUES FROM REACT:", react_data)

        if not react_data:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "Missing form metrics values parameter object"
                }
            )

        pdf_buffer = io.BytesIO()
        generate_solar_report(data=react_data, filename=pdf_buffer)
        pdf_buffer.seek(0)

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "inline; filename=Solar_String_Sizing_Report.pdf"
            }
        )

    except Exception:
        error_trace = traceback.format_exc()
        print("Exception encountered during production compilation:")
        print(error_trace)

        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Server error during report generation.",
                "details": error_trace
            }
        )



@app.post("/api/generate-pdf")
async def generate_pdf_endpoint(payload: dict):
    """Receive the full HTML string from the front‑end and return a PDF."""
    html = payload.get("html")
    if not html:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Missing html content"},
        )
    pdf_bytes = await generate_pdf_from_html(html, format="Letter")
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )


@app.post("/api/generate-pdf-with-toc")
async def generate_pdf_with_toc_endpoint(payload: dict):
    """Two-pass PDF: discover page numbers, inject into TOC, re-render."""
    html = payload.get("html")
    if not html:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Missing html content"},
        )
    pdf_bytes = await generate_pdf_with_toc(html, format="Letter")
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )


# ─── SUPABASE SAVING & RETRIEVAL ENDPOINTS ──────────────────────────────────

from typing import Optional
from fastapi import Header, HTTPException, Depends
from app.supabase_service import supabase_admin, get_current_user


# TODO: replace with get_current_user (supabase_service.py) once real Supabase
# Auth is wired up on the frontend — this reads the id straight off a header
# instead of verifying a JWT, so it only holds for the single stubbed test user.
def get_stub_user_id(x_user_id: str = Header(...)) -> str:
    return x_user_id


class AuthSignInRequest(BaseModel):
    email: str
    password: str


class AuthSignUpRequest(BaseModel):
    full_name: str
    email: str
    organization_name: str
    password: str


class AuthRefreshRequest(BaseModel):
    refresh_token: str


class AuthForgotPasswordRequest(BaseModel):
    email: str


def _serialize_supabase_value(value):
    if value is None:
        return None
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if hasattr(value, "dict"):
        return value.dict()
    return value


@app.post("/api/auth/sign-in")
def auth_sign_in(payload: AuthSignInRequest):
    try:
        auth_res = supabase_admin.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password,
        })
        return {
            "success": True,
            "session": _serialize_supabase_value(auth_res.session),
            "user": _serialize_supabase_value(auth_res.user),
        }
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=400, content={"success": False, "error": str(e)})


@app.post("/api/auth/sign-up")
def auth_sign_up(payload: AuthSignUpRequest):
    try:
        normalized_org = payload.organization_name.strip()
        if not normalized_org:
            return JSONResponse(status_code=400, content={"success": False, "error": "Organization name is required."})

        auth_res = supabase_admin.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {
                    "full_name": payload.full_name.strip(),
                    "organization_name": normalized_org,
                }
            }
        })

        user = auth_res.user
        if not user:
            return JSONResponse(status_code=500, content={"success": False, "error": "Supabase did not return a created auth user."})

        org_query = supabase_admin.table("organizations").select("id, name").ilike("name", normalized_org).limit(1).execute()
        if org_query.data:
            org_id = org_query.data[0]["id"]
        else:
            org_insert = supabase_admin.table("organizations").insert({"name": normalized_org}).execute()
            org_id = org_insert.data[0]["id"]

        supabase_admin.table("profiles").upsert({
            "id": user.id,
            "organization_id": org_id,
            "role": "member",
            "full_name": payload.full_name.strip(),
        }, on_conflict="id").execute()

        return {
            "success": True,
            "session": _serialize_supabase_value(auth_res.session),
            "user": _serialize_supabase_value(user),
            "profile": {
                "id": user.id,
                "organization_id": org_id,
                "role": "member",
                "full_name": payload.full_name.strip(),
            },
            "organization": {
                "id": org_id,
                "name": normalized_org,
            },
        }
    except Exception as e:
        traceback.print_exc()
        msg = str(e)
        lowered = msg.lower()
        if "already registered" in lowered or "already exists" in lowered:
            status_code = 409
        elif "rate limit" in lowered or "too many requests" in lowered:
            status_code = 429
        elif "password" in lowered and ("weak" in lowered or "short" in lowered):
            status_code = 422
        else:
            status_code = 400
        return JSONResponse(status_code=status_code, content={"success": False, "error": msg})


@app.post("/api/auth/refresh")
def auth_refresh(payload: AuthRefreshRequest):
    try:
        auth_res = supabase_admin.auth.refresh_session(payload.refresh_token)
        return {
            "success": True,
            "session": _serialize_supabase_value(auth_res.session),
            "user": _serialize_supabase_value(auth_res.user),
        }
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=401, content={"success": False, "error": str(e)})


@app.post("/api/auth/forgot-password")
def auth_forgot_password(payload: AuthForgotPasswordRequest):
    try:
        supabase_admin.auth.reset_password_for_email(payload.email)
        return {"success": True}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=400, content={"success": False, "error": str(e)})


@app.get("/api/auth/me")
def auth_me(current_user: dict = Depends(get_current_user)):
    return {"success": True, "user": current_user}


class ReportSaveRequest(BaseModel):
    report_id: Optional[str] = None
    report_type: str
    document_no: Optional[str] = None
    revision: Optional[str] = None
    prepared_date: Optional[str] = None
    report_title: Optional[str] = None
    status: Optional[str] = None
    values: dict

def structure_pv_inputs(values: dict) -> dict:
    module_manufacturer = values.get("module_make") or values.get("module_manufacturer")
    module_model = values.get("module_model")
    
    electrical_characteristics = {
        "moduleVoc": values.get("moduleVoc"),
        "moduleVmp": values.get("moduleVmp"),
        "moduleIsc": values.get("moduleIsc"),
        "moduleImp": values.get("moduleImp"),
        "modulePmax": values.get("modulePmax"),
        "module_type": values.get("module_type"),
        "module_wp1": values.get("module_wp1"),
        "module_wp2": values.get("module_wp2"),
        "max_module_power": values.get("max_module_power"),
        "module_qty_615": values.get("module_qty_615"),
        "module_qty_620": values.get("module_qty_620"),
        "string_size": values.get("string_size"),
        "modules_series": values.get("modules_series"),
    }
    
    mechanical_characteristics = {
        "module_dimensions": values.get("module_dimensions"),
        "module_length": values.get("module_length"),
        "module_width": values.get("module_width"),
        "module_height": values.get("module_height"),
        "wind_load": values.get("wind_load"),
        "snow_load": values.get("snow_load"),
    }
    
    temperature_coefficients = {
        "tempCoeffVoc": values.get("tempCoeffVoc"),
        "temp_coeff_voc": values.get("temp_coeff_voc"),
        "temp_coeff_pm": values.get("temp_coeff_pm"),
        "temp_coeff_isc": values.get("temp_coeff_isc"),
    }
    
    site_conditions = {
        "tempMin": values.get("tempMin"),
        "tempCellMax": values.get("tempCellMax"),
        "designStd": values.get("designStd"),
        "ghi": values.get("ghi"),
        "dsi": values.get("dsi"),
        "altitude": values.get("altitude"),
        "wind_speed": values.get("wind_speed"),
        "snow_load": values.get("snow_load"),
        "risk_category": values.get("risk_category"),
        "met_source": values.get("met_source"),
        "data_format": values.get("data_format"),
    }
    
    pvsyst_results = {
        "pvsystData": values.get("pvsystData"),
        "pvsystReport": values.get("pvsystReport"),
    }
    
    irradiation_data = {
        "ghi": values.get("ghi"),
        "dsi": values.get("dsi"),
        "ghiCsv": values.get("ghiCsv"),
        "dhiCsv": values.get("dhiCsv"),
    }
    
    energy_yield = {
        "annual_energy": values.get("annual_energy"),
        "specific_yield": values.get("specific_yield"),
        "performance_ratio": values.get("performance_ratio"),
        "dc_cuf": values.get("dc_cuf"),
        "ac_cuf": values.get("ac_cuf"),
    }
    
    voc_calculations = {
        "yearlyVocSummary": values.get("yearlyVocSummary"),
        "allTimeMaxVoc": values.get("allTimeMaxVoc"),
        "vocCsv": values.get("vocCsv"),
    }
    
    isc_calculations = {
        "yearlyIscSummary": values.get("yearlyIscSummary"),
        "max_3hr_isc": values.get("max_3hr_isc"),
        "max_isc_year": values.get("max_isc_year"),
        "IscCsv": values.get("IscCsv"),
    }
    
    degradation_tables = {
        "moduleDegradation": values.get("moduleDegradation"),
        "deg_year1": values.get("deg_year1"),
        "deg_year30": values.get("deg_year30"),
        "deg_yearly": values.get("deg_yearly"),
        "minVoltageDegradationTable": values.get("minVoltageDegradationTable"),
        "warranty_product": values.get("warranty_product"),
        "warranty_performance": values.get("warranty_performance"),
    }
    
    return {
        "module_manufacturer": module_manufacturer,
        "module_model": module_model,
        "electrical_characteristics": electrical_characteristics,
        "mechanical_characteristics": mechanical_characteristics,
        "temperature_coefficients": temperature_coefficients,
        "pvsyst_results": pvsyst_results,
        "irradiation_data": irradiation_data,
        "energy_yield": energy_yield,
        "voc_calculations": voc_calculations,
        "isc_calculations": isc_calculations,
        "degradation_tables": degradation_tables,
        "site_conditions": site_conditions
    }

@app.post("/api/reports/save")
def save_report(payload: ReportSaveRequest, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        org_id = current_user.get("organization_id")
        if not org_id:
            return JSONResponse(status_code=400, content={"success": False, "error": "Authenticated user is missing an organization."})

        if payload.report_id:
            existing = supabase_admin.table("reports").select("created_by").eq("id", payload.report_id).execute()
            if existing.data and existing.data[0]["created_by"] not in (None, user_id):
                raise HTTPException(status_code=403, detail="You do not own this report.")

        # 1. Ensure a client/project exist inside the authenticated user's organization
        clients = supabase_admin.table("clients").select("id").eq("organization_id", org_id).limit(1).execute()
        if clients.data:
            client_id = clients.data[0]["id"]
        else:
            new_cl = supabase_admin.table("clients").insert({"organization_id": org_id, "name": "Default Client"}).execute()
            client_id = new_cl.data[0]["id"]

        projs = supabase_admin.table("projects").select("id").eq("client_id", client_id).limit(1).execute()
        if projs.data:
            project_id = projs.data[0]["id"]
        else:
            new_proj = supabase_admin.table("projects").insert({
                "client_id": client_id,
                "organization_id": org_id,
                "name": "Default Project"
            }).execute()
            project_id = new_proj.data[0]["id"]

        # 2. Insert or update parent Report row
        report_payload = {
            "project_id": project_id,
            "organization_id": org_id,
            "report_type": payload.report_type,
            "document_no": payload.document_no or "PVI-BESS-GEN-001",
            "revision": payload.revision or "A",
            "prepared_date": payload.prepared_date or "2026-07-03",
            "report_title": payload.report_title or "Engineering Report",
            "metadata_json": payload.values,
            "created_by": user_id
        }
        if payload.status:
            report_payload["status"] = payload.status
        if payload.report_id:
            report_payload["id"] = payload.report_id

        report_res = supabase_admin.table("reports").upsert(report_payload, on_conflict="id").execute()
        saved_id = report_res.data[0]["id"]

        # 3. Dynamic upsert into the report-specific table
        report_tables = {
            "pv": ("pv_reports", {"module_manufacturer", "module_model", "electrical_characteristics", "mechanical_characteristics", "temperature_coefficients", "pvsyst_results", "irradiation_data", "energy_yield", "loss_analysis", "voc_calculations", "isc_calculations", "degradation_tables", "site_conditions"}),
            "battery": ("battery_reports", {"battery_manufacturer", "battery_model", "cell_chemistry", "charge_characteristics", "discharge_characteristics", "thermal_limits", "protection_settings", "cycle_life", "operating_conditions"}),
            "pcs": ("pcs_reports", {"pcs_manufacturer", "pcs_model", "voltage_limits", "current_limits", "mppt_details", "ac_specifications", "dc_specifications", "efficiency_curves", "communication_interfaces", "protection_features"}),
            "inverter": ("inverter_reports", {"inverter_manufacturer", "inverter_model", "voltage_limits", "current_limits", "mppt_details", "ac_specifications", "dc_specifications", "efficiency_curves"}),
            "transformer": ("transformer_reports", {"transformer_manufacturer", "transformer_model", "capacity_kva", "voltage_ratio", "impedance_percent", "cooling_class", "losses_no_load_w", "losses_load_w"}),
            "switchgear": ("switchgear_reports", {"switchgear_manufacturer", "switchgear_model", "rated_voltage_kv", "rated_current_a", "short_circuit_withstand_ka", "busbar_material", "ip_rating"}),
            "cable": ("cable_reports", {"conductor_material", "insulation_type", "voltage_rating", "cable_size", "no_of_runs", "installation_method", "soil_thermal_resistivity", "soil_temperature", "load_factor", "derated_ampacity"}),
            "relay_protection": ("relay_protection_reports", {"relay_manufacturer", "relay_model", "ansi_codes", "ct_ratio", "pt_ratio", "pickup_settings", "delay_settings"}),
            "electrical_design": ("electrical_design_reports", {"system_frequency_hz", "short_circuit_level_ka", "max_voltage_drop_percent", "grounding_system_type", "design_standards", "key_design_parameters"}),
            "structural": ("structural_reports", {"wind_load_mph", "snow_load_psf", "seismic_design_category", "foundation_type", "soil_bearing_capacity", "structural_steel_grade", "concrete_strength_psi"}),
            "grounding": ("grounding_reports", {"grounding_software", "ground_conductor_bess", "ground_conductor_pcs", "ground_conductor_aux", "ground_conductor_misc", "grounding_layout_drawing_no", "grounding_analysis_report_no", "safety_body_weight_kg", "safety_shock_duration_sec", "soil_resistivity_model"}),
            "hv-dbr": ("hv_reports", {"poi_voltage", "substation_voltage", "collection_voltage", "system_frequency", "fault_level", "bil_rating", "mpt_manufacturer", "mpt_model", "mpt_rating_mva", "mpt_voltage_ratio", "mpt_impedance", "mpt_vector_group", "mpt_cooling_class", "hv_breaker_type", "hv_breaker_rating", "hv_disconnect_type", "hv_disconnect_rating", "bus_bar_type", "bus_bar_rating", "relay_codes", "ground_conductor", "ground_software", "scada_protocol"})
        }

        if payload.report_type == "pv":
            child_payload = {"report_id": saved_id}
            structured = structure_pv_inputs(payload.values)
            child_payload.update(structured)
            supabase_admin.table("pv_reports").upsert(child_payload, on_conflict="report_id").execute()
        elif payload.report_type in report_tables:
            tbl_name, cols = report_tables[payload.report_type]
            child_payload = {"report_id": saved_id}
            for c in cols:
                if c in payload.values:
                    child_payload[c] = payload.values[c]
            
            supabase_admin.table(tbl_name).upsert(child_payload, on_conflict="report_id").execute()

        print(f"Saved report {saved_id} as type '{payload.report_type}'")
        return {"success": True, "report_id": saved_id, "report_type": payload.report_type}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.get("/api/reports")
def get_reports_list(current_user: dict = Depends(get_current_user)):
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            return JSONResponse(status_code=400, content={"success": False, "error": "Authenticated user is missing an organization."})

        res = supabase_admin.table("reports") \
            .select("id, report_title, document_no, revision, report_type, created_at, status") \
            .eq("organization_id", org_id) \
            .order("created_at", desc=True) \
            .execute()
        return {"success": True, "reports": res.data}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.get("/api/reports/last-pv")
def get_last_pv_report(current_user: dict = Depends(get_current_user)):
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            return {"success": True, "data": None}

        res = supabase_admin.table("reports") \
            .select("id") \
            .eq("report_type", "pv") \
            .eq("organization_id", org_id) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
            
        if not res.data:
            return {"success": True, "data": None}
            
        report_id = res.data[0]["id"]
        compiled_res = supabase_admin.rpc("get_complete_report_data", {"target_report_id": report_id}).execute()
        return {"success": True, "data": compiled_res.data}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.get("/api/reports/last/{report_type}")
def get_last_report(report_type: str, current_user: dict = Depends(get_current_user)):
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            return {"success": True, "data": None}

        res = supabase_admin.table("reports") \
            .select("id") \
            .eq("report_type", report_type) \
            .eq("organization_id", org_id) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
            
        if not res.data:
            return {"success": True, "data": None}
            
        report_id = res.data[0]["id"]
        compiled_res = supabase_admin.rpc("get_complete_report_data", {"target_report_id": report_id}).execute()
        return {"success": True, "data": compiled_res.data}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.get("/api/reports/{report_id}")
def get_report_detail(report_id: str, current_user: dict = Depends(get_current_user)):
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            return JSONResponse(status_code=404, content={"success": False, "error": "Report not found"})

        owner_check = supabase_admin.table("reports").select("organization_id").eq("id", report_id).execute()
        if not owner_check.data or owner_check.data[0]["organization_id"] != org_id:
            return JSONResponse(status_code=404, content={"success": False, "error": "Report not found"})

        res = supabase_admin.rpc("get_complete_report_data", {"target_report_id": report_id}).execute()
        if not res.data:
            return JSONResponse(status_code=404, content={"success": False, "error": "Report not found"})
        return {"success": True, "data": res.data}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

