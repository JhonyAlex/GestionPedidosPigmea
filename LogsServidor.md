Initializing deployment
Cloning Repo github.com/JhonyAlex/GestionPedidosPigmea.git to /etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code: ✅
Cloning into '/etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code'...
remote: Enumerating objects: 278, done.
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
#6 transferring context: 3.10MB 0.1s done
#6 DONE 0.1s
#7 [ 3/16] COPY package*.json ./
#7 DONE 0.1s
#8 [ 4/16] COPY backend/package*.json ./backend/
#8 DONE 0.2s
#9 [ 5/16] RUN npm install
#9 1.495 npm warn EBADENGINE Unsupported engine {
#9 1.495 npm warn EBADENGINE   package: '@vitejs/plugin-react@5.0.1',
#9 1.495 npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
#9 1.495 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#9 1.495 npm warn EBADENGINE }
#9 5.413 npm warn deprecated react-beautiful-dnd@13.1.1: react-beautiful-dnd is now deprecated. Context and options: https://github.com/atlassian/react-beautiful-dnd/issues/2672
#9 6.428
#9 6.428 added 133 packages, and audited 134 packages in 6s
#9 6.428
#9 6.428 17 packages are looking for funding
#9 6.428   run `npm fund` for details
#9 6.447
#9 6.447 1 moderate severity vulnerability
#9 6.447
#9 6.447 To address all issues, run:
#9 6.447   npm audit fix
#9 6.447
#9 6.447 Run `npm audit` for details.
#9 6.450 npm notice
#9 6.450 npm notice New major version of npm available! 10.8.2 -> 11.7.0
#9 6.450 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
#9 6.450 npm notice To update run: npm install -g npm@11.7.0
#9 6.450 npm notice
#9 DONE 6.6s
#10 [ 6/16] RUN cd backend && npm install
#10 3.313
#10 3.313 added 128 packages, and audited 129 packages in 3s
#10 3.313
#10 3.313 17 packages are looking for funding
#10 3.313   run `npm fund` for details
#10 3.316
#10 3.316 1 high severity vulnerability
#10 3.316
#10 3.316 To address all issues, run:
#10 3.316   npm audit fix
#10 3.316
#10 3.316 Run `npm audit` for details.
#10 DONE 3.4s
#11 [ 7/16] COPY . .
#11 DONE 0.1s
#12 [ 8/16] RUN npm install @vitejs/plugin-react vite terser --save-dev
#12 1.181 npm warn idealTree Removing dependencies.@vitejs/plugin-react in favor of devDependencies.@vitejs/plugin-react
#12 5.389
#12 5.389 changed 4 packages, and audited 134 packages in 5s
#12 5.390
#12 5.390 17 packages are looking for funding
#12 5.390   run `npm fund` for details
#12 5.392
#12 5.392 found 0 vulnerabilities
#12 DONE 5.5s
#13 [ 9/16] RUN npm run build
#13 0.573
#13 0.573 > gestor-de-pedidos-pigmea@0.0.0 build
#13 0.573 > vite build
#13 0.573
#13 1.095 NODE_ENV=production is not supported in the .env file. Only NODE_ENV=development is supported to create a development build of your project. If you need to set process.env.NODE_ENV, you can set it in the Vite config instead.
#13 1.161 vite v6.4.1 building for production...
#13 2.431 transforming...
#13 4.180 ✓ 96 modules transformed.
#13 4.184 ✗ Build failed in 2.97s
#13 4.184 error during build:
#13 4.184 [vite:esbuild] Transform failed with 2 errors:
#13 4.184 /app/hooks/useOperacionesProduccion.ts:90:14: ERROR: The symbol "handleOperacionCompletada" has already been declared
#13 4.184 /app/hooks/useOperacionesProduccion.ts:100:14: ERROR: The symbol "handleOperacionCancelada" has already been declared
#13 4.184 file: /app/hooks/useOperacionesProduccion.ts:90:14
#13 4.184
#13 4.184 The symbol "handleOperacionCompletada" has already been declared
#13 4.184 88 |          socket.on('operacion-iniciada', handleOperacionIniciada);
#13 4.184 89 |          socket.on('operacion-pausada', handleOperacionPausada);
#13 4.184 90 |          const handleOperacionCompletada = (operacion: OperacionProduccion) => {
#13 4.184    |                ^
#13 4.184 91 |              setOperacionesActivas(prev => prev.filter(op => op.id !== operacion.id));
#13 4.184 92 |              if (operacion.operadorId === user?.id) {
#13 4.184
#13 4.184 The symbol "handleOperacionCancelada" has already been declared
#13 4.184 98 |          };
#13 4.184 99 |
#13 4.184 100|          const handleOperacionCancelada = (operacion: OperacionProduccion) => {
#13 4.184    |                ^
#13 4.184 101|              setOperacionesActivas(prev => prev.filter(op => op.id !== operacion.id));
#13 4.184 102|              if (operacion.operadorId === user?.id) {
#13 4.184
#13 4.184     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
#13 4.184     at /app/node_modules/esbuild/lib/main.js:736:50
#13 4.184     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
#13 4.184     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
#13 4.184     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
#13 4.184     at Socket.emit (node:events:517:28)
#13 4.184     at addChunk (node:internal/streams/readable:368:12)
#13 4.184     at readableAddChunk (node:internal/streams/readable:341:9)
#13 4.184     at Readable.push (node:internal/streams/readable:278:10)
#13 4.184     at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)
#13 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
> [ 9/16] RUN npm run build:
4.184     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
4.184     at /app/node_modules/esbuild/lib/main.js:736:50
4.184     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
4.184     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
4.184     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
4.184     at Socket.emit (node:events:517:28)
4.184     at addChunk (node:internal/streams/readable:368:12)
4.184     at readableAddChunk (node:internal/streams/readable:341:9)
4.184     at Readable.push (node:internal/streams/readable:278:10)
4.184     at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)
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
#6 transferring context: 3.10MB 0.1s done
#6 DONE 0.1s
#7 [ 3/16] COPY package*.json ./
#7 DONE 0.1s
#8 [ 4/16] COPY backend/package*.json ./backend/
#8 DONE 0.2s
#9 [ 5/16] RUN npm install
#9 1.495 npm warn EBADENGINE Unsupported engine {
#9 1.495 npm warn EBADENGINE   package: '@vitejs/plugin-react@5.0.1',
#9 1.495 npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
#9 1.495 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#9 1.495 npm warn EBADENGINE }
#9 5.413 npm warn deprecated react-beautiful-dnd@13.1.1: react-beautiful-dnd is now deprecated. Context and options: https://github.com/atlassian/react-beautiful-dnd/issues/2672
#9 6.428
#9 6.428 added 133 packages, and audited 134 packages in 6s
#9 6.428
#9 6.428 17 packages are looking for funding
#9 6.428   run `npm fund` for details
#9 6.447
#9 6.447 1 moderate severity vulnerability
#9 6.447
#9 6.447 To address all issues, run:
#9 6.447   npm audit fix
#9 6.447
#9 6.447 Run `npm audit` for details.
#9 6.450 npm notice
#9 6.450 npm notice New major version of npm available! 10.8.2 -> 11.7.0
#9 6.450 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
#9 6.450 npm notice To update run: npm install -g npm@11.7.0
#9 6.450 npm notice
#9 DONE 6.6s
#10 [ 6/16] RUN cd backend && npm install
#10 3.313
#10 3.313 added 128 packages, and audited 129 packages in 3s
#10 3.313
#10 3.313 17 packages are looking for funding
#10 3.313   run `npm fund` for details
#10 3.316
#10 3.316 1 high severity vulnerability
#10 3.316
#10 3.316 To address all issues, run:
#10 3.316   npm audit fix
#10 3.316
#10 3.316 Run `npm audit` for details.
#10 DONE 3.4s
#11 [ 7/16] COPY . .
#11 DONE 0.1s
#12 [ 8/16] RUN npm install @vitejs/plugin-react vite terser --save-dev
#12 1.181 npm warn idealTree Removing dependencies.@vitejs/plugin-react in favor of devDependencies.@vitejs/plugin-react
#12 5.389
#12 5.389 changed 4 packages, and audited 134 packages in 5s
#12 5.390
#12 5.390 17 packages are looking for funding
#12 5.390   run `npm fund` for details
#12 5.392
#12 5.392 found 0 vulnerabilities
#12 DONE 5.5s
#13 [ 9/16] RUN npm run build
#13 0.573
#13 0.573 > gestor-de-pedidos-pigmea@0.0.0 build
#13 0.573 > vite build
#13 0.573
#13 1.095 NODE_ENV=production is not supported in the .env file. Only NODE_ENV=development is supported to create a development build of your project. If you need to set process.env.NODE_ENV, you can set it in the Vite config instead.
#13 1.161 vite v6.4.1 building for production...
#13 2.431 transforming...
#13 4.180 ✓ 96 modules transformed.
#13 4.184 ✗ Build failed in 2.97s
#13 4.184 error during build:
#13 4.184 [vite:esbuild] Transform failed with 2 errors:
#13 4.184 /app/hooks/useOperacionesProduccion.ts:90:14: ERROR: The symbol "handleOperacionCompletada" has already been declared
#13 4.184 /app/hooks/useOperacionesProduccion.ts:100:14: ERROR: The symbol "handleOperacionCancelada" has already been declared
#13 4.184 file: /app/hooks/useOperacionesProduccion.ts:90:14
#13 4.184
#13 4.184 The symbol "handleOperacionCompletada" has already been declared
#13 4.184 88 |          socket.on('operacion-iniciada', handleOperacionIniciada);
#13 4.184 89 |          socket.on('operacion-pausada', handleOperacionPausada);
#13 4.184 90 |          const handleOperacionCompletada = (operacion: OperacionProduccion) => {
#13 4.184    |                ^
#13 4.184 91 |              setOperacionesActivas(prev => prev.filter(op => op.id !== operacion.id));
#13 4.184 92 |              if (operacion.operadorId === user?.id) {
#13 4.184
#13 4.184 The symbol "handleOperacionCancelada" has already been declared
#13 4.184 98 |          };
#13 4.184 99 |
#13 4.184 100|          const handleOperacionCancelada = (operacion: OperacionProduccion) => {
#13 4.184    |                ^
#13 4.184 101|              setOperacionesActivas(prev => prev.filter(op => op.id !== operacion.id));
#13 4.184 102|              if (operacion.operadorId === user?.id) {
#13 4.184
#13 4.184     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
#13 4.184     at /app/node_modules/esbuild/lib/main.js:736:50
#13 4.184     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
#13 4.184     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
#13 4.184     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
#13 4.184     at Socket.emit (node:events:517:28)
#13 4.184     at addChunk (node:internal/streams/readable:368:12)
#13 4.184     at readableAddChunk (node:internal/streams/readable:341:9)
#13 4.184     at Readable.push (node:internal/streams/readable:278:10)
#13 4.184     at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)
#13 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
> [ 9/16] RUN npm run build:
4.184     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
4.184     at /app/node_modules/esbuild/lib/main.js:736:50
4.184     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
4.184     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
4.184     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
4.184     at Socket.emit (node:events:517:28)
4.184     at addChunk (node:internal/streams/readable:368:12)
4.184     at readableAddChunk (node:internal/streams/readable:341:9)
4.184     at Readable.push (node:internal/streams/readable:278:10)
4.184     at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)
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