import axios, { AxiosInstance, AxiosResponse } from 'axios'

export interface ApiResponse {
  data: any
  status: number
  headers: Record<string, any>
}

class ChessApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.chess.com/pub',
      timeout: 10000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'libchessjs/1.0.0',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      config => {
        return config
      },
      error => {
        return Promise.reject(error)
      }
    )

    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout')
        }
        if (error.response?.status === 404) {
          throw new Error('Player not found')
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded')
        }
        throw error
      }
    )
  }

  async get(endpoint: string): Promise<ApiResponse> {
    const response: AxiosResponse = await this.client.get(endpoint)
    return {
      data: response.data,
      status: response.status,
      headers: response.headers,
    }
  }
}

export const ChessApi = new ChessApiClient()
