export interface CountryProfile {
  '@id': string
  name: string
  code: string
}

export interface CountryPlayers {
  players: string[]
}

export interface CountryClubs {
  clubs: string[]
}

export interface CompleteCountryData {
  profile: CountryProfile
  players: CountryPlayers
  clubs: CountryClubs
  fetchedAt: number
}
