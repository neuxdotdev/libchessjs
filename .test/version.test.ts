import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import versionManager, { APP_VERSION, BUILD_INFO } from '../src/config/version';

describe('Version Management', () => {
    let originalVersionData: any;
s
    beforeEach(() => {
        const versionFilePath = versionManager['getVersionFilePath']();
        originalVersionData = JSON.parse(readFileSync(versionFilePath, 'utf-8'));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('VersionManager', () => {
        it('should be a singleton', () => {
            const instance1 = versionManager;
            const instance2 = versionManager;
            expect(instance1).toBe(instance2);
        });

        it('should load version data correctly', () => {
            const versionData = versionManager.getAllVersionData();

            expect(versionData).toHaveProperty('app');
            expect(versionData.app).toHaveProperty('version');
            expect(versionData.app).toHaveProperty('buildDate');
            expect(versionData.app).toHaveProperty('buildNumber');
            expect(versionData.app).toHaveProperty('buildId');
            expect(versionData.app).toHaveProperty('semanticVersion');

            expect(versionData).toHaveProperty('metadata');
            expect(versionData.metadata).toHaveProperty('lastUpdated');
            expect(versionData.metadata).toHaveProperty('updatedBy');
            expect(versionData.metadata).toHaveProperty('environment');
        });

        it('should return correct version', () => {
            const version = versionManager.getVersion();
            expect(typeof version).toBe('string');
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        it('should return build info', () => {
            const buildInfo = versionManager.getBuildInfo();
            expect(buildInfo.version).toBe(versionManager.getVersion());
            expect(buildInfo.buildId).toBe(versionManager.getBuildId());
        });

        it('should return semantic version', () => {
            const semanticVersion = versionManager.getSemanticVersion();
            expect(semanticVersion).toContain(versionManager.getVersion());
        });

        it('should force reload when requested', () => {
            const initialLoadTime = versionManager['lastLoadTime'];
            versionManager.forceReload();
            const newLoadTime = versionManager['lastLoadTime'];

            expect(newLoadTime).toBeGreaterThan(initialLoadTime);
        });
    });

    describe('Exported constants', () => {
        it('should export APP_VERSION', () => {
            expect(APP_VERSION).toBe(versionManager.getVersion());
        });

        it('should export BUILD_INFO', () => {
            expect(BUILD_INFO).toEqual(versionManager.getBuildInfo());
        });
    });

    describe('Environment detection', () => {
        it('should detect environment correctly', () => {
            const isDev = versionManager.isDevelopment();
            const isProd = versionManager.isProduction();

            expect(typeof isDev).toBe('boolean');
            expect(typeof isProd).toBe('boolean');

            expect(isDev || isProd).toBe(true);
        });
    });
});
