import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Define the competitor interface
export interface Competitor {
  id: string;
  name: string;
  address: string;
  distance: number;
  website: string;
  phone: string;
  email: string;
  category: string;
  rating: number;
  reviewCount: number;
  rank: number | null;
  rankingKeywords: string[];
  visible: boolean;
  metrics: {
    localVisibility: number;
    totalKeywords: number;
    top3Keywords: number;
    top10Keywords: number;
    reviews: {
      total: number;
      average: number;
      sentiment: number;
    };
  };
}

// Sample competitor data generator
function generateCompetitors(searchTerm: string, location?: { lat: number, lng: number }): Competitor[] {
  const businessTypes = ['Restaurant', 'Retail Store', 'Professional Service', 'Healthcare', 'Home Service'];
  const keywordsList = [
    'local business', 'near me', 'best service', 
    'top rated', 'affordable', 'professional', 
    'expert', 'quality', 'trusted', 'reliable'
  ];
  
  // Generate random competitors
  return Array.from({ length: 8 }, (_, i) => {
    // Base distance = 0.5-5 miles, closer for higher ranked businesses
    const distance = Math.max(0.5, Math.min(5, (i * 0.6) + (Math.random() * 0.8)));
    
    // Review count - higher ranked generally have more
    const reviewCount = Math.floor(Math.max(5, 200 - (i * 20) + (Math.random() * 40)));
    
    // Rating - higher for better ranked businesses, slight variation
    const rating = Math.min(5, Math.max(3, 5 - (i * 0.15) + (Math.random() * 0.3)));
    
    // Keywords - random selection with more for better rankings
    const keywordsCount = Math.max(2, 10 - i);
    const shuffledKeywords = [...keywordsList].sort(() => 0.5 - Math.random());
    const selectedKeywords = shuffledKeywords.slice(0, keywordsCount);
    
    if (searchTerm && !selectedKeywords.includes(searchTerm)) {
      selectedKeywords.push(searchTerm);
    }
    
    // Business type
    const category = businessTypes[Math.floor(Math.random() * businessTypes.length)];
    
    // Local visibility - higher for better ranked
    const localVisibility = Math.floor(Math.max(10, 95 - (i * 10) + (Math.random() * 15)));
    
    // Keyword metrics
    const totalKeywords = Math.floor(Math.max(5, 50 - (i * 5) + (Math.random() * 10)));
    const top3Keywords = Math.floor(Math.max(0, 10 - i + (Math.random() * 3)));
    const top10Keywords = Math.floor(Math.max(top3Keywords, 20 - i + (Math.random() * 6)));
    
    return {
      id: uuidv4(),
      name: `Competitor ${i + 1}`,
      address: `${100 + i} Main St, San Francisco, CA 94105`,
      distance,
      website: `https://competitor${i + 1}.example.com`,
      phone: `(415) 555-${1000 + i}`,
      email: `contact@competitor${i + 1}.example.com`,
      category,
      rating,
      reviewCount,
      rank: i + 1,
      rankingKeywords: selectedKeywords,
      visible: true,
      metrics: {
        localVisibility,
        totalKeywords,
        top3Keywords,
        top10Keywords,
        reviews: {
          total: reviewCount,
          average: rating,
          sentiment: Math.min(100, Math.max(60, 90 - (i * 3) + (Math.random() * 10)))
        }
      }
    };
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const businessId = searchParams.get('businessId');
  const searchTerm = searchParams.get('searchTerm') || 'local business';
  
  // Parse location if provided
  let location;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  if (lat && lng) {
    location = {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };
  }
  
  // Generate competitors - in a real app, this would come from a database
  const competitors = generateCompetitors(searchTerm, location);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return NextResponse.json(competitors);
} 