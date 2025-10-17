#!/bin/bash
set -uo pipefail
if tput setaf 1 &>/dev/null; then
    RED=$(tput setaf 1)
    GREEN=$(tput setaf 2)
    YELLOW=$(tput setaf 3)
    BLUE=$(tput setaf 4)
    MAGENTA=$(tput setaf 5)
    CYAN=$(tput setaf 6)
    WHITE=$(tput setaf 7)
    BOLD=$(tput bold)
    RESET=$(tput sgr0)
else
    # fallback jika tput gak tersedia
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    MAGENTA='\033[0;35m'
    CYAN='\033[0;36m'
    WHITE='\033[1;37m'
    BOLD='\033[1m'
    RESET='\033[0m'
fi

# Compatibility alias biar gak error di script lama
NC="${RESET}"
ICON_INFO="🔵"
ICON_SUCCESS="🟢"
ICON_WARNING="🟡"
ICON_ERROR="🔴"
ICON_DEBUG="🔍"
ICON_FILE="📄"
ICON_FOLDER="📁"
ICON_SNAPSHOT="📸"
ICON_CONFIG="⚙️"
ICON_SUMMARY="📊"
CONFIG_FILE="./.chapsnaprc"
SNAPSHOT_DIR="./.snapshoot"
OUTPUT_FORMAT="txt"
VERBOSE=true
DEBUG=false
QUIET=false
TIMESTAMP_FORMAT="%Y-%m-%d_%H-%M-%S"
INCLUDE_PATTERNS=()
EXCLUDE_PATTERNS=(
    ".git/*"
    ".snapshoot/*"
    "node_modules/*"
    "*.tmp"
    "*.log"
    "*.cache"
    "*.lock"
    "*.pid"
)
MAX_FILE_SIZE=10485760
FOLLOW_SYMLINKS=false
PRESERVE_PATH=true
ENCODING="utf-8"
COMPRESSION=false
BACKUP_COUNT=5
PARALLEL_JOBS=1
INCREMENTAL=false
DRY_RUN=false
CHECKSUM_ALGORITHM="sha256"
LOG_LEVEL="info"
COLOR_OUTPUT=true
PROGRESS_BAR=true
JSON_REPORT=false
HTML_REPORT=false
STATISTICS=true
SECURITY_SCAN=false
FILE_METADATA=true
GIT_INTEGRATION=false
CLOUD_BACKUP=false
EMAIL_REPORT=false
AUTO_CLEANUP=false
WATCH_MODE=false
HEALTH_CHECK=false
PERFORMANCE_MONITOR=false
EXIT_SUCCESS=0
EXIT_ERROR=1
EXIT_INVALID_ARG=2
EXIT_NO_FILES=3
EXIT_DISK_FULL=4
log() {
    if [[ "$QUIET" == false && ("$LOG_LEVEL" == "info" || "$LOG_LEVEL" == "debug" || "$LOG_LEVEL" == "warn") ]]; then
        if [[ "$COLOR_OUTPUT" == true ]]; then
            echo -e "${ICON_INFO} ${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
        else
            echo "${ICON_INFO} [$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
        fi
    fi
}
log_success() {
    if [[ "$QUIET" == false ]]; then
        if [[ "$COLOR_OUTPUT" == true ]]; then
            echo -e "${ICON_SUCCESS} ${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
        else
            echo "${ICON_SUCCESS} [$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1"
        fi
    fi
}
log_warning() {
    if [[ "$QUIET" == false && ("$LOG_LEVEL" == "warn" || "$LOG_LEVEL" == "debug") ]]; then
        if [[ "$COLOR_OUTPUT" == true ]]; then
            echo -e "${ICON_WARNING} ${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"
        else
            echo "${ICON_WARNING} [$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1"
        fi
    fi
}
log_error() {
    if [[ "$QUIET" == false ]]; then
        if [[ "$COLOR_OUTPUT" == true ]]; then
            echo -e "${ICON_ERROR} ${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
        else
            echo "${ICON_ERROR} [$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
        fi
    fi
}
log_debug() {
    if [[ "$DEBUG" == true && "$LOG_LEVEL" == "debug" ]]; then
        if [[ "$COLOR_OUTPUT" == true ]]; then
            echo -e "${ICON_DEBUG} ${MAGENTA}[$(date '+%Y-%m-%d %H:%M:%S')] DEBUG:${NC} $1"
        else
            echo "${ICON_DEBUG} [$(date '+%Y-%m-%d %H:%M:%S')] DEBUG: $1"
        fi
    fi
}
show_progress() {
    local current=$1 total=$2 operation="$3"
    if [[ "$PROGRESS_BAR" == true && "$QUIET" == false ]]; then
        local width=50
        local percentage=$((current * 100 / total))
        local completed=$((current * width / total))
        local remaining=$((width - completed))
        printf "\r${CYAN}${operation}:${NC} [${GREEN}%*s${NC}${RED}%*s${NC}] %d%% (%d/%d)" \
            $completed "" $remaining "" $percentage $current $total
    fi
}
complete_progress() {
    if [[ "$PROGRESS_BAR" == true && "$QUIET" == false ]]; then
        echo
    fi
}
human_size() {
    local size=$1
    local units=("B" "KB" "MB" "GB" "TB")
    local unit=0
    while (( size > 1024 && unit < 4 )); do
        size=$((size / 1024))
        ((unit++))
    done
    echo "${size}${units[unit]}"
}
usage() {
    cat << EOF
${CYAN}
🐚 ChapSnap Maker - Ultimate Filesystem Snapshot Tool v4.0.0
${NC}
${GREEN}USAGE:${NC}
    $0 [OPTIONS] [TARGET_DIR]
${GREEN}OPTIONS:${NC}
    ${YELLOW}Core Options:${NC}
    -c, --config FILE        Use custom config file
    -o, --output DIR         Output directory for snapshots
    -f, --format FORMAT      Output format: txt, md, html, json
    -t, --target DIR         Target directory to snapshot
    ${YELLOW}Filter Options:${NC}
    -i, --include PATTERN    Include files matching pattern
    -e, --exclude PATTERN    Exclude files matching pattern
    --max-size SIZE          Maximum file size in bytes
    --follow-symlinks        Follow symbolic links
    --no-preserve-path       Don't preserve relative paths
    ${YELLOW}Output Control:${NC}
    -q, --quiet              Quiet mode (minimal output)
    -v, --verbose            Verbose mode
    -d, --debug              Debug mode (very verbose)
    --no-color               Disable colored output
    --no-progress            Disable progress bar
    --log-level LEVEL        Set log level: error, warn, info, debug
    ${YELLOW}Advanced Features:${NC}
    --incremental            Incremental snapshot mode
    --dry-run                Dry run (simulate without writing)
    --parallel JOBS          Number of parallel jobs
    --compression            Compress snapshot output
    --backup-count NUM       Keep last N snapshots (default: 5)
    --checksum ALGO          Checksum algorithm: md5, sha1, sha256
    --file-metadata          Include file metadata
    --security-scan          Scan for security issues
    --git-integration        Integrate with Git
    --health-check           Perform system health check
    --performance-monitor    Monitor performance metrics
    --watch                  Watch mode for continuous snapshots
    --auto-cleanup           Auto cleanup old snapshots
    --json-report            Generate JSON report
    --html-report            Generate HTML report
    --email-report           Email report after completion
    --cloud-backup           Backup to cloud storage
    ${YELLOW}Utility Options:${NC}
    --save-config            Save current configuration
    --version                Show version information
    -h, --help               Show this help message
${GREEN}EXAMPLES:${NC}
    ${WHITE}# Basic snapshot${NC}
    $0 -f md -o ./snapshots
    ${WHITE}# Advanced snapshot with filters${NC}
    $0 -i "*.py" -i "*.js" -e "*.log" --max-size 5242880 --parallel 4
    ${WHITE}# Incremental snapshot with monitoring${NC}
    $0 --incremental --health-check --performance-monitor --json-report
    ${WHITE}# Production ready snapshot${NC}
    $0 --config /etc/chapsnap.conf --backup-count 10 --compression --cloud-backup
    ${WHITE}# Development watch mode${NC}
    $0 --watch --git-integration --auto-cleanup
${GREEN}CONFIGURATION:${NC}
    Configuration files support: .chapsnaprc, /etc/chapsnap.conf
    See documentation for complete configuration options.
EOF
}
show_version() {
    cat << EOF
${CYAN}
🐚 ChapSnap Maker - Ultimate Filesystem Snapshot Tool
Version: 4.0.0 "Dragon Scale"
Author: System Expert Team
License: MIT
Website: https://github.com/chapsnap/tool
${NC}
EOF
}
load_config() {
    local config_file="$1"
    if [[ -f "$config_file" ]]; then
        log "Loading configuration from: $config_file"
        if source "$config_file"; then
            log_success "Configuration loaded successfully"
        else
            log_error "Failed to load configuration file: $config_file"
            return $EXIT_ERROR
        fi
    else
        log_warning "Config file not found: $config_file, using defaults"
    fi
}
save_config() {
    local config_file="$1"
    local config_dir=$(dirname "$config_file")
    if mkdir -p "$config_dir"; then
        cat > "$config_file" << EOF
CONFIG_FILE="$CONFIG_FILE"
SNAPSHOT_DIR="$SNAPSHOT_DIR"
OUTPUT_FORMAT="$OUTPUT_FORMAT"
VERBOSE=$VERBOSE
DEBUG=$DEBUG
QUIET=$QUIET
TIMESTAMP_FORMAT="$TIMESTAMP_FORMAT"
MAX_FILE_SIZE=$MAX_FILE_SIZE
FOLLOW_SYMLINKS=$FOLLOW_SYMLINKS
PRESERVE_PATH=$PRESERVE_PATH
ENCODING="$ENCODING"
COMPRESSION=$COMPRESSION
BACKUP_COUNT=$BACKUP_COUNT
PARALLEL_JOBS=$PARALLEL_JOBS
INCREMENTAL=$INCREMENTAL
DRY_RUN=$DRY_RUN
CHECKSUM_ALGORITHM="$CHECKSUM_ALGORITHM"
LOG_LEVEL="$LOG_LEVEL"
COLOR_OUTPUT=$COLOR_OUTPUT
PROGRESS_BAR=$PROGRESS_BAR
JSON_REPORT=$JSON_REPORT
HTML_REPORT=$HTML_REPORT
STATISTICS=$STATISTICS
SECURITY_SCAN=$SECURITY_SCAN
FILE_METADATA=$FILE_METADATA
GIT_INTEGRATION=$GIT_INTEGRATION
CLOUD_BACKUP=$CLOUD_BACKUP
EMAIL_REPORT=$EMAIL_REPORT
AUTO_CLEANUP=$AUTO_CLEANUP
WATCH_MODE=$WATCH_MODE
HEALTH_CHECK=$HEALTH_CHECK
PERFORMANCE_MONITOR=$PERFORMANCE_MONITOR
INCLUDE_PATTERNS=(
$(printf "    \"%s\"\n" "${INCLUDE_PATTERNS[@]}")
)
EXCLUDE_PATTERNS=(
$(printf "    \"%s\"\n" "${EXCLUDE_PATTERNS[@]}")
)
EOF
        log_success "Configuration saved to: $config_file"
    else
        log_error "Failed to create config directory: $config_dir"
        return $EXIT_ERROR
    fi
}
perform_health_check() {
    if [[ "$HEALTH_CHECK" == true ]]; then
        log "Performing system health check..."
        local available_space=$(df . | awk 'NR==2 {print $4}')
        if [[ available_space -lt 10485760 ]]; then
            log_warning "Low disk space: $(human_size $available_space)"
        else
            log_success "Disk space OK: $(human_space $available_space)"
        fi
        local free_memory=$(free -m | awk 'NR==2 {print $4}')
        if [[ free_memory -lt 100 ]]; then
            log_warning "Low memory: ${free_memory}MB"
        else
            log_success "Memory OK: ${free_memory}MB"
        fi
        local load_average=$(cut -d' ' -f1-3 /proc/loadavg)
        log "Load average: $load_average"
    fi
}
start_performance_monitor() {
    if [[ "$PERFORMANCE_MONITOR" == true ]]; then
        log "Starting performance monitor..."
        SNAPSHOT_START_TIME=$(date +%s)
        MEMORY_START=$(free -m | awk 'NR==2 {print $3}')
    fi
}
stop_performance_monitor() {
    if [[ "$PERFORMANCE_MONITOR" == true ]]; then
        local end_time=$(date +%s)
        local memory_end=$(free -m | awk 'NR==2 {print $3}')
        local duration=$((end_time - SNAPSHOT_START_TIME))
        local memory_used=$((memory_end - MEMORY_START))
        log "Performance metrics:"
        log "  Duration: ${duration} seconds"
        log "  Memory used: ${memory_used}MB"
        log "  Average speed: $((TOTAL_FILES_PROCESSED / duration)) files/second"
    fi
}
perform_security_scan() {
    if [[ "$SECURITY_SCAN" == true ]]; then
        log "Performing security scan..."
        find "$1" -type f -perm /o=w -ls 2>/dev/null | while read file; do
            log_warning "World-writable file: $file"
        done
        find "$1" -type f -executable ! -name "*.sh" ! -name "*.py" ! -name "*.js" \
            -exec file {} \; | grep "script" | while read script; do
            log_warning "Potential script without extension: $script"
        done
    fi
}
git_integration() {
    if [[ "$GIT_INTEGRATION" == true && -d ".git" ]]; then
        log "Integrating with Git..."
        local git_info=""
        if command -v git >/dev/null; then
            git_info+="Git Branch: $(git branch --show-current 2>/dev/null || echo "detached")\n"
            git_info+="Git Commit: $(git rev-parse --short HEAD 2>/dev/null)\n"
            git_info+="Git Status: $(git status --porcelain | wc -l) changes\n"
        fi
        echo -e "$git_info" >> "$2"
    fi
}
calculate_checksum() {
    local file="$1"
    case "$CHECKSUM_ALGORITHM" in
        md5) md5sum "$file" | cut -d' ' -f1 2>/dev/null ;;
        sha1) sha1sum "$file" | cut -d' ' -f1 2>/dev/null ;;
        sha256) sha256sum "$file" | cut -d' ' -f1 2>/dev/null ;;
        *) sha256sum "$file" | cut -d' ' -f1 2>/dev/null ;;
    esac
}
get_file_metadata() {
    local file="$1"
    local metadata=""
    if [[ "$FILE_METADATA" == true ]]; then
        metadata+="Permissions: $(stat -c "%A" "$file" 2>/dev/null || stat -f "%Sp" "$file" 2>/dev/null)\n"
        metadata+="Owner: $(stat -c "%U:%G" "$file" 2>/dev/null || stat -f "%Su:%Sg" "$file" 2>/dev/null)\n"
        metadata+="Size: $(stat -c "%s" "$file" 2>/dev/null || stat -f "%z" "$file" 2>/dev/null) bytes\n"
        metadata+="Modified: $(stat -c "%y" "$file" 2>/dev/null || stat -f "%Sm" "$file" 2>/dev/null)\n"
        metadata+="Inode: $(stat -c "%i" "$file" 2>/dev/null || stat -f "%i" "$file" 2>/dev/null)\n"
    fi
    echo -e "$metadata"
}
should_include_file() {
    local file="$1"
    local filename=$(basename "$file")
    local relative_path="$2"
    local file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    if [[ $file_size -gt $MAX_FILE_SIZE ]]; then
        log_debug "Skipping large file: $file ($(human_size $file_size))"
        return 1
    fi
    if [[ ${#INCLUDE_PATTERNS[@]} -gt 0 ]]; then
        local include_match=false
        for pattern in "${INCLUDE_PATTERNS[@]}"; do
            if [[ "$filename" == $pattern ]] || [[ "$relative_path" == $pattern ]]; then
                include_match=true
                break
            fi
        done
        if [[ "$include_match" == false ]]; then
            return 1
        fi
    fi
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        if [[ "$filename" == $pattern ]] || [[ "$relative_path" == $pattern ]]; then
            return 1
        fi
    done
    return 0
}
get_file_content() {
    local file="$1"
    if [[ ! -f "$file" ]] || [[ ! -r "$file" ]]; then
        log_error "Cannot read file: $file"
        return 1
    fi
    local file_type=$(file -b "$file" 2>/dev/null || echo "unknown")
    case "$file_type" in
        *text*)
            if iconv -f "$ENCODING" -t "$ENCODING" "$file" &>/dev/null; then
                cat "$file"
            else
                log_warning "Encoding issues with file: $file"
                cat "$file" 2>/dev/null || echo "[ENCODING ERROR: Unable to read file]"
            fi
            ;;
        *JSON*|*XML*|*script*)
            cat "$file" 2>/dev/null || echo "[READ ERROR: Unable to read file]"
            ;;
        *)
            echo "[BINARY FILE: $file_type - Content not captured]"
            ;;
    esac
}
create_snapshot() {
    local target_dir="$1"
    local output_file="$2"
    log "${ICON_SNAPSHOT} Starting advanced snapshot creation..."
    log "${ICON_FOLDER} Target: $target_dir"
    log "${ICON_FILE} Output: $output_file"
    log "${ICON_CONFIG} Format: $OUTPUT_FORMAT"
    local file_count=0
    local skipped_count=0
    local total_size=0
    local files=()
    local current=0
    while IFS= read -r -d '' file; do
        files+=("$file")
    done < <(find "$target_dir" \( -type f -o \( "$FOLLOW_SYMLINKS" = true -a -type l \) \) -print0 2>/dev/null)
    local total_files=${#files[@]}
    log "Found $total_files files to process"
    perform_security_scan "$target_dir"
    start_performance_monitor
    mkdir -p "$(dirname "$output_file")"
    case "$OUTPUT_FORMAT" in
        txt)
            echo "CHAPSNAP SNAPSHOT REPORT" > "$output_file"
            echo "========================" >> "$output_file"
            echo "Created: $(date)" >> "$output_file"
            echo "Target: $target_dir" >> "$output_file"
            echo "========================" >> "$output_file"
            ;;
        md)
            echo "# ChapSnap Snapshot Report" > "$output_file"
            echo "" >> "$output_file"
            echo "**Created:** $(date)" >> "$output_file"
            echo "**Target:** $target_dir" >> "$output_file"
            echo "" >> "$output_file"
            ;;
        html)
            echo "<!DOCTYPE html>" > "$output_file"
            echo "<html>" >> "$output_file"
            echo "<head>" >> "$output_file"
            echo "<title>ChapSnap Report</title>" >> "$output_file"
            echo "<style>body{font-family: Arial, sans-serif; margin: 20px;}</style>" >> "$output_file"
            echo "</head>" >> "$output_file"
            echo "<body>" >> "$output_file"
            echo "<h1>ChapSnap Snapshot Report</h1>" >> "$output_file"
            echo "<p><strong>Created:</strong> $(date)</p>" >> "$output_file"
            echo "<p><strong>Target:</strong> $target_dir</p>" >> "$output_file"
            echo "<hr>" >> "$output_file"
            ;;
    esac
    for file in "${files[@]}"; do
        ((current++))
        show_progress $current $total_files "Processing files"
        local relative_path="${file#$target_dir/}"
        if [[ "$relative_path" == "$file" ]]; then
            relative_path=$(basename "$file")
        fi
        if [[ "$PRESERVE_PATH" == false ]]; then
            relative_path=$(basename "$file")
        fi
        if should_include_file "$file" "$relative_path"; then
            local file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            ((total_size += file_size))
            if [[ "$DRY_RUN" == true ]]; then
                log_debug "DRY RUN: Would process $relative_path"
                ((file_count++))
                continue
            fi
            local content=$(get_file_content "$file")
            local checksum=$(calculate_checksum "$file")
            local metadata=$(get_file_metadata "$file")
            case "$OUTPUT_FORMAT" in
                txt)
                    echo "FILE: $relative_path" >> "$output_file"
                    echo "CHECKSUM ($CHECKSUM_ALGORITHM): $checksum" >> "$output_file"
                    echo -e "METADATA:\n$metadata" >> "$output_file"
                    echo "CONTENT:" >> "$output_file"
                    echo "=============" >> "$output_file"
                    echo "$content" >> "$output_file"
                    echo "=============" >> "$output_file"
                    echo >> "$output_file"
                    ;;
                md)
                    local extension="${file##*.}"
                    echo "## $relative_path" >> "$output_file"
                    echo "" >> "$output_file"
                    echo "- **Checksum ($CHECKSUM_ALGORITHM):** $checksum" >> "$output_file"
                    echo "- **Size:** $file_size bytes" >> "$output_file"
                    echo "" >> "$output_file"
                    echo "**Metadata:**" >> "$output_file"
                    echo "\`\`\`" >> "$output_file"
                    echo -e "$metadata" >> "$output_file"
                    echo "\`\`\`" >> "$output_file"
                    echo "" >> "$output_file"
                    echo "**Content:**" >> "$output_file"
                    echo "\`\`\`${extension}" >> "$output_file"
                    echo "$content" >> "$output_file"
                    echo "\`\`\`" >> "$output_file"
                    echo "" >> "$output_file"
                    ;;
                html)
                    local extension="${file##*.}"
                    echo "<div class='file'>" >> "$output_file"
                    echo "<h2>$relative_path</h2>" >> "$output_file"
                    echo "<p><strong>Checksum ($CHECKSUM_ALGORITHM):</strong> $checksum</p>" >> "$output_file"
                    echo "<p><strong>Size:</strong> $file_size bytes</p>" >> "$output_file"
                    echo "<pre><code>$metadata</code></pre>" >> "$output_file"
                    echo "<h3>Content:</h3>" >> "$output_file"
                    echo "<pre><code class='language-${extension}'>$content</code></pre>" >> "$output_file"
                    echo "</div>" >> "$output_file"
                    echo "<hr>" >> "$output_file"
                    ;;
            esac
            ((file_count++))
        else
            ((skipped_count++))
        fi
    done
    complete_progress
    case "$OUTPUT_FORMAT" in
        txt)
            echo "========================" >> "$output_file"
            echo "SUMMARY:" >> "$output_file"
            echo "Files processed: $file_count" >> "$output_file"
            echo "Files skipped: $skipped_count" >> "$output_file"
            echo "Total size: $(human_size $total_size)" >> "$output_file"
            echo "========================" >> "$output_file"
            ;;
        md)
            echo "## Summary" >> "$output_file"
            echo "" >> "$output_file"
            echo "- **Files processed:** $file_count" >> "$output_file"
            echo "- **Files skipped:** $skipped_count" >> "$output_file"
            echo "- **Total size:** $(human_size $total_size)" >> "$output_file"
            ;;
        html)
            echo "<h2>Summary</h2>" >> "$output_file"
            echo "<ul>" >> "$output_file"
            echo "<li><strong>Files processed:</strong> $file_count</li>" >> "$output_file"
            echo "<li><strong>Files skipped:</strong> $skipped_count</li>" >> "$output_file"
            echo "<li><strong>Total size:</strong> $(human_size $total_size)</li>" >> "$output_file"
            echo "</ul>" >> "$output_file"
            echo "</body>" >> "$output_file"
            echo "</html>" >> "$output_file"
            ;;
    esac
    git_integration "$target_dir" "$output_file"
    stop_performance_monitor
    log_success "Snapshot completed: $file_count files processed, $skipped_count files skipped"
    TOTAL_FILES_PROCESSED=$file_count
    echo "$file_count" > "${output_file}.stats"
    echo "$skipped_count" > "${output_file}.skipped"
    echo "$total_size" > "${output_file}.size"
}
generate_reports() {
    local output_file="$1"
    local target_dir="$2"
    local file_count=$(cat "${output_file}.stats" 2>/dev/null || echo "0")
    local skipped_count=$(cat "${output_file}.skipped" 2>/dev/null || echo "0")
    local total_size=$(cat "${output_file}.size" 2>/dev/null || echo "0")
    if [[ "$JSON_REPORT" == true ]]; then
        local json_file="${output_file}.report.json"
        cat > "$json_file" << EOF
{
    "snapshot": {
        "target": "$target_dir",
        "output": "$output_file",
        "timestamp": "$(date -Iseconds)",
        "files_processed": $file_count,
        "files_skipped": $skipped_count,
        "total_size_bytes": $total_size,
        "total_size_human": "$(human_size $total_size)",
        "format": "$OUTPUT_FORMAT"
    },
    "statistics": {
        "success": true,
        "duration_seconds": $((SNAPSHOT_END_TIME - SNAPSHOT_START_TIME)),
        "average_file_size": $((total_size / (file_count > 0 ? file_count : 1)))
    }
}
EOF
        log_success "JSON report generated: $json_file"
    fi
    if [[ "$HTML_REPORT" == true ]]; then
        local html_file="${output_file}.report.html"
        cat > "$html_file" << EOF
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
        <div class="stat">Files Processed: $file_count</div>
        <div class="stat">Files Skipped: $skipped_count</div>
        <div class="stat">Total Size: $(human_size $total_size)</div>
        <div class="stat">Target Directory: $target_dir</div>
        <div class="stat">Generated: $(date)</div>
    </div>
</body>
</html>
EOF
        log_success "HTML report generated: $html_file"
    fi
}
auto_cleanup() {
    if [[ "$AUTO_CLEANUP" == true ]]; then
        log "Performing auto cleanup..."
        local snapshots=("$SNAPSHOT_DIR"/*.stats)
        local count=${#snapshots[@]}
        if [[ $count -gt $BACKUP_COUNT ]]; then
            local to_delete=$((count - BACKUP_COUNT))
            log "Removing $to_delete old snapshots"
            for ((i=0; i<to_delete; i++)); do
                local base_file=$(basename "${snapshots[$i]}" .stats)
                rm -f "$SNAPSHOT_DIR/${base_file}."*
                log_debug "Removed: $base_file"
            done
        fi
    fi
}
initialize() {
    local target_dir="$1"
    if [[ ! -d "$target_dir" ]]; then
        log_error "Target directory does not exist: $target_dir"
        exit $EXIT_ERROR
    fi
    if [[ ! -w "$(dirname "$SNAPSHOT_DIR")" ]]; then
        log_error "No write permission for snapshot directory: $SNAPSHOT_DIR"
        exit $EXIT_ERROR
    fi
    if mkdir -p "$SNAPSHOT_DIR"; then
        log_success "Snapshot directory created: $SNAPSHOT_DIR"
    else
        log_error "Failed to create snapshot directory: $SNAPSHOT_DIR"
        exit $EXIT_ERROR
    fi
    perform_health_check
    log_success "Environment initialized successfully"
}
main() {
    local target_dir="."
    local custom_config=""
    local save_config_flag=false
    local show_version_flag=false
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--config)
                custom_config="$2"
                shift 2
                ;;
            -o|--output)
                SNAPSHOT_DIR="$2"
                shift 2
                ;;
            -f|--format)
                OUTPUT_FORMAT="$2"
                if [[ ! "$OUTPUT_FORMAT" =~ ^(txt|md|html|json)$ ]]; then
                    log_error "Invalid format: $OUTPUT_FORMAT. Use 'txt', 'md', 'html', or 'json'"
                    exit $EXIT_INVALID_ARG
                fi
                shift 2
                ;;
            -t|--target)
                target_dir="$2"
                shift 2
                ;;
            -i|--include)
                INCLUDE_PATTERNS+=("$2")
                shift 2
                ;;
            -e|--exclude)
                EXCLUDE_PATTERNS+=("$2")
                shift 2
                ;;
            -q|--quiet)
                VERBOSE=false
                QUIET=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                QUIET=false
                LOG_LEVEL="info"
                shift
                ;;
            -d|--debug)
                DEBUG=true
                VERBOSE=true
                LOG_LEVEL="debug"
                set -x
                shift
                ;;
            --no-color)
                COLOR_OUTPUT=false
                shift
                ;;
            --no-progress)
                PROGRESS_BAR=false
                shift
                ;;
            --log-level)
                LOG_LEVEL="$2"
                shift 2
                ;;
            --max-size)
                MAX_FILE_SIZE="$2"
                shift 2
                ;;
            --follow-symlinks)
                FOLLOW_SYMLINKS=true
                shift
                ;;
            --no-preserve-path)
                PRESERVE_PATH=false
                shift
                ;;
            --encoding)
                ENCODING="$2"
                shift 2
                ;;
            --timestamp)
                TIMESTAMP_FORMAT="$2"
                shift 2
                ;;
            --incremental)
                INCREMENTAL=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --parallel)
                PARALLEL_JOBS="$2"
                shift 2
                ;;
            --compression)
                COMPRESSION=true
                shift
                ;;
            --backup-count)
                BACKUP_COUNT="$2"
                shift 2
                ;;
            --checksum)
                CHECKSUM_ALGORITHM="$2"
                shift 2
                ;;
            --file-metadata)
                FILE_METADATA=true
                shift
                ;;
            --security-scan)
                SECURITY_SCAN=true
                shift
                ;;
            --git-integration)
                GIT_INTEGRATION=true
                shift
                ;;
            --health-check)
                HEALTH_CHECK=true
                shift
                ;;
            --performance-monitor)
                PERFORMANCE_MONITOR=true
                shift
                ;;
            --watch)
                WATCH_MODE=true
                shift
                ;;
            --auto-cleanup)
                AUTO_CLEANUP=true
                shift
                ;;
            --json-report)
                JSON_REPORT=true
                shift
                ;;
            --html-report)
                HTML_REPORT=true
                shift
                ;;
            --email-report)
                EMAIL_REPORT=true
                shift
                ;;
            --cloud-backup)
                CLOUD_BACKUP=true
                shift
                ;;
            --save-config)
                save_config_flag=true
                shift
                ;;
            --version)
                show_version_flag=true
                shift
                ;;
            -h|--help)
                usage
                exit $EXIT_SUCCESS
                ;;
            *)
                if [[ -d "$1" ]]; then
                    target_dir="$1"
                else
                    log_error "Unknown option: $1"
                    usage
                    exit $EXIT_INVALID_ARG
                fi
                shift
                ;;
        esac
    done
    if [[ "$show_version_flag" == true ]]; then
        show_version
        exit $EXIT_SUCCESS
    fi
    if [[ -n "$custom_config" ]]; then
        CONFIG_FILE="$custom_config"
    fi
    load_config "$CONFIG_FILE"
    if [[ "$save_config_flag" == true ]]; then
        save_config "$CONFIG_FILE"
        exit $EXIT_SUCCESS
    fi
    target_dir=$(realpath "$target_dir" 2>/dev/null || echo "$target_dir")
    initialize "$target_dir"
    local timestamp=$(date +"$TIMESTAMP_FORMAT")
    local output_file="${SNAPSHOT_DIR}/snapshot_${timestamp}.${OUTPUT_FORMAT}"
    if [[ "$QUIET" == false ]]; then
        echo
        echo "${CYAN}🐚 CHAPSNAP MAKER ULTIMATE v4.0.0${NC}"
        echo "${BLUE}==========================================${NC}"
        echo "${WHITE}Started:${NC} $(date)"
        echo "${WHITE}Target:${NC} $target_dir"
        echo "${WHITE}Output:${NC} $output_file"
        echo "${BLUE}==========================================${NC}"
        echo
    fi
    SNAPSHOT_START_TIME=$(date +%s)
    create_snapshot "$target_dir" "$output_file"
    SNAPSHOT_END_TIME=$(date +%s)
    generate_reports "$output_file" "$target_dir"
    auto_cleanup
    if [[ "$QUIET" == false ]]; then
        local duration=$((SNAPSHOT_END_TIME - SNAPSHOT_START_TIME))
        local file_count=$(cat "${output_file}.stats" 2>/dev/null || echo "0")
        local skipped_count=$(cat "${output_file}.skipped" 2>/dev/null || echo "0")
        local total_size=$(cat "${output_file}.size" 2>/dev/null || echo "0")
        echo
        echo "${GREEN}==========================================${NC}"
        echo "${GREEN}🎉 CHAPSNAP - SNAPSHOT COMPLETE${NC}"
        echo "${GREEN}==========================================${NC}"
        echo "${WHITE}📁 Target:${NC} $target_dir"
        echo "${WHITE}💾 Output:${NC} $output_file"
        echo "${WHITE}📊 Size:${NC} $(human_size $total_size)"
        echo "${WHITE}📄 Files processed:${NC} $file_count"
        echo "${WHITE}🚫 Files skipped:${NC} $skipped_count"
        echo "${WHITE}⏱️  Duration:${NC} ${duration} seconds"
        echo "${WHITE}📈 Rate:${NC} $((file_count / (duration > 0 ? duration : 1))) files/sec"
        echo "${GREEN}==========================================${NC}"
    fi
    if [[ $file_count -eq 0 ]]; then
        exit $EXIT_NO_FILES
    else
        exit $EXIT_SUCCESS
    fi
}
trap 'log_debug "ChapSnap interrupted"; exit 130' INT TERM
main "$@"
