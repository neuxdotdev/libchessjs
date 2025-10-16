// index.ts

// Import core module dulu, biar dependency seperti ChessComHttpClient kebaca sebelum digabung
import { ChessComHttpClient } from '../lib/client.js'
import * as lib from '../lib/index.js'
import * as utils from '../utils/index.js'

// Gabungkan semua ke satu namespace agar tidak kehilangan konteks konstruktor internal
export const libChessDotComJs = {
  ...lib,
  utils,
  ChessComHttpClient,
}

// Re-export semua biar tetap modular
export * from '../lib/index.js'
export * from '../utils/index.js'
export { ChessComHttpClient }

// Default export utama
export default libChessDotComJs

// Export type agar tetap dikenali TypeScript
export type {
  ApiResponse,
  PlayerProfile,
  GameInfo,
  TournamentInfo,
  ClubProfile,
  CountryProfile,
  LeaderboardInfo,
  PuzzleInfo,
  StreamInfo,
  TeamMatchBase,
} from '../lib/types/index.js'
