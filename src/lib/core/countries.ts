import { validate } from '../../utils/core/validator.js'
import { Logger } from '../../utils/logger/logger.js'
import { ChessComHttpClient } from '../client.js'
import type { CountryClubs, CountryPlayers, CountryProfile } from './../types/src/country.d.ts'
import type { ApiResponse } from '../types/src/common.d.ts'

export class CountriesEndpoints {
  private logger: Logger

  constructor(private http: ChessComHttpClient) {
    this.logger = new Logger()
  }

  async getProfile(countryCode: string): Promise<ApiResponse<CountryProfile>> {
    this.logger.info(`Fetching country profile for: ${countryCode}`)
    const validatedCountryCode = validate.countryCode(countryCode)
    return this.http.get<CountryProfile>(`/country/${validatedCountryCode}`)
  }

  async getPlayers(countryCode: string): Promise<ApiResponse<CountryPlayers>> {
    this.logger.info(`Fetching country players for: ${countryCode}`)
    const validatedCountryCode = validate.countryCode(countryCode)
    return this.http.get<CountryPlayers>(`/country/${validatedCountryCode}/players`)
  }

  async getClubs(countryCode: string): Promise<ApiResponse<CountryClubs>> {
    this.logger.info(`Fetching country clubs for: ${countryCode}`)
    const validatedCountryCode = validate.countryCode(countryCode)
    return this.http.get<CountryClubs>(`/country/${validatedCountryCode}/clubs`)
  }

  async getCompleteCountryData(countryCode: string) {
    this.logger.info(`Fetching complete country data for: ${countryCode}`)

    const result = validate.countryCode(countryCode)
    if (!result.isValid) {
      throw new Error(`Invalid country code: ${result.errors.join(', ')}`)
    }

    const validatedCountryCode = countryCode
    const [profile, players, clubs] = await Promise.all([
      this.getProfile(validatedCountryCode),
      this.getPlayers(validatedCountryCode),
      this.getClubs(validatedCountryCode),
    ])

    return {
      profile: profile.data,
      players: players.data,
      clubs: clubs.data,
      fetchedAt: Date.now(),
    }
  }

  async getMultipleCountriesProfiles(countryCodes: string[]): Promise<Map<string, CountryProfile>> {
    this.logger.info(`Fetching profiles for ${countryCodes.length} countries`)
    const results = new Map<string, CountryProfile>()

    const uniqueCountryCodes = [...new Set(countryCodes.map(code => code.toUpperCase()))]
    const validCodes = uniqueCountryCodes.filter(code => {
      const res = validate.countryCode(code)
      if (!res.isValid) {
        this.logger.warn(`Skipping invalid country code: ${code} (${res.errors.join(', ')})`)
        return false
      }
      return true
    })

    const promises = validCodes.map(async countryCode => {
      try {
        const response = await this.getProfile(countryCode)
        results.set(countryCode, response.data)
        this.logger.debug(`Fetched profile for country: ${countryCode}`)
      } catch (error) {
        this.logger.warn(`Failed to fetch profile for country: ${countryCode}`, error)
      }
    })

    await Promise.all(promises)
    this.logger.info(
      `Successfully fetched ${results.size} out of ${validCodes.length} valid country profiles`
    )

    return results
  }
}
