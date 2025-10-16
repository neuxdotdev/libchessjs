import { Logger } from '../../utils/logger/logger.js'
import { ChessComHttpClient } from '../client.js'
import { ApiResponse } from '../types/src/common.js'
import {
  CompleteTournamentData,
  Tournament,
  TournamentFilters,
  TournamentGame,
  TournamentGroupPlayer,
  TournamentPlayer,
  TournamentRound,
  TournamentRoundGroup,
  TournamentSearchResult,
  TournamentStats,
  TournamentWinner,
} from '../types/src/tournament.js'
import { validate } from './../../utils/core/validator.js'
export class TournamentsEndpoints {
  private logger: Logger
  constructor(private http: ChessComHttpClient) {
    this.logger = new Logger()
  }
  async getTournament(tournamentId: string): Promise<ApiResponse<Tournament>> {
    this.logger.info(`Fetching tournament: ${tournamentId}`)
    try {
      const validatedId = this.validateTournamentIdString(tournamentId)
      const response = await this.http.get<Tournament>(`/tournament/${validatedId}`)
      this.logger.debug(`Successfully fetched tournament: ${tournamentId}`)
      return response
    } catch (error) {
      this.logger.error(`Failed to fetch tournament ${tournamentId}:`, error)
      throw error
    }
  }
  async getTournamentRound(
    tournamentId: string,
    round: number
  ): Promise<ApiResponse<TournamentRound>> {
    this.logger.info(`Fetching tournament round: ${tournamentId}/${round}`)
    try {
      const validatedId = this.validateTournamentIdString(tournamentId)
      const roundValidation = validate.positiveInteger(round, 'round')
      if (!roundValidation.isValid) {
        throw new Error(`Invalid round: ${roundValidation.errors.join(', ')}`)
      }
      const response = await this.http.get<TournamentRound>(`/tournament/${validatedId}/${round}`)
      this.logger.debug(`Successfully fetched tournament round: ${tournamentId}/${round}`)
      return response
    } catch (error) {
      this.logger.error(`Failed to fetch tournament round ${tournamentId}/${round}:`, error)
      throw error
    }
  }
  async getTournamentRoundGroup(
    tournamentId: string,
    round: number,
    group: number
  ): Promise<ApiResponse<TournamentRoundGroup>> {
    this.logger.info(`Fetching tournament round group: ${tournamentId}/${round}/${group}`)
    try {
      const validatedId = this.validateTournamentIdString(tournamentId)
      const roundValidation = validate.positiveInteger(round, 'round')
      if (!roundValidation.isValid) {
        throw new Error(`Invalid round: ${roundValidation.errors.join(', ')}`)
      }
      const groupValidation = validate.positiveInteger(group, 'group')
      if (!groupValidation.isValid) {
        throw new Error(`Invalid group: ${groupValidation.errors.join(', ')}`)
      }
      const response = await this.http.get<TournamentRoundGroup>(
        `/tournament/${validatedId}/${round}/${group}`
      )
      this.logger.debug(
        `Successfully fetched tournament round group: ${tournamentId}/${round}/${group}`
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to fetch tournament round group ${tournamentId}/${round}/${group}:`,
        error
      )
      throw error
    }
  }
  async getTournamentPlayers(tournamentId: string): Promise<TournamentPlayer[]> {
    this.logger.info(`Fetching tournament players: ${tournamentId}`)
    try {
      const tournament = await this.getTournament(tournamentId)
      return tournament.data.players
    } catch (error) {
      this.logger.error(`Failed to fetch tournament players ${tournamentId}:`, error)
      throw error
    }
  }
  async getTournamentRounds(tournamentId: string): Promise<Map<number, TournamentRound>> {
    this.logger.info(`Fetching all tournament rounds: ${tournamentId}`)
    try {
      const tournament = await this.getTournament(tournamentId)
      const rounds = new Map<number, TournamentRound>()
      const totalRounds = tournament.data.settings.total_rounds
      if (!totalRounds || totalRounds < 1) {
        this.logger.warn(`Tournament ${tournamentId} has no rounds or invalid total_rounds`)
        return rounds
      }
      const roundPromises = Array.from({ length: totalRounds }, async (_, roundNumber) => {
        const roundNum = roundNumber + 1
        try {
          const round = await this.getTournamentRound(tournamentId, roundNum)
          return { roundNum, round: round.data }
        } catch (error) {
          this.logger.warn(
            `Failed to fetch round ${roundNum} for tournament ${tournamentId}:`,
            error
          )
          return null
        }
      })
      const roundResults = await Promise.all(roundPromises)
      roundResults.forEach(result => {
        if (result) {
          rounds.set(result.roundNum, result.round)
        }
      })
      this.logger.debug(
        `Fetched ${rounds.size} out of ${totalRounds} rounds for tournament ${tournamentId}`
      )
      return rounds
    } catch (error) {
      this.logger.error(`Failed to fetch tournament rounds ${tournamentId}:`, error)
      throw error
    }
  }
  async getTournamentGroups(
    tournamentId: string,
    round: number
  ): Promise<Map<number, TournamentRoundGroup>> {
    this.logger.info(`Fetching tournament groups for round ${round}: ${tournamentId}`)
    try {
      const roundData = await this.getTournamentRound(tournamentId, round)
      const groups = new Map<number, TournamentRoundGroup>()
      if (!roundData.data.groups || roundData.data.groups.length === 0) {
        this.logger.warn(`No groups found for round ${round} in tournament ${tournamentId}`)
        return groups
      }
      const groupPromises = Array.from(
        { length: roundData.data.groups.length },
        async (_, groupIndex) => {
          const groupNum = groupIndex + 1
          try {
            const group = await this.getTournamentRoundGroup(tournamentId, round, groupNum)
            return { groupNum, group: group.data }
          } catch (error) {
            this.logger.warn(
              `Failed to fetch group ${groupNum} for round ${round} in tournament ${tournamentId}:`,
              error
            )
            return null
          }
        }
      )
      const groupResults = await Promise.all(groupPromises)
      groupResults.forEach(result => {
        if (result) {
          groups.set(result.groupNum, result.group)
        }
      })
      this.logger.debug(
        `Fetched ${groups.size} out of ${roundData.data.groups.length} groups for round ${round}`
      )
      return groups
    } catch (error) {
      this.logger.error(
        `Failed to fetch tournament groups for round ${round} in ${tournamentId}:`,
        error
      )
      throw error
    }
  }
  async getTournamentStats(tournamentId: string): Promise<TournamentStats> {
    this.logger.info(`Fetching tournament stats: ${tournamentId}`)
    try {
      const [tournament, rounds] = await Promise.all([
        this.getTournament(tournamentId),
        this.getTournamentRounds(tournamentId),
      ])
      let totalGames = 0
      let ongoingGames = 0
      let completedGames = 0
      let totalRating = 0
      let ratedPlayers = 0
      for (const [roundNumber, round] of rounds) {
        const groups = await this.getTournamentGroups(tournamentId, roundNumber)
        for (const [groupNumber, group] of groups) {
          totalGames += group.games.length
          const ongoingInGroup = group.games.filter(game => {
            return !game.pgn || !game.pgn.includes('Result') || game.pgn.includes('*')
          }).length
          ongoingGames += ongoingInGroup
          completedGames += group.games.length - ongoingInGroup
          for (const player of group.players) {
            if (player.performance_rating) {
              totalRating += player.performance_rating
              ratedPlayers++
            }
          }
        }
      }
      const activePlayers = tournament.data.players.filter(
        player => player.status === 'active'
      ).length
      const topPlayers = tournament.data.players.slice(0, 10)
      const stats: TournamentStats = {
        total_players: tournament.data.players.length,
        active_players: activePlayers,
        completed_games: completedGames,
        ongoing_games: ongoingGames,
        total_games: totalGames,
        top_players: topPlayers,
        start_time: tournament.data.start_time,
        finish_time: tournament.data.finish_time,
        average_rating: ratedPlayers > 0 ? Math.round(totalRating / ratedPlayers) : undefined,
      }
      return stats
    } catch (error) {
      this.logger.error(`Failed to fetch tournament stats ${tournamentId}:`, error)
      throw error
    }
  }
  async getCompleteTournamentData(tournamentId: string): Promise<CompleteTournamentData> {
    this.logger.info(`Fetching complete tournament data: ${tournamentId}`)
    try {
      const [tournament, rounds, stats] = await Promise.all([
        this.getTournament(tournamentId),
        this.getTournamentRounds(tournamentId),
        this.getTournamentStats(tournamentId),
      ])
      const groups = new Map<string, TournamentRoundGroup>()
      for (const [roundNumber, round] of rounds) {
        const roundGroups = await this.getTournamentGroups(tournamentId, roundNumber)
        for (const [groupNumber, group] of roundGroups) {
          groups.set(`${roundNumber}-${groupNumber}`, group)
        }
      }
      return {
        tournament: tournament.data,
        rounds,
        groups,
        stats,
        fetchedAt: Date.now(),
      }
    } catch (error) {
      this.logger.error(`Failed to fetch complete tournament data ${tournamentId}:`, error)
      throw error
    }
  }
  async getTournamentGames(tournamentId: string): Promise<TournamentGame[]> {
    this.logger.info(`Fetching all tournament games: ${tournamentId}`)
    try {
      const rounds = await this.getTournamentRounds(tournamentId)
      const allGames: TournamentGame[] = []
      for (const [roundNumber, round] of rounds) {
        const groups = await this.getTournamentGroups(tournamentId, roundNumber)
        for (const [groupNumber, group] of groups) {
          allGames.push(...group.games)
        }
      }
      this.logger.debug(`Found ${allGames.length} total games in tournament ${tournamentId}`)
      return allGames
    } catch (error) {
      this.logger.error(`Failed to fetch tournament games ${tournamentId}:`, error)
      throw error
    }
  }
  async getTournamentPlayerGames(
    tournamentId: string,
    username: string
  ): Promise<TournamentGame[]> {
    this.logger.info(`Fetching tournament games for player ${username}: ${tournamentId}`)
    try {
      const validatedUsername = validate.usernameString(username)
      const allGames = await this.getTournamentGames(tournamentId)
      const playerGames = allGames.filter(
        game =>
          game.white.toLowerCase() === validatedUsername.toLowerCase() ||
          game.black.toLowerCase() === validatedUsername.toLowerCase()
      )
      this.logger.debug(
        `Found ${playerGames.length} games for player ${validatedUsername} in tournament ${tournamentId}`
      )
      return playerGames
    } catch (error) {
      this.logger.error(
        `Failed to fetch tournament player games for ${username} in ${tournamentId}:`,
        error
      )
      throw error
    }
  }
  async getTournamentStandings(
    tournamentId: string,
    round?: number
  ): Promise<TournamentGroupPlayer[]> {
    this.logger.info(
      `Fetching tournament standings${round ? ` for round ${round}` : ''}: ${tournamentId}`
    )
    try {
      if (round) {
        const roundValidation = validate.positiveInteger(round, 'round')
        if (!roundValidation.isValid) {
          throw new Error(`Invalid round: ${roundValidation.errors.join(', ')}`)
        }
        const groups = await this.getTournamentGroups(tournamentId, round)
        const standings: TournamentGroupPlayer[] = []
        for (const [groupNumber, group] of groups) {
          standings.push(...group.players)
        }
        return standings.sort((a, b) => b.points - a.points || b.tie_break - a.tie_break)
      } else {
        const tournament = await this.getTournament(tournamentId)
        const lastRound = tournament.data.settings.total_rounds
        return this.getTournamentStandings(tournamentId, lastRound)
      }
    } catch (error) {
      this.logger.error(`Failed to fetch tournament standings for ${tournamentId}:`, error)
      throw error
    }
  }
  async searchTournaments(filters: TournamentFilters): Promise<TournamentSearchResult> {
    this.logger.info('Searching tournaments with filters', filters)
    try {
      return {
        tournaments: [],
        total: 0,
        page: 1,
        limit: 50,
        filters,
      }
    } catch (error) {
      this.logger.error('Failed to search tournaments:', error)
      throw error
    }
  }
  async getMultipleTournaments(tournamentIds: string[]): Promise<Map<string, Tournament>> {
    this.logger.info(`Fetching ${tournamentIds.length} tournaments`)
    try {
      const results = new Map<string, Tournament>()
      const uniqueIds = [...new Set(tournamentIds)]
      const promises = uniqueIds.map(async tournamentId => {
        try {
          const validatedId = this.validateTournamentIdString(tournamentId)
          const response = await this.getTournament(validatedId)
          results.set(tournamentId, response.data)
          this.logger.debug(`Fetched tournament: ${tournamentId}`)
        } catch (error) {
          this.logger.warn(`Failed to fetch tournament: ${tournamentId}`, error)
        }
      })
      await Promise.all(promises)
      this.logger.info(
        `Successfully fetched ${results.size} out of ${uniqueIds.length} tournaments`
      )
      return results
    } catch (error) {
      this.logger.error(`Failed to fetch multiple tournaments:`, error)
      throw error
    }
  }
  async getTournamentWinners(tournamentId: string): Promise<TournamentWinner[]> {
    this.logger.info(`Fetching tournament winners: ${tournamentId}`)
    try {
      const standings = await this.getTournamentStandings(tournamentId)
      const tournament = await this.getTournament(tournamentId)
      const winnerPlaces = tournament.data.settings.winner_places || 1
      return standings.slice(0, winnerPlaces).map((player, index) => ({
        username: player.username,
        place: index + 1,
        points: player.points,
        tie_break: player.tie_break,
      }))
    } catch (error) {
      this.logger.error(`Failed to fetch tournament winners ${tournamentId}:`, error)
      throw error
    }
  }
  async getTournamentsByPlayer(username: string): Promise<Tournament[]> {
    this.logger.info(`Fetching tournaments for player: ${username}`)
    try {
      const validatedUsername = validate.usernameString(username)
      return []
    } catch (error) {
      this.logger.error(`Failed to fetch tournaments for player ${username}:`, error)
      throw error
    }
  }
  private validateTournamentIdString(tournamentId: string): string {
    const result = validate.tournamentId(tournamentId)
    if (!result.isValid) {
      throw new Error(`Invalid tournament ID: ${result.errors.join(', ')}`)
    }
    return tournamentId
  }
}
