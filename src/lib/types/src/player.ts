import { Title, PlayerStatus, GameResult, TimeControl } from './common.js'

export interface PlayerProfile {
  '@id': string
  url: string
  username: string
  player_id: number
  title?: Title
  status: PlayerStatus
  name?: string
  avatar?: string
  location?: string
  country: string
  joined: number
  last_online: number
  followers: number
  is_streamer: boolean
  twitch_url?: string
  fide?: number
}

export interface PlayerStats {
  chess_daily?: GameTypeStats
  chess_rapid?: GameTypeStats
  chess_blitz?: GameTypeStats
  chess_bullet?: GameTypeStats
  chess960_daily?: GameTypeStats
  chess960_rapid?: GameTypeStats
  chess960_blitz?: GameTypeStats
  chess960_bullet?: GameTypeStats
  bughouse?: GameTypeStats
  kingofthehill?: GameTypeStats
  threecheck?: GameTypeStats
  crazyhouse?: GameTypeStats
  tactics?: LearningStats
  lessons?: LearningStats
  puzzle_rush?: PuzzleRushStats
}

export interface GameTypeStats {
  last: RatingInfo
  best?: BestRating
  record: GameRecord
  tournament?: TournamentStats
}

export interface RatingInfo {
  date: number
  rating: number
  rd: number
}

export interface BestRating {
  date: number
  rating: number
  game: string
}

export interface GameRecord {
  win: number
  loss: number
  draw: number
  time_per_move: number
  timeout_percent: number
}

export interface TournamentStats {
  count: number
  withdraw: number
  points: number
  highest_finish: number
}

export interface LearningStats {
  highest: {
    rating: number
    date: number
  }
  lowest: {
    rating: number
    date: number
  }
}

export interface PuzzleRushStats {
  daily?: {
    total_attempts: number
    score: number
  }
  best?: {
    total_attempts: number
    score: number
  }
}

export interface PlayerGameInfo {
  rating: number
  result: GameResult
  '@id': string
  username: string
  uuid?: string
}

export interface OnlineStatus {
  online: boolean
}

export interface PlayerClubs {
  clubs: ClubMembership[]
}

export interface ClubMembership {
  '@id': string
  name: string
  last_activity: number
  icon: string
  url: string
  joined: number
}

export interface PlayerMatches {
  finished: PlayerMatch[]
  in_progress: PlayerMatch[]
  registered: PlayerMatch[]
}

export interface PlayerMatch {
  name: string
  url: string
  '@id': string
  club: string
  results?: {
    played_as_white: GameResult
    played_as_black: GameResult
  }
  board?: string
}

export interface PlayerTournaments {
  finished: PlayerTournament[]
  in_progress: PlayerTournament[]
  registered: PlayerTournament[]
}

export interface PlayerTournament {
  url: string
  '@id': string
  wins?: number
  losses?: number
  draws?: number
  points_awarded?: number
  placement?: number
  status: string
  total_players?: number
}

export interface TitledPlayers {
  players: string[]
}

export interface CompletePlayerData {
  profile: PlayerProfile
  stats: PlayerStats
  clubs: PlayerClubs
  matches: PlayerMatches
  tournaments: PlayerTournaments
  online: OnlineStatus
  fetchedAt: number
}

export interface PlayerGamesSummary {
  stats: PlayerStats
  totalArchives: number
  archives: string[]
  fetchedAt: number
}

export interface PlayerSearchResult {
  players: PlayerProfile[]
  total: number
  page: number
  limit: number
}

export interface PlayerComparison {
  player1: PlayerProfile
  player2: PlayerProfile
  commonClubs: ClubMembership[]
  ratingDifferences: {
    [key in TimeControl]?: {
      player1: number
      player2: number
      difference: number
    }
  }
  headToHead?: {
    totalGames: number
    wins: { player1: number; player2: number; draws: number }
    lastPlayed?: number
  }
}

export { Title }
