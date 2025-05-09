export const scanTypes = [
  { type: "supplier", regex: /\d{8}-\d+$/ },
  { type: "material", regex: /\d{8}-\d+$/ },
  { type: "new_drum", regex: /\d{5}$/ },
  { type: "repro_drum", regex: /^R-\d{4}$/ },
  { type: "location", regex: /^[A-Z]{1,3}-\d{1,2}$/ },
  { type: "context", regex: /^s-.+/ },
];
