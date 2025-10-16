import { Logger } from '../../utils/logger/logger.js'
import { ChessComHttpClient } from '../client.js'
import type { ApiResponse } from '../types/src/common.d.ts'
import {
  CompletePlayerData,
  OnlineStatus,
  PlayerClubs,
  PlayerMatches,
  PlayerProfile,
  PlayerStats,
  PlayerTournaments,
  Title,
  TitledPlayers,
} from '../types/src/player.js'
import { validate } from './../../utils/core/validator.js'

export class PlayerEndpoints {
  private logger: Logger

  constructor(private http: ChessComHttpClient) {
    this.logger = new Logger()
  }

  async getProfile(username: string): Promise<ApiResponse<PlayerProfile>> {
    this.logger.info(`Fetching profile for: ${username}`)
    if (!username || username.trim().length === 0) {
      throw new Error('Username is required and cannot be empty')
    }
    const validatedUsername = validate.username(username)
    this.logger.debug(`Username validated: ${validatedUsername}`)
    return this.http.get<PlayerProfile>(`/player/${validatedUsername}`)
  }

  async getStats(username: string): Promise<ApiResponse<PlayerStats>> {
    this.logger.info(`Fetching stats for: ${username}`)
    const validatedUsername = validate.username(username)
    return this.http.get<PlayerStats>(`/player/${validatedUsername}/stats`)
  }

  async getOnlineStatus(username: string): Promise<ApiResponse<OnlineStatus>> {
    this.logger.info(`Checking online status for: ${username}`)
    const validatedUsername = validate.username(username)
    return this.http.get<OnlineStatus>(`/player/${validatedUsername}/is-online`)
  }

  async getClubs(username: string): Promise<ApiResponse<PlayerClubs>> {
    this.logger.info(`Fetching clubs for: ${username}`)
    const validatedUsername = validate.username(username)
    return this.http.get<PlayerClubs>(`/player/${validatedUsername}/clubs`)
  }

  async getMatches(username: string): Promise<ApiResponse<PlayerMatches>> {
    this.logger.info(`Fetching matches for: ${username}`)
    const validatedUsername = validate.username(username)
    return this.http.get<PlayerMatches>(`/player/${validatedUsername}/matches`)
  }

  async getTournaments(username: string): Promise<ApiResponse<PlayerTournaments>> {
    this.logger.info(`Fetching tournaments for: ${username}`)
    const validatedUsername = validate.username(username)
    return this.http.get<PlayerTournaments>(`/player/${validatedUsername}/tournaments`)
  }

  async getTitledPlayers(title: Title): Promise<ApiResponse<TitledPlayers>> {
    this.logger.info(`Fetching titled players for: ${title}`)
    if (!Object.values(Title).includes(title)) {
      throw new Error(`Invalid title: ${title}. Must be one of: ${Object.values(Title).join(', ')}`)
    }
    return this.http.get<TitledPlayers>(`/titled/${title}`)
  }

  async getCompleteData(username: string): Promise<CompletePlayerData> {
    this.logger.info(`Fetching complete data for: ${username}`)
    const validatedUsername = validate.usernameString(username)
    try {
      const [profile, stats, clubs, matches, tournaments, online] = await Promise.all([
        this.getProfile(validatedUsername),
        this.getStats(validatedUsername),
        this.getClubs(validatedUsername),
        this.getMatches(validatedUsername),
        this.getTournaments(validatedUsername),
        this.getOnlineStatus(validatedUsername),
      ])
      this.logger.info(`Successfully fetched complete data for: ${validatedUsername}`)
      return {
        profile: profile.data,
        stats: stats.data,
        clubs: clubs.data,
        matches: matches.data,
        tournaments: tournaments.data,
        online: online.data,
        fetchedAt: Date.now(),
      }
    } catch (error) {
      this.logger.error(`Failed to fetch complete data for ${validatedUsername}:`, error)
      throw error
    }
  }

  async getMultipleProfiles(usernames: string[]): Promise<Map<string, PlayerProfile>> {
    this.logger.info(`Fetching profiles for ${usernames.length} players`)
    const results = new Map<string, PlayerProfile>()
    const uniqueUsernames = [...new Set(usernames.map(u => validate.usernameString(u)))]
    const promises = uniqueUsernames.map(async username => {
      try {
        const response = await this.getProfile(username)
        results.set(username, response.data)
        this.logger.debug(`Fetched profile for: ${username}`)
      } catch (error) {
        this.logger.warn(`Failed to fetch profile for: ${username}`, error)
      }
    })
    await Promise.all(promises)
    this.logger.info(
      `Successfully fetched ${results.size} out of ${uniqueUsernames.length} profiles`
    )
    return results
  }
  async getPlayerById(playerId: number): Promise<PlayerProfile | null> {
    this.logger.info(`Searching for player by ID: ${playerId}`)
    try {
      const response = await this.http.get<PlayerProfile>(`/player/id/${playerId}`)
      return response.data
    } catch (error) {
      this.logger.warn(`Player not found with ID: ${playerId}`, error)
      return null
    }
  }

  async getPlayerGamesSummary(username: string) {
    this.logger.info(`Fetching games summary for: ${username}`)
    const validatedUsername = validate.usernameString(username)
    const [stats, archives] = await Promise.all([
      this.getStats(validatedUsername),
      this.getGameArchives(validatedUsername),
    ])
    return {
      stats: stats.data,
      totalArchives: archives.data.archives.length,
      archives: archives.data.archives,
      fetchedAt: Date.now(),
    }
  }

  private async getGameArchives(username: string): Promise<ApiResponse<{ archives: string[] }>> {
    return this.http.get<{ archives: string[] }>(`/player/${username}/games/archives`)
  }
}
