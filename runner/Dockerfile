# Image d'exécution de l'agent : Node 24, pnpm, Git, OpenCode,
# dépendances système de Chromium pour Playwright.
FROM node:24-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=true

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates jq ripgrep coreutils \
 && npx -y playwright@latest install-deps chromium \
 && rm -rf /var/lib/apt/lists/*

# OpenCode : version figée par l'argument, à mettre à jour volontairement.
ARG OPENCODE_VERSION=latest
RUN npm install -g "opencode-ai@${OPENCODE_VERSION}" pnpm

RUN mkdir -p /ms-playwright /workspace /run-logs /home/node/.local/share/opencode /home/node/.local/share/pnpm/store \
 && chown -R node:node /ms-playwright /workspace /run-logs /home/node

# Outillage du run : propriété de root, en lecture seule pour l'agent (utilisateur node)
COPY agent-loop.sh run-checks.mjs /runner/
COPY opencode/ /runner/opencode/
RUN chmod 755 /runner/agent-loop.sh && chmod -R a+rX,go-w /runner

USER node
WORKDIR /workspace
RUN git config --global user.name "agent" \
 && git config --global user.email "agent@localhost" \
 && git config --global init.defaultBranch main \
 && git config --global --add safe.directory '*' \
 && pnpm config set store-dir /home/node/.local/share/pnpm/store

ENTRYPOINT ["/runner/agent-loop.sh"]
