#!/usr/bin/env bash

set -euo pipefail

source "$(dirname "$0")/version-utils.sh"

increment_version() {
    local part="$1"
    local current_version="$2"

    local major minor patch
    IFS='.' read -r major minor patch <<< "${current_version}"

    local pre_release=""
    if [[ "${patch}" =~ -([a-zA-Z0-9_-]+) ]]; then
        pre_release="-${BASH_REMATCH[1]}"
        patch="${patch%%-*}"
    fi

    case "${part}" in
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
            log_error "Invalid version part: ${part}. Use major, minor, or patch."
            return 1
            ;;
    esac

    echo "${major}.${minor}.${patch}${pre_release}"
}

increment_build_number() {
    local current_build_number="$1"

    if [[ ! "${current_build_number}" =~ ^[0-9]+$ ]]; then
        echo "1"
        return
    fi

    echo "$((current_build_number + 1))"
}

update_version() {
    local part="$1"
    local current_version current_build_number new_version new_build_number

    if ! current_version=$(get_version_field ".app.version"); then
        exit 1
    fi

    if ! current_build_number=$(get_version_field ".app.buildNumber"); then
        current_build_number="1"
    fi

    log "Current version: ${current_version}"
    log "Current build number: ${current_build_number}"

    new_version=$(increment_version "${part}" "${current_version}")
    new_build_number=$(increment_build_number "${current_build_number}")

    if ! validate_semantic_version "${new_version}"; then
        exit 1
    fi

    update_version_field ".app.version" "${new_version}"
    update_version_field ".app.buildNumber" "${new_build_number}"
    update_version_field ".app.buildDate" "$(get_current_timestamp)"

    log "New version: ${new_version}"
    log "New build number: ${new_build_number}"
}

show_current_version() {
    local version build_number build_date build_id

    if version=$(get_version_field ".app.version"); then
        build_number=$(get_version_field ".app.buildNumber")
        build_date=$(get_version_field ".app.buildDate")
        build_id=$(get_version_field ".app.buildId")

        echo "=== Current Version Information ==="
        echo "Version: ${version}"
        echo "Build Number: ${build_number}"
        echo "Build Date: ${build_date}"
        echo "Build ID: ${build_id}"
        echo "==================================="
    else
        exit 1
    fi
}

usage() {
    cat << EOF
Usage: $0 <command> [args]

Commands:
    show                    Show current version information
    major                   Increment major version (X.0.0)
    minor                   Increment minor version (x.X.0)
    patch                   Increment patch version (x.x.X)
    build                   Increment build number only

Examples:
    $0 show
    $0 patch
    $0 minor
    $0 major
    $0 build

Environment:
    VERSION_DEBUG=true      Enable debug output
EOF
}

main() {
    local command="${1:-}"

    case "${command}" in
        show)
            show_current_version
            ;;
        major|minor|patch)
            log "Incrementing ${command} version"
            update_version "${command}"
            ;;
        build)
            log "Incrementing build number"
            local current_build_number new_build_number
            current_build_number=$(get_version_field ".app.buildNumber")
            new_build_number=$(increment_build_number "${current_build_number}")
            update_version_field ".app.buildNumber" "${new_build_number}"
            update_version_field ".app.buildDate" "$(get_current_timestamp)"
            log "New build number: ${new_build_number}"
            ;;
        -h|--help|help)
            usage
            ;;
        *)
            log_error "Unknown command: ${command}"
            usage
            exit 1
            ;;
    esac
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        usage
        exit 1
    fi
    main "$@"
fi
