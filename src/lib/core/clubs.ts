import { Logger } from '../../utils/logger/logger.js'
import { ChessComHttpClient } from '../client.js'
import { ClubMatches, ClubMembers, ClubProfile } from '../types/src/club.js'
import { ApiResponse } from '../types/src/common.js'
import { validate } from './../../utils/core/validator.js'

export class ClubsEndpoints {
  private logger: Logger

  constructor(private http: ChessComHttpClient) {
    this.logger = new Logger()
  }

  async getProfile(clubId: string): Promise<ApiResponse<ClubProfile>> {
    this.logger.info(`Fetching club profile for: ${clubId}`)
    const validatedClubId = validate.clubIdString(clubId)
    return this.http.get<ClubProfile>(`/club/${validatedClubId}`)
  }

  async getMembers(clubId: string): Promise<ApiResponse<ClubMembers>> {
    this.logger.info(`Fetching club members for: ${clubId}`)
    const validatedClubId = validate.clubIdString(clubId)
    return this.http.get<ClubMembers>(`/club/${validatedClubId}/members`)
  }

  async getMatches(clubId: string): Promise<ApiResponse<ClubMatches>> {
    this.logger.info(`Fetching club matches for: ${clubId}`)
    const validatedClubId = validate.clubIdString(clubId)
    return this.http.get<ClubMatches>(`/club/${validatedClubId}/matches`)
  }

  async getCompleteClubData(clubId: string) {
    this.logger.info(`Fetching complete club data for: ${clubId}`)
    const validatedClubId = validate.clubIdString(clubId)
    const [profile, members, matches] = await Promise.all([
      this.getProfile(validatedClubId),
      this.getMembers(validatedClubId),
      this.getMatches(validatedClubId),
    ])
    return {
      profile: profile.data,
      members: members.data,
      matches: matches.data,
      fetchedAt: Date.now(),
    }
  }

  async getMultipleClubsProfiles(clubIds: string[]): Promise<Map<string, ClubProfile>> {
    this.logger.info(`Fetching profiles for ${clubIds.length} clubs`)
    const results = new Map<string, ClubProfile>()

    // Perbaiki syntax error dan gunakan id yang benar
    const uniqueClubIds = [...new Set(clubIds.map(id => validate.clubIdString(id)))]

    const promises = uniqueClubIds.map(async clubId => {
      try {
        const response = await this.getProfile(clubId)
        results.set(clubId, response.data)
        this.logger.debug(`Fetched profile for club: ${clubId}`)
      } catch (error) {
        this.logger.warn(`Failed to fetch profile for club: ${clubId}`, error)
      }
    })

    await Promise.all(promises)
    this.logger.info(
      `Successfully fetched ${results.size} out of ${uniqueClubIds.length} club profiles`
    )
    return results
  }
}
