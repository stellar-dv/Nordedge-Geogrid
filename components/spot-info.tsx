"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  ExternalLink, 
  BarChart2, 
  MapPin, 
  PhoneCall, 
  Star 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Place {
  placeId: string
  name: string
  address: string
  rating?: number
  reviewCount?: number
  order: number
  selected?: boolean
  website?: string
  distance?: number
  photos?: string[]
}

interface SpotInfoProps {
  place: Place
  onSelect: () => void
  onShowGeogrid?: () => void
}

export function SpotInfo({ place, onSelect, onShowGeogrid }: SpotInfoProps) {
  const hasRating = place.rating && place.rating > 0
  const formattedDistance = place.distance 
    ? place.distance < 1000 
      ? `${Math.round(place.distance)}m`
      : `${(place.distance / 1000).toFixed(1)}km`
    : null

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer",
        place.selected ? "ring-2 ring-primary" : "ring-0"
      )}
      onClick={onSelect}
    >
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2">
            <div className={cn(
              "flex items-center justify-center rounded-full w-7 h-7 font-medium text-sm shrink-0",
              place.order <= 3 ? "bg-green-600 text-white" :
              place.order <= 7 ? "bg-green-500 text-white" :
              place.order <= 10 ? "bg-yellow-400 text-black" :
              place.order <= 15 ? "bg-orange-500 text-white" :
              place.order <= 20 ? "bg-red-500 text-white" :
              "bg-gray-500 text-white"
            )}>
              {place.order}
            </div>
            <div>
              <h3 className="font-medium text-sm line-clamp-1">{place.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{place.address}</p>
            </div>
          </div>
          {formattedDistance && (
            <div className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {formattedDistance}
            </div>
          )}
        </div>

        {/* Rating and actions */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            {hasRating ? (
              <>
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                <span className="text-xs font-medium">{place.rating?.toFixed(1)}</span>
                {place.reviewCount && place.reviewCount > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({place.reviewCount})
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No ratings</span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {onShowGeogrid && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={(e) => {
                  e.stopPropagation();
                  onShowGeogrid();
                }}
                title="View ranking grid for this competitor"
              >
                <BarChart2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {place.website && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(place.website, '_blank');
                }}
                title="Visit website"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
} 