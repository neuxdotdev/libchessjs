import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

interface VersionMetadata {
  lastUpdated: string
  updatedBy: string
  environment: string
}

interface VersionInfo {
  version: string
  buildDate: string
  buildNumber: string
  buildId: string
  semanticVersion: string
}

interface VersionData {
  app: VersionInfo
  metadata: VersionMetadata
}

class VersionManager {
  private static instance: VersionManager
  private versionData: VersionData | null = null
  private lastLoadTime: number = 0
  private readonly cacheTTL: number = 30000 // 30 seconds

  private constructor() {}

  static getInstance(): VersionManager {
    if (!VersionManager.instance) {
      VersionManager.instance = new VersionManager()
    }
    return VersionManager.instance
  }

  private getVersionFilePath(): string {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    return join(currentDir, '..', '..', 'version.json')
  }

  private shouldReload(): boolean {
    return !this.versionData || Date.now() - this.lastLoadTime > this.cacheTTL
  }

  private loadVersionData(): void {
    try {
      const versionFilePath = this.getVersionFilePath()
      const fileContent = readFileSync(versionFilePath, 'utf-8')
      this.versionData = JSON.parse(fileContent) as VersionData
      this.lastLoadTime = Date.now()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to load version data: ${errorMessage}`)
    }
  }

  private getVersionData(): VersionData {
    if (this.shouldReload()) {
      this.loadVersionData()
    }

    if (!this.versionData) {
      throw new Error('Version data not available')
    }

    return this.versionData
  }

  getVersion(): string {
    return this.getVersionData().app.version
  }

  getBuildInfo(): VersionInfo {
    return this.getVersionData().app
  }

  getMetadata(): VersionMetadata {
    return this.getVersionData().metadata
  }

  getAllVersionData(): VersionData {
    return this.getVersionData()
  }

  getSemanticVersion(): string {
    return this.getVersionData().app.semanticVersion
  }

  getBuildId(): string {
    return this.getVersionData().app.buildId
  }

  forceReload(): void {
    this.loadVersionData()
  }

  isDevelopment(): boolean {
    return this.getVersionData().metadata.environment === 'development'
  }

  isProduction(): boolean {
    return this.getVersionData().metadata.environment === 'production'
  }
}

export const versionManager = VersionManager.getInstance()

export const APP_VERSION = versionManager.getVersion()
export const BUILD_INFO = versionManager.getBuildInfo()
export const BUILD_METADATA = versionManager.getMetadata()
export const SEMANTIC_VERSION = versionManager.getSemanticVersion()
export const BUILD_ID = versionManager.getBuildId()

export default versionManager
