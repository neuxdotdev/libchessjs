import { GameRules, TimeControl } from './common.js'
import { PlayerGameInfo } from './player.js'

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
