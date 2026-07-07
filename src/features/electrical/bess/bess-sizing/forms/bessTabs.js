export const BESS_TABS = [

  // ─── DOCUMENT INFORMATION ──────────────────────────────────────────────────
  {
    id: 'document',
    name: 'Document Information',
    icon: 'file-text',
    blurb: 'Report title and revision control information shown on the cover sheet.',
    fields: [
      { key: 'reportTitle', label: 'Report Title', type: 'text', required: true, placeholder: 'Design Basis Report' },
      { key: 'documentNo', label: 'Document Number', type: 'text', required: true },
      { key: 'revision', label: 'Revision', type: 'text', required: true, placeholder: 'A' },
      { key: 'preparedDate', label: 'Prepared Date', type: 'text', required: true },
    ]
  },

  // ─── CLIENT INFORMATION ────────────────────────────────────────────────────
  {
    id: 'client',
    name: 'Client Information',
    icon: 'briefcase',
    blurb: 'Identifies the client and the engagement on the report cover sheet.',
    fields: [
      { key: 'clientName', label: 'Client / Company name', type: 'text', required: true, placeholder: 'e.g. Clenera LLC' },
      { key: 'clientContact', label: 'Primary contact', type: 'text', required: true, placeholder: 'Full name' },
      { key: 'clientEmail', label: 'Contact email', type: 'text', required: true, placeholder: 'name@company.com' },
      { key: 'clientAddress', label: 'Client address', type: 'textarea', required: true, placeholder: 'Street, City, State, Country' },
      { key: 'consultant', label: 'Consultant / EPC', type: 'text', required: true, placeholder: 'Preparing organization' },
    ]
  },

  // ─── PROJECT INFORMATION ───────────────────────────────────────────────────
  {
    id: 'project',
    name: 'Project Information',
    icon: 'map',
    blurb: 'Core project identifiers used throughout the report.',
    fields: [
      { key: 'projectName', label: 'Project Name', type: 'text', required: true },
      { key: 'projectSite', label: 'Project Site', type: 'text', required: true },
      { key: 'state', label: 'State', type: 'text', required: true },
      { key: 'county', label: 'County', type: 'text', required: true },
      { key: 'country', label: 'Country', type: 'text', required: true },
      { key: 'coordinates', label: 'Coordinates', type: 'text', required: true },
      { key: 'projectCapacityMW', label: 'Power Capacity', type: 'number', required: true, unit: 'MW' },
      { key: 'projectCapacityMWh', label: 'Energy Capacity', type: 'number', required: true, unit: 'MWh' },
      { key: 'projectDurationHours', label: 'Duration', type: 'number', required: true, unit: 'Hours' },
      { key: 'bessPowerRating', label: 'BESS Power Rating', type: 'number', required: true, unit: 'MW' },
      { key: 'bessEnergyRating', label: 'BESS Energy Rating', type: 'number', required: true, unit: 'MWh' },
      { key: 'powerFactor', label: 'Power Factor', type: 'text', required: true, placeholder: '0.95' },
      { key: 'powerFactorLeadLag', label: 'PF Lead / Lag', type: 'text', required: true, placeholder: 'Lead / Lag' },
      { key: 'annualCycles', label: 'Annual Cycles', type: 'number', required: true, placeholder: '365' },
      { key: 'totalPCSPowerRating', label: 'Total PCS Rating', type: 'number', required: true, unit: 'MVA' },
      { key: 'totalBessEnergyRating', label: 'Total BESS Energy', type: 'number', required: true, unit: 'MWh' },
    ]
  },

  // ─── SITE CONDITIONS ───────────────────────────────────────────────────────
  {
    id: 'site',
    name: 'Site Conditions',
    icon: 'cloud',
    blurb: 'Ambient and environmental conditions that govern equipment sizing.',
    fields: [
      { key: 'utilityName', label: 'Utility / Distribution Company', type: 'text', required: true },
      { key: 'fenceArea', label: 'Total Fence Area', type: 'number', required: true, unit: 'Acres' },
      { key: 'cyclesPerDay', label: 'Max Cycles Per Day', type: 'number', required: true },
      { key: 'maxTemp', label: 'Max Ambient Temp', type: 'number', required: true, unit: '°F' },
      { key: 'minTemp', label: 'Min Ambient Temp', type: 'number', required: true, unit: '°F' },
      { key: 'tempDesign', label: 'Design Temp', type: 'number', required: true, unit: '°F' },
      { key: 'altitude', label: 'Altitude', type: 'number', required: true, unit: 'ft' },
      { key: 'windSpeed', label: 'Design Wind Speed', type: 'number', required: true, unit: 'mph' },
      { key: 'riskCategory', label: 'Risk Category', type: 'text', required: true, placeholder: 'CAT-II' },
      { key: 'snowLoad', label: 'Snow Load', type: 'number', required: true, unit: 'psf' },
      { key: 'snowDepth', label: 'Snow Depth', type: 'number', required: true, unit: 'inch' },
      { key: 'roadWidth', label: 'Road Width', type: 'number', required: true, unit: 'ft' },
      { key: 'fenceClearance', label: 'Fence to Road Clearance', type: 'number', required: true, unit: 'ft' },
    ]
  },

  // ─── ELECTRICAL SYSTEM ─────────────────────────────────────────────────────
  {
    id: 'electrical',
    name: 'Electrical System',
    icon: 'zap',
    blurb: 'Voltage levels and interconnection parameters.',
    fields: [
      { key: 'poiVoltage', label: 'POI Voltage', type: 'number', required: true, unit: 'kV' },
      { key: 'mvVoltage', label: 'MV Collection Voltage', type: 'number', required: true, unit: 'kV' },
      { key: 'lvVoltage', label: 'LV Collection Voltage', type: 'number', required: true, unit: 'V' },
      { key: 'dcVoltage', label: 'DC Voltage', type: 'number', required: true, unit: 'V' },
      { key: 'noOfVCB', label: 'Number of VCB Feeders', type: 'number', required: true },
    ]
  },

  // ─── BATTERY SYSTEM ────────────────────────────────────────────────────────
  {
    id: 'battery',
    name: 'Battery System',
    icon: 'battery',
    blurb: 'BESS enclosure technical parameters from manufacturer datasheet.',
    fields: [
      { key: 'batteryTechnology', label: 'Technology', type: 'text', required: true, placeholder: 'Li-Ion LFP' },
      { key: 'bessManufacturer', label: 'Manufacturer', type: 'text', required: true },
      { key: 'bessModel', label: 'Model', type: 'text', required: true },
      { key: 'batteryMinVoltage', label: 'Min Voltage', type: 'number', required: true, unit: 'Vdc' },
      { key: 'batteryMaxVoltage', label: 'Max Voltage', type: 'number', required: true, unit: 'Vdc' },
      { key: 'batteryRatedVoltage', label: 'Rated Voltage', type: 'number', required: true, unit: 'V', placeholder: '1331.2' },
      { key: 'batteryRatedCurrent', label: 'Rated Current', type: 'number', required: true, unit: 'A', placeholder: '1205.6' },
      { key: 'bessDimension', label: 'Enclosure Dimensions', type: 'text', required: true },
      { key: 'bessEnergyPerEnclosure', label: 'Energy / Enclosure', type: 'number', required: true, unit: 'kWh' },
      { key: 'noOfEnclosures', label: 'No. of Enclosures', type: 'number', required: true },
      { key: 'coolingMethod', label: 'Cooling Method', type: 'text', required: true, placeholder: 'Liquid Cooling' },
      { key: 'ipRating', label: 'IP Rating', type: 'text', required: true },
      { key: 'bessDesignLife', label: 'Design Life', type: 'number', required: true, unit: 'Years', placeholder: '25' },
      { key: 'batteryCertification', label: 'Certification', type: 'textarea', required: true, placeholder: 'UL1973, UL9540A, NFPA855, UN38.3' },
      { key: 'tempMin', label: 'Internal Temp Min', type: 'number', required: true, unit: '°C' },
      { key: 'tempMax', label: 'Internal Temp Max', type: 'number', required: true, unit: '°C' },
      { key: 'batteryChargeRate', label: 'Charging Rate', type: 'text', required: true, placeholder: '0.4C' },
      { key: 'batteryDischargeRate', label: 'Discharging Rate', type: 'text', required: true, placeholder: '0.43C' },
      { key: 'batteryMaxPower', label: 'Max Power / Enclosure', type: 'number', required: true, unit: 'MW' },
    ]
  },

  // ─── PCS INFORMATION ───────────────────────────────────────────────────────
  {
    id: 'pcs',
    name: 'PCS Information',
    icon: 'cpu',
    blurb: 'Power Conversion System technical parameters from manufacturer datasheet.',
    fields: [
      { key: 'pcsManufacturer', label: 'PCS Manufacturer', type: 'text', required: true },
      { key: 'pcsModel', label: 'PCS Model', type: 'text', required: true },
      { key: 'pcsRating', label: 'PCS Rating', type: 'number', required: true, unit: 'kVA' },
      { key: 'pcsDimension', label: 'PCS Dimensions', type: 'text', required: true, placeholder: '3183 x 2110 x 1800 mm' },
      { key: 'pcsAcVoltage', label: 'AC Voltage', type: 'number', required: true, unit: 'Vac', placeholder: '600' },
      { key: 'pcsDcVoltageRange', label: 'DC Voltage Range', type: 'text', required: true, placeholder: '920 – 1500 Vdc' },
      { key: 'pcsFrequency', label: 'Frequency', type: 'number', required: true, unit: 'Hz', placeholder: '60' },
      { key: 'pcsEfficiency', label: 'Efficiency', type: 'number', required: true, unit: '%', placeholder: '99' },
      { key: 'pcsThd', label: 'THD', type: 'number', required: true, unit: '%', placeholder: '3' },
      { key: 'pcsProtection', label: 'Protection', type: 'text', required: true, placeholder: 'NEMA 3R / IP55' },
      { key: 'pcsCooling', label: 'Cooling', type: 'text', required: true, placeholder: 'Forced Air' },
      { key: 'pcsOutputProtection', label: 'Output Protection', type: 'text', required: true, placeholder: 'Fuse + Switch' },
      { key: 'pcsOvervoltageProtection', label: 'Overvoltage Prot.', type: 'text', required: true, placeholder: 'Surge Arrestor' },
      { key: 'pcsCommunication', label: 'Communication', type: 'text', required: true, placeholder: 'Ethernet / Modbus TCP' },
      { key: 'pcsAltitude', label: 'Altitude Limit', type: 'number', required: true, unit: 'm', placeholder: '4000' },
      { key: 'pcsCertification', label: 'Certification', type: 'text', required: false, placeholder: 'UL1741, IEEE 1547' },
      { key: 'noOfPCS', label: 'No. of PCS', type: 'number', required: true },
    ]
  },

  // ─── TRANSFORMER ───────────────────────────────────────────────────────────
  {
    id: 'transformer',
    name: 'Transformer',
    icon: 'layers',
    blurb: 'Medium voltage transformer technical parameters.',
    fields: [
      { key: 'mvtManufacturer', label: 'Manufacturer', type: 'text', required: true },
      { key: 'mvtRating', label: 'Rating', type: 'number', required: true, unit: 'kVA' },
      { key: 'transformerVoltageRating', label: 'Voltage Rating', type: 'text', required: true, placeholder: '34.5 / 0.69 kV' },
      { key: 'transformerWindingConfig', label: 'Winding Configuration', type: 'text', required: true, placeholder: 'HV – Wye, LV – Delta' },
      { key: 'transformerVectorGroup', label: 'Vector Group', type: 'text', required: true, placeholder: 'Yd11' },
      { key: 'transformerImpedance', label: 'Impedance', type: 'number', required: true, unit: '%', placeholder: '5.75' },
      { key: 'transformerEfficiency', label: 'Efficiency at Full Load', type: 'number', required: true, unit: '%', placeholder: '99' },
      { key: 'transformerWindingMaterial', label: 'Winding Material', type: 'text', required: true, placeholder: 'Aluminum' },
      { key: 'transformerCooling', label: 'Cooling', type: 'text', required: true, placeholder: 'KNAN' },
      { key: 'maxMvtLoop', label: 'Max Loop', type: 'number', required: true },
    ]
  },

  // ─── AUXILIARY POWER ───────────────────────────────────────────────────────
  {
    id: 'auxiliary',
    name: 'Auxiliary Power',
    icon: 'zap',
    blurb: 'Auxiliary power supply details for BESS enclosures, EMS, and FNE systems.',
    fields: [
      { key: 'auxVoltage', label: 'Aux Voltage (Enclosure)', type: 'number', required: true, unit: 'V' },
      { key: 'auxVoltage2', label: 'Aux Voltage (Board)', type: 'number', required: true, unit: 'V' },
      { key: 'auxVoltage3', label: 'Aux Voltage (FNE)', type: 'number', required: true, unit: 'V' },
      { key: 'auxPowerKVA', label: 'Auxiliary Power', type: 'number', required: true, unit: 'kVA' },
      { key: 'upsPowerKVA', label: 'UPS Power', type: 'number', required: true, unit: 'kVA' },
      { key: 'fneAuxPowerKVA', label: 'FNE Aux Power', type: 'number', required: true, unit: 'kVA' },
      { key: 'maxFneLoop', label: 'Max FNE Loop', type: 'number', required: true },
      { key: 'dcControlVoltage', label: 'DC Control Voltage', type: 'number', required: true, unit: 'V' },
    ]
  },

  // ─── CABLE CALCULATIONS ────────────────────────────────────────────────────
  {
    id: 'cables',
    name: 'Cable Calculations',
    icon: 'git-branch',
    blurb: 'DC and MV AC cable sizing parameters used in ampacity calculations.',
    groups: [
      {
        title: 'DC Cables (Cable Tray)',
        fields: [
          { key: 'dcCableSize', label: 'DC Cable Size', type: 'text', required: true },
          { key: 'noOfDcRuns', label: 'No. of DC Runs', type: 'number', required: true },
          { key: 'cableTrayWidth', label: 'Cable Tray Width', type: 'number', required: true, unit: 'ft' },
          { key: 'ampacityReportNo', label: 'DC & AC Ampacity Report No.', type: 'text', required: false },
        ]
      },
      {
        title: 'MV AC Cables (Direct Buried)',
        fields: [
          { key: 'mvCableBurialDepth', label: 'MV Burial Depth', type: 'number', required: true, unit: 'ft' },
          { key: 'mvCableMaxTemp', label: 'MV Cable Max Temp', type: 'number', required: true, unit: '°C' },
          { key: 'loadFactorPercent', label: 'Load Factor', type: 'number', required: true, unit: '%' },
          { key: 'dischargePeriodHours', label: 'Discharge Period', type: 'number', required: true, unit: 'hours' },
          { key: 'restPeriodHours', label: 'Rest Period', type: 'number', required: true, unit: 'hours' },
          { key: 'chargePeriodHours', label: 'Charging Period', type: 'number', required: true, unit: 'hours' },
          { key: 'mvCableSize1', label: 'MV Cable Size 1', type: 'text', required: true },
          { key: 'mvCableSize2', label: 'MV Cable Size 2', type: 'text', required: true },
          { key: 'mvCableSize3', label: 'MV Cable Size 3', type: 'text' },
          { key: 'mvCableSize4', label: 'MV Cable Size 4', type: 'text' },
        ]
      },
      {
        title: 'Auxiliary Cables',
        fields: [
          { key: 'auxCableBurialDepth', label: 'Aux Cable Burial Depth', type: 'text', required: true, placeholder: '1\'-6"' },
          { key: 'auxCable1', label: 'Aux Transformer → Aux Panel Board', type: 'text', required: true },
          { key: 'auxCable2', label: 'Aux Panel Board → BESS Enclosure', type: 'text', required: true },
          { key: 'auxCable3', label: 'Aux Panel Board → PCS Skid', type: 'text', required: true },
          { key: 'auxCable4', label: 'Aux Panel Board → Light Poles', type: 'text', required: true },
          { key: 'auxCable5', label: 'Aux Panel Board → Mini Power Center', type: 'text', required: true },
          { key: 'auxCable6', label: 'Mini Power Center → Receptacle', type: 'text', required: true },
          { key: 'auxCable7', label: 'Mini Power Center → FNE', type: 'text', required: true },
          { key: 'auxCable8', label: 'Generator → Tap Box', type: 'text', required: true },
          { key: 'auxCable9', label: 'Tap Box → Aux Panel Boards', type: 'text', required: true },
        ]
      }
    ]
  },

  // ─── GEOTECHNICAL ──────────────────────────────────────────────────────────
  {
    id: 'geotech',
    name: 'Geotechnical',
    icon: 'map-pin',
    blurb: 'Geotechnical report data and soil thermal properties for cable calculations.',
    fields: [
      { key: 'geotechReportCompany', label: 'Geotech Report Company', type: 'text', required: true },
      { key: 'geotechReportNo', label: 'Geotech Report No.', type: 'text', required: true },
      { key: 'geotechReportDate', label: 'Geotech Report Date', type: 'text', required: true },
      { key: 'soilTempStation', label: 'Soil Temp Station', type: 'text', required: true },
      { key: 'soilTempLocation', label: 'Soil Temp Location', type: 'text', required: true },
      { key: 'soilTempMax', label: 'Soil Temp Max', type: 'number', required: true, unit: '°C' },
      { key: 'soilTempSelected', label: 'Soil Temp Selected', type: 'number', required: true, unit: '°C' },
      { key: 'soilThermalResistivityNative', label: 'Soil Thermal Resistivity', type: 'text', required: true },
      { key: 'soilMoistureContent', label: 'Soil Moisture Content', type: 'number', required: true, unit: '%' },
      { key: 'parcelNo', label: 'Parcel No.', type: 'text', required: true },
      { key: 'referenceDrawingNo', label: 'Reference Drawing No.', type: 'text', required: true },
    ]
  },

  // ─── APPLICABLE STANDARDS ──────────────────────────────────────────────────
  {
    id: 'standards',
    name: 'Applicable Standards',
    icon: 'book',
    blurb: 'Code editions referenced in the applicable design standards list.',
    fields: [
      { key: 'necEditionYear', label: 'NEC Edition Year', type: 'text', required: true, placeholder: '2023' },
      { key: 'ibcEditionYear', label: 'IBC Edition Year', type: 'text', required: true, placeholder: '2024' },
      { key: 'nfpa855EditionYear', label: 'NFPA 855 Edition Year', type: 'text', required: true, placeholder: '2026' },
    ]
  },

  // ─── WEATHER DATA (ASHRAE) ─────────────────────────────────────────────────
  {
    id: 'ashrae',
    name: 'Weather Data (ASHRAE)',
    icon: 'cloud-rain',
    blurb: 'Key weather parameters obtained from the ASHRAE database.',
    fields: [
      { key: 'ashraeMaxDryBulb', label: 'Max Dry Bulb Temp', type: 'number', required: false, unit: '°F' },
      { key: 'ashraeMinDryBulb', label: 'Min Dry Bulb Temp', type: 'number', required: false, unit: '°F' },
      { key: 'ashraeWindSpeed', label: 'Design Wind Speed', type: 'number', required: false, unit: 'mph' },
      { key: 'ashraeSnowLoad', label: 'Ground Snow Load', type: 'number', required: false, unit: 'psf' },
      { key: 'ashraeElevation', label: 'Elevation', type: 'number', required: false, unit: 'ft' },
    ]
  },

  // ─── WIRING COLOR CODES ────────────────────────────────────────────────────
  {
    id: 'wiringColors',
    name: 'Wiring Color Codes',
    icon: 'palette',
    blurb: 'Conductor color coding by voltage class used throughout the plant.',
    groups: [
      {
        title: 'LV Wiring (480/690V)',
        fields: [
          { key: 'wiringLvVoltageClass', label: 'Voltage Class Label', type: 'text', required: true, placeholder: '480/690V' },
          { key: 'wiringLvLineAColor', label: 'Line A Color', type: 'text', required: true, placeholder: 'Brown' },
          { key: 'wiringLvLineBColor', label: 'Line B Color', type: 'text', required: true, placeholder: 'Orange' },
          { key: 'wiringLvLineCColor', label: 'Line C Color', type: 'text', required: true, placeholder: 'Yellow' },
          { key: 'wiringLvNeutralColor', label: 'Neutral Color', type: 'text', required: true, placeholder: 'Grey' },
        ]
      },
      {
        title: 'MV Wiring',
        fields: [
          { key: 'wiringMvVoltageClass', label: 'Voltage Class Label', type: 'text', required: true, placeholder: '35kV' },
          { key: 'wiringMvPhaseLabeling', label: 'Phase Labeling Convention', type: 'text', required: true, placeholder: 'White tape / printed placard: A-Phase, B-Phase, C-Phase' },
        ]
      },
      {
        title: 'DC & Ground',
        fields: [
          { key: 'wiringDcPositiveColor', label: 'DC Positive Color', type: 'text', required: true, placeholder: 'Red' },
          { key: 'wiringDcNegativeColor', label: 'DC Negative Color', type: 'text', required: true, placeholder: 'Black' },
          { key: 'wiringGroundColor', label: 'Ground Conductor Color', type: 'text', required: true, placeholder: 'Green / Bare' },
        ]
      }
    ]
  },

  // ─── COMMUNICATION AND CONTROL ─────────────────────────────────────────────
  {
    id: 'communication',
    name: 'Communication and Control',
    icon: 'radio',
    blurb: 'EMS and FACP communication architecture parameters.',
    groups: [
      {
        title: 'FO and CAT6 Communication',
        fields: [
          { key: 'fneLoopCount', label: 'Max FNEs Looped per MV Circuit', type: 'number', required: true },
          { key: 'totalFneCount', label: 'Total FNEs on Site', type: 'number', required: true },
          { key: 'commBlockDiagramNo', label: 'Communication Block Diagram No.', type: 'text', required: false },
          { key: 'cableScheduleNo', label: 'FO / CAT-6A Cable Schedule No.', type: 'text', required: false },
        ]
      },
      {
        title: 'E-Stop Control',
        fields: [
          { key: 'estopCableSpec', label: 'E-Stop Cable Specification', type: 'text', required: true, placeholder: '2C, 16 AWG' },
          { key: 'estopEnclosuresPerJb', label: 'Max Enclosures per JB', type: 'number', required: true },
          { key: 'estopJbToEmsCableSpec', label: 'JB to EMS Cable Spec', type: 'text', required: true, placeholder: '12-core, 16 AWG' },
        ]
      },
      {
        title: 'FACP Communication',
        fields: [
          { key: 'facpRingStartEnclosure', label: 'FACP Ring Start Enclosure ID', type: 'text', required: false },
          { key: 'facpRingEndEnclosure', label: 'FACP Ring End Enclosure ID', type: 'text', required: false },
        ]
      }
    ]
  },

  // ─── GROUNDING & EGC ────────────────────────────────────────────────────────
  {
    id: 'grounding',
    name: 'Grounding & EGC',
    icon: 'anchor',
    blurb: 'Grounding system design basis and Equipment Grounding Conductor (EGC) sizing table.',
    groups: [
      {
        title: 'Grounding Design Basis',
        fields: [
          { key: 'groundingSoftware', label: 'Grounding Analysis Software', type: 'text', required: true, placeholder: 'WinIGS' },
          { key: 'groundConductorBess', label: 'BESS Enclosure Ground Conductor', type: 'text', required: true, placeholder: '500 KCMIL Cu' },
          { key: 'groundConductorPcs', label: 'PCS Skid Ground Conductor', type: 'text', required: true, placeholder: '600 KCMIL Cu' },
          { key: 'groundConductorAux', label: 'Auxiliary Equipment Ground Conductor', type: 'text', required: true, placeholder: '#4/0 AWG Cu' },
          { key: 'groundConductorMisc', label: 'Misc. Equipment Ground Conductor', type: 'text', required: true, placeholder: '#6 AWG Cu' },
          { key: 'groundingLayoutDrawingNo', label: 'Grounding Layout Drawing No.', type: 'text', required: false },
          { key: 'groundingAnalysisReportNo', label: 'Grounding Analysis Report No.', type: 'text', required: false },
        ]
      },
      {
        title: 'Equipment Grounding Conductor (EGC) Table',
        fields: [
          { key: 'egc1Ocpd', label: 'Row 1 (Aux Xfmr → Aux Panel) – OCPD', type: 'text', required: true },
          { key: 'egc1PowerCable', label: 'Row 1 – Power Cable', type: 'text', required: true },
          { key: 'egc1Egc', label: 'Row 1 – EGC', type: 'text', required: true },
          { key: 'egc2Ocpd', label: 'Row 2 (BESS Enclosure → PCS Skid) – OCPD', type: 'text', required: true },
          { key: 'egc2PowerCable', label: 'Row 2 – Power Cable', type: 'text', required: true },
          { key: 'egc2Egc', label: 'Row 2 – EGC', type: 'text', required: true },
          { key: 'egc3Ocpd', label: 'Row 3 (Generator → Tap Box) – OCPD', type: 'text', required: true },
          { key: 'egc3PowerCable', label: 'Row 3 – Power Cable', type: 'text', required: true },
          { key: 'egc3Egc', label: 'Row 3 – EGC', type: 'text', required: true },
          { key: 'egc4Ocpd', label: 'Row 4 (Aux Panel → BESS Enclosure) – OCPD', type: 'text', required: true },
          { key: 'egc4PowerCable', label: 'Row 4 – Power Cable', type: 'text', required: true },
          { key: 'egc4Egc', label: 'Row 4 – EGC', type: 'text', required: true },
          { key: 'egc5Ocpd', label: 'Row 5 (Aux Panel → Mini Power Center) – OCPD', type: 'text', required: true },
          { key: 'egc5PowerCable', label: 'Row 5 – Power Cable', type: 'text', required: true },
          { key: 'egc5Egc', label: 'Row 5 – EGC', type: 'text', required: true },
          { key: 'egc6Ocpd', label: 'Row 6 (Tap Box → Aux Panel) – OCPD', type: 'text', required: true },
          { key: 'egc6PowerCable', label: 'Row 6 – Power Cable', type: 'text', required: true },
          { key: 'egc6Egc', label: 'Row 6 – EGC', type: 'text', required: true },
          { key: 'egc7Ocpd', label: 'Row 7 (Aux Panel → PCS Skid) – OCPD', type: 'text', required: true },
          { key: 'egc7PowerCable', label: 'Row 7 – Power Cable', type: 'text', required: true },
          { key: 'egc7Egc', label: 'Row 7 – EGC', type: 'text', required: true },
          { key: 'egc8Ocpd', label: 'Row 8 (Aux Panel → Light Poles) – OCPD', type: 'text', required: true },
          { key: 'egc8PowerCable', label: 'Row 8 – Power Cable', type: 'text', required: true },
          { key: 'egc8Egc', label: 'Row 8 – EGC', type: 'text', required: true },
          { key: 'egc9Ocpd', label: 'Row 9 (Mini Power Center → Receptacle) – OCPD', type: 'text', required: true },
          { key: 'egc9PowerCable', label: 'Row 9 – Power Cable', type: 'text', required: true },
          { key: 'egc9Egc', label: 'Row 9 – EGC', type: 'text', required: true },
          { key: 'egc10Ocpd', label: 'Row 10 (Mini Power Center → FNE) – OCPD', type: 'text', required: true },
          { key: 'egc10PowerCable', label: 'Row 10 – Power Cable', type: 'text', required: true },
          { key: 'egc10Egc', label: 'Row 10 – EGC', type: 'text', required: true },
        ]
      }
    ]
  },

  // ─── BESS LAYOUT DESIGN ─────────────────────────────────────────────────────
  {
    id: 'layout',
    name: 'BESS Layout Design',
    icon: 'layout',
    blurb: 'Clearance requirements and layout media for the BESS site plan.',
    fields: [
      { key: 'bessClearance', label: 'Min Clearance Between Enclosures', type: 'number', required: true, unit: 'ft' },
      { key: 'bessPcsClearance', label: 'Min Clearance Enclosure to PCS', type: 'number', required: true, unit: 'ft' },
    ],
    uploads: [
      { key: 'singleLineDiagram', label: 'Single Line Diagram', hint: 'Image · Electrical single line diagram', required: false },
      { key: 'loadProfileChart', label: 'Load Profile Chart', hint: 'Image/Chart · Daily BESS load profile', required: false },
      { key: 'sitePhoto', label: 'Site Layout / Aerial Photo', hint: 'Image · Site layout or aerial view', required: false },
      { key: 'siteMap', label: 'Site Location Map', hint: 'Image · Site location map', required: false },
    ]
  },

  // ─── DATASHEETS & UPLOADS ──────────────────────────────────────────────────
  {
    id: 'uploads',
    name: 'Datasheets & Uploads',
    icon: 'paperclip',
    blurb: 'Attach source datasheets used for BESS sizing and design validation.',
    uploads: [
      { key: 'batteryDs', label: 'Battery Datasheet', hint: 'PDF · Manufacturer battery specification', required: false },
      { key: 'pcsDs', label: 'PCS Datasheet', hint: 'PDF · PCS manufacturer specification', required: false },
      { key: 'transformerDs', label: 'Transformer Datasheet', hint: 'PDF · MV transformer specification', required: false },
    ]
  },

];
