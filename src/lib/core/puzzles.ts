import { Logger } from '../../utils/logger/logger.js'
import { ChessComHttpClient } from '../client.js'
import { ApiResponse } from '../types/src/common.js'
import { DailyPuzzle, PuzzleStats, PuzzleTheme, RandomPuzzle } from '../types/src/puzzle.js'
import { validate } from './../../utils/core/validator.js'

export class PuzzlesEndpoints {
  private logger: Logger
  private readonly RATE_LIMIT_DELAY = 1000 // 1 second between requests
  private readonly MAX_RANDOM_PUZZLES = 50 // Maximum allowed random puzzles per request

  constructor(private http: ChessComHttpClient) {
    this.logger = new Logger()
  }

  async getDailyPuzzle(): Promise<ApiResponse<DailyPuzzle>> {
    this.logger.info('Fetching daily puzzle')
    try {
      const response = await this.http.get<DailyPuzzle>('/puzzle')
      this.logger.debug('Successfully fetched daily puzzle')
      return response
    } catch (error) {
      this.logger.error('Failed to fetch daily puzzle:', error)
      throw new Error(
        `Failed to fetch daily puzzle: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async getRandomPuzzle(): Promise<ApiResponse<RandomPuzzle>> {
    this.logger.info('Fetching random puzzle')
    try {
      const response = await this.http.get<RandomPuzzle>('/puzzle/random')
      this.logger.debug('Successfully fetched random puzzle')
      return response
    } catch (error) {
      this.logger.error('Failed to fetch random puzzle:', error)
      throw new Error(
        `Failed to fetch random puzzle: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async getPuzzleByDate(year: number, month: number, day: number): Promise<DailyPuzzle | null> {
    this.logger.info(`Fetching puzzle for date: ${year}-${month}-${day}`)

    // Validasi input tanggal
    const dateValidation = this.validateDate(year, month, day)
    if (!dateValidation.isValid) {
      this.logger.error('Invalid date parameters:', dateValidation.errors)
      throw new Error(`Invalid date: ${dateValidation.errors.join(', ')}`)
    }

    try {
      const date = new Date(year, month - 1, day)
      const timestamp = Math.floor(date.getTime() / 1000)
      const dailyPuzzleResponse = await this.getDailyPuzzle()
      const dailyPuzzle = dailyPuzzleResponse.data

      if (dailyPuzzle.publish_time === timestamp) {
        this.logger.info(`Found puzzle for date: ${year}-${month}-${day}`)
        return dailyPuzzle
      }

      this.logger.warn(`No puzzle found for date: ${year}-${month}-${day}`)
      return null
    } catch (error) {
      this.logger.error(`Failed to fetch puzzle for date ${year}-${month}-${day}:`, error)
      throw new Error(
        `Failed to fetch puzzle for date ${year}-${month}-${day}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  async getMultipleRandomPuzzles(count: number): Promise<RandomPuzzle[]> {
    this.logger.info(`Fetching ${count} random puzzles`)

    // Validasi count
    const countValidation = validate.positiveInteger(count, 'count')
    if (!countValidation.isValid) {
      throw new Error(`Invalid count: ${countValidation.errors.join(', ')}`)
    }

    if (count > this.MAX_RANDOM_PUZZLES) {
      throw new Error(`Count cannot exceed ${this.MAX_RANDOM_PUZZLES}`)
    }

    const puzzles: RandomPuzzle[] = []
    const failedRequests: number[] = []

    for (let i = 0; i < count; i++) {
      try {
        const puzzleResponse = await this.getRandomPuzzle()
        puzzles.push(puzzleResponse.data)
        this.logger.debug(`Fetched random puzzle ${i + 1}/${count}`)

        // Rate limiting untuk menghindari banned
        if (i < count - 1) {
          await this.delay(this.RATE_LIMIT_DELAY)
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch random puzzle ${i + 1}:`, error)
        failedRequests.push(i + 1)
      }
    }

    if (failedRequests.length > 0) {
      this.logger.warn(
        `Failed to fetch ${failedRequests.length} puzzles: positions ${failedRequests.join(', ')}`
      )
    }

    this.logger.info(`Successfully fetched ${puzzles.length} out of ${count} random puzzles`)

    if (puzzles.length === 0) {
      throw new Error('Failed to fetch any random puzzles')
    }

    return puzzles
  }

  async getPuzzleStats(): Promise<PuzzleStats> {
    this.logger.info('Fetching puzzle stats')

    try {
      const [dailyPuzzleResponse, randomPuzzles] = await Promise.all([
        this.getDailyPuzzle(),
        this.getMultipleRandomPuzzles(3),
      ])

      const stats: PuzzleStats = {
        dailyPuzzle: dailyPuzzleResponse.data,
        randomPuzzles,
        totalPuzzles: randomPuzzles.length + 1,
        fetchedAt: Date.now(),
        successRate: (randomPuzzles.length / 3) * 100, // 3 adalah jumlah yang diminta
      }

      this.logger.debug('Successfully fetched puzzle stats')
      return stats
    } catch (error) {
      this.logger.error('Failed to fetch puzzle stats:', error)
      throw new Error(
        `Failed to fetch puzzle stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async searchPuzzlesByTheme(theme: string, maxResults: number = 10): Promise<RandomPuzzle[]> {
    this.logger.info(`Searching puzzles by theme: "${theme}"`)

    // Validasi parameter
    if (!theme || typeof theme !== 'string' || theme.trim().length === 0) {
      throw new Error('Theme must be a non-empty string')
    }

    const maxResultsValidation = validate.positiveInteger(maxResults, 'maxResults')
    if (!maxResultsValidation.isValid) {
      throw new Error(`Invalid maxResults: ${maxResultsValidation.errors.join(', ')}`)
    }

    if (maxResults > 20) {
      this.logger.warn(`Max results limited to 20, requested: ${maxResults}`)
      maxResults = 20
    }

    try {
      const puzzles = await this.getMultipleRandomPuzzles(maxResults * 2) // Fetch more untuk meningkatkan chance menemukan match

      const filteredPuzzles = puzzles
        .filter(
          puzzle =>
            puzzle.title?.toLowerCase().includes(theme.toLowerCase()) ||
            puzzle.pgn?.toLowerCase().includes(theme.toLowerCase()) ||
            puzzle.tags?.some((tag: string) => tag.toLowerCase().includes(theme.toLowerCase()))
        )
        .slice(0, maxResults)

      this.logger.info(`Found ${filteredPuzzles.length} puzzles matching theme: "${theme}"`)
      return filteredPuzzles
    } catch (error) {
      this.logger.error(`Failed to search puzzles by theme "${theme}":`, error)
      throw new Error(
        `Failed to search puzzles by theme "${theme}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  async getPuzzlesByDifficulty(
    difficulty: 'easy' | 'medium' | 'hard',
    count: number = 5
  ): Promise<RandomPuzzle[]> {
    this.logger.info(`Fetching ${count} ${difficulty} puzzles`)

    // Validasi parameter
    const validDifficulties = ['easy', 'medium', 'hard']
    if (!validDifficulties.includes(difficulty)) {
      throw new Error(`Difficulty must be one of: ${validDifficulties.join(', ')}`)
    }

    const countValidation = validate.positiveInteger(count, 'count')
    if (!countValidation.isValid) {
      throw new Error(`Invalid count: ${countValidation.errors.join(', ')}`)
    }

    try {
      const allPuzzles = await this.getMultipleRandomPuzzles(count * 3) // Fetch more untuk filtering

      // Filter berdasarkan rating (asumsi: rating lebih tinggi = lebih sulit)
      const filteredPuzzles = allPuzzles
        .filter(puzzle => {
          const rating = puzzle.rating || 1500
          switch (difficulty) {
            case 'easy':
              return rating < 1400
            case 'medium':
              return rating >= 1400 && rating < 1800
            case 'hard':
              return rating >= 1800
            default:
              return false
          }
        })
        .slice(0, count)

      this.logger.info(`Found ${filteredPuzzles.length} ${difficulty} puzzles`)
      return filteredPuzzles
    } catch (error) {
      this.logger.error(`Failed to fetch ${difficulty} puzzles:`, error)
      throw new Error(
        `Failed to fetch ${difficulty} puzzles: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  async getPuzzleThemes(): Promise<PuzzleTheme[]> {
    this.logger.info('Fetching available puzzle themes')

    try {
      // Catatan: Endpoint ini mungkin tidak tersedia di API Chess.com resmi
      // Ini adalah contoh implementasi
      const puzzles = await this.getMultipleRandomPuzzles(10)

      const themes: PuzzleTheme[] = puzzles
        .flatMap(puzzle => puzzle.tags || [])
        .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
        .map(tag => ({
          name: tag,
          count: puzzles.filter(puzzle => puzzle.tags?.includes(tag)).length,
        }))
        .sort((a, b) => b.count - a.count)

      this.logger.debug(`Found ${themes.length} unique puzzle themes`)
      return themes
    } catch (error) {
      this.logger.error('Failed to fetch puzzle themes:', error)
      throw new Error(
        `Failed to fetch puzzle themes: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Helper methods
  private validateDate(
    year: number,
    month: number,
    day: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const currentDate = new Date()
    const inputDate = new Date(year, month - 1, day)

    if (!Number.isInteger(year) || year < 2000 || year > currentDate.getFullYear()) {
      errors.push(`Year must be an integer between 2000 and ${currentDate.getFullYear()}`)
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      errors.push('Month must be an integer between 1 and 12')
    }

    if (!Number.isInteger(day) || day < 1 || day > 31) {
      errors.push('Day must be an integer between 1 and 31')
    }

    if (inputDate > currentDate) {
      errors.push('Date cannot be in the future')
    }

    // Validasi tanggal spesifik (misal: 31 Februari)
    if (inputDate.getMonth() !== month - 1) {
      errors.push('Invalid date (e.g., February 30)')
    }

    return { isValid: errors.length === 0, errors }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
