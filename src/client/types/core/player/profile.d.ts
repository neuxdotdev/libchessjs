export interface ApiResponse {
  data: any
  status: number
  headers: Record<string, any>
}

export declare class ChessApiClient {
  get(endpoint: string): Promise<ApiResponse>
}

export declare const ChessApi: ChessApiClient
