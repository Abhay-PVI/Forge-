export const BESS_DEFAULTS = {

  // ─── CLIENT INFORMATION ────────────────────────────────────────────────────
  clientName:    'Aurora Energy Storage LLC',
  clientContact: 'James Whitfield',
  clientEmail:   'j.whitfield@aurora-es.com',
  clientAddress: '4400 Desert Sky Blvd, Suite 200\nPhoenix, AZ 85048, USA',
  consultant:    'HV DBR Engineering Inc.',

  // ─── PROJECT INFORMATION ───────────────────────────────────────────────────
  projectName:           'Sunbelt BESS — Phase I',
  projectSite:           'Maricopa County Substation Site',
  state:                 'AZ',
  county:                'Maricopa',
  country:               'USA',
  coordinates:           '33.4484° N, 112.0740° W',

  projectCapacityMW:     '200',
  projectCapacityMWh:    '800',
  projectDurationHours:  '4',
  bessPowerRating:       '200',
  bessEnergyRating:      '800',

  powerFactor:           '0.95',
  powerFactorLeadLag:    'Lead / Lag',
  annualCycles:          '365',
  totalPCSPowerRating:   '237.45',
  totalBessEnergyRating: '1023.26',

  // ─── SITE CONDITIONS ───────────────────────────────────────────────────────
  utilityName:    'Arizona Public Service (APS)',
  fenceArea:      '25',
  cyclesPerDay:   '1',

  maxTemp:        '115',
  minTemp:        '20',
  tempDesign:     '113',

  altitude:       '1100',
  windSpeed:      '110',
  snowLoad:       '5',
  snowDepth:      '2',
  roadWidth:      '20',
  fenceClearance: '10',

  // ─── ELECTRICAL SYSTEM ─────────────────────────────────────────────────────
  poiVoltage: '230',
  mvVoltage:  '34.5',
  lvVoltage:  '600',
  dcVoltage:  '1500',
  noOfVCB:    '8',

  // ─── BATTERY SYSTEM ────────────────────────────────────────────────────────
  batteryTechnology:      'Li-Ion LFP',
  bessManufacturer:       'CATL',
  bessModel:              'EnerOne Plus',
  batteryMinVoltage:      '920',
  batteryMaxVoltage:      '1500',
  batteryRatedVoltage:    '1331.2',
  batteryRatedCurrent:    '1205.6',
  bessDimension:          '6058 x 2438 x 2896 mm',
  bessEnergyPerEnclosure: '3720',
  noOfEnclosures:         '216',
  coolingMethod:          'Liquid Cooling',
  ipRating:               'IP55',
  bessDesignLife:         '25',
  batteryCertification:   'UL1973, UL9540A, NFPA855, UN38.3',
  tempMin:                '0',
  tempMax:                '45',

  // ─── PCS INFORMATION ───────────────────────────────────────────────────────
  pcsManufacturer:          'Sungrow',
  pcsModel:                 'SC4000UD-MV',
  pcsRating:                '4000',
  pcsDimension:             '3183 x 2110 x 1800 mm',
  pcsAcVoltage:             '600',
  pcsDcVoltageRange:        '920 – 1500 Vdc',
  pcsFrequency:             '60',
  pcsEfficiency:            '99',
  pcsThd:                   '3',
  pcsProtection:            'NEMA 3R / IP55',
  pcsCooling:               'Forced Air',
  pcsOutputProtection:      'Fuse + Switch',
  pcsOvervoltageProtection: 'Surge Arrestor',
  pcsCommunication:         'Ethernet / Modbus TCP',
  pcsAltitude:              '4000',
  noOfPCS:                  '54',

  // ─── TRANSFORMER ───────────────────────────────────────────────────────────
  mvtManufacturer:           'ABB',
  mvtRating:                 '4000',
  transformerVoltageRating:  '34.5 / 0.6 kV',
  transformerImpedance:      '5.75',
  transformerWindingMaterial:'Aluminum',
  transformerCooling:        'KNAN',
  maxMvtLoop:                '4',

  // ─── AUXILIARY POWER ───────────────────────────────────────────────────────
  auxVoltage:       '480',
  auxVoltage2:      '480',
  auxVoltage3:      '120',
  auxPowerKVA:      '25',
  upsPowerKVA:      '10',
  fneAuxPowerKVA:   '5',
  maxFneLoop:       '4',
  dcControlVoltage: '24',

  // ─── CABLE CALCULATIONS ────────────────────────────────────────────────────
  dcCableSize:    '2/0 AWG Cu',
  noOfDcRuns:     '4',
  cableTrayWidth: '12',

  mvCableBurialDepth: '3.5',
  mvCableMaxTemp:     '90',
  loadFactorPercent:  '75',
  mvCableSize1:       '3C x 300 mm² Al, 35 kV, XLPE',
  mvCableSize2:       '3C x 240 mm² Al, 35 kV, XLPE',
  mvCableSize3:       '',
  mvCableSize4:       '',

  // ─── GEOTECHNICAL ──────────────────────────────────────────────────────────
  geotechReportCompany:         'GeoSystems Southwest Inc.',
  geotechReportNo:              'GSW-2024-0451',
  geotechReportDate:            'March 2024',
  soilTempStation:              'Phoenix Sky Harbor Airport',
  soilTempLocation:             'Maricopa County, AZ',
  soilTempMax:                  '28',
  soilTempSelected:             '25',
  soilThermalResistivityNative: '0.9 °C·m/W',
  soilMoistureContent:          '8',
  parcelNo:                     'APN 302-15-048',
  referenceDrawingNo:           'E-001 Rev A',

};
