# Source Code Snapshot of src/lib/types/src

## src/lib/types/src/club.d.ts
```ts
import type { ClubVisibility } from './common.d.ts'

export interface ClubProfile {
  '@id': string
  name: string
  club_id: number
  icon?: string
  country: string
  average_daily_rating: number
  members_count: number
  created: number
  last_activity: number
  visibility: ClubVisibility
  join_request: string
  admin: string[]
  description: string
}

export interface ClubMember {
  username: string
  joined: number
}

export interface ClubMembers {
  weekly: ClubMember[]
  monthly: ClubMember[]
  all_time: ClubMember[]
}

export interface ClubMatch {
  name: string
  '@id': string
  opponent: string
  result?: string
  start_time?: number
  time_class: string
}

export interface ClubMatches {
  finished: ClubMatch[]
  in_progress: ClubMatch[]
  registered: ClubMatch[]
}

export interface CompleteClubData {
  profile: ClubProfile
  members: ClubMembers
  matches: ClubMatches
  fetchedAt: number
}
```

## src/lib/types/src/common.d.ts
```ts
export declare enum TimeControl {
  DAILY = 'daily',
  RAPID = 'rapid',
  BLITZ = 'blitz',
  BULLET = 'bullet',
  ULTRABULLET = 'ultrabullet',
}
export declare enum TimeControlCategory {
  DAILY = 'daily',
  LIVE = 'live',
  CORRESPONDENCE = 'correspondence',
}
export declare enum GameRules {
  CHESS = 'chess',
  CHESS_960 = 'chess960',
  BUGHOUSE = 'bughouse',
  KING_OF_THE_HILL = 'kingofthehill',
  THREE_CHECK = 'threecheck',
  CRAZYHOUSE = 'crazyhouse',
  ATOMIC = 'atomic',
  HORDE = 'horde',
  RACING_KINGS = 'racingkings',
  NO_Castling = 'nocastling',
}
export declare enum Title {
  GM = 'GM',
  WGM = 'WGM',
  IM = 'IM',
  WIM = 'WIM',
  FM = 'FM',
  WFM = 'WFM',
  NM = 'NM',
  WNM = 'WNM',
  CM = 'CM',
  WCM = 'WCM',
  LM = 'LM',
  BOT = 'BOT',
}
export declare enum GameResult {
  WIN = 'win',
  CHECKMATED = 'checkmated',
  AGREED = 'agreed',
  REPETITION = 'repetition',
  TIMEOUT = 'timeout',
  RESIGNED = 'resigned',
  STALEMATE = 'stalemate',
  LOSE = 'lose',
  INSUFFICIENT = 'insufficient',
  FIFTY_MOVE = '50move',
  ABANDONED = 'abandoned',
  KING_OF_THE_HILL = 'kingofthehill',
  THREE_CHECK = 'threecheck',
  TIME_VS_INSUFFICIENT = 'timevsinsufficient',
  BUGHOUSE_PARTNER_LOSE = 'bughousepartnerlose',
  DRAW = 'draw',
}
export declare enum GameTermination {
  NORMAL = 'normal',
  TIME_FORFEIT = 'time forfeit',
  ABANDONED = 'abandoned',
  RULES_INFRACTION = 'rules infraction',
  UNTERMINATED = 'unterminated',
}
export declare enum PlayerStatus {
  CLOSED = 'closed',
  CLOSED_FAIR_PLAY = 'closed:fair_play_violations',
  BASIC = 'basic',
  PREMIUM = 'premium',
  MOD = 'mod',
  STAFF = 'staff',
  BOT = 'bot',
}
export declare enum TournamentStatus {
  FINISHED = 'finished',
  IN_PROGRESS = 'in_progress',
  REGISTRATION = 'registration',
  CANCELLED = 'cancelled',
}
export declare enum MatchStatus {
  FINISHED = 'finished',
  IN_PROGRESS = 'in_progress',
  REGISTERED = 'registered',
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
}
export declare enum ClubVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
}
export declare enum ClubMembership {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
  REQUESTED = 'requested',
  BANNED = 'banned',
}
export declare enum StreamerPlatform {
  TWITCH = 'twitch',
  YOUTUBE = 'youtube',
}
export declare enum PuzzleDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}
export declare enum PuzzleTheme {
  OPENING = 'opening',
  MIDDLEGAME = 'middlegame',
  ENDGAME = 'endgame',
  TACTICS = 'tactics',
  STRATEGY = 'strategy',
  CHECKMATE = 'checkmate',
  SACRIFICE = 'sacrifice',
  PIN = 'pin',
  SKEWER = 'skewer',
  FORK = 'fork',
}
export declare enum LeaderboardCategory {
  DAILY = 'daily',
  LIVE_RAPID = 'live_rapid',
  LIVE_BLITZ = 'live_blitz',
  LIVE_BULLET = 'live_bullet',
  TACTICS = 'tactics',
  LESSONS = 'lessons',
}
export declare enum CountryCode {
  US = 'US',
  CA = 'CA',
  MX = 'MX',
  GB = 'GB',
  FR = 'FR',
  DE = 'DE',
  IT = 'IT',
  ES = 'ES',
  RU = 'RU',
  NL = 'NL',
  PL = 'PL',
  UA = 'UA',
  CN = 'CN',
  IN = 'IN',
  JP = 'JP',
  KR = 'KR',
  ID = 'ID',
  BR = 'BR',
  AR = 'AR',
  CO = 'CO',
  AU = 'AU',
  NZ = 'NZ',
  ZA = 'ZA',
  EG = 'EG',
  NG = 'NG',
}
export declare enum PieceColor {
  WHITE = 'white',
  BLACK = 'black',
}
export declare enum PieceType {
  KING = 'k',
  QUEEN = 'q',
  ROOK = 'r',
  BISHOP = 'b',
  KNIGHT = 'n',
  PAWN = 'p',
}
export declare enum GamePhase {
  OPENING = 'opening',
  MIDDLEGAME = 'middlegame',
  ENDGAME = 'endgame',
}
export declare enum RatingType {
  BULLET = 'bullet',
  BLITZ = 'blitz',
  RAPID = 'rapid',
  DAILY = 'daily',
  TACTICS = 'tactics',
  FIDE = 'fide',
  USCF = 'uscf',
  ECF = 'ecf',
}
export declare enum ArchiveMonth {
  JANUARY = '01',
  FEBRUARY = '02',
  MARCH = '03',
  APRIL = '04',
  MAY = '05',
  JUNE = '06',
  JULY = '07',
  AUGUST = '08',
  SEPTEMBER = '09',
  OCTOBER = '10',
  NOVEMBER = '11',
  DECEMBER = '12',
}
export declare enum CacheStrategy {
  NONE = 'none',
  MEMORY = 'memory',
  PERSISTENT = 'persistent',
  NETWORK_FIRST = 'network_first',
  CACHE_FIRST = 'cache_first',
}
export declare enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}
export declare enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
export interface ApiResponse<T> {
  data: T
  headers: Record<string, string>
  status: number
  url: string
  timestamp: number
  fromCache?: boolean
  requestId?: string
  rateLimit?: RateLimitInfo
}
export interface ApiError extends Error {
  code: number
  status: number
  url?: string
  timestamp: number
  stack?: string
  severity?: ErrorSeverity
  retryable?: boolean
  details?: Record<string, any>
}
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
  cursor?: string
}
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    pages: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
    nextCursor?: string
    prevCursor?: string
  }
}
export interface CacheConfig {
  enabled: boolean
  ttl: number
  strategy: CacheStrategy
  maxSize?: number
  staleWhileRevalidate?: number
}
export interface RequestMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  cacheHits: number
  cacheMisses: number
  rateLimitedRequests: number
  averageResponseTime: number
  totalResponseTime: number
  errorsByCode: Record<number, number>
  requestsByEndpoint: Record<string, number>
}
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  window: number
  cost?: number
}
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  normalized?: any
}
export interface Coordinates {
  x: number
  y: number
}
export interface TimeControlConfig {
  initial: number
  increment: number
  daysPerMove?: number
  timeControl: TimeControl
}
export interface PlayerBasicInfo {
  username: string
  id?: number
  title?: Title
  rating?: number
  provisional?: boolean
  online?: boolean
  patron?: boolean
}
export interface PlayerProfile extends PlayerBasicInfo {
  name?: string
  avatar?: string
  location?: string
  country: string
  joined: number
  last_online: number
  followers: number
  is_streamer: boolean
  verified: boolean
  league?: string
  streaming_platforms?: StreamerPlatform[]
  status: PlayerStatus
  links?: {
    twitch?: string
    youtube?: string
    twitter?: string
  }
}
export interface GamePlayer {
  username: string
  rating: number
  result: GameResult
  color: PieceColor
  title?: Title
  berserk?: boolean
  move_count?: number
  analysis?: GameAnalysis
}
export interface GameAnalysis {
  accuracy?: number
  blunders: number
  mistakes: number
  inaccuracies: number
  acpl: number
  performance?: number
}
export interface GameInfo {
  id: string
  url: string
  pgn?: string
  fen: string
  time_control: string
  time_class: TimeControl
  rules: GameRules
  rated: boolean
  accuracy?: {
    white: number
    black: number
  }
  tournament?: string
  match?: string
  moves: string
  white: GamePlayer
  black: GamePlayer
  winner?: PieceColor
  result: GameResult
  termination: GameTermination
  start_time: number
  end_time: number
  last_move_at?: number
  analysed?: boolean
  clock_increment?: number
  clock_initial?: number
}
export interface TournamentInfo {
  id: string
  name: string
  description: string
  url: string
  status: TournamentStatus
  time_control: TimeControl
  time_class: TimeControl
  rules: GameRules
  rated: boolean
  full: boolean
  players: number
  max_players: number
  start_time: number
  finish_time?: number
  creator: PlayerBasicInfo
  winner?: PlayerBasicInfo
  rounds?: number
  current_round?: number
  settings: TournamentSettings
}
export interface TournamentSettings {
  type: 'arena' | 'swiss' | 'round-robin'
  min_rating?: number
  max_rating?: number
  rated: boolean
  position?: number
  berserkable: boolean
  streakable: boolean
  description?: string
}
export interface ClubInfo {
  id: string
  name: string
  description: string
  url: string
  visibility: ClubVisibility
  joined: boolean
  member_count: number
  online_members: number
  streamer_count: number
  owner: PlayerBasicInfo
  admins: PlayerBasicInfo[]
  created: number
  last_activity?: number
  country?: CountryCode
  location?: string
  rules?: string
  links?: {
    website?: string
    discord?: string
  }
}
export interface StreamInfo {
  username: string
  platform: StreamerPlatform
  url: string
  is_live: boolean
  title?: string
  viewers?: number
  thumbnail?: string
  started_at?: number
  language?: string
}
export interface PuzzleInfo {
  id: string
  title: string
  rating: number
  themes: PuzzleTheme[]
  solution: string[]
  moves: string[]
  fen: string
  pgn: string
  game_url?: string
  popularity: number
  nb_plays: number
  difficulty: PuzzleDifficulty
  phase: GamePhase
}
export interface LeaderboardPlayer {
  username: string
  rank: number
  score: number
  title?: Title
  country?: CountryCode
  flair?: string
  patron?: boolean
}
export interface LeaderboardInfo {
  category: LeaderboardCategory
  players: LeaderboardPlayer[]
  last_updated: number
  total_players: number
}
export interface RequestConfig {
  timeout?: number
  retries?: number
  retryDelay?: number
  cache?: CacheConfig
  headers?: Record<string, string>
  params?: Record<string, any>
  validateStatus?: (status: number) => boolean
}
export interface BatchRequest<T> {
  id: string
  request: Promise<T>
  timestamp: number
}
export interface BatchResponse<T> {
  id: string
  data?: T
  error?: ApiError
  duration: number
}
export interface BaseEvent {
  type: string
  timestamp: number
  source: string
  correlationId?: string
}
export interface ApiRequestEvent extends BaseEvent {
  type: 'api_request'
  method: HttpMethod
  url: string
  headers: Record<string, string>
  params?: Record<string, any>
}
export interface ApiResponseEvent extends BaseEvent {
  type: 'api_response'
  status: number
  duration: number
  cached: boolean
  url: string
}
export interface ApiErrorEvent extends BaseEvent {
  type: 'api_error'
  error: ApiError
  url: string
  method: HttpMethod
}
export interface CacheEvent extends BaseEvent {
  type: 'cache_hit' | 'cache_miss' | 'cache_set' | 'cache_clear'
  key: string
  duration?: number
}
export interface RateLimitEvent extends BaseEvent {
  type: 'rate_limit'
  limit: number
  remaining: number
  reset: number
  url: string
}
export type ApiEvent =
  | ApiRequestEvent
  | ApiResponseEvent
  | ApiErrorEvent
  | CacheEvent
  | RateLimitEvent
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>
export type Nullable<T> = T | null
export type MaybePromise<T> = T | Promise<T>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
export interface ClientConfig {
  baseURL: string
  timeout?: number
  cache?: CacheConfig
  retries?: number
  retryDelay?: number
  rateLimit?: {
    maxRequests: number
    perMilliseconds: number
  }
  headers?: Record<string, string>
  logger?: {
    enabled: boolean
    level: 'error' | 'warn' | 'info' | 'debug'
  }
  events?: {
    enabled: boolean
    listeners: Array<(event: ApiEvent) => void>
  }
}
export interface EndpointConfig {
  cache?: CacheConfig
  retries?: number
  timeout?: number
  validation?: {
    enabled: boolean
    strict: boolean
  }
}
export declare const isApiError: (error: any) => error is ApiError
export declare const isPlayerProfile: (obj: any) => obj is PlayerProfile
export declare const isGameInfo: (obj: any) => obj is GameInfo
export declare const isTournamentInfo: (obj: any) => obj is TournamentInfo
export type TransformFunction<T, R> = (data: T) => R
export type FilterFunction<T> = (item: T) => boolean
export type SortFunction<T> = (a: T, b: T) => number
```

## src/lib/types/src/country.d.ts
```ts
export interface CountryProfile {
  '@id': string
  name: string
  code: string
}

export interface CountryPlayers {
  players: string[]
}

export interface CountryClubs {
  clubs: string[]
}

export interface CompleteCountryData {
  profile: CountryProfile
  players: CountryPlayers
  clubs: CountryClubs
  fetchedAt: number
}
```

## src/lib/types/src/game.d.ts
```ts
import type { GameRules, TimeControl } from './common.d.ts'
import type { PlayerGameInfo } from './player.d.ts'

export interface Game {
  url: string
  pgn: string
  fen: string
  time_control: string
  time_class: TimeControl
  rules: GameRules
  white: PlayerGameInfo
  black: PlayerGameInfo
  accuracies?: {
    white: number
    black: number
  }
  eco?: string
  end_time: number
  start_time?: number
  tournament?: string
  match?: string
  rated?: boolean
}

export interface CurrentGame {
  url: string
  fen: string
  pgn: string
  turn: 'white' | 'black'
  move_by: number
  draw_offer?: 'white' | 'black'
  last_activity: number
  start_time: number
  time_control: string
  time_class: TimeControl
  rules: GameRules
  white: string
  black: string
  tournament?: string
  match?: string
}

export interface ToMoveGame {
  url: string
  move_by: number
  draw_offer?: boolean
  last_activity: number
}

export interface GameArchives {
  archives: string[]
}

export interface LiveGamesResponse {
  games: Game[]
}

export interface GameWithPlayers extends Omit<Game, 'white' | 'black'> {
  white: PlayerGameInfo & { team?: string }
  black: PlayerGameInfo & { team?: string }
}
```

## src/lib/types/src/leaderboard.d.ts
```ts
import type { TimeControl, GameRules } from './common.d.ts'

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
```

## src/lib/types/src/player.d.ts
```ts
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
```

## src/lib/types/src/puzzle.d.ts
```ts
export interface DailyPuzzle {
  title: string
  url: string
  publish_time: number
  fen: string
  pgn: string
  image: string
}

export interface RandomPuzzle {
  title: string
  url: string
  publish_time: number
  fen: string
  pgn: string
  image: string
}

export interface PuzzleStats {
  dailyPuzzle: DailyPuzzle
  randomPuzzles: RandomPuzzle[]
  totalPuzzles: number
  fetchedAt: number
}

export interface PuzzleSolution {
  moves: string[]
  evaluation: string
  bestLine: string
}

export interface PuzzleAnalysis {
  puzzle: DailyPuzzle | RandomPuzzle
  solution: PuzzleSolution
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  themes: string[]
  rating?: number
}

export interface DailyPuzzle {
  title: string
  url: string
  publish_time: number
  fen: string
  pgn: string
  image: string
  move_list: string[]
  solution?: string
}

export interface RandomPuzzle {
  id: string
  title: string
  rating: number
  pgn: string
  fen: string
  tags: string[]
  solution?: string
  moves?: string[]
}

export interface PuzzleTheme {
  name: string
  count: number
}

export interface PuzzleStats {
  dailyPuzzle: DailyPuzzle
  randomPuzzles: RandomPuzzle[]
  totalPuzzles: number
  fetchedAt: number
  successRate: number
}
```

## src/lib/types/src/streamer.d.ts
```ts
export interface Streamer {
  username: string
  avatar?: string
  twitch_url: string
  url: string
}

export interface StreamersResponse {
  streamers: Streamer[]
}

export interface StreamerStats {
  streamer: Streamer
  profile?: StreamerProfile
  isLive: boolean
  lastStream?: number
  followers?: number
  joined?: number
  lastOnline?: number
}

export interface StreamerProfile {
  username: string
  title?: string
  status?: string
  name?: string
  followers?: number
  country?: string
  joined?: number
  lastOnline?: number
  isStreamer: boolean
}

export interface StreamerFilters {
  platform?: 'twitch' | 'youtube' | 'all'
  minFollowers?: number
  isLive?: boolean
  country?: string
}

export interface StreamerSearchResult {
  streamers: Streamer[]
  total: number
  filters: StreamerFilters
  searchTerm?: string
}

export interface StreamerWithStats {
  streamer: Streamer
  followers: number
  country?: string
  lastOnline?: number
}
```

## src/lib/types/src/team-matches.d.ts
```ts
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
```

## src/lib/types/src/tournament.d.ts
```ts
import type { GameRules, TimeControl, TournamentStatus, PlayerBasicInfo } from './common.d.ts'

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
```

