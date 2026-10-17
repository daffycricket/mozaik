# Image d'exécution de l'agent du mode produit : Node 24, pnpm, Git, OpenCode,
# dépendances système de Chromium pour Playwright.
# Construite par mzk.sh depuis la copie de mozaik sur main, jamais depuis le clone d'un ticket.
# Toutes les versions sont figées, pour que l'image ne change que par un commit de runner/ :
# mise à jour volontaire décrite dans runner/README.md (« Versions de l'image »).
ARG NODE_IMAGE=node:24-bookworm@sha256:14078204b6bb268c107ceff6d3c43f45a888105e5c2b18b14c32b3409d93a1b0
FROM ${NODE_IMAGE}

# Playwright : version de @playwright/test du projet (package.json) ; pnpm : version de packageManager
ARG PLAYWRIGHT_VERSION=1.63.0
ARG PNPM_VERSION=12.8.1

ENV DEBIAN_FRONTEND=noninteractive \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=true

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates jq ripgrep coreutils \
 && npx -y "playwright@${PLAYWRIGHT_VERSION}" install-deps chromium \
 && rm -rf /var/lib/apt/lists/*

# OpenCode : version figée par l'argument, à mettre à jour volontairement.
ARG OPENCODE_VERSION=1.18.34
RUN npm install -g "opencode-ai@${OPENCODE_VERSION}" "pnpm@${PNPM_VERSION}"

RUN mkdir -p /ms-playwright /workspace /run-logs /home/node/.local/share/opencode /home/node/.local/share/pnpm/store \
 && chown -R node:node /ms-playwright /workspace /run-logs /home/node

# Outillage des phases : propriété de root, en lecture seule pour l'agent (utilisateur node)
COPY phase.sh checks.mjs verify-failures.mjs /runner/
COPY opencode/ /runner/opencode/
RUN chmod 755 /runner/phase.sh && chmod -R a+rX,go-w /runner

USER node
WORKDIR /workspace
RUN git config --global user.name "agent" \
 && git config --global user.email "agent@localhost" \
 && git config --global init.defaultBranch main \
 && git config --global --add safe.directory '*' \
 && pnpm config set store-dir /home/node/.local/share/pnpm/store

ENTRYPOINT ["/runner/phase.sh"]
