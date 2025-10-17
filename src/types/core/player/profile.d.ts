export interface PlayerProfileData {
  avatar?: string
  player_id?: number
  id?: string
  url?: string
  name?: string
  username?: string
  title?: string
  followers?: number
  country?: string
  last_online?: number
  joined?: number
  status?: string
  is_streamer?: boolean
  verified?: boolean
  league?: string
  location?: string
  streaming_platforms?: Array<{
    type?: string
    channel_url?: string
  }>
}

export interface PlayerProfile {
  avatar?: string
  playerId?: number
  id?: string
  url?: string
  name?: string
  username?: string
  title?: string
  followers?: number
  country?: string
  lastOnline?: number
  joined?: number
  status?: string
  isStreamer?: boolean
  verified?: boolean
  league?: string
  location?: string
  streamingPlatforms: Array<{
    type?: string
    channelUrl?: string
  }>
  lastOnlineDate?: string
  joinedDate?: string
}

export interface ProfileResult {
  success: boolean
  data?: PlayerProfile
  error?: string
  statusCode?: number
  headers?: Record<string, any>
}

export declare function fetchPlayerProfile(username: string): Promise<ProfileResult>
export declare function fetchMultipleProfiles(usernames: string[]): Promise<ProfileResult[]>
