import { NextRequest, NextResponse } from 'next/server';

// Get locations reference - in a real app this would be a database connection
// For now, we import directly from the parent file's in-memory storage
import { locations, Location } from '../route';

// DELETE a specific location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // Find the location index
  const locationIndex = locations.findIndex((loc: Location) => loc.id === id);
  
  // If location not found
  if (locationIndex === -1) {
    return NextResponse.json(
      { error: 'Location not found' },
      { status: 404 }
    );
  }
  
  // Delete the location from the array
  const deletedLocation = locations[locationIndex];
  locations.splice(locationIndex, 1);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return NextResponse.json({
    success: true,
    id,
    deleted: deletedLocation
  });
} 