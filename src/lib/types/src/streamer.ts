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
