# Forge Graph

This file turns the current workspace into a quick-read architecture graph for the main product flows.

## Application Flow

```mermaid
flowchart TD
  A[Sign In] --> B[Dashboard]
  B --> C[Select Vertical]
  C --> D[Select Sub-Module]
  D --> E[Select Report]
  E --> F[Form Screen]
  F --> G[Engineering Calculations]
  G --> H[Generating]
  H --> I[Preview]
  I --> J[Export PDF / DOCX]
```

## Navigation Graph

```mermaid
graph TD
  Root[Navigation Root]

  Root --> Elec[Electrical]
  Root --> Civil[Civil]
  Root --> Struct[Structure]

  Elec --> PV[PV]
  Elec --> BESS[BESS]
  Elec --> HV[HV & Substation]
  Elec --> TLine[T-Line]

  PV --> PV1[String Size Design Basis]
  PV --> PV2[PV Design Basis]
  PV --> PV3[Energy Yield Design Basis]
  PV --> PV4[GCR Optimization Design Basis]
  PV --> PV5[DC Cable Sizing Design Basis]
  PV --> PV6[Lightning Protection Design Basis]

  BESS --> BESS1[BESS Sizing Design Basis]
  BESS --> BESS2[PCS Sizing Design Basis]

  HV --> HV1[Transformer Sizing Design Basis]
  HV --> HV2[SLD Basis Report]

  TLine --> TL1[Sag & Tension Design Basis]

  Civil --> CV1[PV: Grading & Drainage Design Basis]
  Civil --> CV2[PV: Access Road Design Basis]

  Struct --> ST1[PV: Pile Foundation Design Basis]
  Struct --> ST2[PV: Tracker Structure Design Basis]
```

## Code Map

```mermaid
graph LR
  App[src/app/App.jsx] --> Router[src/app/Router.jsx]
  App --> Nav[src/data/navigation.js]
  App --> PVForms[src/features/electrical/pv/pv-design/components/FormScreen.jsx]
  App --> PVCalc[src/features/electrical/pv/pv-design/calculations/stringSizing.js]
  App --> PVPreview[src/features/electrical/pv/pv-design/reports/Preview.jsx]
  App --> BessForms[src/features/electrical/bess/bess-sizing/components/BessFormScreen.jsx]
  App --> BessPreview[src/features/electrical/bess/bess-sizing/reports/BessPreview.jsx]
  App --> Shared[src/shared/*]
  App --> Backend[src/backend/*]
```

## Key Files

- [src/app/App.jsx](src/app/App.jsx)
- [src/app/Router.jsx](src/app/Router.jsx)
- [src/data/navigation.js](src/data/navigation.js)
- [README.md](README.md)
- [PROJECT.md](PROJECT.md)

