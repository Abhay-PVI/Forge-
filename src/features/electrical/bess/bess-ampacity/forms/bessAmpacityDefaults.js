export const BESS_AMPACITY_DEFAULTS = {
  // Document Info
  reportTitle: 'DC & AC Cable Ampacity Report',
  documentNo: 'PVI-BESS-AMP-001',
  revision: 'A',
  preparedDate: '2026-07-03',

  // Project Info
  clientName: 'Aurora Energy Storage LLC',
  projectName: 'Sunbelt BESS — Phase I',
  county: 'Maricopa',
  state: 'AZ',
  country: 'USA',
  projectCapacityMW: '200',
  projectCapacityMWh: '800',
  projectDurationHours: '4',
  powerFactor: '0.95',
  powerFactorLeadLag: 'Lead / Lag',

  // Soil Thermal Resistivity
  geotechReportCompany: 'GeoSystems Southwest Inc.',
  geotechReportNo: 'GSW-2024-0451',
  geotechReportDate: 'March 2024',
  soilThermalResistivityNative: '90',
  soilMoistureContent: '8',
  soilThermalResistivitySelectiveFill: '85',
  selectiveFillDepth: '4',

  dryoutMoisture1Pct: '120',
  dryoutMoisture2Pct: '105',
  dryoutMoisture3Pct: '95',
  dryoutMoisture4Pct: '90',
  dryoutMoisture5Pct: '85',
  dryoutTestBoreholeId: 'B-02',

  // Ambient Temperature
  weatherStationName: 'Eagle Point, Texas',
  weatherStationWmo: '722780',
  ashraeMinTemp: '-5',
  ashraeMaxTemp: '42',
  designMinTemp: '-8',
  designMaxTemp: '45',

  // Soil Temperature
  soilTempSource: 'USDA NRCS',
  soilTempStation: 'Beaumont, Texas',
  soilTempStationId: 'TX-4521',
  soilTempDepth: '40-inch',
  soilTempRecordYears: '15',
  soilTempMax: '28',
  soilTempSelected: '25',

  // DC Cables
  dcCableTrayWidth: '24',
  dcTrayFillAreaLimit: '26',
  dcCableSize: '600 KCMIL, AL',
  dcCableOuterDiameter: '1.08',
  dcNoOfPositiveRuns: '6',
  dcNoOfNegativeRuns: '6',
  dcTotalFillArea: '11.0',
  dcAmpacityReference: 'NEC 310.17',
  dcAmpacityAt30C: '430',
  dcAmbientTemp: '45',
  dcTempCorrectionRef: 'NEC 310.15(B)(1)',
  dcCorrectionFactorK1: '0.87',
  dcGroupingRef: 'N/A',
  dcCorrectionFactorK2: '1.0',
  dcDeRatedAmpacity: '374',
  dcRequiredAmpacity: '350',

  // MV AC Cables
  noOfPcsSkidsBOL: '54',
  pcsSkidRatingKva: '4000',
  pcsSkidCurrentAtMv: '67',
  maxPcsPerLoop: '4',
  maxLoopCurrent: '268',
  mvCableSize1: '500 KCMIL Aluminum',
  mvCableSize2: '1000 KCMIL Aluminum',

  mvCableBurialDepth: '3.5',
  mvCableMaxTemp: '90',
  mvConduitSize: '8-inch',
  mvWarningTapeDepth: "1'",

  dischargePeriodHours: '4',
  restPeriodHours: '2',
  chargePeriodHours: '6',
  dischargeRateC: '0.25C',
  chargeRateC: '0.17C',

  mvDirectBuriedSummaryTable: `<table>
  <thead>
    <tr>
      <th>Circuit ID</th>
      <th>Cable Size</th>
      <th>Max Temp (°C)</th>
      <th>Limit (°C)</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Loop-1</td>
      <td>500 KCMIL</td>
      <td>78.2</td>
      <td>90</td>
      <td>Pass</td>
    </tr>
    <tr>
      <td>Loop-2</td>
      <td>500 KCMIL</td>
      <td>79.1</td>
      <td>90</td>
      <td>Pass</td>
    </tr>
  </tbody>
</table>`,

  mvConduitSummaryTable: `<table>
  <thead>
    <tr>
      <th>Circuit ID</th>
      <th>Cable Size</th>
      <th>Max Temp (°C)</th>
      <th>Limit (°C)</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Loop-1 (Conduit)</td>
      <td>1000 KCMIL</td>
      <td>82.4</td>
      <td>90</td>
      <td>Pass</td>
    </tr>
  </tbody>
</table>`,

  mvParallelCircuitSummaryTable: `<table>
  <thead>
    <tr>
      <th>No. of Parallel Circuits</th>
      <th>Cable Size</th>
      <th>Max Temp (°C)</th>
      <th>Limit (°C)</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2 Circuits</td>
      <td>500 KCMIL</td>
      <td>74.5</td>
      <td>90</td>
      <td>Pass</td>
    </tr>
    <tr>
      <td>3 Circuits</td>
      <td>500 KCMIL</td>
      <td>78.9</td>
      <td>90</td>
      <td>Pass</td>
    </tr>
    <tr>
      <td>4 Circuits</td>
      <td>500 KCMIL</td>
      <td>83.2</td>
      <td>90</td>
      <td>Pass</td>
    </tr>
  </tbody>
</table>`,

  // Auxiliary Cables
  auxTransformerRatingKva: '1200',
  auxTransformerVoltage: '480',
  auxTransformerToBoardCableSize: '1C, 1000 KCMIL, Al',
  auxTransformerToBoardRuns: '6',
  auxTransformerOutputCurrent: '1443',

  bessAuxCableSize: '#2 AWG',
  bessAuxAmpacityRef: 'NEC 310.16',
  bessAuxAmpacityAt30C: '115',
  bessAuxCorrectionFactorK1: '0.87',
  bessAuxCorrectionFactorK2: '0.70',
  bessAuxDeRatedAmpacity: '70',
  bessAuxRequiredCurrent: '45',

  pcsAuxCableSize: '#12 AWG',
  pcsAuxAmpacityAt30C: '30',
  pcsAuxCorrectionFactorK1: '0.87',
  pcsAuxCorrectionFactorK2: '0.70',
  pcsAuxDeRatedAmpacity: '18',
  pcsAuxRequiredCurrent: '12',

  maxCablesInTrench: '12',
  trenchBessCableCount: '6',
  trenchPcsCableCount: '6',
  totalConductorsInTrench: '36',

  lightPoleFixtureCount: '2',
  lightPoleFixtureWattage: '147',
  lightPoleVoltage: '277',
  lightPoleCableSize: '2C, #12 AWG, Cu',
  lightPoleCurrent: '1.06',
  polesPerDaisyChain: '2',
  totalLightingPoles: '13',

  mpcRatingKva: '15',
  mpcVoltage: '480',
  mpcCableSize: '2C, #2 AWG, Cu',
  mpcCurrent: '31.25',

  receptacleRatingKva: '2.4',
  receptaclePf: '0.85',
  receptacleVoltage: '120',
  receptacleCableSize: '2C, #12 AWG, Cu',
  receptacleCurrent: '20',

  fneRatingKva: '0.141',
  fneVoltage: '120',
  fneCableSize: '2C, #12 AWG, Cu',
  fneCurrent: '1.18',

  generatorRatingKw: '150',
  generatorPf: '0.85',
  generatorVoltage: '480',
  generatorCableSize: '4 x 1C, 500 KCMIL, Al',
  generatorCurrent: '225',

  tapBoxMaxLoadKva: '120',
  tapBoxVoltage: '480',
  tapBoxCableSize: '4C, #1 AWG, Cu',
  tapBoxCurrent: '144',

  auxCable1Size: '1000 KCMIL, Al',
  auxCable1Temp: '82.5',
  auxCable2Size: '2C, #12 AWG, Cu',
  auxCable2Temp: '42.1',
  auxCable2Remarks: 'Max. of 2 poles in daisy chain',
  auxCable3Size: '2C, #2 AWG, Cu',
  auxCable3Temp: '54.2',
  auxCable4Size: '2C, #12 AWG, Cu',
  auxCable4Temp: '38.4',
  auxCable5Size: '2C, #12 AWG, Cu',
  auxCable5Temp: '35.6',
  auxCable6Size: '500 KCMIL, Al',
  auxCable6Temp: '68.4',
  auxCable7Size: '4C, #1 AWG, Cu',
  auxCable7Temp: '62.7',
};
