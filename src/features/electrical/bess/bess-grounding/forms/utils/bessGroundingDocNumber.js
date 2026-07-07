export function bessGroundingDocNumber(values) {
  const code = values?.documentNo || "PVI-BESS-GRN-001";
  const rev = values?.revision || "A";

  return `${code}-${rev}`;
}
