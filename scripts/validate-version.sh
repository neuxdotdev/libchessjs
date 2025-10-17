#!/usr/bin/env bash

set -euo pipefail

source "$(dirname "$0")/version-utils.sh"

validate_version_consistency() {
    local version_file_version package_file_version
    local errors=0

    log "Validating version consistency across files"

    if ! version_file_version=$(get_version_field ".app.version"); then
        errors=$((errors + 1))
    fi

    if ! package_file_version=$(jq -r '.version // "unknown"' "${ROOT_DIR}/${PACKAGE_FILE}"); then
        log_error "Failed to read version from package.json"
        errors=$((errors + 1))
    fi

    if [[ "${version_file_version}" != "${package_file_version}" ]]; then
        log_error "Version mismatch: version.json (${version_file_version}) vs package.json (${package_file_version})"
        errors=$((errors + 1))
    else
        log_debug "Version consistency check passed: ${version_file_version}"
    fi

    return ${errors}
}

validate_build_metadata() {
    local build_date build_number build_id
    local errors=0

    if ! build_date=$(get_version_field ".app.buildDate"); then
        errors=$((errors + 1))
    fi

    if ! build_number=$(get_version_field ".app.buildNumber"); then
        errors=$((errors + 1))
    fi

    if ! build_id=$(get_version_field ".app.buildId"); then
        errors=$((errors + 1))
    fi

    if [[ -n "${build_date}" ]] && ! date -d "${build_date}" >/dev/null 2>&1; then
        log_error "Invalid build date format: ${build_date}"
        errors=$((errors + 1))
    fi

    if [[ -n "${build_number}" ]] && [[ ! "${build_number}" =~ ^[0-9]+$ ]]; then
        log_error "Invalid build number: ${build_number}"
        errors=$((errors + 1))
    fi

    if [[ ${errors} -eq 0 ]]; then
        log_debug "Build metadata validation passed"
    fi

    return ${errors}
}

check_file_permissions() {
    local files=("${VERSION_FILE}" "${PACKAGE_FILE}")
    local errors=0

    for file in "${files[@]}"; do
        if [[ -f "${ROOT_DIR}/${file}" ]]; then
            if [[ ! -w "${ROOT_DIR}/${file}" ]]; then
                log_error "File not writable: ${file}"
                errors=$((errors + 1))
            fi
        else
            log_error "File not found: ${file}"
            errors=$((errors + 1))
        fi
    done

    return ${errors}
}

main() {
    local total_errors=0

    log "Starting comprehensive version validation"

    if ! validate_version_consistency; then
        total_errors=$((total_errors + 1))
    fi

    if ! validate_build_metadata; then
        total_errors=$((total_errors + 1))
    fi

    if ! check_file_permissions; then
        total_errors=$((total_errors + 1))
    fi

    if [[ ${total_errors} -eq 0 ]]; then
        log "All version validations passed"
        exit 0
    else
        log_error "Version validation failed with ${total_errors} error(s)"
        exit 1
    fi
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
