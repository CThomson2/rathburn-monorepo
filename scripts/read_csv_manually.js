const fs = require("fs");
const path = require("path");

// Path to the CSV file
const csvPath = "/Users/conrad/Documents/apps/data/repro-data.csv";

// Read the CSV file
const csvContent = fs.readFileSync(csvPath, "utf8");

// Manually split into lines and analyze
const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

console.log(`Total lines: ${lines.length}`);

// Analyze header line
const headerLine = lines[0];
console.log(`Header: ${headerLine}`);

// Analyze first few data lines
for (let i = 1; i < Math.min(5, lines.length); i++) {
  console.log(`\nLine ${i}: ${lines[i]}`);
  const columns = lines[i].split(",");
  console.log(`Columns: ${columns.length}`);
  console.log(`old_id: "${columns[0]}"`);
  console.log(`material: "${columns[1]}"`);
  console.log(`date: "${columns[5]}"`);
  console.log(`site: "${columns[6]}"`);
}
