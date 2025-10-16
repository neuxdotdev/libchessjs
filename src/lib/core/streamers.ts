import { Logger } from '../../utils/logger/logger.js'
import { ChessComHttpClient } from '../client.js'
import { ApiResponse, PlayerProfile } from '../types/src/common.js'
import {
  Streamer,
  StreamerFilters,
  StreamerProfile,
  StreamerSearchResult,
  StreamersResponse,
  StreamerStats,
  StreamerWithStats,
} from '../types/src/streamer.js'
import { validate } from './../../utils/core/validator.js'
export class StreamersEndpoints {
  private logger: Logger
  private readonly PLATFORMS = ['twitch', 'youtube', 'all'] as const
  constructor(private http: ChessComHttpClient) {
    this.logger = new Logger()
  }
  async getStreamers(): Promise<ApiResponse<StreamersResponse>> {
    this.logger.info('Fetching all streamers')
    try {
      const response = await this.http.get<StreamersResponse>('/streamers')
      this.logger.debug(`Successfully fetched ${response.data.streamers.length} streamers`)
      return response
    } catch (error) {
      this.logger.error('Failed to fetch streamers:', error)
      throw new Error(
        `Failed to fetch streamers: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
  async getStreamerByUsername(username: string): Promise<Streamer | null> {
    this.logger.info(`Fetching streamer by username: ${username}`)
    const validatedUsername = validate.usernameString(username)
    try {
      const response = await this.getStreamers()
      const streamer = response.data.streamers.find(
        (s: Streamer) => s.username.toLowerCase() === validatedUsername.toLowerCase()
      )
      if (!streamer) {
        this.logger.warn(`Streamer not found: ${validatedUsername}`)
        return null
      }
      this.logger.debug(`Found streamer: ${validatedUsername}`)
      return streamer
    } catch (error) {
      this.logger.error(`Failed to fetch streamer ${validatedUsername}:`, error)
      throw new Error(
        `Failed to fetch streamer ${validatedUsername}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }
  async getStreamersByPlatform(
    platform: 'twitch' | 'youtube' | 'all' = 'all'
  ): Promise<Streamer[]> {
    this.logger.info(`Fetching streamers by platform: ${platform}`)
    if (!this.PLATFORMS.includes(platform)) {
      throw new Error(`Platform must be one of: ${this.PLATFORMS.join(', ')}`)
    }
    try {
      const response = await this.getStreamers()
      if (platform === 'all') {
        return response.data.streamers
      }
      const platformStreamers = response.data.streamers.filter((streamer: Streamer) => {
        if (platform === 'twitch') {
          return streamer.twitch_url?.includes('twitch.tv') || false
        } else {
          return streamer.twitch_url?.includes('youtube.com') || false
        }
      })
      this.logger.debug(`Found ${platformStreamers.length} ${platform} streamers`)
      return platformStreamers
    } catch (error) {
      this.logger.error(`Failed to fetch ${platform} streamers:`, error)
      throw new Error(
        `Failed to fetch ${platform} streamers: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }
  async getStreamersWithFilters(filters: StreamerFilters): Promise<Streamer[]> {
    this.logger.info('Fetching streamers with filters', filters)
    if (filters.platform && !this.PLATFORMS.includes(filters.platform)) {
      throw new Error(`Platform filter must be one of: ${this.PLATFORMS.join(', ')}`)
    }
    if (
      filters.minFollowers &&
      (!Number.isInteger(filters.minFollowers) || filters.minFollowers < 0)
    ) {
      throw new Error('minFollowers must be a non-negative integer')
    }
    try {
      const response = await this.getStreamers()
      let streamers = response.data.streamers
      if (filters.platform && filters.platform !== 'all') {
        streamers = streamers.filter((streamer: Streamer) => {
          if (filters.platform === 'twitch') {
            return streamer.twitch_url?.includes('twitch.tv') || false
          } else {
            return streamer.twitch_url?.includes('youtube.com') || false
          }
        })
      }
      if (filters.minFollowers) {
        const streamersWithStats = await this.enrichStreamersWithFollowers(streamers)
        streamers = streamersWithStats
          .filter(item => (item.followers || 0) >= filters.minFollowers!)
          .map(item => item.streamer)
      }
      if (filters.isLive !== undefined) {
        this.logger.warn('Live status filtering is not currently supported')
      }
      this.logger.debug(`Found ${streamers.length} streamers matching filters`)
      return streamers
    } catch (error) {
      this.logger.error('Failed to fetch filtered streamers:', error)
      throw new Error(
        `Failed to fetch filtered streamers: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }
  async getStreamerStats(username: string): Promise<StreamerStats | null> {
    this.logger.info(`Fetching streamer stats for: ${username}`)
    const validatedUsername = validate.usernameString(username)
    const streamer = await this.getStreamerByUsername(validatedUsername)
    if (!streamer) {
      return null
    }
    try {
      const profileResponse = await this.http.get<PlayerProfile>(`/player/${validatedUsername}`)
      const profile = profileResponse.data
      const stats: StreamerStats = {
        streamer,
        profile: this.mapToStreamerProfile(profile),
        isLive: await this.checkStreamerLiveStatus(streamer),
        lastStream: await this.getLastStreamTime(streamer),
        followers: profile.followers,
        joined: profile.joined,
        lastOnline: profile.last_online,
      }
      this.logger.debug(`Successfully fetched stats for streamer: ${validatedUsername}`)
      return stats
    } catch (error) {
      this.logger.warn(`Could not fetch complete profile for streamer ${validatedUsername}`, error)
      const basicStats: StreamerStats = {
        streamer,
        isLive: false,
        lastStream: undefined,
        followers: undefined,
      }
      return basicStats
    }
  }
  async searchStreamers(
    searchTerm: string,
    filters?: StreamerFilters
  ): Promise<StreamerSearchResult> {
    this.logger.info(`Searching streamers: "${searchTerm}"`)
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
      throw new Error('Search term must be a non-empty string')
    }
    if (searchTerm.length < 2) {
      throw new Error('Search term must be at least 2 characters long')
    }
    try {
      const response = await this.getStreamers()
      const matchingStreamers = response.data.streamers.filter(
        (streamer: Streamer) =>
          streamer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          streamer.twitch_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          streamer.avatar?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      let resultStreamers = matchingStreamers
      if (filters) {
        resultStreamers = await this.getStreamersWithFilters({
          ...filters,
        })
      }
      const result: StreamerSearchResult = {
        streamers: resultStreamers,
        total: resultStreamers.length,
        filters: filters || { platform: 'all' },
        searchTerm,
      }
      this.logger.debug(`Found ${resultStreamers.length} streamers matching "${searchTerm}"`)
      return result
    } catch (error) {
      this.logger.error(`Failed to search streamers for "${searchTerm}":`, error)
      throw new Error(
        `Failed to search streamers for "${searchTerm}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }
  async getTopStreamers(limit: number = 10): Promise<Streamer[]> {
    this.logger.info(`Fetching top ${limit} streamers`)
    const limitValidation = validate.positiveInteger(limit, 'limit')
    if (!limitValidation.isValid) {
      throw new Error(`Invalid limit: ${limitValidation.errors.join(', ')}`)
    }
    try {
      const response = await this.getStreamers()
      const topStreamers = response.data.streamers.slice(0, limit)
      this.logger.debug(`Returning top ${topStreamers.length} streamers`)
      return topStreamers
    } catch (error) {
      this.logger.error(`Failed to fetch top ${limit} streamers:`, error)
      throw new Error(
        `Failed to fetch top ${limit} streamers: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }
  async getStreamersByPopularity(limit?: number): Promise<Streamer[]> {
    this.logger.info('Fetching streamers by popularity')
    if (limit) {
      const limitValidation = validate.positiveInteger(limit, 'limit')
      if (!limitValidation.isValid) {
        throw new Error(`Invalid limit: ${limitValidation.errors.join(', ')}`)
      }
    }
    try {
      const response = await this.getStreamers()
      const streamersWithStats = await this.enrichStreamersWithFollowers(response.data.streamers)
      const sortedStreamers = streamersWithStats
        .sort((a, b) => (b.followers || 0) - (a.followers || 0))
        .map(item => item.streamer)
      const result = limit ? sortedStreamers.slice(0, limit) : sortedStreamers
      this.logger.debug(`Sorted ${result.length} streamers by popularity`)
      return result
    } catch (error) {
      this.logger.error('Failed to fetch streamers by popularity:', error)
      throw new Error(
        `Failed to fetch streamers by popularity: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }
  async getStreamersByCountry(countryCode: string): Promise<Streamer[]> {
    this.logger.info(`Fetching streamers from country: ${countryCode}`)
    const countryValidation = validate.countryCode(countryCode)
    if (!countryValidation.isValid) {
      throw new Error(`Invalid country code: ${countryValidation.errors.join(', ')}`)
    }
    try {
      const response = await this.getStreamers()
      const streamersFromCountry: Streamer[] = []
      for (const streamer of response.data.streamers) {
        try {
          const profileResponse = await this.http.get<PlayerProfile>(`/player/${streamer.username}`)
          if (profileResponse.data.country?.toLowerCase().endsWith(countryCode.toLowerCase())) {
            streamersFromCountry.push(streamer)
          }
        } catch (error) {
          continue
        }
      }
      this.logger.debug(`Found ${streamersFromCountry.length} streamers from ${countryCode}`)
      return streamersFromCountry
    } catch (error) {
      this.logger.error(`Failed to fetch streamers from ${countryCode}:`, error)
      throw new Error(
        `Failed to fetch streamers from ${countryCode}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }
  private async enrichStreamersWithFollowers(streamers: Streamer[]): Promise<StreamerWithStats[]> {
    this.logger.debug(`Enriching ${streamers.length} streamers with follower data`)
    const enrichedStreamers = await Promise.all(
      streamers.map(async (streamer): Promise<StreamerWithStats> => {
        try {
          const profileResponse = await this.http.get<PlayerProfile>(`/player/${streamer.username}`)
          return {
            streamer,
            followers: profileResponse.data.followers,
            country: profileResponse.data.country,
            lastOnline: profileResponse.data.last_online,
          }
        } catch (error) {
          this.logger.debug(
            `Could not fetch profile for ${streamer.username}, using default values`
          )
          return {
            streamer,
            followers: 0,
            country: undefined,
            lastOnline: undefined,
          }
        }
      })
    )
    return enrichedStreamers
  }
  private mapToStreamerProfile(profile: PlayerProfile): StreamerProfile {
    return {
      username: profile.username,
      title: profile.title,
      status: profile.status,
      name: profile.name,
      followers: profile.followers,
      country: profile.country,
      joined: profile.joined,
      lastOnline: profile.last_online,
      isStreamer: true,
    }
  }
  private async checkStreamerLiveStatus(streamer: Streamer): Promise<boolean> {
    return false
  }
  private async getLastStreamTime(streamer: Streamer): Promise<number | undefined> {
    return undefined
  }
}
