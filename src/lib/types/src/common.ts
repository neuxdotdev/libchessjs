export  enum TimeControl {
  DAILY = 'daily',
  RAPID = 'rapid',
  BLITZ = 'blitz',
  BULLET = 'bullet',
  ULTRABULLET = 'ultrabullet',
}
export  enum TimeControlCategory {
  DAILY = 'daily',
  LIVE = 'live',
  CORRESPONDENCE = 'correspondence',
}
export  enum GameRules {
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
export enum Title {
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
export  enum GameResult {
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
export  enum GameTermination {
  NORMAL = 'normal',
  TIME_FORFEIT = 'time forfeit',
  ABANDONED = 'abandoned',
  RULES_INFRACTION = 'rules infraction',
  UNTERMINATED = 'unterminated',
}
export  enum PlayerStatus {
  CLOSED = 'closed',
  CLOSED_FAIR_PLAY = 'closed:fair_play_violations',
  BASIC = 'basic',
  PREMIUM = 'premium',
  MOD = 'mod',
  STAFF = 'staff',
  BOT = 'bot',
}
export  enum TournamentStatus {
  FINISHED = 'finished',
  IN_PROGRESS = 'in_progress',
  REGISTRATION = 'registration',
  CANCELLED = 'cancelled',
}
export  enum MatchStatus {
  FINISHED = 'finished',
  IN_PROGRESS = 'in_progress',
  REGISTERED = 'registered',
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
}
export  enum ClubVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
}
export  enum ClubMembership {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
  REQUESTED = 'requested',
  BANNED = 'banned',
}
export  enum StreamerPlatform {
  TWITCH = 'twitch',
  YOUTUBE = 'youtube',
}
export  enum PuzzleDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}
export  enum PuzzleTheme {
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
export  enum LeaderboardCategory {
  DAILY = 'daily',
  LIVE_RAPID = 'live_rapid',
  LIVE_BLITZ = 'live_blitz',
  LIVE_BULLET = 'live_bullet',
  TACTICS = 'tactics',
  LESSONS = 'lessons',
}
export  enum CountryCode {
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
export  enum PieceColor {
  WHITE = 'white',
  BLACK = 'black',
}
export  enum PieceType {
  KING = 'k',
  QUEEN = 'q',
  ROOK = 'r',
  BISHOP = 'b',
  KNIGHT = 'n',
  PAWN = 'p',
}
export  enum GamePhase {
  OPENING = 'opening',
  MIDDLEGAME = 'middlegame',
  ENDGAME = 'endgame',
}
export  enum RatingType {
  BULLET = 'bullet',
  BLITZ = 'blitz',
  RAPID = 'rapid',
  DAILY = 'daily',
  TACTICS = 'tactics',
  FIDE = 'fide',
  USCF = 'uscf',
  ECF = 'ecf',
}
export  enum ArchiveMonth {
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
export  enum CacheStrategy {
  NONE = 'none',
  MEMORY = 'memory',
  PERSISTENT = 'persistent',
  NETWORK_FIRST = 'network_first',
  CACHE_FIRST = 'cache_first',
}
export  enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}
export  enum ErrorSeverity {
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
