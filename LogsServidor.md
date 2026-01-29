Initializing deployment
Cloning Repo github.com/JhonyAlex/GestionPedidosPigmea.git to /etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code: ✅
Cloning into '/etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code'...
remote: Enumerating objects: 368, done.
Cloned github.com/JhonyAlex/GestionPedidosPigmea.git: ✅
Build dockerfile: ✅
Source Type: github: ✅
#0 building with "default" instance using docker driver
#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.75kB done
#1 DONE 0.0s
#2 [internal] load metadata for docker.io/library/node:18-alpine
#2 DONE 0.8s
#3 [internal] load .dockerignore
#3 transferring context: 959B done
#3 DONE 0.0s
#4 [frontend-builder  1/12] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#4 DONE 0.0s
#5 [frontend-builder  2/12] WORKDIR /app
#5 CACHED
#6 [internal] load build context
#6 transferring context: 1.12MB 0.3s done
#6 DONE 0.3s
#7 [frontend-builder  3/12] COPY package*.json ./
#7 DONE 0.2s
#8 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#8 ...
#9 [frontend-builder  4/12] COPY tsconfig*.json ./
#9 DONE 0.1s
#8 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#8 0.687 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/main/x86_64/APKINDEX.tar.gz
#8 ...
#10 [frontend-builder  5/12] COPY vite.config.ts ./
#10 DONE 0.1s
#11 [frontend-builder  6/12] COPY tailwind.config.js ./
#11 DONE 0.1s
#12 [frontend-builder  7/12] COPY postcss.config.js ./
#12 DONE 0.1s
#8 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#8 0.938 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/community/x86_64/APKINDEX.tar.gz
#8 1.733 (1/8) Installing postgresql-common (1.2-r1)
#8 1.738 Executing postgresql-common-1.2-r1.pre-install
#8 1.773 (2/8) Installing lz4-libs (1.10.0-r0)
#8 1.798 (3/8) Installing libpq (17.7-r0)
#8 1.822 (4/8) Installing ncurses-terminfo-base (6.5_p20241006-r3)
#8 1.834 (5/8) Installing libncursesw (6.5_p20241006-r3)
#8 1.848 (6/8) Installing readline (8.2.13-r0)
#8 1.860 (7/8) Installing zstd-libs (1.5.6-r2)
#8 1.887 (8/8) Installing postgresql17-client (17.7-r0)
#8 1.936 Executing busybox-1.37.0-r12.trigger
#8 1.943 Executing postgresql-common-1.2-r1.trigger
#8 1.948 * Setting postgresql17 as the default version
#8 2.087 WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/main: No such file or directory
#8 2.087 WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/community: No such file or directory
#8 2.095 OK: 15 MiB in 25 packages
#8 DONE 2.3s
#13 [frontend-builder  8/12] RUN npm ci --only=production
#13 0.984 npm warn config only Use `--omit=dev` to omit dev dependencies from the install.
#13 ...
#14 [stage-1  4/10] COPY backend/package*.json ./backend/
#14 DONE 0.1s
#15 [stage-1  5/10] WORKDIR /app/backend
#15 DONE 0.1s
#16 [stage-1  6/10] RUN npm ci --only=production
#16 0.692 npm warn config only Use `--omit=dev` to omit dev dependencies from the install.
#16 6.173
#16 6.173 added 128 packages, and audited 129 packages in 6s
#16 6.173
#16 6.174 17 packages are looking for funding
#16 6.174   run `npm fund` for details
#16 6.194
#16 6.194 4 high severity vulnerabilities
#16 6.194
#16 6.194 To address all issues, run:
#16 6.194   npm audit fix
#16 6.194
#16 6.194 Run `npm audit` for details.
#16 6.196 npm notice
#16 6.196 npm notice New major version of npm available! 10.8.2 -> 11.8.0
#16 6.196 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#16 6.196 npm notice To update run: npm install -g npm@11.8.0
#16 6.196 npm notice
#16 DONE 6.4s
#13 [frontend-builder  8/12] RUN npm ci --only=production
#13 3.254 npm warn EBADENGINE Unsupported engine {
#13 3.254 npm warn EBADENGINE   package: '@vitejs/plugin-react@5.0.1',
#13 3.254 npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
#13 3.254 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#13 3.254 npm warn EBADENGINE }
#13 ...
#17 [stage-1  7/10] WORKDIR /app
#17 DONE 0.0s
#18 [stage-1  8/10] COPY backend ./backend
#18 DONE 0.1s
#13 [frontend-builder  8/12] RUN npm ci --only=production
#13 15.64
#13 15.64 added 204 packages, and audited 205 packages in 15s
#13 15.65
#13 15.65 36 packages are looking for funding
#13 15.65   run `npm fund` for details
#13 15.70
#13 15.70 1 moderate severity vulnerability
#13 15.70
#13 15.70 To address all issues, run:
#13 15.70   npm audit fix
#13 15.70
#13 15.70 Run `npm audit` for details.
#13 15.71 npm notice
#13 15.71 npm notice New major version of npm available! 10.8.2 -> 11.8.0
#13 15.71 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#13 15.71 npm notice To update run: npm install -g npm@11.8.0
#13 15.71 npm notice
#13 DONE 15.9s
#19 [frontend-builder  9/12] COPY src ./src
#19 DONE 0.1s
#20 [frontend-builder 10/12] COPY index.html ./
#20 DONE 0.0s
#21 [frontend-builder 11/12] COPY public ./public
#21 DONE 0.0s
#22 [frontend-builder 12/12] RUN npm run build
#22 0.810
#22 0.810 > gestor-de-pedidos-pigmea@0.0.0 build
#22 0.810 > vite build
#22 0.810
#22 1.402 vite v6.3.5 building for production...
#22 1.614 ✓ 0 modules transformed.
#22 1.634 ✗ Build failed in 164ms
#22 1.635 error during build:
#22 1.635 [vite:build-html] Failed to resolve /index.tsx from /app/index.html
#22 1.635 file: /app/index.html
#22 1.635     at file:///app/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:36310:29
#22 1.635     at async Promise.all (index 0)
#22 1.635     at async Object.handler (file:///app/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:36507:11)
#22 1.635     at async transform (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21086:16)
#22 1.635     at async ModuleLoader.addModuleSource (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21299:36)
#22 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
> [frontend-builder 12/12] RUN npm run build:
1.614 ✓ 0 modules transformed.
1.634 ✗ Build failed in 164ms
1.635 error during build:
1.635 [vite:build-html] Failed to resolve /index.tsx from /app/index.html
1.635 file: /app/index.html
1.635     at file:///app/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:36310:29
1.635     at async Promise.all (index 0)
1.635     at async Object.handler (file:///app/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:36507:11)
1.635     at async transform (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21086:16)
1.635     at async ModuleLoader.addModuleSource (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21299:36)
------
Dockerfile:24
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
#1 transferring dockerfile: 1.75kB done
#1 DONE 0.0s
#2 [internal] load metadata for docker.io/library/node:18-alpine
#2 DONE 0.8s
#3 [internal] load .dockerignore
#3 transferring context: 959B done
#3 DONE 0.0s
#4 [frontend-builder  1/12] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#4 DONE 0.0s
#5 [frontend-builder  2/12] WORKDIR /app
#5 CACHED
#6 [internal] load build context
#6 transferring context: 1.12MB 0.3s done
#6 DONE 0.3s
#7 [frontend-builder  3/12] COPY package*.json ./
#7 DONE 0.2s
#8 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#8 ...
#9 [frontend-builder  4/12] COPY tsconfig*.json ./
#9 DONE 0.1s
#8 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#8 0.687 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/main/x86_64/APKINDEX.tar.gz
#8 ...
#10 [frontend-builder  5/12] COPY vite.config.ts ./
#10 DONE 0.1s
#11 [frontend-builder  6/12] COPY tailwind.config.js ./
#11 DONE 0.1s
#12 [frontend-builder  7/12] COPY postcss.config.js ./
#12 DONE 0.1s
#8 [stage-1  3/10] RUN apk add --no-cache postgresql-client
#8 0.938 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/community/x86_64/APKINDEX.tar.gz
#8 1.733 (1/8) Installing postgresql-common (1.2-r1)
#8 1.738 Executing postgresql-common-1.2-r1.pre-install
#8 1.773 (2/8) Installing lz4-libs (1.10.0-r0)
#8 1.798 (3/8) Installing libpq (17.7-r0)
#8 1.822 (4/8) Installing ncurses-terminfo-base (6.5_p20241006-r3)
#8 1.834 (5/8) Installing libncursesw (6.5_p20241006-r3)
#8 1.848 (6/8) Installing readline (8.2.13-r0)
#8 1.860 (7/8) Installing zstd-libs (1.5.6-r2)
#8 1.887 (8/8) Installing postgresql17-client (17.7-r0)
#8 1.936 Executing busybox-1.37.0-r12.trigger
#8 1.943 Executing postgresql-common-1.2-r1.trigger
#8 1.948 * Setting postgresql17 as the default version
#8 2.087 WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/main: No such file or directory
#8 2.087 WARNING: opening from cache https://dl-cdn.alpinelinux.org/alpine/v3.21/community: No such file or directory
#8 2.095 OK: 15 MiB in 25 packages
#8 DONE 2.3s
#13 [frontend-builder  8/12] RUN npm ci --only=production
#13 0.984 npm warn config only Use `--omit=dev` to omit dev dependencies from the install.
#13 ...
#14 [stage-1  4/10] COPY backend/package*.json ./backend/
#14 DONE 0.1s
#15 [stage-1  5/10] WORKDIR /app/backend
#15 DONE 0.1s
#16 [stage-1  6/10] RUN npm ci --only=production
#16 0.692 npm warn config only Use `--omit=dev` to omit dev dependencies from the install.
#16 6.173
#16 6.173 added 128 packages, and audited 129 packages in 6s
#16 6.173
#16 6.174 17 packages are looking for funding
#16 6.174   run `npm fund` for details
#16 6.194
#16 6.194 4 high severity vulnerabilities
#16 6.194
#16 6.194 To address all issues, run:
#16 6.194   npm audit fix
#16 6.194
#16 6.194 Run `npm audit` for details.
#16 6.196 npm notice
#16 6.196 npm notice New major version of npm available! 10.8.2 -> 11.8.0
#16 6.196 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#16 6.196 npm notice To update run: npm install -g npm@11.8.0
#16 6.196 npm notice
#16 DONE 6.4s
#13 [frontend-builder  8/12] RUN npm ci --only=production
#13 3.254 npm warn EBADENGINE Unsupported engine {
#13 3.254 npm warn EBADENGINE   package: '@vitejs/plugin-react@5.0.1',
#13 3.254 npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
#13 3.254 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#13 3.254 npm warn EBADENGINE }
#13 ...
#17 [stage-1  7/10] WORKDIR /app
#17 DONE 0.0s
#18 [stage-1  8/10] COPY backend ./backend
#18 DONE 0.1s
#13 [frontend-builder  8/12] RUN npm ci --only=production
#13 15.64
#13 15.64 added 204 packages, and audited 205 packages in 15s
#13 15.65
#13 15.65 36 packages are looking for funding
#13 15.65   run `npm fund` for details
#13 15.70
#13 15.70 1 moderate severity vulnerability
#13 15.70
#13 15.70 To address all issues, run:
#13 15.70   npm audit fix
#13 15.70
#13 15.70 Run `npm audit` for details.
#13 15.71 npm notice
#13 15.71 npm notice New major version of npm available! 10.8.2 -> 11.8.0
#13 15.71 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#13 15.71 npm notice To update run: npm install -g npm@11.8.0
#13 15.71 npm notice
#13 DONE 15.9s
#19 [frontend-builder  9/12] COPY src ./src
#19 DONE 0.1s
#20 [frontend-builder 10/12] COPY index.html ./
#20 DONE 0.0s
#21 [frontend-builder 11/12] COPY public ./public
#21 DONE 0.0s
#22 [frontend-builder 12/12] RUN npm run build
#22 0.810
#22 0.810 > gestor-de-pedidos-pigmea@0.0.0 build
#22 0.810 > vite build
#22 0.810
#22 1.402 vite v6.3.5 building for production...
#22 1.614 ✓ 0 modules transformed.
#22 1.634 ✗ Build failed in 164ms
#22 1.635 error during build:
#22 1.635 [vite:build-html] Failed to resolve /index.tsx from /app/index.html
#22 1.635 file: /app/index.html
#22 1.635     at file:///app/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:36310:29
#22 1.635     at async Promise.all (index 0)
#22 1.635     at async Object.handler (file:///app/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:36507:11)
#22 1.635     at async transform (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21086:16)
#22 1.635     at async ModuleLoader.addModuleSource (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21299:36)
#22 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
> [frontend-builder 12/12] RUN npm run build:
1.614 ✓ 0 modules transformed.
1.634 ✗ Build failed in 164ms
1.635 error during build:
1.635 [vite:build-html] Failed to resolve /index.tsx from /app/index.html
1.635 file: /app/index.html
1.635     at file:///app/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:36310:29
1.635     at async Promise.all (index 0)
1.635     at async Object.handler (file:///app/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:36507:11)
1.635     at async transform (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21086:16)
1.635     at async ModuleLoader.addModuleSource (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21299:36)
------
Dockerfile:24
--------------------
|
|     # Build del frontend
| >>> RUN npm run build
|
|     # ============================================
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1