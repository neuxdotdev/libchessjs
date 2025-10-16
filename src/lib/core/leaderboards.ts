import { validate } from '../../utils/core/validator.js'
import { Logger } from '../../utils/logger/logger.js'
import { ChessComHttpClient } from '../client.js'
import type { ApiResponse } from '../types/src/common.d.ts'
import type {
  CompleteLeaderboardData,
  LeaderboardFilters,
  LeaderboardPlayer,
  Leaderboards,
  LeaderboardStats,
} from '../types/src/leaderboard.d.ts'

export class LeaderboardsEndpoints {
  private logger: Logger

  constructor(private http: ChessComHttpClient) {
    this.logger = new Logger()
  }

  async getLeaderboards(): Promise<ApiResponse<Leaderboards>> {
    this.logger.info('Fetching all leaderboards')
    return this.http.get<Leaderboards>('/leaderboards')
  }

  async getLeaderboardByCategory(category: keyof Leaderboards): Promise<LeaderboardPlayer[]> {
    this.logger.info(`Fetching leaderboard for category: ${category}`)
    const validationResult = validate.leaderboardCategory(category as string)
    if (!validationResult.isValid) {
      throw new Error(`Invalid leaderboard category: ${validationResult.errors.join(', ')}`)
    }

    const response = await this.getLeaderboards()
    return response.data[category]?.players || []
  }

  async getDailyLeaderboard(): Promise<LeaderboardPlayer[]> {
    this.logger.info('Fetching daily leaderboard')
    return this.getLeaderboardByCategory('daily')
  }

  async getLiveRapidLeaderboard(): Promise<LeaderboardPlayer[]> {
    this.logger.info('Fetching live rapid leaderboard')
    return this.getLeaderboardByCategory('live_rapid')
  }

  async getLiveBlitzLeaderboard(): Promise<LeaderboardPlayer[]> {
    this.logger.info('Fetching live blitz leaderboard')
    return this.getLeaderboardByCategory('live_blitz')
  }

  async getLiveBulletLeaderboard(): Promise<LeaderboardPlayer[]> {
    this.logger.info('Fetching live bullet leaderboard')
    return this.getLeaderboardByCategory('live_bullet')
  }

  async getTacticsLeaderboard(): Promise<LeaderboardPlayer[]> {
    this.logger.info('Fetching tactics leaderboard')
    return this.getLeaderboardByCategory('tactics')
  }

  async getLessonsLeaderboard(): Promise<LeaderboardPlayer[]> {
    this.logger.info('Fetching lessons leaderboard')
    return this.getLeaderboardByCategory('lessons')
  }

  async getFilteredLeaderboards(
    filters: LeaderboardFilters
  ): Promise<Map<keyof Leaderboards, LeaderboardPlayer[]>> {
    this.logger.info('Fetching filtered leaderboards', filters)
    const response = await this.getLeaderboards()
    const results = new Map<keyof Leaderboards, LeaderboardPlayer[]>()

    const categories = filters.categories || (Object.keys(response.data) as (keyof Leaderboards)[])

    categories.forEach(category => {
      if (response.data[category]) {
        let players = response.data[category].players

        if (filters.minRank) players = players.filter(p => p.rank >= filters.minRank!)
        if (filters.maxRank) players = players.filter(p => p.rank <= filters.maxRank!)
        if (filters.minScore) players = players.filter(p => p.score >= filters.minScore!)
        if (filters.maxScore) players = players.filter(p => p.score <= filters.maxScore!)
        if (filters.limit) players = players.slice(0, filters.limit)

        results.set(category, players)
      }
    })

    this.logger.debug(`Filtered ${results.size} leaderboard categories`)
    return results
  }

  async getTopPlayers(
    limit: number = 10,
    category?: keyof Leaderboards
  ): Promise<LeaderboardPlayer[]> {
    this.logger.info(`Fetching top ${limit} players${category ? ` for ${category}` : ''}`)
    const validationResult = validate.positiveInteger(limit, 'limit')
    if (!validationResult.isValid) {
      throw new Error(`Invalid limit: ${validationResult.errors.join(', ')}`)
    }

    if (category) {
      const players = await this.getLeaderboardByCategory(category)
      return players.slice(0, limit)
    }

    const response = await this.getLeaderboards()
    const allPlayers: LeaderboardPlayer[] = []

    Object.values(response.data).forEach(cat => {
      allPlayers.push(...cat.players)
    })

    return allPlayers.sort((a, b) => a.rank - b.rank).slice(0, limit)
  }

  async getPlayerRankings(username: string): Promise<Map<keyof Leaderboards, number>> {
    this.logger.info(`Fetching player rankings for: ${username}`)
    const validatedUsername = validate.usernameString(username)
    const response = await this.getLeaderboards()
    const rankings = new Map<keyof Leaderboards, number>()

    Object.entries(response.data).forEach(([category, catData]) => {
      const player = catData.players.find(
        (p: LeaderboardPlayer) => p.username.toLowerCase() === validatedUsername.toLowerCase()
      )
      if (player) rankings.set(category as keyof Leaderboards, player.rank)
    })

    this.logger.debug(`Found ${rankings.size} rankings for player ${validatedUsername}`)
    return rankings
  }

  async getLeaderboardStats(
    category?: keyof Leaderboards
  ): Promise<Map<keyof Leaderboards, LeaderboardStats> | LeaderboardStats> {
    this.logger.info(`Fetching leaderboard stats${category ? ` for ${category}` : ''}`)
    const response = await this.getLeaderboards()

    const calc = (cat: keyof Leaderboards, players: LeaderboardPlayer[]): LeaderboardStats => {
      const scores = players.map(p => p.score)
      return {
        totalPlayers: players.length,
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        topScore: Math.max(...scores),
        lastUpdated: Date.now(),
        category: cat,
      }
    }

    if (category) {
      const players = response.data[category]?.players || []
      return calc(category, players)
    }

    const stats = new Map<keyof Leaderboards, LeaderboardStats>()
    Object.entries(response.data).forEach(([cat, catData]) =>
      stats.set(cat as keyof Leaderboards, calc(cat as keyof Leaderboards, catData.players))
    )
    return stats
  }

  async getCompleteLeaderboardData(): Promise<CompleteLeaderboardData> {
    this.logger.info('Fetching complete leaderboard data')
    const response = await this.getLeaderboards()
    const stats = (await this.getLeaderboardStats()) as Map<keyof Leaderboards, LeaderboardStats>
    return {
      leaderboards: response.data,
      stats,
      fetchedAt: Date.now(),
    }
  }

  async searchPlayersInLeaderboards(
    searchTerm: string
  ): Promise<Map<keyof Leaderboards, LeaderboardPlayer[]>> {
    this.logger.info(`Searching for players in leaderboards: ${searchTerm}`)
    const response = await this.getLeaderboards()
    const results = new Map<keyof Leaderboards, LeaderboardPlayer[]>()

    Object.entries(response.data).forEach(([category, catData]) => {
      const found = catData.players.filter((p: LeaderboardPlayer) =>
        p.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (found.length > 0) results.set(category as keyof Leaderboards, found)
    })

    this.logger.debug(`Found players in ${results.size} categories for search: ${searchTerm}`)
    return results
  }
}
