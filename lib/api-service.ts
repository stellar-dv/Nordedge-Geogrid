// API Service for fetching real data

// Base URLs - replace with your actual API endpoints
const API_BASE_URL = '/api';
const KEYWORDS_ENDPOINT = `${API_BASE_URL}/keywords`;
const COMPETITORS_ENDPOINT = `${API_BASE_URL}/competitors`;
const LOCATIONS_ENDPOINT = `${API_BASE_URL}/locations`;

// Keywords API
export async function fetchKeywordData(keywords: string[], timeRange?: string, region?: string) {
  try {
    // Build query params
    const queryParams = new URLSearchParams();
    keywords.forEach(kw => queryParams.append('keyword', kw));
    if (timeRange) queryParams.append('timeRange', timeRange);
    if (region) queryParams.append('region', region);
    
    const response = await fetch(`${KEYWORDS_ENDPOINT}?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(`Error fetching keyword data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in fetchKeywordData:', error);
    throw error;
  }
}

export async function fetchKeywordSuggestions(seed: string) {
  try {
    const response = await fetch(`${KEYWORDS_ENDPOINT}/suggestions?seed=${encodeURIComponent(seed)}`);
    if (!response.ok) {
      throw new Error(`Error fetching keyword suggestions: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in fetchKeywordSuggestions:', error);
    throw error;
  }
}

// Competitors API
export async function fetchCompetitors(businessId?: string, location?: { lat: number, lng: number }, searchTerm?: string) {
  try {
    // Build query params
    const queryParams = new URLSearchParams();
    if (businessId) queryParams.append('businessId', businessId);
    if (location) {
      queryParams.append('lat', location.lat.toString());
      queryParams.append('lng', location.lng.toString());
    }
    if (searchTerm) queryParams.append('searchTerm', searchTerm);
    
    const response = await fetch(`${COMPETITORS_ENDPOINT}?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(`Error fetching competitors: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in fetchCompetitors:', error);
    throw error;
  }
}

// Locations API
export async function fetchLocations() {
  try {
    const response = await fetch(LOCATIONS_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Error fetching locations: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in fetchLocations:', error);
    throw error;
  }
}

export async function addLocation(locationData: any) {
  try {
    const response = await fetch(LOCATIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData),
    });
    
    if (!response.ok) {
      throw new Error(`Error adding location: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in addLocation:', error);
    throw error;
  }
}

export async function deleteLocation(id: string) {
  try {
    const response = await fetch(`${LOCATIONS_ENDPOINT}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting location: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in deleteLocation:', error);
    throw error;
  }
} 