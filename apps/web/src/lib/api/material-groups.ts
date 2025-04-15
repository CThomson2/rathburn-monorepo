/**
 * A utility client to fetch material groups data with fallback handling
 * This ensures that if the main endpoint is excluded in production,
 * the app will still function with the fallback endpoint
 */

interface Material {
  id: number;
  name: string;
  stock: number;
  cas_number: string;
}

interface MaterialGroup {
  chemical_group: string;
  total_stock: number;
  material_count: number;
  percentage: string;
  materials: Material[];
}

interface MaterialGroupsResponse {
  groups: MaterialGroup[];
  totalStock: number;
}

export async function getMaterialGroups(): Promise<MaterialGroupsResponse> {
  try {
    // First try the main endpoint
    const response = await fetch('/api/materials/groups');
    
    // If successful, return the data
    if (response.ok) {
      return await response.json();
    }
    
    // If the main endpoint fails, try the fallback
    console.warn('Main material groups endpoint failed, trying fallback...');
    const fallbackResponse = await fetch('/api/materials/groups/fallback');
    
    if (fallbackResponse.ok) {
      return await fallbackResponse.json();
    }
    
    // If both fail, throw an error
    throw new Error('Both main and fallback endpoints failed');
  } catch (error) {
    console.error('Error fetching material groups:', error);
    
    // Return empty data structure as last resort
    return {
      groups: [],
      totalStock: 0
    };
  }
}