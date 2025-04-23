import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient("https://ktgxqvnjnnljdjxnwykw.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Z3hxdm5qbm5samRqeG53eWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjA4MDAsImV4cCI6MjA2MDIzNjgwMH0.aeyLCPo9TRsgPgmW2XmXnSmmS617wtcAj8WhvstvsFE");

// Define types for better type safety
type Business = {
  id: string;
  name: string;
  address: string;
  place_id: string;
  lat: string;
  lng: string;
  category: string | null;
}

type GridResult = {
  id: string;
  search_term: string;
  created_at: string;
  grid_size: number;
  grid_data: any;
  metrics: any;
  google_region: string;
  distance_km: number;
  businesses: Business;
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    
    // Parse sorting parameters
    const orderField = searchParams.get('order[][field]') || 'created_at';
    const orderDirection = searchParams.get('order[][direction]') || 'desc';
    
    // Parse pagination parameters
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    
    // Parse filtering parameters
    const businessId = searchParams.get('business_id');
    const searchTerm = searchParams.get('search_term');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build the query
    let query = supabase
      .from('grid_results')
      .select(`
        id,
        search_term,
        created_at,
        grid_size,
        grid_data,
        metrics,
        google_region,
        distance_km,
        businesses!inner (
          id,
          name,
          address,
          place_id,
          lat,
          lng,
          category
        )
      `)
      .order(orderField, { ascending: orderDirection === 'asc' })
      .range(from, to);
    
    // Apply filters if provided
    if (businessId) {
      query = query.eq('business_id', businessId);
    }
    
    if (searchTerm) {
      query = query.ilike('search_term', `%${searchTerm}%`);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Execute the query
    const { data, error, count } = await query.limit(perPage);

    if (error) {
      throw error;
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('grid_results')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    // Transform data to match LocalViking format
    const formattedResults = data.map((row: any) => {
      const business = row.businesses;
      
      return {
        id: row.id,
        search_term: row.search_term,
        created_at: row.created_at,
        grid_size: row.grid_size,
        grid_data: row.grid_data,
        metrics: row.metrics,
        google_region: row.google_region,
        distance_km: row.distance_km,
        business: {
          id: business.id,
          name: business.name,
          address: business.address,
          place_id: business.place_id,
          location: {
            lat: parseFloat(business.lat),
            lng: parseFloat(business.lng)
          },
          category: business.category
        }
      };
    });

    // Return response with pagination metadata
    return NextResponse.json({
      results: formattedResults,
      meta: {
        total_count: totalCount || 0,
        page_count: Math.ceil((totalCount || 0) / perPage),
        current_page: page,
        per_page: perPage
      }
    });
  } catch (error) {
    console.error('Error fetching geogrid results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geogrid results' },
      { status: 500 }
    );
  }
}

// Add POST endpoint to create a new geogrid result
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.businessInfo || !body.gridData || !body.searchTerm) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Insert the business record first
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: body.businessInfo.name,
        address: body.businessInfo.address,
        place_id: body.businessInfo.placeId || null,
        lat: body.businessInfo.location.lat,
        lng: body.businessInfo.location.lng,
        category: body.businessInfo.category || null
      })
      .select('id')
      .single();

    if (businessError) {
      throw businessError;
    }
    
    // Then insert the grid result with the business ID
    const { data: resultData, error: resultError } = await supabase
      .from('grid_results')
      .insert({
        business_id: businessData.id,
        search_term: body.searchTerm,
        created_at: body.createdAt || new Date().toISOString(),
        grid_size: body.gridSize,
        grid_data: body.gridData,
        metrics: body.metrics,
        google_region: body.googleRegion || 'en-US',
        distance_km: body.distanceKm
      })
      .select('id')
      .single();

    if (resultError) {
      throw resultError;
    }
    
    return NextResponse.json({
      id: resultData.id,
      success: true,
      message: 'Geogrid result created successfully'
    });
  } catch (error) {
    console.error('Error creating geogrid result:', error);
    return NextResponse.json(
      { error: 'Failed to create geogrid result' },
      { status: 500 }
    );
  }
} 