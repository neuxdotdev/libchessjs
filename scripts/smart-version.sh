#!/usr/bin/env bash

set -euo pipefail

VERSION_FILE="version.json"
PACKAGE_FILE="package.json"

get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

get_current_version() {
    jq -r '.app.version' "$VERSION_FILE" 2>/dev/null || echo "0.0.0"
}

get_current_build_number() {
    jq -r '.app.buildNumber' "$VERSION_FILE" 2>/dev/null || echo "0"
}

increment_build_number() {
    local current=$1
    echo $((current + 1))
}

generate_build_id() {
    local version=$1
    local build_number=$2
    local date_str=$(date -u +"%Y%m%d")
    echo "build-${build_number}-${date_str}"
}

generate_semantic_version() {
    local version=$1
    local build_number=$2
    local date_str=$(date -u +"%Y%m%d")
    echo "${version}+${build_number}.${date_str}"
}

auto_update_version() {
    local current_version=$(get_current_version)
    local current_build=$(get_current_build_number)
    local new_build=$(increment_build_number "$current_build")
    local new_build_id=$(generate_build_id "$current_version" "$new_build")
    local new_semantic_version=$(generate_semantic_version "$current_version" "$new_build")
    local timestamp=$(get_timestamp)

    jq \
        --arg version "$current_version" \
        --argjson build_number "$new_build" \
        --arg build_id "$new_build_id" \
        --arg semantic_version "$new_semantic_version" \
        --arg build_date "$timestamp" \
        --arg last_updated "$timestamp" \
        '
        .app.version = $version |
        .app.buildNumber = $build_number |
        .app.buildId = $build_id |
        .app.semanticVersion = $semantic_version |
        .app.buildDate = $build_date |
        .metadata.lastUpdated = $last_updated
        ' "$VERSION_FILE" > "${VERSION_FILE}.tmp"

    mv "${VERSION_FILE}.tmp" "$VERSION_FILE"

    jq --arg version "$current_version" '.version = $version' "$PACKAGE_FILE" > "${PACKAGE_FILE}.tmp"
    mv "${PACKAGE_FILE}.tmp" "$PACKAGE_FILE"

    echo "Auto-updated: v${current_version} build ${new_build}"
}

increment_version() {
    local part="$1"
    local current_version=$(get_current_version)
    local current_build=$(get_current_build_number)

    IFS='.' read -r major minor patch <<< "$current_version"

    case "$part" in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            echo "Invalid part: $part. Use major, minor, or patch."
            exit 1
            ;;
    esac

    local new_version="${major}.${minor}.${patch}"
    local timestamp=$(get_timestamp)

    jq \
        --arg version "$new_version" \
        --argjson build_number "1" \
        --arg build_date "$timestamp" \
        --arg last_updated "$timestamp" \
        '
        .app.version = $version |
        .app.buildNumber = $build_number |
        .app.buildDate = $build_date |
        .metadata.lastUpdated = $last_updated
        ' "$VERSION_FILE" > "${VERSION_FILE}.tmp"

    mv "${VERSION_FILE}.tmp" "$VERSION_FILE"

    echo "Version incremented: v${new_version}"
}

show_version() {
    local version=$(get_current_version)
    local build_number=$(get_current_build_number)
    local build_date=$(jq -r '.app.buildDate' "$VERSION_FILE")
    local build_id=$(jq -r '.app.buildId' "$VERSION_FILE")

    echo "Version: $version"
    echo "Build: $build_number"
    echo "Build ID: $build_id"
    echo "Last Updated: $build_date"
}

case "${1:-}" in
    "major"|"minor"|"patch")
        increment_version "$1"
        ;;
    "show")
        show_version
        ;;
    *)
        auto_update_version
        ;;
esac
