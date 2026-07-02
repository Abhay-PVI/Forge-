import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

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
