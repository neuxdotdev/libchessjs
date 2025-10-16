import { logger } from './../logger/logger.js'
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}
export class ChessValidator {
  static validateUsername(username: string): ValidationResult {
    const errors: string[] = []
    if (typeof username !== 'string') errors.push('Username must be a string')
    if (username.length < 3) errors.push('Username must be at least 3 characters long')
    if (username.length > 25) errors.push('Username must be at most 25 characters long')
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      errors.push('Username can only contain letters, numbers, and underscores')
    return { isValid: errors.length === 0, errors }
  }
  static validateCountryCode(code: string): ValidationResult {
    const errors: string[] = []
    if (typeof code !== 'string') errors.push('Country code must be a string')
    if (code.length !== 2) errors.push('Country code must be exactly 2 characters long')
    if (!/^[A-Z]{2}$/.test(code)) errors.push('Country code must be uppercase letters only')
    return { isValid: errors.length === 0, errors }
  }
  static validateClubId(clubId: string): ValidationResult {
    const errors: string[] = []
    if (typeof clubId !== 'string') errors.push('Club ID must be a string')
    if (clubId.length === 0) errors.push('Club ID cannot be empty')
    if (!/^[a-zA-Z0-9-]+$/.test(clubId))
      errors.push('Club ID can only contain letters, numbers, and hyphens')
    return { isValid: errors.length === 0, errors }
  }
  static validateTournamentId(tournamentId: string): ValidationResult {
    const errors: string[] = []
    if (typeof tournamentId !== 'string') errors.push('Tournament ID must be a string')
    if (tournamentId.length === 0) errors.push('Tournament ID cannot be empty')
    if (!/^[a-zA-Z0-9-_]+$/.test(tournamentId))
      errors.push('Tournament ID can only contain letters, numbers, hyphens, and underscores')
    return { isValid: errors.length === 0, errors }
  }
  static validateMatchId(matchId: string | number): ValidationResult {
    const errors: string[] = []
    if (typeof matchId === 'number') {
      if (matchId <= 0) errors.push('Match ID must be a positive number')
    } else if (typeof matchId === 'string') {
      if (!/^\d+$/.test(matchId)) errors.push('Match ID must be a numeric string')
      else if (parseInt(matchId, 10) <= 0) errors.push('Match ID must be a positive number')
    } else {
      errors.push('Match ID must be a number or numeric string')
    }
    return { isValid: errors.length === 0, errors }
  }
  static validateBoard(board: string | number): ValidationResult {
    const errors: string[] = []
    if (typeof board === 'number') {
      if (board <= 0) errors.push('Board number must be positive')
    } else if (typeof board === 'string') {
      if (!/^\d+$/.test(board)) errors.push('Board number must be a numeric string')
      else if (parseInt(board, 10) <= 0) errors.push('Board number must be positive')
    } else {
      errors.push('Board number must be a number or numeric string')
    }
    return { isValid: errors.length === 0, errors }
  }
  static validateYearMonth(year: number, month: number): ValidationResult {
    const errors: string[] = []
    const currentYear = new Date().getFullYear()
    if (typeof year !== 'number' || year < 2000 || year > currentYear)
      errors.push(`Year must be a number between 2000 and ${currentYear}`)
    if (typeof month !== 'number' || month < 1 || month > 12)
      errors.push('Month must be a number between 1 and 12')
    return { isValid: errors.length === 0, errors }
  }
  static validateTitleAbbrev(titleAbbrev: string): ValidationResult {
    const validTitles = ['GM', 'WGM', 'IM', 'WIM', 'FM', 'WFM', 'NM', 'WNM', 'CM', 'WCM']
    const errors: string[] = []
    if (!validTitles.includes(titleAbbrev))
      errors.push(`Title abbreviation must be one of: ${validTitles.join(', ')}`)
    return { isValid: errors.length === 0, errors }
  }
  static validatePGN(pgn: string): ValidationResult {
    const errors: string[] = []
    if (typeof pgn !== 'string') errors.push('PGN must be a string')
    if (pgn.length === 0) errors.push('PGN cannot be empty')
    if (!pgn.includes('[Event ') || !pgn.includes('[White ') || !pgn.includes('[Black '))
      errors.push('PGN must contain basic tags (Event, White, Black)')
    return { isValid: errors.length === 0, errors }
  }
  static validateFEN(fen: string): ValidationResult {
    const errors: string[] = []
    if (typeof fen !== 'string') errors.push('FEN must be a string')
    const parts = fen.split(' ')
    if (parts.length !== 6) errors.push('FEN must have 6 parts separated by spaces')
    const [piecePlacement, activeColor, castling, enPassant, halfmove, fullmove] = parts
    if (!['w', 'b'].includes(activeColor)) errors.push('Active color must be "w" or "b"')
    if (!/^\d+$/.test(halfmove)) errors.push('Halfmove clock must be a number')
    if (!/^\d+$/.test(fullmove)) errors.push('Fullmove number must be a number')
    return { isValid: errors.length === 0, errors }
  }
  static validateTimeControl(baseTime: number, increment?: number): ValidationResult {
    const errors: string[] = []
    if (typeof baseTime !== 'number' || baseTime <= 0) {
      errors.push('Base time must be a positive number')
    }
    if (increment !== undefined) {
      if (typeof increment !== 'number' || increment < 0) {
        errors.push('Increment must be a non-negative number')
      }
    }
    return { isValid: errors.length === 0, errors }
  }
  static validateParams(params: Record<string, any>): ValidationResult {
    const errors: string[] = []
    if (typeof params !== 'object' || params === null) errors.push('Parameters must be an object')
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'undefined' || value === null)
        errors.push(`Parameter "${key}" cannot be undefined or null`)
    }
    return { isValid: errors.length === 0, errors }
  }
  static validateLeaderboardCategory(category: string): ValidationResult {
    const validCategories = [
      'daily',
      'live_rapid',
      'live_blitz',
      'live_bullet',
      'tactics',
      'lessons',
    ]
    const errors: string[] = []
    if (!validCategories.includes(category)) {
      errors.push(`Category must be one of: ${validCategories.join(', ')}`)
    }
    return { isValid: errors.length === 0, errors }
  }
  static validatePositiveInteger(value: number, field?: string): ValidationResult {
    const errors: string[] = []
    if (typeof value !== 'number' || value <= 0 || !Number.isInteger(value)) {
      errors.push(
        field ? `${field} must be a positive integer` : 'Value must be a positive integer'
      )
    }
    return { isValid: errors.length === 0, errors }
  }
  static validateUsernameString(username: string): string {
    const result = this.validateUsername(username)
    if (!result.isValid) {
      const error = new Error(`Invalid username: ${result.errors.join(', ')}`)
      logger.error('Validation error', { username, errors: result.errors })
      throw error
    }
    return username
  }
}
export function validateClubIdString(clubId: string): string {
  const result = ChessValidator.validateClubId(clubId)
  if (!result.isValid) {
    const error = new Error(`Invalid club ID: ${result.errors.join(', ')}`)
    logger.error('Validation error', { clubId, errors: result.errors })
    throw error
  }
  return clubId
}

export function validateTournamentIdString(tournamentId: string): string {
  const result = ChessValidator.validateTournamentId(tournamentId)
  if (!result.isValid) {
    const error = new Error(`Invalid tournament ID: ${result.errors.join(', ')}`)
    logger.error('Validation error', { tournamentId, errors: result.errors })
    throw error
  }
  return tournamentId
}

export const validate = {
  username: ChessValidator.validateUsername,
  usernameString: ChessValidator.validateUsernameString,
  countryCode: ChessValidator.validateCountryCode,
  clubId: ChessValidator.validateClubId,
  clubIdString: validateClubIdString,
  tournamentId: ChessValidator.validateTournamentId,
  tournamentIdString: validateTournamentIdString,
  matchId: ChessValidator.validateMatchId,
  board: ChessValidator.validateBoard,
  yearMonth: ChessValidator.validateYearMonth,
  titleAbbrev: ChessValidator.validateTitleAbbrev,
  pgn: ChessValidator.validatePGN,
  fen: ChessValidator.validateFEN,
  params: ChessValidator.validateParams,
  timeControl: ChessValidator.validateTimeControl,
  leaderboardCategory: ChessValidator.validateLeaderboardCategory,
  positiveInteger: ChessValidator.validatePositiveInteger,
}
export function validateOrThrow<T>(
  validator: (input: T) => ValidationResult,
  input: T,
  context?: string
): void {
  const result = validator(input)
  if (!result.isValid) {
    const contextMsg = context ? ` in ${context}` : ''
    const error = new Error(`Validation failed${contextMsg}: ${result.errors.join(', ')}`)
    logger.error('Validation error', { input, errors: result.errors, context })
    throw error
  }
}
