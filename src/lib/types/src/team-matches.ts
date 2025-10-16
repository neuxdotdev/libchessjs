import {
  ApiResponse,
  ApiError,
  PlayerBasicInfo,
  TimeControl,
  GameRules,
  GameResult,
  PieceColor,
  MatchStatus,
  TimeControlConfig,
  GameAnalysis,
  PaginationParams,
  PaginatedResponse,
} from './common.js'
export interface TeamMatchBase {
  id: string
  name: string
  url: string
  description?: string
  start_time: number
  end_time?: number
  status: MatchStatus
  boards: number
  time_class: TimeControl
  time_control: string
  rules: GameRules
  settings: MatchSettings
  created_at?: number
  updated_at?: number
}
export interface MatchSettings {
  time_class: TimeControl
  time_control: string
  rules: GameRules
  min_team_players: number
  max_team_players: number
  min_required_games: number
  min_rating?: number
  max_rating?: number
  autostart: boolean
  rated: boolean
  time_increment?: number
  initial_setup?: string
  allow_berserk?: boolean
  allow_registration_after_start?: boolean
}
export interface Team {
  id: string
  name: string
  url: string
  score: number
  result?: 'win' | 'loss' | 'draw'
  players: PlayerInMatch[]
  fair_play_removals?: string[]
  stats?: TeamStats
}
export interface TeamStats {
  games_played: number
  games_won: number
  games_lost: number
  games_drawn: number
  total_points: number
  average_rating?: number
}
export interface PlayerInMatch {
  username: string
  board?: number
  rating?: number
  rd?: number
  timeout_percent?: number
  status: PlayerMatchStatus
  stats?: PlayerMatchStats
  played_as_white?: GameResultStats
  played_as_black?: GameResultStats
  team_id: string
}
export interface PlayerMatchStats {
  games_played: number
  games_won: number
  games_lost: number
  games_drawn: number
  points: number
  performance_rating?: number
  accuracy?: number
}
export interface GameResultStats {
  games: number
  wins: number
  losses: number
  draws: number
  rating?: number
}
export enum PlayerMatchStatus {
  REGISTERED = 'registered',
  PLAYING = 'playing',
  FINISHED = 'finished',
  WITHDRAWN = 'withdrawn',
  REMOVED = 'removed',
  TIME_OUT = 'time_out',
}
export interface BoardScores {
  [playerUsername: string]: number
}
export interface TeamMatchGame {
  id: string
  url: string
  pgn?: string
  fen: string
  time_control: string
  time_class: TimeControl
  rules: GameRules
  start_time: number
  end_time?: number
  rated: boolean
  eco?: string
  tournament?: string
  match: string
  board: number
  turn?: PieceColor
  move_by?: number
  draw_offer?: PieceColor
  last_activity?: number
  accuracies?: {
    white?: number
    black?: number
  }
  analysis?: {
    white?: GameAnalysis
    black?: GameAnalysis
  }
  white: PlayerInMatchWithTeam
  black: PlayerInMatchWithTeam
  result?: GameResult
  termination?: string
}
export interface PlayerInMatchWithTeam extends PlayerInMatch {
  team: string
  color: PieceColor
  rating_diff?: number
}
export interface DailyTeamMatch extends TeamMatchBase {
  teams: {
    team1: Team
    team2: Team
  }
  current_round?: number
  total_rounds?: number
  board_results?: BoardResult[]
}
export interface BoardResult {
  board: number
  score_team1: number
  score_team2: number
  games: string[]
}
export interface DailyTeamMatchBoard {
  match_id: string
  board: number
  board_scores: BoardScores
  games: TeamMatchGame[]
  team1_score: number
  team2_score: number
  status: MatchStatus
}
export interface LiveTeamMatch extends TeamMatchBase {
  teams: {
    team1: Team
    team2: Team
  }
  current_round?: number
  time_per_move?: number
  is_started: boolean
}
export interface LiveTeamMatchBoard {
  match_id: string
  board: number
  board_scores: BoardScores
  games: TeamMatchGame[]
  team1_score: number
  team2_score: number
  status: MatchStatus
  current_game?: string
}
export interface TeamMatchResponse {
  match: DailyTeamMatch | LiveTeamMatch
  headers: Record<string, string>
  status: number
}
export interface TeamMatchBoardResponse {
  board: DailyTeamMatchBoard | LiveTeamMatchBoard
  headers: Record<string, string>
  status: number
}
export interface PlayerTeamMatches {
  username: string
  finished: PlayerTeamMatch[]
  in_progress: PlayerTeamMatch[]
  registered: PlayerTeamMatch[]
}
export interface PlayerTeamMatch {
  id: string
  name: string
  url: string
  club: string
  board: number
  team: string
  time_class: TimeControl
  start_time: number
  end_time?: number
  result?: string
  opponent_team?: string
}
export interface ClubTeamMatches {
  club_id: string
  finished: ClubTeamMatch[]
  in_progress: ClubTeamMatch[]
  registered: ClubTeamMatch[]
}
export interface ClubTeamMatch {
  id: string
  name: string
  opponent: string
  result?: string
  start_time: number
  time_class: TimeControl
  boards: number
  team1_score?: number
  team2_score?: number
}
export interface TeamMatchFilters {
  status?: MatchStatus
  time_class?: TimeControl
  min_players?: number
  max_players?: number
  rated?: boolean
  min_rating?: number
  max_rating?: number
  date_from?: number
  date_to?: number
}
export interface TeamMatchSearchParams extends PaginationParams {
  query?: string
  filters?: TeamMatchFilters
  sort_by?: 'start_time' | 'name' | 'players'
  sort_order?: 'asc' | 'desc'
}
export interface TeamMatchStats {
  total_matches: number
  matches_won: number
  matches_lost: number
  matches_drawn: number
  total_games: number
  games_won: number
  games_lost: number
  games_drawn: number
  average_rating?: number
  best_rating?: number
  favorite_time_control?: TimeControl
  performance_by_time_control: {
    [key in TimeControl]?: {
      games: number
      wins: number
      losses: number
      draws: number
      performance: number
    }
  }
}
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  headers?: Record<string, string>
  status?: number
  pagination?: {
    total: number
    page: number
    pages: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
  }
}
export type { ApiResponse as ChessComApiResponse, ApiError as ChessComApiError }
