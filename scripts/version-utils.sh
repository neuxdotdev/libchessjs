#!/usr/bin/env bash

set -euo pipefail

readonly VERSION_FILE="version.json"
readonly PACKAGE_FILE="package.json"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

VERSION_DEBUG=${VERSION_DEBUG:-false}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2
}

log_debug() {
    if [[ "${VERSION_DEBUG}" == "true" ]]; then
        echo "[DEBUG][$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2
    fi
}

log_error() {
    echo "[ERROR][$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2
}

validate_semantic_version() {
    local version="$1"
    if [[ ! "${version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9_-]+(\.[0-9]+)?)?(\+[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*)?$ ]]; then
        log_error "Invalid semantic version format: ${version}"
        return 1
    fi
    return 0
}

get_current_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

generate_build_id() {
    local version="$1"
    local build_number="$2"
    local timestamp=$(date -u +"%Y%m%d%H%M%S")
    echo "build-${version}-${build_number}-${timestamp}"
}

read_version_file() {
    local file_path="${ROOT_DIR}/${VERSION_FILE}"

    if [[ ! -f "${file_path}" ]]; then
        log_error "Version file not found: ${file_path}"
        return 1
    fi

    if ! jq empty "${file_path}" 2>/dev/null; then
        log_error "Invalid JSON in version file: ${file_path}"
        return 1
    fi

    cat "${file_path}"
}

get_version_field() {
    local field="$1"
    local version_data

    if ! version_data=$(read_version_file); then
        return 1
    fi

    local value
    if ! value=$(echo "${version_data}" | jq -r "${field} // empty"); then
        log_error "Failed to read field ${field} from version file"
        return 1
    fi

    if [[ -z "${value}" ]]; then
        log_error "Field ${field} is empty or not found"
        return 1
    fi

    echo "${value}"
}

update_version_field() {
    local field="$1"
    local value="$2"
    local tmp_file

    tmp_file=$(mktemp)
    
    if ! jq --arg field "${field}" --arg value "${value}" '
        if ($field | contains(".")) then
            ($field | split(".")) as $path |
            setpath($path; $value)
        else
            .[$field] = $value
        end' "${ROOT_DIR}/${VERSION_FILE}" > "${tmp_file}"; then
        log_error "Failed to update field ${field}"
        rm -f "${tmp_file}"
        return 1
    fi

    if ! mv "${tmp_file}" "${ROOT_DIR}/${VERSION_FILE}"; then
        log_error "Failed to replace version file"
        rm -f "${tmp_file}"
        return 1
    fi

    log_debug "Updated field ${field} to ${value}"
}
