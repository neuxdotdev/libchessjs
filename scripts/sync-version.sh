#!/usr/bin/env bash

set -euo pipefail

source "$(dirname "$0")/version-utils.sh"

readonly LOCK_FILE="${ROOT_DIR}/.version.lock"
readonly MAX_RETRIES=3
readonly RETRY_DELAY=2

acquire_lock() {
    local retries=0
    while [[ ${retries} -lt ${MAX_RETRIES} ]]; do
        if (set -o noclobber; echo "$$" > "${LOCK_FILE}") 2>/dev/null; then
            trap 'release_lock' EXIT
            trap 'release_lock; exit 1' INT TERM
            return 0
        fi

        local lock_pid
        lock_pid=$(cat "${LOCK_FILE}" 2>/dev/null || echo "")

        if [[ -n "${lock_pid}" ]] && ! ps -p "${lock_pid}" > /dev/null 2>&1; then
            log_debug "Removing stale lock file (PID: ${lock_pid})"
            rm -f "${LOCK_FILE}"
        else
            log_debug "Waiting for lock file... (attempt $((retries + 1))/${MAX_RETRIES})"
            sleep ${RETRY_DELAY}
        fi

        retries=$((retries + 1))
    done

    log_error "Could not acquire lock after ${MAX_RETRIES} attempts"
    return 1
}

release_lock() {
    if [[ -f "${LOCK_FILE}" ]] && [[ $$ -eq $(cat "${LOCK_FILE}") ]]; then
        rm -f "${LOCK_FILE}"
        log_debug "Released version lock"
    fi
}

validate_package_json() {
    if [[ ! -f "${ROOT_DIR}/${PACKAGE_FILE}" ]]; then
        log_error "Package file not found: ${PACKAGE_FILE}"
        return 1
    fi

    if ! jq empty "${ROOT_DIR}/${PACKAGE_FILE}" 2>/dev/null; then
        log_error "Invalid JSON in package file"
        return 1
    fi
}

backup_file() {
    local file="$1"
    local backup_file="${file}.bak.$(date +%Y%m%d_%H%M%S)"

    if [[ -f "${file}" ]]; then
        cp "${file}" "${backup_file}"
        log_debug "Created backup: ${backup_file}"
        echo "${backup_file}"
    fi
}

update_package_version() {
    local version="$1"
    local tmp_file
    local backup_file

    tmp_file=$(mktemp)
    backup_file=$(backup_file "${ROOT_DIR}/${PACKAGE_FILE}")

    log_debug "Updating package.json version to: ${version}"

    if ! jq --arg version "${version}" '.version = $version' "${ROOT_DIR}/${PACKAGE_FILE}" > "${tmp_file}"; then
        log_error "Failed to update package.json version"
        rm -f "${tmp_file}"
        return 1
    fi

    if ! mv "${tmp_file}" "${ROOT_DIR}/${PACKAGE_FILE}"; then
        log_error "Failed to replace package.json"
        rm -f "${tmp_file}"
        return 1
    fi

    log "Updated package.json version to ${version}"
}

generate_semantic_version() {
    local version="$1"
    local build_number="$2"
    local build_date=$(date -u +"%Y%m%d")
    echo "${version}+${build_number}.${build_date}"
}

synchronize_all_files() {
    local version build_date build_number

    log "Starting version synchronization"

    if ! version=$(get_version_field ".app.version"); then
        return 1
    fi

    if ! build_date=$(get_version_field ".app.buildDate"); then
        build_date=$(get_current_timestamp)
        update_version_field ".app.buildDate" "${build_date}"
    fi

    if ! build_number=$(get_version_field ".app.buildNumber"); then
        build_number="1"
        update_version_field ".app.buildNumber" "${build_number}"
    fi

    local build_id=$(generate_build_id "${version}" "${build_number}")
    local semantic_version=$(generate_semantic_version "${version}" "${build_number}")

    update_version_field ".app.buildId" "${build_id}"
    update_version_field ".app.semanticVersion" "${semantic_version}"
    update_version_field ".metadata.lastUpdated" "$(get_current_timestamp)"

    validate_package_json
    update_package_version "${version}"

    log "Version synchronization completed: ${version} (build ${build_number})"
    log "Build ID: ${build_id}"
    log "Semantic Version: ${semantic_version}"
}

main() {
    local start_time
    start_time=$(date +%s)

    log_debug "Version synchronization started by user: $(whoami)"
    log_debug "Working directory: ${ROOT_DIR}"

    if ! acquire_lock; then
        exit 1
    fi

    if synchronize_all_files; then
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log "Synchronization completed successfully in ${duration} seconds"
    else
        log_error "Version synchronization failed"
        exit 1
    fi
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
