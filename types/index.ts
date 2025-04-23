export interface MapCenter {
  lat: number
  lng: number
}

export interface GridPoint {
  lat: number
  lng: number
}

export interface Competitor {
  id: string
  name: string
  address: string
  rating: number
  userRatingsTotal: number
  types: string[]
  location: {
    lat: number
    lng: number
  }
}

export interface RankingData {
  [keyword: string]: number[][]
}

export * from './business-info';
