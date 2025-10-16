import { Logger } from '../../utils/logger/logger.js'
import { ChessComHttpClient } from '../client.js'
import { CurrentGame, Game, GameArchives, LiveGamesResponse, ToMoveGame } from '../types/src/game.js'
import { ApiResponse } from '../types/src/common.js'
import { validate } from './../../utils/core/validator.js'

export class GamesEndpoints {
  private logger: Logger

  constructor(private http: ChessComHttpClient) {
    this.logger = new Logger()
  }

  async getCurrentGames(username: string): Promise<ApiResponse<{ games: CurrentGame[] }>> {
    this.logger.info(`Fetching current games for: ${username}`)
    const validatedUsername = validate.username(username)
    return this.http.get<{ games: CurrentGame[] }>(`/player/${validatedUsername}/games`)
  }

  async getToMoveGames(username: string): Promise<ApiResponse<{ games: ToMoveGame[] }>> {
    this.logger.info(`Fetching to-move games for: ${username}`)
    const validatedUsername = validate.username(username)
    return this.http.get<{ games: ToMoveGame[] }>(`/player/${validatedUsername}/games/to-move`)
  }

  async getGameArchives(username: string): Promise<ApiResponse<GameArchives>> {
    this.logger.info(`Fetching game archives for: ${username}`)
    const validatedUsername = validate.username(username)
    return this.http.get<GameArchives>(`/player/${validatedUsername}/games/archives`)
  }

  async getMonthlyGames(
    username: string,
    year: number,
    month: number
  ): Promise<ApiResponse<{ games: Game[] }>> {
    this.logger.info(`Fetching games for ${username} - ${year}/${month}`)
    const validatedUsername = validate.username(username)
    validate.yearMonth(year, month)
    validate.yearMonth(year, month)
    const monthStr = month.toString().padStart(2, '0')
    return this.http.get<{ games: Game[] }>(
      `/player/${validatedUsername}/games/${year}/${monthStr}`
    )
  }

  async getLiveGames(
    username: string,
    baseTime: number,
    increment?: number
  ): Promise<ApiResponse<LiveGamesResponse>> {
    this.logger.info(
      `Fetching live games for ${username} - ${baseTime}s${increment ? `+${increment}s` : ''}`
    )
    const validatedUsername = validate.username(username)
    validate.timeControl(baseTime, increment)
    const endpoint = increment
      ? `/player/${validatedUsername}/games/live/${baseTime}/${increment}`
      : `/player/${validatedUsername}/games/live/${baseTime}`
    return this.http.get<LiveGamesResponse>(endpoint)
  }

  async getMonthlyPGN(username: string, year: number, month: number): Promise<string> {
    this.logger.info(`Fetching PGN for ${username} - ${year}/${month}`)
    const validatedUsername = validate.username(username)
    validate.yearMonth(year, month)
    validate.yearMonth(year, month)
    const monthStr = month.toString().padStart(2, '0')
    const url = `https://api.chess.com/pub/player/${validatedUsername}/games/${year}/${monthStr}/pgn`
    this.logger.debug(`PGN URL: ${url}`)
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch PGN: HTTP ${response.status}`)
      }
      const pgn = await response.text()
      this.logger.debug(`PGN fetched successfully (${pgn.length} characters)`)
      return pgn
    } catch (error) {
      this.logger.error(`Failed to fetch PGN:`, error)
      throw error
    }
  }

  async getAllGamesForPeriod(
    username: string,
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number
  ): Promise<Game[]> {
    this.logger.info(
      `Fetching all games for ${username} from ${startYear}/${startMonth} to ${endYear}/${endMonth}`
    )
    const archives = await this.getGameArchives(username)
    const allGames: Game[] = []
    this.logger.debug(`Found ${archives.data.archives.length} archive periods`)
    for (const archiveUrl of archives.data.archives) {
      const match = archiveUrl.match(/\/(\d{4})\/(\d{2})$/)
      if (!match) {
        this.logger.warn(`Skipping invalid archive URL: ${archiveUrl}`)
        continue
      }
      const year = parseInt(match[1])
      const month = parseInt(match[2])
      if (year < startYear || (year === startYear && month < startMonth)) continue
      if (year > endYear || (year === endYear && month > endMonth)) continue
      this.logger.debug(`Processing archive: ${year}/${month}`)
      try {
        const games = await this.getMonthlyGames(username, year, month)
        allGames.push(...games.data.games)
        this.logger.debug(`Added ${games.data.games.length} games from ${year}/${month}`)
      } catch (error) {
        this.logger.warn(`Failed to fetch games for ${year}/${month}:`, error)
      }
    }
    this.logger.info(`Successfully fetched ${allGames.length} total games`)
    return allGames
  }

  async getRecentGames(username: string, months = 3): Promise<Game[]> {
    this.logger.info(`Fetching recent games for ${username} (last ${months} months)`)
    const now = new Date()
    const endYear = now.getFullYear()
    const endMonth = now.getMonth() + 1
    const startDate = new Date(now.setMonth(now.getMonth() - months))
    const startYear = startDate.getFullYear()
    const startMonth = startDate.getMonth() + 1
    return this.getAllGamesForPeriod(username, startYear, startMonth, endYear, endMonth)
  }

  async getGamesWithFilters(
    username: string,
    filters: {
      timeControl?: string[]
      result?: string[]
      rated?: boolean
      since?: Date
      until?: Date
    } = {}
  ): Promise<Game[]> {
    this.logger.info(`Fetching filtered games for ${username}`, filters)
    const allGames = await this.getRecentGames(username, 12)
    return allGames.filter(game => {
      if (filters.timeControl && !filters.timeControl.includes(game.time_class)) {
        return false
      }
      if (filters.result) {
        const playerColor =
          game.white.username.toLowerCase() === username.toLowerCase() ? 'white' : 'black'
        const playerResult = playerColor === 'white' ? game.white.result : game.black.result
        if (!filters.result.includes(playerResult)) {
          return false
        }
      }
      if (filters.rated !== undefined && game.rated !== filters.rated) {
        return false
      }
      if (filters.since && game.end_time < filters.since.getTime() / 1000) {
        return false
      }
      if (filters.until && game.end_time > filters.until.getTime() / 1000) {
        return false
      }
      return true
    })
  }
}
