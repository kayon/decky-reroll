-include .env

DECKY_CLI := $(CURDIR)/cli/decky
PLUGIN_NAME="Reroll"
PLUGIN_DIR_NAME="decky-reroll"

DECK_USER=deck
DECK_PASS?=$(DECK_PWD)
DECK_HOST?=$(DECK_HOST)
DECK_PLUG_DIR=/home/deck/homebrew/plugins

.PHONY: all setup update build build-ui deploy deploy-ui
all: build-ui

setup:
	@if [ -f "$(DECKY_CLI)" ]; then \
		echo "Decky CLI already exists, skipping."; \
	else \
		SYSTEM_ARCH="$$(uname -a)"; \
		mkdir -p "$(CURDIR)/cli"; \
		if [[ "$$SYSTEM_ARCH" =~ "x86_64" ]]; then \
			if [[ "$$SYSTEM_ARCH" =~ "Linux" ]]; then \
				curl -L -o "$(DECKY_CLI)" "https://github.com/SteamDeckHomebrew/cli/releases/latest/download/decky-linux-x86_64"; \
			elif [[ "$$SYSTEM_ARCH" =~ "Darwin" ]]; then \
				curl -L -o "$(DECKY_CLI)" "https://github.com/SteamDeckHomebrew/cli/releases/latest/download/decky-macOS-x86_64"; \
			fi; \
		elif [[ "$$SYSTEM_ARCH" =~ "arm64" || "$$SYSTEM_ARCH" =~ "aarch64" ]]; then \
			if [[ "$$SYSTEM_ARCH" =~ "Linux" ]]; then \
				curl -L -o "$(DECKY_CLI)" "https://github.com/SteamDeckHomebrew/cli/releases/latest/download/decky-linux-aarch64"; \
			elif [[ "$$SYSTEM_ARCH" =~ "Darwin" ]]; then \
				curl -L -o "$(DECKY_CLI)" "https://github.com/SteamDeckHomebrew/cli/releases/latest/download/decky-macOS-aarch64"; \
			fi; \
		else \
			echo "System Arch not found! Not $$SYSTEM_ARCH"; \
			exit 1; \
		fi; \
		chmod +x "$(DECKY_CLI)"; \
	fi

update:
	@pnpm update @decky/ui --latest

build:
	@echo $sudopass | sudo -E $(DECKY_CLI) plugin build $(pwd)

deploy:
	@sshpass -p $(DECK_PASS) rsync -avz --rsync-path="sudo rsync" ./out/$(PLUGIN_NAME).zip $(DECK_USER)@$(DECK_HOST):$(DECK_PLUG_DIR)
	@sshpass -p $(DECK_PASS) ssh $(DECK_USER)@$(DECK_HOST) \
    		"RAW_DIR='$(DECK_PLUG_DIR)/$(PLUGIN_DIR_NAME)'; \
    		 CLEAN_DIR=\$$(echo \"\$$RAW_DIR\" | sed 's/ /-/g'); \
    		 ZIP_PATH='$(DECK_PLUG_DIR)/$(PLUGIN_NAME).zip'; \
    		 sudo rm -rf \"\$$CLEAN_DIR\"; \
    		 sudo mkdir -m 755 -p \"\$$CLEAN_DIR\" && \
    		 sudo chown $(DECK_USER):$(DECK_USER) \"\$$CLEAN_DIR\" && \
    		 sudo bsdtar -xzpf \"\$$ZIP_PATH\" -C \"\$$CLEAN_DIR\" --strip-components=1 && \
    		 sudo rm -f \"\$$ZIP_PATH\""
	@sshpass -p $(DECK_PASS) ssh $(DECK_USER)@$(DECK_HOST) "sudo systemctl restart plugin_loader"

build-ui:
	@pnpm run build

deploy-ui: build-ui
	@tar -czf ./out/$(PLUGIN_NAME)-ui.tar.gz -C ./dist .
	@sshpass -p $(DECK_PASS) rsync -avz --rsync-path="sudo rsync" ./out/$(PLUGIN_NAME)-ui.tar.gz $(DECK_USER)@$(DECK_HOST):$(DECK_PLUG_DIR)/
	@sshpass -p $(DECK_PASS) ssh $(DECK_USER)@$(DECK_HOST) \
		"RAW_DIR='$(DECK_PLUG_DIR)/$(PLUGIN_DIR_NAME)'; \
		 CLEAN_DIR=\$$(echo \"\$$RAW_DIR\" | sed 's/ /-/g'); \
		 TAR_PATH='$(DECK_PLUG_DIR)/$(PLUGIN_NAME)-ui.tar.gz'; \
		 sudo mkdir -p \"\$$CLEAN_DIR/dist\"; \
		 sudo rm -rf \"\$$CLEAN_DIR/dist/\"*; \
		 sudo tar -xzf \"\$$TAR_PATH\" -C \"\$$CLEAN_DIR/dist\"; \
		 sudo rm -f \"\$$TAR_PATH\""
