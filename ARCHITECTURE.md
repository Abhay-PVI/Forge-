# Architecture

Frontend (React)
↓
API Layer
↓
FastAPI
↓
Extraction
↓
Calculation Engine
↓
Template Engine
↓
PDF Generator

Rules:
- React never performs engineering calculations.
- Python calculations are deterministic and testable.
- Templates contain presentation only.
- Each extractor is independent.
