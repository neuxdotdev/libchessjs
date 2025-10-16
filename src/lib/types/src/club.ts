import { ClubVisibility } from './common.js'

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
