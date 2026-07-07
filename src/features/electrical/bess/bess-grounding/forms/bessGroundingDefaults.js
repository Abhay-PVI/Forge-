export const BESS_GROUNDING_DEFAULTS = {
  // Document Info
  reportTitle: 'BESS Grounding Analysis (Step and Touch Voltage)',
  documentNo: 'PVI-BESS-GRN-001',
  revision: 'A',
  preparedDate: '2026-07-03',

  // Project Info
  clientName: 'Aurora Energy Storage LLC',
  projectName: 'Sunbelt BESS — Phase I',
  county: 'Maricopa',
  state: 'AZ',
  country: 'USA',
  projectCapacityMW: 200,
  projectCapacityMWh: 800,
  projectDurationHours: 4,
  powerFactor: '0.95',
  powerFactorLeadLag: 'Lead / Lag',
  dcVoltage: 1500,
  mvVoltage: 34.5,
  poiVoltage: 138,
  bessManufacturer: 'CATL',
  ipRating: 'IP55',
  batteryMinVoltage: 1000,
  batteryMaxVoltage: 1500,
  pcsManufacturer: 'Sungrow',
  pcsModel: 'SC5000UD-MV',
  pcsRating: 5000,
  mvtRating: 5000,
  maxMvtLoop: 6,
  noOfVCB: 9,

  // Study Basis
  poiSubstationName: 'TNMP Heights Substation',
  poiSubstationVoltage: 138,
  ohtlConductorType: 'ACSR Lark 397.5 KCMil',
  ohtlLengthMiles: 1.2,

  mptRatingMva: '138/184/230 MVA',
  mptVoltageRatio: '138/34.5 kV',
  mptPsPercentZ: 8.5,
  mptPsXR: 18,
  mptPtPercentZ: 8.5,
  mptPtXR: 18,
  mptStPercentZ: 12.0,
  mptStXR: 15,
  neutralGroundingReactorOhm: 8,

  mvtVoltageRatio: '34.5/0.69 kV',
  mvtRatingMva: 5.3,
  mvtImpedancePercent: 8,

  mvCableInsulationSpec: '35kV TR-XLPE 105°C 100% insulation level',
  mvCableSize1: '500 KCMil Al conductor, 1/2 Cu concentric neutral',
  mvCableSize2: '1000 KCMil Al conductor, 1/3 Cu concentric neutral',
  mvTrenchGroundConductor: '3/0 AWG',

  groundingMatConductor: '4/0 AWG',
  groundConductorBess: '500 KCMil Bare Stranded Cu',
  groundConductorPcs: '600 KCMil Bare Stranded Cu',
  groundConductorAuxXfmr: '4/0 AWG Bare Stranded Cu',
  groundConductorGenerator: '#3 AWG Bare Stranded Cu',
  groundConductorMisc: '#6 AWG Bare Stranded Cu',

  // WinIGS Model Inputs
  winigsSoftwareVendor: 'Advanced Grounding Concepts',
  winigsSoftwareVersion: '8.3.6',
  inverterLvVoltage: 0.69,
  stepUpTransformerConfig: 'Delta on MV side, Wye on LV side',
  mptWindingConfig: '3-winding Wye-Wye-Delta',
  mptBaseMva: 138,
  soilResistivityVendor: 'ADVITECH Engineering Group',
  soilResistivityReportDate: 'April 2024',
  soilTestMethod: 'Wenner 4-Electrode Method per IEEE Std 81 and ASTM G57',
  soilProbeSpacingMin: '0.5 ft',
  soilProbeSpacingMax: '150 ft',
  soilTestLocationCount: 2,

  // Grounding System
  concentricNeutralBondingDepth: '30 inches',
  groundRodSpec: '3/4" x 10\' copper-clad steel',
  earthConductorRefEquation: 'IEEE 80, Eq. 37',

  // Analysis
  groundReferenceNodeLocation: 'Each PCS Skid connecting to the substation',
  substationGroundingScopeNote: 'substation grounding layout design is not within the scope of this work',

  // Results
  safetyBodyWeightKg: 50,
  safetyShockDurationSec: 0.5,
  conclusionText: 'Touch and step potentials at all accessible points within and adjacent to the BESS area are lower than the maximum permissible tolerable limits.',
};
