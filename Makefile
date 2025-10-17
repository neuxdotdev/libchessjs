VERSION_FILE := version.json
PACKAGE_FILE := package.json
SCRIPTS_DIR := scripts

ifeq ($(shell test -f $(VERSION_FILE) && echo exists),exists)
APP_VERSION := $(shell jq -r '.app.version // "unknown"' $(VERSION_FILE))
BUILD_NUMBER := $(shell jq -r '.app.buildNumber // "unknown"' $(VERSION_FILE))
BUILD_ID := $(shell jq -r '.app.buildId // "unknown"' $(VERSION_FILE))
SEMANTIC_VERSION := $(shell jq -r '.app.semanticVersion // "unknown"' $(VERSION_FILE))
else
APP_VERSION := unknown
BUILD_NUMBER := unknown
BUILD_ID := unknown
SEMANTIC_VERSION := unknown
endif

.PHONY: help version sync-version increment-version validate-version build test clean debug

help:
	@echo "Available targets:"
	@echo "  version         - Show current version information"
	@echo "  sync-version    - Synchronize version across all files"
	@echo "  increment-version - Increment version (use: make increment-version PART=patch)"
	@echo "  validate-version - Validate version consistency"
	@echo "  build           - Build the project with version sync"
	@echo "  test            - Run tests with version validation"
	@echo "  debug           - Show debug information"
	@echo "  clean           - Clean temporary files"

version:
	@bash $(SCRIPTS_DIR)/increment-version.sh show

sync-version:
	@echo "Synchronizing version information..."
	@bash $(SCRIPTS_DIR)/sync-version.sh

increment-version:
ifndef PART
	@echo "Error: PART parameter required (major, minor, patch, build)"
	@exit 1
endif
	@bash $(SCRIPTS_DIR)/increment-version.sh $(PART)
	@bash $(SCRIPTS_DIR)/sync-version.sh

validate-version:
	@echo "Validating version consistency..."
	@bash $(SCRIPTS_DIR)/validate-version.sh

build: validate-version sync-version
	@echo "Building $(APP_VERSION) [Build: $(BUILD_NUMBER)]"
	@echo "Build ID: $(BUILD_ID)"
	@tsc --project tsconfig.json
	@echo "Build completed: $(SEMANTIC_VERSION)"

test: validate-version
	@echo "Running tests for $(APP_VERSION)"
	@npm test

run: build
	@echo "Starting application $(SEMANTIC_VERSION)"
	@node dist/index.js

debug:
	@echo "=== Debug Information ==="
	@echo "App Version: $(APP_VERSION)"
	@echo "Build Number: $(BUILD_NUMBER)"
	@echo "Build ID: $(BUILD_ID)"
	@echo "Semantic Version: $(SEMANTIC_VERSION)"
	@echo "Package Version: $(shell jq -r '.version // "unknown"' $(PACKAGE_FILE))"
	@echo "Node Version: $(shell node --version)"
	@echo "NPM Version: $(shell npm --version)"

clean:
	@rm -f .version.lock
	@rm -f $(PACKAGE_FILE).bak.*
	@find . -name "*.bak.*" -delete
	@echo "Cleaned version management artifacts"

install-hooks:
	@echo "Installing version validation git hook..."
	@cp scripts/validate-version.sh .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "Git hook installed"

production: validate-version
	@bash $(SCRIPTS_DIR)/increment-version.sh build
	@VERSION_DEBUG=true bash $(SCRIPTS_DIR)/sync-version.sh
	@make build

.DEFAULT_GOAL := help
