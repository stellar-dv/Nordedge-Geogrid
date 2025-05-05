export interface BusinessInfo {
  name: string;
  address: string;
  location?: { lat: number; lng: number } | string;
  category?: string;
  placeId?: string;
  verified?: boolean;
  keywords: string[];
  businessType: "physical" | "restaurant" | "medical" | "service" | string;
  serviceRadius: number;
  rating?: number;
}
