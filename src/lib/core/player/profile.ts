import { ChessApi } from '../../../client/function/core/player/profile.js'

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

function convertToPlayerProfile(data: PlayerProfileData): PlayerProfile {
  return {
    avatar: data.avatar,
    playerId: data.player_id,
    id: data.id,
    url: data.url,
    name: data.name,
    username: data.username,
    title: data.title,
    followers: data.followers,
    country: data.country,
    lastOnline: data.last_online,
    joined: data.joined,
    status: data.status,
    isStreamer: data.is_streamer,
    verified: data.verified,
    league: data.league,
    location: data.location,
    streamingPlatforms: (data.streaming_platforms || []).map(platform => ({
      type: platform.type,
      channelUrl: platform.channel_url,
    })),
    lastOnlineDate: data.last_online ? new Date(data.last_online * 1000).toISOString() : undefined,
    joinedDate: data.joined ? new Date(data.joined * 1000).toISOString() : undefined,
  }
}

export async function fetchPlayerProfile(username: string): Promise<ProfileResult> {
  try {
    const response = await ChessApi.get(`/player/${username}`)

    if (!response.data) {
      return {
        success: false,
        error: 'No data received from API',
        statusCode: response.status,
      }
    }

    const profileData: PlayerProfileData = response.data
    const profile = convertToPlayerProfile(profileData)

    return {
      success: true,
      data: profile,
      statusCode: response.status,
      headers: response.headers,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      statusCode: error.response?.status,
    }
  }
}

export async function fetchMultipleProfiles(usernames: string[]): Promise<ProfileResult[]> {
  const results: ProfileResult[] = []

  for (const username of usernames) {
    const result = await fetchPlayerProfile(username)
    results.push(result)

    if (usernames.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
}
