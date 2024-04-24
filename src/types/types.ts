export type Location = {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  country_code: string
}

export type Locations = Location[]

export type WeatherForeCast = {
  latitude: number
  longitude: number
  generationtime_ms?: number
  utc_offset_seconds?: number
  timezone?: string
  timezone_abbreviation?: string
  elevation?: number
  current: {
    time: string
    temperature: string
  }
  hourly_units?: {
    time: string
    temperature_2m: string
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
  }
}
