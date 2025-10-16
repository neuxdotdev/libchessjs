import { Logger } from '../../utils/logger/logger.js'
import { ChessComHttpClient } from '../client.js'
import {
  ApiError,
  MatchStatus,
  PaginatedResponse,
  PaginationParams,
  TimeControl,
} from '../types/src/common.js'
import {
  APIResponse,
  ClubTeamMatches,
  DailyTeamMatch,
  DailyTeamMatchBoard,
  LiveTeamMatch,
  LiveTeamMatchBoard,
  PlayerTeamMatches,
  TeamMatchFilters,
  TeamMatchSearchParams,
  TeamMatchStats,
} from '../types/src/team-matches.js'
import { validate } from './../../utils/core/validator.js'

export class TeamMatchesEndpoints {
  private logger: Logger
  private readonly BASE_PATH = '/match'

  constructor(private http: ChessComHttpClient) {
    this.logger = new Logger()
  }

  async getDailyTeamMatch(id: string | number): Promise<APIResponse<DailyTeamMatch>> {
    this.logger.info(`Fetching daily team match: ${id}`)
    try {
      const matchId = this.validateMatchId(id)
      const url = `${this.BASE_PATH}/${matchId}`
      const response = await this.http.get<DailyTeamMatch>(url)
      this.logger.debug(`Successfully fetched daily team match: ${matchId}`)
      return {
        success: true,
        data: response.data,
        headers: response.headers,
        status: response.status,
      }
    } catch (error) {
      this.logger.error(`Failed to fetch daily team match ${id}:`, error)
      return this.handleError(error)
    }
  }

  async getDailyTeamMatchBoard(
    id: string | number,
    board: string | number
  ): Promise<APIResponse<DailyTeamMatchBoard>> {
    this.logger.info(`Fetching daily team match board: ${id}/${board}`)
    try {
      const matchId = this.validateMatchId(id)
      const boardNumber = this.validateBoardNumber(board)
      const url = `${this.BASE_PATH}/${matchId}/${boardNumber}`
      const response = await this.http.get<DailyTeamMatchBoard>(url)
      this.logger.debug(`Successfully fetched daily team match board: ${matchId}/${boardNumber}`)
      return {
        success: true,
        data: response.data,
        headers: response.headers,
        status: response.status,
      }
    } catch (error) {
      this.logger.error(`Failed to fetch daily team match board ${id}/${board}:`, error)
      return this.handleError(error)
    }
  }

  async getLiveTeamMatch(id: string | number): Promise<APIResponse<LiveTeamMatch>> {
    this.logger.info(`Fetching live team match: ${id}`)
    try {
      const matchId = this.validateMatchId(id)
      const url = `${this.BASE_PATH}/live/${matchId}`
      const response = await this.http.get<LiveTeamMatch>(url)
      this.logger.debug(`Successfully fetched live team match: ${matchId}`)
      return {
        success: true,
        data: response.data,
        headers: response.headers,
        status: response.status,
      }
    } catch (error) {
      this.logger.error(`Failed to fetch live team match ${id}:`, error)
      return this.handleError(error)
    }
  }

  async getLiveTeamMatchBoard(
    id: string | number,
    board: string | number
  ): Promise<APIResponse<LiveTeamMatchBoard>> {
    this.logger.info(`Fetching live team match board: ${id}/${board}`)
    try {
      const matchId = this.validateMatchId(id)
      const boardNumber = this.validateBoardNumber(board)
      const url = `${this.BASE_PATH}/live/${matchId}/${boardNumber}`
      const response = await this.http.get<LiveTeamMatchBoard>(url)
      this.logger.debug(`Successfully fetched live team match board: ${matchId}/${boardNumber}`)
      return {
        success: true,
        data: response.data,
        headers: response.headers,
        status: response.status,
      }
    } catch (error) {
      this.logger.error(`Failed to fetch live team match board ${id}/${board}:`, error)
      return this.handleError(error)
    }
  }

  async getPlayerTeamMatches(username: string): Promise<APIResponse<PlayerTeamMatches>> {
    this.logger.info(`Fetching team matches for player: ${username}`)
    try {
      const validatedUsername = validate.usernameString(username)
      const url = `/player/${validatedUsername}/matches`
      const response = await this.http.get<PlayerTeamMatches>(url)
      this.logger.debug(`Successfully fetched team matches for player: ${validatedUsername}`)
      return {
        success: true,
        data: response.data,
        headers: response.headers,
        status: response.status,
      }
    } catch (error) {
      this.logger.error(`Failed to fetch team matches for player ${username}:`, error)
      return this.handleError(error)
    }
  }

  async getClubTeamMatches(clubId: string): Promise<APIResponse<ClubTeamMatches>> {
    this.logger.info(`Fetching team matches for club: ${clubId}`)
    try {
      const validatedClubId = validate.clubIdString(clubId)
      const url = `/club/${validatedClubId}/matches`
      const response = await this.http.get<ClubTeamMatches>(url)
      this.logger.debug(`Successfully fetched team matches for club: ${validatedClubId}`)
      return {
        success: true,
        data: response.data,
        headers: response.headers,
        status: response.status,
      }
    } catch (error) {
      this.logger.error(`Failed to fetch team matches for club ${clubId}:`, error)
      return this.handleError(error)
    }
  }

  async searchTeamMatches(
    params: TeamMatchSearchParams
  ): Promise<APIResponse<PaginatedResponse<DailyTeamMatch | LiveTeamMatch>>> {
    this.logger.info('Searching team matches with filters', params)
    try {
      this.validateSearchParams(params)
      const allMatches = await this.getAllTeamMatches()
      let filteredMatches = allMatches.data || []
      if (params.filters) {
        filteredMatches = this.applyFilters(filteredMatches, params.filters)
      }
      if (params.query) {
        filteredMatches = this.applySearch(filteredMatches, params.query)
      }
      if (params.sort_by) {
        filteredMatches = this.applySorting(filteredMatches, params.sort_by, params.sort_order)
      }
      const paginatedResults = this.applyPagination(filteredMatches, params)
      this.logger.debug(
        `Found ${paginatedResults.data.length} matches out of ${filteredMatches.length} total`
      )
      return {
        success: true,
        data: paginatedResults,
        headers: allMatches.headers,
        status: allMatches.status,
      }
    } catch (error) {
      this.logger.error('Failed to search team matches:', error)
      return this.handleError(error)
    }
  }

  async getPlayerTeamMatchStats(username: string): Promise<APIResponse<TeamMatchStats>> {
    this.logger.info(`Fetching team match stats for player: ${username}`)
    try {
      const validatedUsername = validate.usernameString(username)
      const matchesResponse = await this.getPlayerTeamMatches(validatedUsername)
      if (!matchesResponse.success || !matchesResponse.data) {
        throw new Error('Failed to fetch player matches for statistics')
      }
      const stats = this.calculatePlayerStats(matchesResponse.data)
      this.logger.debug(`Calculated team match stats for player: ${validatedUsername}`)
      return {
        success: true,
        data: stats,
        headers: matchesResponse.headers,
        status: matchesResponse.status,
      }
    } catch (error) {
      this.logger.error(`Failed to fetch team match stats for player ${username}:`, error)
      return this.handleError(error)
    }
  }

  async getOngoingTeamMatches(
    limit?: number
  ): Promise<APIResponse<Array<DailyTeamMatch | LiveTeamMatch>>> {
    this.logger.info('Fetching ongoing team matches')
    try {
      const allMatches = await this.getAllTeamMatches()
      const ongoingMatches = (allMatches.data || [])
        .filter(match => match.status === MatchStatus.IN_PROGRESS)
        .slice(0, limit)
      this.logger.debug(`Found ${ongoingMatches.length} ongoing team matches`)
      return {
        success: true,
        data: ongoingMatches,
        headers: allMatches.headers,
        status: allMatches.status,
      }
    } catch (error) {
      this.logger.error('Failed to fetch ongoing team matches:', error)
      return this.handleError(error)
    }
  }

  async getTeamMatchesByTimeControl(
    timeControl: TimeControl,
    status?: MatchStatus
  ): Promise<APIResponse<Array<DailyTeamMatch | LiveTeamMatch>>> {
    this.logger.info(`Fetching team matches by time control: ${timeControl}`)
    try {
      const allMatches = await this.getAllTeamMatches()
      let filteredMatches = (allMatches.data || []).filter(
        match => match.time_class === timeControl
      )
      if (status) {
        filteredMatches = filteredMatches.filter(match => match.status === status)
      }
      this.logger.debug(`Found ${filteredMatches.length} ${timeControl} team matches`)
      return {
        success: true,
        data: filteredMatches,
        headers: allMatches.headers,
        status: allMatches.status,
      }
    } catch (error) {
      this.logger.error(`Failed to fetch ${timeControl} team matches:`, error)
      return this.handleError(error)
    }
  }

  private async getAllTeamMatches(): Promise<APIResponse<Array<DailyTeamMatch | LiveTeamMatch>>> {
    this.logger.debug('Fetching all available team matches')
    return {
      success: true,
      data: [],
      headers: {},
      status: 200,
    }
  }

  private validateMatchId(id: string | number): string {
    const validation = validate.matchId(id)
    if (!validation.isValid) {
      throw new Error(`Invalid match ID: ${validation.errors.join(', ')}`)
    }
    return id.toString()
  }

  private validateBoardNumber(board: string | number): string {
    const validation = validate.board(board)
    if (!validation.isValid) {
      throw new Error(`Invalid board number: ${validation.errors.join(', ')}`)
    }
    return board.toString()
  }

  private validateSearchParams(params: TeamMatchSearchParams): void {
    if (params.page && params.page < 1) {
      throw new Error('Page must be a positive integer')
    }
    if (params.limit && (params.limit < 1 || params.limit > 100)) {
      throw new Error('Limit must be between 1 and 100')
    }
    if (params.filters?.min_rating && params.filters.min_rating < 0) {
      throw new Error('Minimum rating must be non-negative')
    }
    if (params.filters?.max_rating && params.filters.max_rating < 0) {
      throw new Error('Maximum rating must be non-negative')
    }
    if (params.filters?.date_from && params.filters.date_to) {
      if (params.filters.date_from > params.filters.date_to) {
        throw new Error('Date range is invalid: date_from must be before date_to')
      }
    }
  }

  private applyFilters(
    matches: Array<DailyTeamMatch | LiveTeamMatch>,
    filters: TeamMatchFilters
  ): Array<DailyTeamMatch | LiveTeamMatch> {
    return matches.filter(match => {
      if (filters.status && match.status !== filters.status) return false
      if (filters.time_class && match.time_class !== filters.time_class) return false
      if (filters.rated !== undefined && match.settings.rated !== filters.rated) return false
      if (filters.min_players && match.boards < filters.min_players) return false
      if (filters.max_players && match.boards > filters.max_players) return false
      if (filters.date_from && match.start_time < filters.date_from) return false
      if (filters.date_to && match.start_time > filters.date_to) return false
      return true
    })
  }

  private applySearch(
    matches: Array<DailyTeamMatch | LiveTeamMatch>,
    query: string
  ): Array<DailyTeamMatch | LiveTeamMatch> {
    const searchTerm = query.toLowerCase()
    return matches.filter(
      match =>
        match.name.toLowerCase().includes(searchTerm) ||
        match.description?.toLowerCase().includes(searchTerm) ||
        Object.values(match.teams).some(team => team.name.toLowerCase().includes(searchTerm))
    )
  }

  private applySorting(
    matches: Array<DailyTeamMatch | LiveTeamMatch>,
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Array<DailyTeamMatch | LiveTeamMatch> {
    return matches.sort((a, b) => {
      let aValue: any, bValue: any
      switch (sortBy) {
        case 'start_time':
          aValue = a.start_time
          bValue = b.start_time
          break
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'players':
          aValue = a.boards
          bValue = b.boards
          break
        default:
          aValue = a.start_time
          bValue = b.start_time
      }
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  private applyPagination(
    matches: Array<DailyTeamMatch | LiveTeamMatch>,
    params: PaginationParams
  ): PaginatedResponse<DailyTeamMatch | LiveTeamMatch> {
    const page = params.page || 1
    const limit = params.limit || 20
    const offset = (page - 1) * limit
    const paginatedData = matches.slice(offset, offset + limit)
    const total = matches.length
    const pages = Math.ceil(total / limit)
    return {
      data: paginatedData,
      pagination: {
        total,
        page,
        pages,
        limit,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    }
  }

  private calculatePlayerStats(matches: PlayerTeamMatches): TeamMatchStats {
    const finishedMatches = matches.finished
    const totalMatches = finishedMatches.length
    const stats: TeamMatchStats = {
      total_matches: totalMatches,
      matches_won: finishedMatches.filter(m => m.result === 'win').length,
      matches_lost: finishedMatches.filter(m => m.result === 'loss').length,
      matches_drawn: finishedMatches.filter(m => m.result === 'draw').length,
      total_games: 0,
      games_won: 0,
      games_lost: 0,
      games_drawn: 0,
      performance_by_time_control: {},
    }
    return stats
  }

  private handleError(error: any): APIResponse<any> {
    const apiError: ApiError = {
      name: 'TeamMatchError',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 0,
      status: 500,
      timestamp: Date.now(),
    }
    if (error instanceof Error && 'code' in error) {
      apiError.code = (error as any).code
    }
    if (error instanceof Error && 'status' in error) {
      apiError.status = (error as any).status
    }
    return {
      success: false,
      error: apiError,
    }
  }
}

export default TeamMatchesEndpoints
