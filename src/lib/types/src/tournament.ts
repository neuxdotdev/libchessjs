import { GameRules, TimeControl, TournamentStatus, PlayerBasicInfo } from './common.js'

export interface Tournament {
  id: string
  name: string
  url: string
  description: string
  creator: string
  status: TournamentStatus
  start_time: number
  finish_time?: number
  settings: TournamentSettings
  players: TournamentPlayer[]
  rounds: string[]
}

export interface TournamentSettings {
  type: 'arena' | 'swiss' | 'round-robin'
  rules: GameRules
  time_class: TimeControl
  time_control: string
  is_rated: boolean
  is_official: boolean
  is_invite_only: boolean
  initial_group_size: number
  user_advance_count: number
  use_tiebreak: boolean
  allow_vacation: boolean
  winner_places: number
  registered_user_count: number
  games_per_opponent: number
  total_rounds: number
  concurrent_games_per_opponent: number
  min_rating?: number
  max_rating?: number
}

export interface TournamentPlayer extends PlayerBasicInfo {
  status: 'registered' | 'active' | 'withdrawn' | 'removed'
  is_online?: boolean
  rating_diff?: number
}

export interface TournamentRound {
  round: number
  groups: string[]
  players: TournamentRoundPlayer[]
  start_time?: number
  end_time?: number
}

export interface TournamentRoundPlayer {
  username: string
  is_advancing: boolean
  points?: number
  tie_break?: number
}

export interface TournamentRoundGroup {
  group: number
  round: number
  fair_play_removals: string[]
  games: TournamentGame[]
  players: TournamentGroupPlayer[]
}

export interface TournamentGame {
  id: string
  white: string
  black: string
  url: string
  fen: string
  pgn: string
  turn: 'white' | 'black'
  move_by: number
  draw_offer?: 'white' | 'black'
  last_activity: number
  start_time: number
  end_time?: number
  time_control: string
  time_class: TimeControl
  rules: GameRules
  eco?: string
  tournament?: string
  result?: string
  white_rating?: number
  black_rating?: number
}

export interface TournamentGroupPlayer {
  username: string
  points: number
  tie_break: number
  is_advancing: boolean
  games_played: number
  games_won: number
  games_lost: number
  games_drawn: number
  performance_rating?: number
}

export interface TournamentWinner {
  username: string
  place: number
  points: number
  tie_break: number
}

export interface TournamentFilters {
  status?: TournamentStatus
  time_class?: TimeControl
  is_rated?: boolean
  min_players?: number
  max_players?: number
  date_from?: number
  date_to?: number
  search_query?: string
}

export interface TournamentSearchResult {
  tournaments: Tournament[]
  total: number
  page: number
  limit: number
  filters: TournamentFilters
}

export interface TournamentStats {
  total_players: number
  active_players: number
  completed_games: number
  ongoing_games: number
  total_games: number
  top_players: TournamentPlayer[]
  average_rating?: number
  start_time: number
  finish_time?: number
}

export interface CompleteTournamentData {
  tournament: Tournament
  rounds: Map<number, TournamentRound>
  groups: Map<string, TournamentRoundGroup>
  stats: TournamentStats
  fetchedAt: number
}

export interface TournamentLeaderboard {
  tournament_id: string
  players: TournamentGroupPlayer[]
  last_updated: number
}
