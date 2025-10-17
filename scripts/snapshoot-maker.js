#!/usr/bin/env node
/**
 * ChapSnap Maker - Ultimate Filesystem Snapshot Tool
 * Version: 4.0.0 - "Dragon Scale"
 * Author: System Expert Team
 */
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const { exec } = require('child_process');
const os = require('os');
const execAsync = promisify(exec);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
class ChapSnap {
    constructor() {
        this.config = {
            configFile: './.chapsnaprc.json',
            snapshotDir: './.snapshoot',
            outputFormat: 'txt',
            verbose: true,
            debug: false,
            quiet: false,
            timestampFormat: 'YYYY-MM-DD_HH-mm-ss',
            maxFileSize: 10 * 1024 * 1024,
            followSymlinks: false,
            preservePath: true,
            encoding: 'utf-8',
            compression: false,
            backupCount: 5,
            parallelJobs: 1,
            incremental: false,
            dryRun: false,
            checksumAlgorithm: 'sha256',
            logLevel: 'info',
            colorOutput: true,
            progressBar: true,
            jsonReport: false,
            htmlReport: false,
            statistics: true,
            securityScan: false,
            fileMetadata: true,
            gitIntegration: false,
            cloudBackup: false,
            emailReport: false,
            autoCleanup: false,
            watchMode: false,
            healthCheck: false,
            performanceMonitor: false,
            includePatterns: [],
            excludePatterns: [
                '.git/*',
                '.snapshoot/*',
                'node_modules/*',
                '*.tmp',
                '*.log',
                '*.cache',
                '*.lock',
                '*.pid'
            ]
        };
        this.stats = {
            filesProcessed: 0,
            filesSkipped: 0,
            totalSize: 0,
            startTime: null,
            endTime: null
        };
        this.emoji = {
            info: '🔵',
            success: '🟢',
            warning: '🟡',
            error: '🔴',
            debug: '🔍',
            file: '📄',
            folder: '📁',
            snapshot: '📸',
            config: '⚙️',
            summary: '📊'
        };
        this.colors = {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m'
        };
    }
    log(message) {
        if (!this.config.quiet && ['info', 'debug', 'warn'].includes(this.config.logLevel)) {
            this.output(`${this.emoji.info} [${new Date().toISOString()}] INFO: ${message}`, 'blue');
        }
    }
    logSuccess(message) {
        if (!this.config.quiet) {
            this.output(`${this.emoji.success} [${new Date().toISOString()}] SUCCESS: ${message}`, 'green');
        }
    }
    logWarning(message) {
        if (!this.config.quiet && ['warn', 'debug'].includes(this.config.logLevel)) {
            this.output(`${this.emoji.warning} [${new Date().toISOString()}] WARN: ${message}`, 'yellow');
        }
    }
    logError(message) {
        if (!this.config.quiet) {
            this.output(`${this.emoji.error} [${new Date().toISOString()}] ERROR: ${message}`, 'red');
        }
    }
    logDebug(message) {
        if (this.config.debug && this.config.logLevel === 'debug') {
            this.output(`${this.emoji.debug} [${new Date().toISOString()}] DEBUG: ${message}`, 'magenta');
        }
    }
    output(message, color = 'white') {
        if (this.config.colorOutput) {
            console.log(`${this.colors[color]}${message}${this.colors.reset}`);
        } else {
            console.log(message);
        }
    }
    showProgress(current, total, operation = 'Processing') {
        if (this.config.progressBar && !this.config.quiet) {
            const width = 50;
            const percentage = Math.floor((current / total) * 100);
            const completed = Math.floor((current / total) * width);
            const remaining = width - completed;
            const progressBar = `${this.colors.green}${'█'.repeat(completed)}${this.colors.red}${'░'.repeat(remaining)}${this.colors.reset}`;
            process.stdout.write(`\r${this.colors.cyan}${operation}:${this.colors.reset} [${progressBar}] ${percentage}% (${current}/${total})`);
        }
    }
    completeProgress() {
        if (this.config.progressBar && !this.config.quiet) {
            console.log();
        }
    }
    humanSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unit = 0;
        while (size >= 1024 && unit < units.length - 1) {
            size /= 1024;
            unit++;
        }
        return `${Math.round(size * 100) / 100}${units[unit]}`;
    }
    async loadConfig(configFile) {
        try {
            if (await fs.pathExists(configFile)) {
                const configData = await readFileAsync(configFile, 'utf8');
                const loadedConfig = JSON.parse(configData);
                this.config = { ...this.config, ...loadedConfig };
                this.logSuccess(`Configuration loaded from: ${configFile}`);
            } else {
                this.logWarning(`Config file not found: ${configFile}, using defaults`);
            }
        } catch (error) {
            this.logError(`Failed to load configuration: ${error.message}`);
        }
    }
    async saveConfig(configFile) {
        try {
            await fs.ensureDir(path.dirname(configFile));
            await writeFileAsync(
                configFile,
                JSON.stringify(this.config, null, 2),
                'utf8'
            );
            this.logSuccess(`Configuration saved to: ${configFile}`);
        } catch (error) {
            this.logError(`Failed to save configuration: ${error.message}`);
            throw error;
        }
    }
    async performHealthCheck() {
        if (!this.config.healthCheck) return;
        this.log('Performing system health check...');
        try {
            const diskInfo = await this.getDiskInfo();
            if (diskInfo.free < 100 * 1024 * 1024) {
                this.logWarning(`Low disk space: ${this.humanSize(diskInfo.free)}`);
            } else {
                this.logSuccess(`Disk space OK: ${this.humanSize(diskInfo.free)}`);
            }
            const freeMemory = os.freemem();
            const totalMemory = os.totalmem();
            const memoryUsage = (freeMemory / totalMemory) * 100;
            if (memoryUsage > 90) {
                this.logWarning(`High memory usage: ${Math.round(memoryUsage)}%`);
            } else {
                this.logSuccess(`Memory usage OK: ${Math.round(memoryUsage)}%`);
            }
            const loadAverage = os.loadavg();
            this.log(`Load average: ${loadAverage.map(load => load.toFixed(2)).join(', ')}`);
        } catch (error) {
            this.logError(`Health check failed: ${error.message}`);
        }
    }
    async getDiskInfo() {
        if (process.platform === 'win32') {
            const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
            const lines = stdout.trim().split('\n').slice(1);
            return { free: 1024 * 1024 * 1024, total: 1024 * 1024 * 1024 * 100 };
        } else {
            const { stdout } = await execAsync('df -k .');
            const lines = stdout.trim().split('\n');
            const data = lines[1].split(/\s+/);
            return {
                free: parseInt(data[3]) * 1024,
                total: parseInt(data[1]) * 1024
            };
        }
    }
    startPerformanceMonitor() {
        if (this.config.performanceMonitor) {
            this.stats.startTime = Date.now();
            this.stats.memoryStart = process.memoryUsage().heapUsed;
            this.log('Starting performance monitor...');
        }
    }
    stopPerformanceMonitor() {
        if (this.config.performanceMonitor) {
            this.stats.endTime = Date.now();
            const memoryEnd = process.memoryUsage().heapUsed;
            const duration = (this.stats.endTime - this.stats.startTime) / 1000;
            const memoryUsed = memoryEnd - this.stats.memoryStart;
            this.log('Performance metrics:');
            this.log(`  Duration: ${duration.toFixed(2)} seconds`);
            this.log(`  Memory used: ${this.humanSize(memoryUsed)}`);
            this.log(`  Average speed: ${(this.stats.filesProcessed / duration).toFixed(2)} files/second`);
        }
    }
    async performSecurityScan(targetDir) {
        if (!this.config.securityScan) return;
        this.log('Performing security scan...');
        try {
            const files = await this.findAllFiles(targetDir);
            for (const file of files.slice(0, 1000)) {
                try {
                    const stats = await statAsync(file);
                    const mode = stats.mode.toString(8);
                    if (stats.mode & 0o002) {
                        this.logWarning(`World-writable file: ${file}`);
                    }
                } catch (error) {
                }
            }
        } catch (error) {
            this.logError(`Security scan failed: ${error.message}`);
        }
    }
    async gitIntegration(targetDir, outputFile) {
        if (!this.config.gitIntegration) return;
        try {
            if (await fs.pathExists(path.join(targetDir, '.git'))) {
                this.log('Integrating with Git...');
                let gitInfo = '';
                try {
                    const branch = await execAsync('git branch --show-current', { cwd: targetDir });
                    gitInfo += `Git Branch: ${branch.stdout.trim()}\n`;
                } catch (error) {
                    gitInfo += 'Git Branch: detached\n';
                }
                try {
                    const commit = await execAsync('git rev-parse --short HEAD', { cwd: targetDir });
                    gitInfo += `Git Commit: ${commit.stdout.trim()}\n`;
                } catch (error) {
                }
                try {
                    const status = await execAsync('git status --porcelain', { cwd: targetDir });
                    const changes = status.stdout.trim().split('\n').filter(line => line).length;
                    gitInfo += `Git Changes: ${changes}\n`;
                } catch (error) {
                }
                await fs.appendFile(outputFile, `\n\nGit Information:\n${gitInfo}`);
            }
        } catch (error) {
            this.logDebug(`Git integration failed: ${error.message}`);
        }
    }
    async calculateChecksum(filePath) {
        try {
            const fileBuffer = await readFileAsync(filePath);
            const hash = crypto.createHash(this.config.checksumAlgorithm);
            hash.update(fileBuffer);
            return hash.digest('hex');
        } catch (error) {
            this.logDebug(`Failed to calculate checksum for ${filePath}: ${error.message}`);
            return 'N/A';
        }
    }
    async getFileMetadata(filePath) {
        if (!this.config.fileMetadata) return '';
        try {
            const stats = await statAsync(filePath);
            return {
                permissions: stats.mode.toString(8),
                owner: `${stats.uid}:${stats.gid}`,
                size: stats.size,
                modified: stats.mtime.toISOString(),
                inode: stats.ino
            };
        } catch (error) {
            this.logDebug(`Failed to get metadata for ${filePath}: ${error.message}`);
            return {};
        }
    }
    shouldIncludeFile(filePath, relativePath) {
        const filename = path.basename(filePath);
        if (this.stats.currentFileSize > this.config.maxFileSize) {
            this.logDebug(`Skipping large file: ${filePath} (${this.humanSize(this.stats.currentFileSize)})`);
            return false;
        }
        if (this.config.includePatterns.length > 0) {
            const includeMatch = this.config.includePatterns.some(pattern => {
                const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
                return regex.test(filename) || regex.test(relativePath);
            });
            if (!includeMatch) {
                return false;
            }
        }
        const excludeMatch = this.config.excludePatterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
            return regex.test(filename) || regex.test(relativePath);
        });
        return !excludeMatch;
    }
    async getFileContent(filePath) {
        try {
            await fs.access(filePath, fs.constants.R_OK);
            const buffer = await readFileAsync(filePath);
            const isBinary = buffer.includes(0);
            if (isBinary) {
                return `[BINARY FILE - Content not captured. Size: ${this.humanSize(buffer.length)}]`;
            }
            return buffer.toString(this.config.encoding);
        } catch (error) {
            this.logError(`Cannot read file: ${filePath} - ${error.message}`);
            return `[READ ERROR: ${error.message}]`;
        }
    }
    async findAllFiles(dir, fileList = []) {
        try {
            const files = await readdirAsync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                let stats;
                try {
                    stats = await statAsync(filePath);
                } catch (error) {
                    continue;
                }
                if (stats.isDirectory()) {
                    if (this.shouldIncludeFile(filePath, filePath)) {
                        await this.findAllFiles(filePath, fileList);
                    }
                } else if (stats.isFile() || (this.config.followSymlinks && stats.isSymbolicLink())) {
                    fileList.push(filePath);
                }
            }
            return fileList;
        } catch (error) {
            this.logError(`Error finding files in ${dir}: ${error.message}`);
            return fileList;
        }
    }
    async createSnapshot(targetDir, outputFile) {
        this.log(`${this.emoji.snapshot} Starting advanced snapshot creation...`);
        this.log(`${this.emoji.folder} Target: ${targetDir}`);
        this.log(`${this.emoji.file} Output: ${outputFile}`);
        this.log(`${this.emoji.config} Format: ${this.config.outputFormat}`);
        this.stats.filesProcessed = 0;
        this.stats.filesSkipped = 0;
        this.stats.totalSize = 0;
        const allFiles = await this.findAllFiles(targetDir);
        this.log(`Found ${allFiles.length} files to process`);
        await this.performSecurityScan(targetDir);
        this.startPerformanceMonitor();
        await fs.ensureDir(path.dirname(outputFile));
        await this.writeHeader(outputFile, targetDir);
        for (let i = 0; i < allFiles.length; i++) {
            const filePath = allFiles[i];
            this.showProgress(i + 1, allFiles.length, 'Processing files');
            let stats;
            try {
                stats = await statAsync(filePath);
            } catch (error) {
                this.stats.filesSkipped++;
                continue;
            }
            this.stats.currentFileSize = stats.size;
            const relativePath = this.config.preservePath
                ? path.relative(targetDir, filePath)
                : path.basename(filePath);
            if (this.shouldIncludeFile(filePath, relativePath)) {
                this.stats.totalSize += stats.size;
                if (this.config.dryRun) {
                    this.logDebug(`DRY RUN: Would process ${relativePath}`);
                    this.stats.filesProcessed++;
                    continue;
                }
                try {
                    const content = await this.getFileContent(filePath);
                    const checksum = await this.calculateChecksum(filePath);
                    const metadata = await this.getFileMetadata(filePath);
                    await this.writeFileEntry(
                        outputFile,
                        relativePath,
                        content,
                        checksum,
                        metadata,
                        stats.size
                    );
                    this.stats.filesProcessed++;
                } catch (error) {
                    this.logError(`Failed to process ${relativePath}: ${error.message}`);
                    this.stats.filesSkipped++;
                }
            } else {
                this.stats.filesSkipped++;
            }
        }
        this.completeProgress();
        await this.writeFooter(outputFile);
        await this.gitIntegration(targetDir, outputFile);
        this.stopPerformanceMonitor();
        this.logSuccess(`Snapshot completed: ${this.stats.filesProcessed} files processed, ${this.stats.filesSkipped} files skipped`);
    }
    async writeHeader(outputFile, targetDir) {
        const timestamp = new Date().toISOString();
        switch (this.config.outputFormat) {
            case 'txt':
                await writeFileAsync(outputFile,
                    `CHAPSNAP SNAPSHOT REPORT\n` +
                    `========================\n` +
                    `Created: ${timestamp}\n` +
                    `Target: ${targetDir}\n` +
                    `========================\n\n`
                );
                break;
            case 'md':
                await writeFileAsync(outputFile,
                    `# ChapSnap Snapshot Report\n\n` +
                    `**Created:** ${timestamp}\n` +
                    `**Target:** ${targetDir}\n\n`
                );
                break;
            case 'html':
                await writeFileAsync(outputFile,
                    `<!DOCTYPE html>\n` +
                    `<html>\n` +
                    `<head>\n` +
                    `<title>ChapSnap Report</title>\n` +
                    `<style>body{font-family: Arial, sans-serif; margin: 20px;}</style>\n` +
                    `</head>\n` +
                    `<body>\n` +
                    `<h1>ChapSnap Snapshot Report</h1>\n` +
                    `<p><strong>Created:</strong> ${timestamp}</p>\n` +
                    `<p><strong>Target:</strong> ${targetDir}</p>\n` +
                    `<hr>\n`
                );
                break;
        }
    }
    async writeFileEntry(outputFile, relativePath, content, checksum, metadata, size) {
        const extension = path.extname(relativePath).slice(1) || 'txt';
        switch (this.config.outputFormat) {
            case 'txt':
                await fs.appendFile(outputFile,
                    `FILE: ${relativePath}\n` +
                    `CHECKSUM (${this.config.checksumAlgorithm}): ${checksum}\n` +
                    `SIZE: ${size} bytes\n` +
                    `METADATA:\n${JSON.stringify(metadata, null, 2)}\n` +
                    `CONTENT:\n` +
                    `=============\n` +
                    `${content}\n` +
                    `=============\n\n`
                );
                break;
            case 'md':
                await fs.appendFile(outputFile,
                    `## ${relativePath}\n\n` +
                    `- **Checksum (${this.config.checksumAlgorithm}):** ${checksum}\n` +
                    `- **Size:** ${size} bytes\n\n` +
                    `**Metadata:**\n` +
                    `\\`\\`\\`\n` +
                    `${JSON.stringify(metadata, null, 2)}\n` +
                    `\\`\\`\\`\n\n` +
                    `**Content:**\n` +
                    `\\`\\`\\`${extension}\n` +
                    `${content}\n` +
                    `\\`\\`\\`\n\n`
                );
                break;
            case 'html':
                await fs.appendFile(outputFile,
                    `<div class='file'>\n` +
                    `<h2>${relativePath}</h2>\n` +
                    `<p><strong>Checksum (${this.config.checksumAlgorithm}):</strong> ${checksum}</p>\n` +
                    `<p><strong>Size:</strong> ${size} bytes</p>\n` +
                    `<pre><code>${JSON.stringify(metadata, null, 2)}</code></pre>\n` +
                    `<h3>Content:</h3>\n` +
                    `<pre><code class='language-${extension}'>${content}</code></pre>\n` +
                    `</div>\n` +
                    `<hr>\n`
                );
                break;
        }
    }
    async writeFooter(outputFile) {
        switch (this.config.outputFormat) {
            case 'txt':
                await fs.appendFile(outputFile,
                    `========================\n` +
                    `SUMMARY:\n` +
                    `Files processed: ${this.stats.filesProcessed}\n` +
                    `Files skipped: ${this.stats.filesSkipped}\n` +
                    `Total size: ${this.humanSize(this.stats.totalSize)}\n` +
                    `========================\n`
                );
                break;
            case 'md':
                await fs.appendFile(outputFile,
                    `## Summary\n\n` +
                    `- **Files processed:** ${this.stats.filesProcessed}\n` +
                    `- **Files skipped:** ${this.stats.filesSkipped}\n` +
                    `- **Total size:** ${this.humanSize(this.stats.totalSize)}\n`
                );
                break;
            case 'html':
                await fs.appendFile(outputFile,
                    `<h2>Summary</h2>\n` +
                    `<ul>\n` +
                    `<li><strong>Files processed:</strong> ${this.stats.filesProcessed}</li>\n` +
                    `<li><strong>Files skipped:</strong> ${this.stats.filesSkipped}</li>\n` +
                    `<li><strong>Total size:</strong> ${this.humanSize(this.stats.totalSize)}</li>\n` +
                    `</ul>\n` +
                    `</body>\n` +
                    `</html>\n`
                );
                break;
        }
    }
    async generateReports(outputFile, targetDir) {
        if (this.config.jsonReport) {
            const jsonFile = `${outputFile}.report.json`;
            const report = {
                snapshot: {
                    target: targetDir,
                    output: outputFile,
                    timestamp: new Date().toISOString(),
                    files_processed: this.stats.filesProcessed,
                    files_skipped: this.stats.filesSkipped,
                    total_size_bytes: this.stats.totalSize,
                    total_size_human: this.humanSize(this.stats.totalSize),
                    format: this.config.outputFormat
                },
                statistics: {
                    success: true,
                    duration_seconds: (this.stats.endTime - this.stats.startTime) / 1000,
                    average_file_size: this.stats.totalSize / (this.stats.filesProcessed || 1)
                }
            };
            await writeFileAsync(jsonFile, JSON.stringify(report, null, 2));
            this.logSuccess(`JSON report generated: ${jsonFile}`);
        }
        if (this.config.htmlReport) {
            const htmlFile = `${outputFile}.report.html`;
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>ChapSnap Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .stat { margin: 10px 0; }
    </style>
</head>
<body>
    <h1>ChapSnap Analysis Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <div class="stat">Files Processed: ${this.stats.filesProcessed}</div>
        <div class="stat">Files Skipped: ${this.stats.filesSkipped}</div>
        <div class="stat">Total Size: ${this.humanSize(this.stats.totalSize)}</div>
        <div class="stat">Target Directory: ${targetDir}</div>
        <div class="stat">Generated: ${new Date().toString()}</div>
    </div>
</body>
</html>`;
            await writeFileAsync(htmlFile, htmlContent);
            this.logSuccess(`HTML report generated: ${htmlFile}`);
        }
    }
    async autoCleanup() {
        if (!this.config.autoCleanup) return;
        this.log('Performing auto cleanup...');
        try {
            const files = await readdirAsync(this.config.snapshotDir);
            const snapshotFiles = files.filter(file => file.startsWith('snapshot_'));
            if (snapshotFiles.length > this.config.backupCount) {
                const toDelete = snapshotFiles.length - this.config.backupCount;
                this.log(`Removing ${toDelete} old snapshots`);
                for (let i = 0; i < toDelete; i++) {
                    const fileToDelete = path.join(this.config.snapshotDir, snapshotFiles[i]);
                    await fs.remove(fileToDelete);
                    this.logDebug(`Removed: ${snapshotFiles[i]}`);
                }
            }
        } catch (error) {
            this.logError(`Auto cleanup failed: ${error.message}`);
        }
    }
    async initialize(targetDir) {
        if (!await fs.pathExists(targetDir)) {
            throw new Error(`Target directory does not exist: ${targetDir}`);
        }
        try {
            await fs.access(path.dirname(this.config.snapshotDir), fs.constants.W_OK);
        } catch (error) {
            throw new Error(`No write permission for snapshot directory: ${this.config.snapshotDir}`);
        }
        await fs.ensureDir(this.config.snapshotDir);
        this.logSuccess(`Snapshot directory created: ${this.config.snapshotDir}`);
        await this.performHealthCheck();
        this.logSuccess('Environment initialized successfully');
    }
    async run(options = {}) {
        try {
            this.config = { ...this.config, ...options };
            if (this.config.configFile) {
                await this.loadConfig(this.config.configFile);
            }
            const targetDir = this.config.target || '.';
            const absoluteTargetDir = path.resolve(targetDir);
            await this.initialize(absoluteTargetDir);
            const timestamp = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).replace(/[\/:, ]/g, '_');
            const outputFile = path.join(
                this.config.snapshotDir,
                `snapshot_${timestamp}.${this.config.outputFormat}`
            );
            if (!this.config.quiet) {
                this.output(`\n${this.colors.cyan}🐚 CHAPSNAP MAKER ULTIMATE v4.0.0${this.colors.reset}`);
                this.output(`${this.colors.blue}==========================================${this.colors.reset}`);
                this.output(`${this.colors.white}Started:${this.colors.reset} ${new Date()}`);
                this.output(`${this.colors.white}Target:${this.colors.reset} ${absoluteTargetDir}`);
                this.output(`${this.colors.white}Output:${this.colors.reset} ${outputFile}`);
                this.output(`${this.colors.blue}==========================================${this.colors.reset}\n`);
            }
            this.stats.startTime = Date.now();
            await this.createSnapshot(absoluteTargetDir, outputFile);
            this.stats.endTime = Date.now();
            await this.generateReports(outputFile, absoluteTargetDir);
            await this.autoCleanup();
            if (!this.config.quiet) {
                const duration = (this.stats.endTime - this.stats.startTime) / 1000;
                this.output(`\n${this.colors.green}==========================================${this.colors.reset}`);
                this.output(`${this.colors.green}🎉 CHAPSNAP - SNAPSHOT COMPLETE${this.colors.reset}`);
                this.output(`${this.colors.green}==========================================${this.colors.reset}`);
                this.output(`${this.colors.white}📁 Target:${this.colors.reset} ${absoluteTargetDir}`);
                this.output(`${this.colors.white}💾 Output:${this.colors.reset} ${outputFile}`);
                this.output(`${this.colors.white}📊 Size:${this.colors.reset} ${this.humanSize(this.stats.totalSize)}`);
                this.output(`${this.colors.white}📄 Files processed:${this.colors.reset} ${this.stats.filesProcessed}`);
                this.output(`${this.colors.white}🚫 Files skipped:${this.colors.reset} ${this.stats.filesSkipped}`);
                this.output(`${this.colors.white}⏱️  Duration:${this.colors.reset} ${duration.toFixed(2)} seconds`);
                this.output(`${this.colors.white}📈 Rate:${this.colors.reset} ${(this.stats.filesProcessed / duration).toFixed(2)} files/sec`);
                this.output(`${this.colors.green}==========================================${this.colors.reset}`);
            }
            return {
                success: true,
                filesProcessed: this.stats.filesProcessed,
                filesSkipped: this.stats.filesSkipped,
                totalSize: this.stats.totalSize,
                outputFile: outputFile,
                duration: (this.stats.endTime - this.stats.startTime) / 1000
            };
        } catch (error) {
            this.logError(`Snapshot failed: ${error.message}`);
            throw error;
        }
    }
}
if (require.main === module) {
    const chapsnap = new ChapSnap();
    const args = process.argv.slice(2);
    const options = {};
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '-t':
            case '--target':
                options.target = args[++i];
                break;
            case '-o':
            case '--output':
                options.snapshotDir = args[++i];
                break;
            case '-f':
            case '--format':
                options.outputFormat = args[++i];
                break;
            case '-v':
            case '--verbose':
                options.verbose = true;
                options.logLevel = 'info';
                break;
            case '-d':
            case '--debug':
                options.debug = true;
                options.verbose = true;
                options.logLevel = 'debug';
                break;
            case '-q':
            case '--quiet':
                options.quiet = true;
                options.verbose = false;
                break;
            case '--json-report':
                options.jsonReport = true;
                break;
            case '--html-report':
                options.htmlReport = true;
                break;
            case '--health-check':
                options.healthCheck = true;
                break;
            case '--performance-monitor':
                options.performanceMonitor = true;
                break;
        }
    }
    chapsnap.run(options).catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}
module.exports = ChapSnap;
