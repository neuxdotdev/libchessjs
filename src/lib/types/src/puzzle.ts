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
