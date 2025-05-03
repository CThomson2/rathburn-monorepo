#!/bin/bash

# Create directories to store results
mkdir -p analysis_results

# Get lists of all component files in both apps
find apps/web/src/components/ui -type f -name "*.tsx" | sort > analysis_results/web_components.txt
find apps/mobile/src/components/ui -type f -name "*.tsx" | sort > analysis_results/mobile_components.txt

# Find unique components (exist in only one app)
comm -23 analysis_results/web_components.txt analysis_results/mobile_components.txt | sed 's/.*\///' > analysis_results/web_only_components.txt
comm -13 analysis_results/web_components.txt analysis_results/mobile_components.txt | sed 's/.*\///' > analysis_results/mobile_only_components.txt

# Find common components (exist in both apps)
comm -12 <(sed 's/.*\///' analysis_results/web_components.txt) <(sed 's/.*\///' analysis_results/mobile_components.txt) > analysis_results/common_components.txt

# Check which common components are identical
echo "# Components that are identical:" > analysis_results/identical_components.txt
echo "# Components with differences:" > analysis_results/different_components.txt

while read -r component; do
  web_path="apps/web/src/components/ui/$component"
  mobile_path="apps/mobile/src/components/ui/$component"
  
  if diff -q "$web_path" "$mobile_path" >/dev/null; then
    echo "$component" >> analysis_results/identical_components.txt
  else
    echo "$component" >> analysis_results/different_components.txt
  fi
done < analysis_results/common_components.txt

# Print summary
echo "=== UI Components Analysis ==="
echo "Web-only components: $(wc -l < analysis_results/web_only_components.txt)"
echo "Mobile-only components: $(wc -l < analysis_results/mobile_only_components.txt)"
echo "Common components: $(wc -l < analysis_results/common_components.txt)"
echo "Identical components: $(wc -l < analysis_results/identical_components.txt)"
echo "Components with differences: $(wc -l < analysis_results/different_components.txt)"
echo

echo "=== Components that can be directly shared ==="
cat analysis_results/identical_components.txt
echo

echo "=== Components that need review before sharing ==="
cat analysis_results/different_components.txt 