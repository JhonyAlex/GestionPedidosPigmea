Initializing deployment
Cloning Repo github.com/JhonyAlex/GestionPedidosPigmea.git to /etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code: ✅
Cloning into '/etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code'...
remote: Enumerating objects: 290, done.
Cloned github.com/JhonyAlex/GestionPedidosPigmea.git: ✅
Build dockerfile: ✅
Source Type: github: ✅
#0 building with "default" instance using docker driver
#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.07kB done
#1 DONE 0.0s
#2 [internal] load metadata for docker.io/library/node:18-alpine
#2 DONE 0.7s
#3 [internal] load .dockerignore
#3 transferring context: 34B done
#3 DONE 0.0s
#4 [ 1/16] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#4 DONE 0.0s
#5 [ 2/16] WORKDIR /app
#5 CACHED
#6 [internal] load build context
#6 transferring context: 3.24MB 0.1s done
#6 DONE 0.1s
#7 [ 3/16] COPY package*.json ./
#7 DONE 0.1s
#8 [ 4/16] COPY backend/package*.json ./backend/
#8 DONE 0.1s
#9 [ 5/16] RUN npm install
#9 1.483 npm warn EBADENGINE Unsupported engine {
#9 1.483 npm warn EBADENGINE   package: '@vitejs/plugin-react@5.0.1',
#9 1.483 npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
#9 1.483 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#9 1.483 npm warn EBADENGINE }
#9 5.659 npm warn deprecated react-beautiful-dnd@13.1.1: react-beautiful-dnd is now deprecated. Context and options: https://github.com/atlassian/react-beautiful-dnd/issues/2672
#9 6.797
#9 6.797 added 133 packages, and audited 134 packages in 6s
#9 6.798
#9 6.798 17 packages are looking for funding
#9 6.798   run `npm fund` for details
#9 6.830
#9 6.830 1 moderate severity vulnerability
#9 6.830
#9 6.830 To address all issues, run:
#9 6.830   npm audit fix
#9 6.830
#9 6.830 Run `npm audit` for details.
#9 6.836 npm notice
#9 6.836 npm notice New major version of npm available! 10.8.2 -> 11.7.0
#9 6.836 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
#9 6.836 npm notice To update run: npm install -g npm@11.7.0
#9 6.836 npm notice
#9 DONE 7.0s
#10 [ 6/16] RUN cd backend && npm install
#10 3.520
#10 3.520 added 128 packages, and audited 129 packages in 3s
#10 3.520
#10 3.521 17 packages are looking for funding
#10 3.521   run `npm fund` for details
#10 3.523
#10 3.523 1 high severity vulnerability
#10 3.523
#10 3.523 To address all issues, run:
#10 3.523   npm audit fix
#10 3.523
#10 3.523 Run `npm audit` for details.
#10 DONE 3.6s
#11 [ 7/16] COPY . .
#11 DONE 0.1s
#12 [ 8/16] RUN npm install @vitejs/plugin-react vite terser --save-dev
#12 1.316 npm warn idealTree Removing dependencies.@vitejs/plugin-react in favor of devDependencies.@vitejs/plugin-react
#12 5.306
#12 5.306 changed 4 packages, and audited 134 packages in 5s
#12 5.306
#12 5.306 17 packages are looking for funding
#12 5.306   run `npm fund` for details
#12 5.308
#12 5.308 found 0 vulnerabilities
#12 DONE 5.4s
#13 [ 9/16] RUN npm run build
#13 0.543
#13 0.543 > gestor-de-pedidos-pigmea@0.0.0 build
#13 0.543 > vite build
#13 0.543
#13 1.009 NODE_ENV=production is not supported in the .env file. Only NODE_ENV=development is supported to create a development build of your project. If you need to set process.env.NODE_ENV, you can set it in the Vite config instead.
#13 1.099 vite v6.4.1 building for production...
#13 2.414 transforming...
#13 3.724 ✓ 51 modules transformed.
#13 3.726 ✗ Build failed in 2.57s
#13 3.727 error during build:
#13 3.727 [vite:esbuild] Transform failed with 1 error:
#13 3.727 /app/contexts/AuthContext.tsx:262:12: ERROR: Expected "finally" but found "if"
#13 3.727 file: /app/contexts/AuthContext.tsx:262:12
#13 3.727
#13 3.727 Expected "finally" but found "if"
#13 3.727 260|              }
#13 3.727 261|
#13 3.727 262|              if (data.success && data.user) {
#13 3.727    |              ^
#13 3.727 263|                  // Primero enriquecemos con permisos locales si no los tiene
#13 3.727 264|                  const enrichedUser = enrichUserWithPermissions(data.user);
#13 3.727
#13 3.727     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
#13 3.727     at /app/node_modules/esbuild/lib/main.js:736:50
#13 3.727     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
#13 3.727     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
#13 3.727     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
#13 3.727     at Socket.emit (node:events:517:28)
#13 3.727     at addChunk (node:internal/streams/readable:368:12)
#13 3.727     at readableAddChunk (node:internal/streams/readable:341:9)
#13 3.727     at Readable.push (node:internal/streams/readable:278:10)
#13 3.727     at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)
#13 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
> [ 9/16] RUN npm run build:
3.727     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
3.727     at /app/node_modules/esbuild/lib/main.js:736:50
3.727     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
3.727     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
3.727     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
3.727     at Socket.emit (node:events:517:28)
3.727     at addChunk (node:internal/streams/readable:368:12)
3.727     at readableAddChunk (node:internal/streams/readable:341:9)
3.727     at Readable.push (node:internal/streams/readable:278:10)
3.727     at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)
------
Dockerfile:21
--------------------
|
|     # Build the frontend (aplicación principal)
| >>> RUN npm run build
|
|     # Install psql client and dos2unix utility
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
Error ❌
#0 building with "default" instance using docker driver
#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.07kB done
#1 DONE 0.0s
#2 [internal] load metadata for docker.io/library/node:18-alpine
#2 DONE 0.7s
#3 [internal] load .dockerignore
#3 transferring context: 34B done
#3 DONE 0.0s
#4 [ 1/16] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#4 DONE 0.0s
#5 [ 2/16] WORKDIR /app
#5 CACHED
#6 [internal] load build context
#6 transferring context: 3.24MB 0.1s done
#6 DONE 0.1s
#7 [ 3/16] COPY package*.json ./
#7 DONE 0.1s
#8 [ 4/16] COPY backend/package*.json ./backend/
#8 DONE 0.1s
#9 [ 5/16] RUN npm install
#9 1.483 npm warn EBADENGINE Unsupported engine {
#9 1.483 npm warn EBADENGINE   package: '@vitejs/plugin-react@5.0.1',
#9 1.483 npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
#9 1.483 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#9 1.483 npm warn EBADENGINE }
#9 5.659 npm warn deprecated react-beautiful-dnd@13.1.1: react-beautiful-dnd is now deprecated. Context and options: https://github.com/atlassian/react-beautiful-dnd/issues/2672
#9 6.797
#9 6.797 added 133 packages, and audited 134 packages in 6s
#9 6.798
#9 6.798 17 packages are looking for funding
#9 6.798   run `npm fund` for details
#9 6.830
#9 6.830 1 moderate severity vulnerability
#9 6.830
#9 6.830 To address all issues, run:
#9 6.830   npm audit fix
#9 6.830
#9 6.830 Run `npm audit` for details.
#9 6.836 npm notice
#9 6.836 npm notice New major version of npm available! 10.8.2 -> 11.7.0
#9 6.836 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
#9 6.836 npm notice To update run: npm install -g npm@11.7.0
#9 6.836 npm notice
#9 DONE 7.0s
#10 [ 6/16] RUN cd backend && npm install
#10 3.520
#10 3.520 added 128 packages, and audited 129 packages in 3s
#10 3.520
#10 3.521 17 packages are looking for funding
#10 3.521   run `npm fund` for details
#10 3.523
#10 3.523 1 high severity vulnerability
#10 3.523
#10 3.523 To address all issues, run:
#10 3.523   npm audit fix
#10 3.523
#10 3.523 Run `npm audit` for details.
#10 DONE 3.6s
#11 [ 7/16] COPY . .
#11 DONE 0.1s
#12 [ 8/16] RUN npm install @vitejs/plugin-react vite terser --save-dev
#12 1.316 npm warn idealTree Removing dependencies.@vitejs/plugin-react in favor of devDependencies.@vitejs/plugin-react
#12 5.306
#12 5.306 changed 4 packages, and audited 134 packages in 5s
#12 5.306
#12 5.306 17 packages are looking for funding
#12 5.306   run `npm fund` for details
#12 5.308
#12 5.308 found 0 vulnerabilities
#12 DONE 5.4s
#13 [ 9/16] RUN npm run build
#13 0.543
#13 0.543 > gestor-de-pedidos-pigmea@0.0.0 build
#13 0.543 > vite build
#13 0.543
#13 1.009 NODE_ENV=production is not supported in the .env file. Only NODE_ENV=development is supported to create a development build of your project. If you need to set process.env.NODE_ENV, you can set it in the Vite config instead.
#13 1.099 vite v6.4.1 building for production...
#13 2.414 transforming...
#13 3.724 ✓ 51 modules transformed.
#13 3.726 ✗ Build failed in 2.57s
#13 3.727 error during build:
#13 3.727 [vite:esbuild] Transform failed with 1 error:
#13 3.727 /app/contexts/AuthContext.tsx:262:12: ERROR: Expected "finally" but found "if"
#13 3.727 file: /app/contexts/AuthContext.tsx:262:12
#13 3.727
#13 3.727 Expected "finally" but found "if"
#13 3.727 260|              }
#13 3.727 261|
#13 3.727 262|              if (data.success && data.user) {
#13 3.727    |              ^
#13 3.727 263|                  // Primero enriquecemos con permisos locales si no los tiene
#13 3.727 264|                  const enrichedUser = enrichUserWithPermissions(data.user);
#13 3.727
#13 3.727     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
#13 3.727     at /app/node_modules/esbuild/lib/main.js:736:50
#13 3.727     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
#13 3.727     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
#13 3.727     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
#13 3.727     at Socket.emit (node:events:517:28)
#13 3.727     at addChunk (node:internal/streams/readable:368:12)
#13 3.727     at readableAddChunk (node:internal/streams/readable:341:9)
#13 3.727     at Readable.push (node:internal/streams/readable:278:10)
#13 3.727     at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)
#13 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
> [ 9/16] RUN npm run build:
3.727     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
3.727     at /app/node_modules/esbuild/lib/main.js:736:50
3.727     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
3.727     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
3.727     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
3.727     at Socket.emit (node:events:517:28)
3.727     at addChunk (node:internal/streams/readable:368:12)
3.727     at readableAddChunk (node:internal/streams/readable:341:9)
3.727     at Readable.push (node:internal/streams/readable:278:10)
3.727     at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)
------
Dockerfile:21
--------------------
|
|     # Build the frontend (aplicación principal)
| >>> RUN npm run build
|
|     # Install psql client and dos2unix utility
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1