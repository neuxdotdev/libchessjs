VERSION_FILE := version.json

APP_VERSION := $(shell jq -r '.app.version' $(VERSION_FILE))
BUILD_NUMBER := $(shell jq -r '.app.buildNumber' $(VERSION_FILE))
BUILD_ID := $(shell jq -r '.app.buildId' $(VERSION_FILE))

.PHONY: vr-build vr-run vr-test version vr-major vr-minor vr-patch

vr-build:
	@echo "Auto-updating version..."
	@bash scripts/smart-version.sh
	@echo "Building $(APP_VERSION) [Build: $(BUILD_NUMBER)]"
	@tsc
	@echo "Build complete: $(BUILD_ID)"

vr-run:
	@bash scripts/smart-version.sh
	@echo "Running $(APP_VERSION)"
	@node dist/index.js

vr-test:
	@bash scripts/smart-version.sh
	@echo "Testing $(APP_VERSION)"
	@npm vr-test

vr-version:
	@bash scripts/smart-version.sh show

vr-major:
	@bash scripts/smart-version.sh major

vr-minor:
	@bash scripts/smart-version.sh minor

vr-patch:
	@bash scripts/smart-version.sh patch

vr-info:
	@echo "Project: $(APP_VERSION)"
	@echo "Build: $(BUILD_NUMBER)"
	@echo "ID: $(BUILD_ID)"
