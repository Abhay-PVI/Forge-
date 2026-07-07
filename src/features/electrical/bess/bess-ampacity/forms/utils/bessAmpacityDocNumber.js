export function bessAmpacityDocNumber(values) {
  const code = values?.documentNo || "PVI-BESS-AMP-001";
  const rev = values?.revision || "A";

  return `${code}-${rev}`;
}
