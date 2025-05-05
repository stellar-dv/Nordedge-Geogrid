"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, MapPin, Trash2, Building, Loader2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { fetchLocations, addLocation, deleteLocation } from "@/lib/api-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Location {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
  isPrimary: boolean
}

export function BusinessLocationTracker() {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  
  // Form state
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    isPrimary: false
  })

  // Load locations
  useEffect(() => {
    const getLocations = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const data = await fetchLocations()
        setLocations(data)
      } catch (err) {
        console.error("Error fetching locations:", err)
        setError("Failed to load locations. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    
    getLocations()
  }, [])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setNewLocation({
      ...newLocation,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  // Handle location addition
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)
    setError(null)
    
    try {
      // In a real scenario we would use an API to geocode the address
      // For demo, we'll use random coordinates near San Francisco
      const latitude = 37.7749 + (Math.random() - 0.5) * 0.1
      const longitude = -122.4194 + (Math.random() - 0.5) * 0.1
      
      const locationData = {
        id: uuidv4(),
        ...newLocation,
        latitude,
        longitude
      }
      
      const addedLocation = await addLocation(locationData)
      
      // Update locations list
      setLocations([...locations, addedLocation])
      
      // Reset form
      setNewLocation({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        isPrimary: false
      })
      
      // Close dialog
      setAddDialogOpen(false)
    } catch (err) {
      console.error("Error adding location:", err)
      setError("Failed to add location. Please try again.")
    } finally {
      setIsAdding(false)
    }
  }

  // Handle location deletion
  const handleDeleteLocation = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      setIsDeleting(true)
      setError(null)
      
      try {
        await deleteLocation(id)
        
        // Update locations list
        setLocations(locations.filter(loc => loc.id !== id))
      } catch (err) {
        console.error("Error deleting location:", err)
        setError("Failed to delete location. Please try again.")
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Business Locations</CardTitle>
          <CardDescription>Loading your business locations...</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              Business Locations
            </CardTitle>
            <CardDescription>
              Manage all your business locations in one place
            </CardDescription>
          </div>
          
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center gap-2"
                onClick={() => setAddDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
                <DialogDescription>
                  Enter the details for your new business location
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddLocation}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={newLocation.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="address" className="text-right">
                      Address
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={newLocation.address}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="city" className="text-right">
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={newLocation.city}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="state" className="text-right">
                      State
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      value={newLocation.state}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="zipCode" className="text-right">
                      Zip Code
                    </Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={newLocation.zipCode}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="isPrimary" className="text-right">
                      Primary Location
                    </Label>
                    <div className="col-span-3 flex items-center">
                      <input
                        type="checkbox"
                        id="isPrimary"
                        name="isPrimary"
                        checked={newLocation.isPrimary}
                        onChange={handleInputChange}
                        className="mr-2 h-4 w-4"
                      />
                      <Label htmlFor="isPrimary">Set as primary location</Label>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Location'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="list">
          <TabsList className="mb-4 bg-muted/50">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            {locations.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-gray-50">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No locations added yet</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  Add your business locations to track their performance and compare local rankings across different areas.
                </p>
                <Button 
                  onClick={() => setAddDialogOpen(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Your First Location
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {locations.map((location) => (
                  <div 
                    key={location.id}
                    className="p-4 border rounded-lg flex flex-col md:flex-row justify-between gap-4 hover:bg-gray-50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {location.name}
                        </h3>
                        {location.isPrimary && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {location.address}, {location.city}, {location.state} {location.zipCode}
                      </p>
                      <p className="text-xs text-gray-400">
                        Lat: {location.latitude.toFixed(5)}, Lng: {location.longitude.toFixed(5)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`, '_blank')}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        View on Map
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteLocation(location.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="map">
            <div className="border rounded-lg h-[500px] bg-gray-100 flex items-center justify-center">
              <div className="text-center p-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Map View</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  In a real application, this would show an interactive map with your business locations. 
                  Currently displaying {locations.length} location{locations.length !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-6">
        <div className="text-sm text-gray-500">
          Showing {locations.length} location{locations.length !== 1 ? 's' : ''}
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {/* Export functionality would go here */}}
        >
          Export Locations
        </Button>
      </CardFooter>
    </Card>
  )
} 