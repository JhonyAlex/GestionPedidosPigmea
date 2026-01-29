Initializing deployment
Cloning Repo github.com/JhonyAlex/GestionPedidosPigmea.git to /etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code: ✅
Cloning into '/etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code'...
remote: Enumerating objects: 367, done.
Cloned github.com/JhonyAlex/GestionPedidosPigmea.git: ✅
Build dockerfile: ✅
Source Type: github: ✅
#0 building with "default" instance using docker driver
#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.81kB done
#1 DONE 0.0s
#2 [internal] load metadata for docker.io/library/node:18-alpine
#2 DONE 0.4s
#3 [internal] load .dockerignore
#3 transferring context: 959B done
#3 DONE 0.0s
#4 [frontend-builder  1/14] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#4 DONE 0.0s
#5 [frontend-builder  2/14] WORKDIR /app
#5 CACHED
#6 [internal] load build context
#6 transferring context: 1.18MB 0.1s done
#6 DONE 0.1s
#7 [frontend-builder  3/14] COPY package*.json ./
#7 DONE 0.1s
#8 [frontend-builder  4/14] COPY tsconfig*.json ./
#8 DONE 0.0s
#9 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#9 ...
#10 [frontend-builder  5/14] COPY vite.config.ts ./
#10 DONE 0.0s
#11 [frontend-builder  6/14] COPY tailwind.config.js ./
#11 DONE 0.0s
#12 [frontend-builder  7/14] COPY postcss.config.js ./
#12 DONE 0.0s
#9 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#9 0.349 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/main/x86_64/APKINDEX.tar.gz
#9 0.576 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/community/x86_64/APKINDEX.tar.gz
#9 1.298 (1/8) Installing postgresql-common (1.2-r1)
#9 1.310 Executing postgresql-common-1.2-r1.pre-install
#9 1.367 (2/8) Installing lz4-libs (1.10.0-r0)
#9 1.392 (3/8) Installing libpq (17.7-r0)
#9 1.410 (4/8) Installing ncurses-terminfo-base (6.5_p20241006-r3)
#9 1.439 (5/8) Installing libncursesw (6.5_p20241006-r3)
#9 1.454 (6/8) Installing readline (8.2.13-r0)
#9 1.466 (7/8) Installing zstd-libs (1.5.6-r2)
#9 1.494 (8/8) Installing postgresql17-client (17.7-r0)
#9 1.632 Executing busybox-1.37.0-r12.trigger
#9 1.654 Executing postgresql-common-1.2-r1.trigger
#9 1.666 * Setting postgresql17 as the default version
#9 1.881 WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/main: No such file or directory
#9 1.881 WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/community: No such file or directory
#9 1.891 OK: 15 MiB in 25 packages
#9 DONE 2.1s
#13 [frontend-builder  8/14] RUN npm ci
#13 ...
#14 [stage-1  4/10] COPY backend/package*.json ./backend/
#14 DONE 0.1s
#15 [stage-1  5/10] WORKDIR /app/backend
#15 DONE 0.0s
#16 [stage-1  6/10] RUN npm ci --only=production
#16 0.724 npm warn config only Use `--omit=dev` to omit dev dependencies from the install.
#16 6.918
#16 6.918 added 128 packages, and audited 129 packages in 6s
#16 6.920
#16 6.921 17 packages are looking for funding
#16 6.924   run `npm fund` for details
#16 6.955
#16 6.955 4 high severity vulnerabilities
#16 6.955
#16 6.955 To address all issues, run:
#16 6.955   npm audit fix
#16 6.955
#16 6.955 Run `npm audit` for details.
#16 6.960 npm notice
#16 6.960 npm notice New major version of npm available! 10.8.2 -> 11.8.0
#16 6.960 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#16 6.960 npm notice To update run: npm install -g npm@11.8.0
#16 6.960 npm notice
#16 DONE 7.2s
#13 [frontend-builder  8/14] RUN npm ci
#13 2.756 npm warn EBADENGINE Unsupported engine {
#13 2.756 npm warn EBADENGINE   package: '@vitejs/plugin-react@5.0.1',
#13 2.756 npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
#13 2.756 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#13 2.756 npm warn EBADENGINE }
#13 ...
#17 [stage-1  7/10] WORKDIR /app
#17 DONE 0.1s
#18 [stage-1  8/10] COPY backend ./backend
#18 DONE 0.2s
#13 [frontend-builder  8/14] RUN npm ci
#13 14.36
#13 14.36 added 229 packages, and audited 230 packages in 14s
#13 14.36
#13 14.36 41 packages are looking for funding
#13 14.36   run `npm fund` for details
#13 14.39
#13 14.39 2 vulnerabilities (1 moderate, 1 high)
#13 14.39
#13 14.39 To address all issues, run:
#13 14.39   npm audit fix
#13 14.39
#13 14.39 Run `npm audit` for details.
#13 14.39 npm notice
#13 14.39 npm notice New major version of npm available! 10.8.2 -> 11.8.0
#13 14.39 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#13 14.39 npm notice To update run: npm install -g npm@11.8.0
#13 14.39 npm notice
#13 DONE 14.7s
#19 [frontend-builder  9/14] COPY src ./src
#19 DONE 0.1s
#20 [frontend-builder 10/14] COPY index.html ./
#20 DONE 0.1s
#21 [frontend-builder 11/14] COPY index.tsx ./
#21 DONE 0.1s
#22 [frontend-builder 12/14] COPY App.tsx ./
#22 DONE 0.0s
#23 [frontend-builder 13/14] COPY public ./public
#23 DONE 0.0s
#24 [frontend-builder 14/14] RUN npm run build
#24 0.830
#24 0.830 > gestor-de-pedidos-pigmea@0.0.0 build
#24 0.830 > vite build
#24 0.830
#24 1.342 vite v6.3.5 building for production...
#24 2.420 transforming...
#24 3.141 ✓ 16 modules transformed.
#24 3.146 ✗ Build failed in 1.75s
#24 3.147 error during build:
#24 3.147 Could not resolve "./types" from "App.tsx"
#24 3.147 file: /app/App.tsx
#24 3.147     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
#24 3.147     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
#24 3.147     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21512:24)
#24 3.147     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21472:26
#24 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
> [frontend-builder 14/14] RUN npm run build:
2.420 transforming...
3.141 ✓ 16 modules transformed.
3.146 ✗ Build failed in 1.75s
3.147 error during build:
3.147 Could not resolve "./types" from "App.tsx"
3.147 file: /app/App.tsx
3.147     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
3.147     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
3.147     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21512:24)
3.147     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21472:26
------
Dockerfile:26
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
#1 transferring dockerfile: 1.81kB done
#1 DONE 0.0s
#2 [internal] load metadata for docker.io/library/node:18-alpine
#2 DONE 0.4s
#3 [internal] load .dockerignore
#3 transferring context: 959B done
#3 DONE 0.0s
#4 [frontend-builder  1/14] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#4 DONE 0.0s
#5 [frontend-builder  2/14] WORKDIR /app
#5 CACHED
#6 [internal] load build context
#6 transferring context: 1.18MB 0.1s done
#6 DONE 0.1s
#7 [frontend-builder  3/14] COPY package*.json ./
#7 DONE 0.1s
#8 [frontend-builder  4/14] COPY tsconfig*.json ./
#8 DONE 0.0s
#9 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#9 ...
#10 [frontend-builder  5/14] COPY vite.config.ts ./
#10 DONE 0.0s
#11 [frontend-builder  6/14] COPY tailwind.config.js ./
#11 DONE 0.0s
#12 [frontend-builder  7/14] COPY postcss.config.js ./
#12 DONE 0.0s
#9 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#9 0.349 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/main/x86_64/APKINDEX.tar.gz
#9 0.576 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/community/x86_64/APKINDEX.tar.gz
#9 1.298 (1/8) Installing postgresql-common (1.2-r1)
#9 1.310 Executing postgresql-common-1.2-r1.pre-install
#9 1.367 (2/8) Installing lz4-libs (1.10.0-r0)
#9 1.392 (3/8) Installing libpq (17.7-r0)
#9 1.410 (4/8) Installing ncurses-terminfo-base (6.5_p20241006-r3)
#9 1.439 (5/8) Installing libncursesw (6.5_p20241006-r3)
#9 1.454 (6/8) Installing readline (8.2.13-r0)
#9 1.466 (7/8) Installing zstd-libs (1.5.6-r2)
#9 1.494 (8/8) Installing postgresql17-client (17.7-r0)
#9 1.632 Executing busybox-1.37.0-r12.trigger
#9 1.654 Executing postgresql-common-1.2-r1.trigger
#9 1.666 * Setting postgresql17 as the default version
#9 1.881 WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/main: No such file or directory
#9 1.881 WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/community: No such file or directory
#9 1.891 OK: 15 MiB in 25 packages
#9 DONE 2.1s
#13 [frontend-builder  8/14] RUN npm ci
#13 ...
#14 [stage-1  4/10] COPY backend/package*.json ./backend/
#14 DONE 0.1s
#15 [stage-1  5/10] WORKDIR /app/backend
#15 DONE 0.0s
#16 [stage-1  6/10] RUN npm ci --only=production
#16 0.724 npm warn config only Use `--omit=dev` to omit dev dependencies from the install.
#16 6.918
#16 6.918 added 128 packages, and audited 129 packages in 6s
#16 6.920
#16 6.921 17 packages are looking for funding
#16 6.924   run `npm fund` for details
#16 6.955
#16 6.955 4 high severity vulnerabilities
#16 6.955
#16 6.955 To address all issues, run:
#16 6.955   npm audit fix
#16 6.955
#16 6.955 Run `npm audit` for details.
#16 6.960 npm notice
#16 6.960 npm notice New major version of npm available! 10.8.2 -> 11.8.0
#16 6.960 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#16 6.960 npm notice To update run: npm install -g npm@11.8.0
#16 6.960 npm notice
#16 DONE 7.2s
#13 [frontend-builder  8/14] RUN npm ci
#13 2.756 npm warn EBADENGINE Unsupported engine {
#13 2.756 npm warn EBADENGINE   package: '@vitejs/plugin-react@5.0.1',
#13 2.756 npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
#13 2.756 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#13 2.756 npm warn EBADENGINE }
#13 ...
#17 [stage-1  7/10] WORKDIR /app
#17 DONE 0.1s
#18 [stage-1  8/10] COPY backend ./backend
#18 DONE 0.2s
#13 [frontend-builder  8/14] RUN npm ci
#13 14.36
#13 14.36 added 229 packages, and audited 230 packages in 14s
#13 14.36
#13 14.36 41 packages are looking for funding
#13 14.36   run `npm fund` for details
#13 14.39
#13 14.39 2 vulnerabilities (1 moderate, 1 high)
#13 14.39
#13 14.39 To address all issues, run:
#13 14.39   npm audit fix
#13 14.39
#13 14.39 Run `npm audit` for details.
#13 14.39 npm notice
#13 14.39 npm notice New major version of npm available! 10.8.2 -> 11.8.0
#13 14.39 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#13 14.39 npm notice To update run: npm install -g npm@11.8.0
#13 14.39 npm notice
#13 DONE 14.7s
#19 [frontend-builder  9/14] COPY src ./src
#19 DONE 0.1s
#20 [frontend-builder 10/14] COPY index.html ./
#20 DONE 0.1s
#21 [frontend-builder 11/14] COPY index.tsx ./
#21 DONE 0.1s
#22 [frontend-builder 12/14] COPY App.tsx ./
#22 DONE 0.0s
#23 [frontend-builder 13/14] COPY public ./public
#23 DONE 0.0s
#24 [frontend-builder 14/14] RUN npm run build
#24 0.830
#24 0.830 > gestor-de-pedidos-pigmea@0.0.0 build
#24 0.830 > vite build
#24 0.830
#24 1.342 vite v6.3.5 building for production...
#24 2.420 transforming...
#24 3.141 ✓ 16 modules transformed.
#24 3.146 ✗ Build failed in 1.75s
#24 3.147 error during build:
#24 3.147 Could not resolve "./types" from "App.tsx"
#24 3.147 file: /app/App.tsx
#24 3.147     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
#24 3.147     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
#24 3.147     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21512:24)
#24 3.147     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21472:26
#24 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
> [frontend-builder 14/14] RUN npm run build:
2.420 transforming...
3.141 ✓ 16 modules transformed.
3.146 ✗ Build failed in 1.75s
3.147 error during build:
3.147 Could not resolve "./types" from "App.tsx"
3.147 file: /app/App.tsx
3.147     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
3.147     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
3.147     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21512:24)
3.147     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21472:26
------
Dockerfile:26
--------------------
|
|     # Build del frontend
| >>> RUN npm run build
|
|     # ============================================
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1