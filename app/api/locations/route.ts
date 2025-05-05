import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Define the location interface
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
}

// In-memory storage for locations
// In a real app, this would be stored in a database
export let locations: Location[] = [
  {
    id: uuidv4(),
    name: 'Main Office',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    latitude: 37.7749,
    longitude: -122.4194,
    isPrimary: true
  },
  {
    id: uuidv4(),
    name: 'Downtown Branch',
    address: '456 Market St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94103',
    latitude: 37.7785,
    longitude: -122.4212,
    isPrimary: false
  }
];

// GET all locations
export async function GET() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return NextResponse.json(locations);
}

// POST a new location
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate required fields
  if (!body.name || !body.address || !body.city || !body.state || !body.zipCode) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }
  
  // In a real app, we would validate the data more thoroughly
  
  // Create new location with either provided ID or generate one
  const newLocation: Location = {
    id: body.id || uuidv4(),
    name: body.name,
    address: body.address,
    city: body.city,
    state: body.state,
    zipCode: body.zipCode,
    latitude: body.latitude || 37.7749 + (Math.random() - 0.5) * 0.1,
    longitude: body.longitude || -122.4194 + (Math.random() - 0.5) * 0.1,
    isPrimary: body.isPrimary || false
  };
  
  // If this is marked as primary, update the other locations
  if (newLocation.isPrimary) {
    locations = locations.map(loc => ({
      ...loc,
      isPrimary: false
    }));
  }
  
  // Add to locations
  locations.push(newLocation);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return NextResponse.json(newLocation);
} 