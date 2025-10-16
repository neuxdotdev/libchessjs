import { TimeControl, GameRules } from './common.js'

export interface LeaderboardPlayer {
  player_id: number
  '@id': string
  url: string
  username: string
  score: number
  rank: number
}

export interface LeaderboardCategory {
  players: LeaderboardPlayer[]
  timeControl?: TimeControl
  rules?: GameRules
  lastUpdated: number
}

export interface Leaderboards {
  daily: LeaderboardCategory
  daily960: LeaderboardCategory
  live_rapid: LeaderboardCategory
  live_blitz: LeaderboardCategory
  live_bullet: LeaderboardCategory
  live_bughouse: LeaderboardCategory
  live_blitz960: LeaderboardCategory
  live_threecheck: LeaderboardCategory
  live_crazyhouse: LeaderboardCategory
  live_kingofthehill: LeaderboardCategory
  lessons: LeaderboardCategory
  tactics: LeaderboardCategory
}

export interface LeaderboardFilters {
  categories?: (keyof Leaderboards)[]
  minRank?: number
  maxRank?: number
  minScore?: number
  maxScore?: number
  limit?: number
}

export interface LeaderboardStats {
  totalPlayers: number
  averageScore: number
  topScore: number
  lastUpdated: number
  category: keyof Leaderboards
}

export interface CompleteLeaderboardData {
  leaderboards: Leaderboards
  stats: Map<keyof Leaderboards, LeaderboardStats>
  fetchedAt: number
}
