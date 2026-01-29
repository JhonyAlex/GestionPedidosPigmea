Initializing deployment
Cloning Repo github.com/JhonyAlex/GestionPedidosPigmea.git to /etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code: ✅
Cloning into '/etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code'...
remote: Enumerating objects: 367, done.
Cloned github.com/JhonyAlex/GestionPedidosPigmea.git: ✅
Build dockerfile: ✅
Source Type: github: ✅
#0 building with "default" instance using docker driver
#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.79kB done
#1 DONE 0.0s
#2 [internal] load metadata for docker.io/library/node:18-alpine
#2 DONE 0.4s
#3 [internal] load .dockerignore
#3 transferring context: 959B done
#3 DONE 0.0s
#4 [frontend-builder  1/13] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#4 DONE 0.0s
#5 [frontend-builder  2/13] WORKDIR /app
#5 CACHED
#6 [internal] load build context
#6 transferring context: 1.12MB 0.1s done
#6 DONE 0.1s
#7 [frontend-builder  3/13] COPY package*.json ./
#7 DONE 0.0s
#8 [frontend-builder  4/13] COPY tsconfig*.json ./
#8 DONE 0.0s
#9 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#9 ...
#10 [frontend-builder  5/13] COPY vite.config.ts ./
#10 DONE 0.0s
#11 [frontend-builder  6/13] COPY tailwind.config.js ./
#11 DONE 0.0s
#12 [frontend-builder  7/13] COPY postcss.config.js ./
#12 DONE 0.0s
#9 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#9 0.338 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/main/x86_64/APKINDEX.tar.gz
#9 0.542 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/community/x86_64/APKINDEX.tar.gz
#9 1.177 (1/8) Installing postgresql-common (1.2-r1)
#9 1.192 Executing postgresql-common-1.2-r1.pre-install
#9 1.218 (2/8) Installing lz4-libs (1.10.0-r0)
#9 1.287 (3/8) Installing libpq (17.7-r0)
#9 1.308 (4/8) Installing ncurses-terminfo-base (6.5_p20241006-r3)
#9 1.338 (5/8) Installing libncursesw (6.5_p20241006-r3)
#9 1.355 (6/8) Installing readline (8.2.13-r0)
#9 1.372 (7/8) Installing zstd-libs (1.5.6-r2)
#9 1.398 (8/8) Installing postgresql17-client (17.7-r0)
#9 1.461 Executing busybox-1.37.0-r12.trigger
#9 1.470 Executing postgresql-common-1.2-r1.trigger
#9 1.477 * Setting postgresql17 as the default version
#9 1.656 WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/main: No such file or directory
#9 1.656 WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/community: No such file or directory
#9 1.667 OK: 15 MiB in 25 packages
#9 DONE 2.1s
#13 [frontend-builder  8/13] RUN npm ci
#13 ...
#14 [stage-1  4/10] COPY backend/package*.json ./backend/
#14 DONE 0.1s
#15 [stage-1  5/10] WORKDIR /app/backend
#15 DONE 0.1s
#16 [stage-1  6/10] RUN npm ci --only=production
#16 1.035 npm warn config only Use `--omit=dev` to omit dev dependencies from the install.
#16 6.677
#16 6.677 added 128 packages, and audited 129 packages in 6s
#16 6.678
#16 6.678 17 packages are looking for funding
#16 6.678   run `npm fund` for details
#16 6.709
#16 6.709 4 high severity vulnerabilities
#16 6.709
#16 6.709 To address all issues, run:
#16 6.709   npm audit fix
#16 6.709
#16 6.709 Run `npm audit` for details.
#16 6.715 npm notice
#16 6.715 npm notice New major version of npm available! 10.8.2 -> 11.8.0
#16 6.715 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#16 6.715 npm notice To update run: npm install -g npm@11.8.0
#16 6.715 npm notice
#16 DONE 7.0s
#13 [frontend-builder  8/13] RUN npm ci
#13 2.618 npm warn EBADENGINE Unsupported engine {
#13 2.618 npm warn EBADENGINE   package: '@vitejs/plugin-react@5.0.1',
#13 2.618 npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
#13 2.618 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#13 2.618 npm warn EBADENGINE }
#13 ...
#17 [stage-1  7/10] WORKDIR /app
#17 DONE 0.1s
#18 [stage-1  8/10] COPY backend ./backend
#18 DONE 0.1s
#13 [frontend-builder  8/13] RUN npm ci
#13 14.78
#13 14.78 added 229 packages, and audited 230 packages in 14s
#13 14.78
#13 14.78 41 packages are looking for funding
#13 14.78   run `npm fund` for details
#13 14.80
#13 14.80 2 vulnerabilities (1 moderate, 1 high)
#13 14.80
#13 14.80 To address all issues, run:
#13 14.80   npm audit fix
#13 14.80
#13 14.80 Run `npm audit` for details.
#13 14.81 npm notice
#13 14.81 npm notice New major version of npm available! 10.8.2 -> 11.8.0
#13 14.81 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#13 14.81 npm notice To update run: npm install -g npm@11.8.0
#13 14.81 npm notice
#13 DONE 15.1s
#19 [frontend-builder  9/13] COPY src ./src
#19 DONE 0.0s
#20 [frontend-builder 10/13] COPY index.html ./
#20 DONE 0.0s
#21 [frontend-builder 11/13] COPY index.tsx ./
#21 DONE 0.0s
#22 [frontend-builder 12/13] COPY public ./public
#22 DONE 0.0s
#23 [frontend-builder 13/13] RUN npm run build
#23 0.812
#23 0.812 > gestor-de-pedidos-pigmea@0.0.0 build
#23 0.812 > vite build
#23 0.812
#23 1.362 vite v6.3.5 building for production...
#23 2.586 transforming...
#23 2.648 ✓ 3 modules transformed.
#23 2.658 ✗ Build failed in 1.23s
#23 2.659 error during build:
#23 2.659 Could not resolve "./App" from "index.tsx"
#23 2.659 file: /app/index.tsx
#23 2.659     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
#23 2.659     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
#23 2.659     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21512:24)
#23 2.659     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21472:26
#23 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
> [frontend-builder 13/13] RUN npm run build:
2.586 transforming...
2.648 ✓ 3 modules transformed.
2.658 ✗ Build failed in 1.23s
2.659 error during build:
2.659 Could not resolve "./App" from "index.tsx"
2.659 file: /app/index.tsx
2.659     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
2.659     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
2.659     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21512:24)
2.659     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21472:26
------
Dockerfile:25
--------------------
|
|     # Build del frontend
| >>> RUN npm run build
|
|     # ============================================
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
Error ❌
#0 building with "default" instance using docker driver
#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.79kB done
#1 DONE 0.0s
#2 [internal] load metadata for docker.io/library/node:18-alpine
#2 DONE 0.4s
#3 [internal] load .dockerignore
#3 transferring context: 959B done
#3 DONE 0.0s
#4 [frontend-builder  1/13] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#4 DONE 0.0s
#5 [frontend-builder  2/13] WORKDIR /app
#5 CACHED
#6 [internal] load build context
#6 transferring context: 1.12MB 0.1s done
#6 DONE 0.1s
#7 [frontend-builder  3/13] COPY package*.json ./
#7 DONE 0.0s
#8 [frontend-builder  4/13] COPY tsconfig*.json ./
#8 DONE 0.0s
#9 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#9 ...
#10 [frontend-builder  5/13] COPY vite.config.ts ./
#10 DONE 0.0s
#11 [frontend-builder  6/13] COPY tailwind.config.js ./
#11 DONE 0.0s
#12 [frontend-builder  7/13] COPY postcss.config.js ./
#12 DONE 0.0s
#9 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#9 0.338 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/main/x86_64/APKINDEX.tar.gz
#9 0.542 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/community/x86_64/APKINDEX.tar.gz
#9 1.177 (1/8) Installing postgresql-common (1.2-r1)
#9 1.192 Executing postgresql-common-1.2-r1.pre-install
#9 1.218 (2/8) Installing lz4-libs (1.10.0-r0)
#9 1.287 (3/8) Installing libpq (17.7-r0)
#9 1.308 (4/8) Installing ncurses-terminfo-base (6.5_p20241006-r3)
#9 1.338 (5/8) Installing libncursesw (6.5_p20241006-r3)
#9 1.355 (6/8) Installing readline (8.2.13-r0)
#9 1.372 (7/8) Installing zstd-libs (1.5.6-r2)
#9 1.398 (8/8) Installing postgresql17-client (17.7-r0)
#9 1.461 Executing busybox-1.37.0-r12.trigger
#9 1.470 Executing postgresql-common-1.2-r1.trigger
#9 1.477 * Setting postgresql17 as the default version
#9 1.656 WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/main: No such file or directory
#9 1.656 WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/community: No such file or directory
#9 1.667 OK: 15 MiB in 25 packages
#9 DONE 2.1s
#13 [frontend-builder  8/13] RUN npm ci
#13 ...
#14 [stage-1  4/10] COPY backend/package*.json ./backend/
#14 DONE 0.1s
#15 [stage-1  5/10] WORKDIR /app/backend
#15 DONE 0.1s
#16 [stage-1  6/10] RUN npm ci --only=production
#16 1.035 npm warn config only Use `--omit=dev` to omit dev dependencies from the install.
#16 6.677
#16 6.677 added 128 packages, and audited 129 packages in 6s
#16 6.678
#16 6.678 17 packages are looking for funding
#16 6.678   run `npm fund` for details
#16 6.709
#16 6.709 4 high severity vulnerabilities
#16 6.709
#16 6.709 To address all issues, run:
#16 6.709   npm audit fix
#16 6.709
#16 6.709 Run `npm audit` for details.
#16 6.715 npm notice
#16 6.715 npm notice New major version of npm available! 10.8.2 -> 11.8.0
#16 6.715 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#16 6.715 npm notice To update run: npm install -g npm@11.8.0
#16 6.715 npm notice
#16 DONE 7.0s
#13 [frontend-builder  8/13] RUN npm ci
#13 2.618 npm warn EBADENGINE Unsupported engine {
#13 2.618 npm warn EBADENGINE   package: '@vitejs/plugin-react@5.0.1',
#13 2.618 npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
#13 2.618 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#13 2.618 npm warn EBADENGINE }
#13 ...
#17 [stage-1  7/10] WORKDIR /app
#17 DONE 0.1s
#18 [stage-1  8/10] COPY backend ./backend
#18 DONE 0.1s
#13 [frontend-builder  8/13] RUN npm ci
#13 14.78
#13 14.78 added 229 packages, and audited 230 packages in 14s
#13 14.78
#13 14.78 41 packages are looking for funding
#13 14.78   run `npm fund` for details
#13 14.80
#13 14.80 2 vulnerabilities (1 moderate, 1 high)
#13 14.80
#13 14.80 To address all issues, run:
#13 14.80   npm audit fix
#13 14.80
#13 14.80 Run `npm audit` for details.
#13 14.81 npm notice
#13 14.81 npm notice New major version of npm available! 10.8.2 -> 11.8.0
#13 14.81 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#13 14.81 npm notice To update run: npm install -g npm@11.8.0
#13 14.81 npm notice
#13 DONE 15.1s
#19 [frontend-builder  9/13] COPY src ./src
#19 DONE 0.0s
#20 [frontend-builder 10/13] COPY index.html ./
#20 DONE 0.0s
#21 [frontend-builder 11/13] COPY index.tsx ./
#21 DONE 0.0s
#22 [frontend-builder 12/13] COPY public ./public
#22 DONE 0.0s
#23 [frontend-builder 13/13] RUN npm run build
#23 0.812
#23 0.812 > gestor-de-pedidos-pigmea@0.0.0 build
#23 0.812 > vite build
#23 0.812
#23 1.362 vite v6.3.5 building for production...
#23 2.586 transforming...
#23 2.648 ✓ 3 modules transformed.
#23 2.658 ✗ Build failed in 1.23s
#23 2.659 error during build:
#23 2.659 Could not resolve "./App" from "index.tsx"
#23 2.659 file: /app/index.tsx
#23 2.659     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
#23 2.659     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
#23 2.659     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21512:24)
#23 2.659     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21472:26
#23 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
> [frontend-builder 13/13] RUN npm run build:
2.586 transforming...
2.648 ✓ 3 modules transformed.
2.658 ✗ Build failed in 1.23s
2.659 error during build:
2.659 Could not resolve "./App" from "index.tsx"
2.659 file: /app/index.tsx
2.659     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
2.659     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
2.659     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21512:24)
2.659     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21472:26
------
Dockerfile:25
--------------------
|
|     # Build del frontend
| >>> RUN npm run build
|
|     # ============================================
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1