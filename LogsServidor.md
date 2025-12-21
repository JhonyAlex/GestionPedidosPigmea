Initializing deployment
Cloning Repo github.com/JhonyAlex/GestionPedidosPigmea.git to /etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code: ✅
Cloning into '/etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code'...
remote: Enumerating objects: 280, done.
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
#6 transferring context: 3.14MB 0.1s done
#6 DONE 0.1s
#7 [ 3/16] COPY package*.json ./
#7 DONE 0.1s
#8 [ 4/16] COPY backend/package*.json ./backend/
#8 DONE 0.1s
#9 [ 5/16] RUN npm install
#9 1.556 npm warn EBADENGINE Unsupported engine {
#9 1.556 npm warn EBADENGINE   package: '@vitejs/plugin-react@5.0.1',
#9 1.556 npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
#9 1.556 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#9 1.556 npm warn EBADENGINE }
#9 5.926 npm warn deprecated react-beautiful-dnd@13.1.1: react-beautiful-dnd is now deprecated. Context and options: https://github.com/atlassian/react-beautiful-dnd/issues/2672
#9 7.082
#9 7.082 added 133 packages, and audited 134 packages in 7s
#9 7.083
#9 7.083 17 packages are looking for funding
#9 7.083   run `npm fund` for details
#9 7.104
#9 7.104 1 moderate severity vulnerability
#9 7.104
#9 7.104 To address all issues, run:
#9 7.104   npm audit fix
#9 7.104
#9 7.104 Run `npm audit` for details.
#9 7.105 npm notice
#9 7.105 npm notice New major version of npm available! 10.8.2 -> 11.7.0
#9 7.105 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
#9 7.105 npm notice To update run: npm install -g npm@11.7.0
#9 7.105 npm notice
#9 DONE 7.3s
#10 [ 6/16] RUN cd backend && npm install
#10 3.530
#10 3.530 added 128 packages, and audited 129 packages in 3s
#10 3.530
#10 3.530 17 packages are looking for funding
#10 3.530   run `npm fund` for details
#10 3.535
#10 3.535 1 high severity vulnerability
#10 3.535
#10 3.535 To address all issues, run:
#10 3.535   npm audit fix
#10 3.535
#10 3.535 Run `npm audit` for details.
#10 DONE 3.6s
#11 [ 7/16] COPY . .
#11 DONE 0.1s
#12 [ 8/16] RUN npm install @vitejs/plugin-react vite terser --save-dev
#12 1.305 npm warn idealTree Removing dependencies.@vitejs/plugin-react in favor of devDependencies.@vitejs/plugin-react
#12 5.814
#12 5.814 changed 4 packages, and audited 134 packages in 5s
#12 5.814
#12 5.814 17 packages are looking for funding
#12 5.814   run `npm fund` for details
#12 5.816
#12 5.816 found 0 vulnerabilities
#12 DONE 5.9s
#13 [ 9/16] RUN npm run build
#13 0.615
#13 0.615 > gestor-de-pedidos-pigmea@0.0.0 build
#13 0.615 > vite build
#13 0.615
#13 1.140 NODE_ENV=production is not supported in the .env file. Only NODE_ENV=development is supported to create a development build of your project. If you need to set process.env.NODE_ENV, you can set it in the Vite config instead.
#13 1.193 vite v6.4.1 building for production...
#13 2.542 transforming...
#13 3.441 ✓ 37 modules transformed.
#13 3.444 ✗ Build failed in 2.19s
#13 3.445 error during build:
#13 3.445 [vite:esbuild] Transform failed with 1 error:
#13 3.445 /app/components/VendedoresList.tsx:91:14: ERROR: Expected ";" but found "estadísticas"
#13 3.445 file: /app/components/VendedoresList.tsx:91:14
#13 3.445
#13 3.445 Expected ";" but found "estadísticas"
#13 3.445 89 |              document.removeEventListener('mousedown', handleClickOutside);
#13 3.445 90 |          };
#13 3.445 91 |      }, []);ar estadísticas de todos los vendedores en batch
#13 3.445    |                ^
#13 3.445 92 |      useEffect(() => {
#13 3.445 93 |          if (vendedores.length > 0) {
#13 3.445
#13 3.445     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
#13 3.445     at /app/node_modules/esbuild/lib/main.js:736:50
#13 3.445     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
#13 3.445     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
#13 3.445     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
#13 3.445     at Socket.emit (node:events:517:28)
#13 3.445     at addChunk (node:internal/streams/readable:368:12)
#13 3.445     at readableAddChunk (node:internal/streams/readable:341:9)
#13 3.445     at Readable.push (node:internal/streams/readable:278:10)
#13 3.445     at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)
#13 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
> [ 9/16] RUN npm run build:
3.445     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
3.445     at /app/node_modules/esbuild/lib/main.js:736:50
3.445     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
3.445     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
3.445     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
3.445     at Socket.emit (node:events:517:28)
3.445     at addChunk (node:internal/streams/readable:368:12)
3.445     at readableAddChunk (node:internal/streams/readable:341:9)
3.445     at Readable.push (node:internal/streams/readable:278:10)
3.445     at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)
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
#6 transferring context: 3.14MB 0.1s done
#6 DONE 0.1s
#7 [ 3/16] COPY package*.json ./
#7 DONE 0.1s
#8 [ 4/16] COPY backend/package*.json ./backend/
#8 DONE 0.1s
#9 [ 5/16] RUN npm install
#9 1.556 npm warn EBADENGINE Unsupported engine {
#9 1.556 npm warn EBADENGINE   package: '@vitejs/plugin-react@5.0.1',
#9 1.556 npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
#9 1.556 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#9 1.556 npm warn EBADENGINE }
#9 5.926 npm warn deprecated react-beautiful-dnd@13.1.1: react-beautiful-dnd is now deprecated. Context and options: https://github.com/atlassian/react-beautiful-dnd/issues/2672
#9 7.082
#9 7.082 added 133 packages, and audited 134 packages in 7s
#9 7.083
#9 7.083 17 packages are looking for funding
#9 7.083   run `npm fund` for details
#9 7.104
#9 7.104 1 moderate severity vulnerability
#9 7.104
#9 7.104 To address all issues, run:
#9 7.104   npm audit fix
#9 7.104
#9 7.104 Run `npm audit` for details.
#9 7.105 npm notice
#9 7.105 npm notice New major version of npm available! 10.8.2 -> 11.7.0
#9 7.105 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
#9 7.105 npm notice To update run: npm install -g npm@11.7.0
#9 7.105 npm notice
#9 DONE 7.3s
#10 [ 6/16] RUN cd backend && npm install
#10 3.530
#10 3.530 added 128 packages, and audited 129 packages in 3s
#10 3.530
#10 3.530 17 packages are looking for funding
#10 3.530   run `npm fund` for details
#10 3.535
#10 3.535 1 high severity vulnerability
#10 3.535
#10 3.535 To address all issues, run:
#10 3.535   npm audit fix
#10 3.535
#10 3.535 Run `npm audit` for details.
#10 DONE 3.6s
#11 [ 7/16] COPY . .
#11 DONE 0.1s
#12 [ 8/16] RUN npm install @vitejs/plugin-react vite terser --save-dev
#12 1.305 npm warn idealTree Removing dependencies.@vitejs/plugin-react in favor of devDependencies.@vitejs/plugin-react
#12 5.814
#12 5.814 changed 4 packages, and audited 134 packages in 5s
#12 5.814
#12 5.814 17 packages are looking for funding
#12 5.814   run `npm fund` for details
#12 5.816
#12 5.816 found 0 vulnerabilities
#12 DONE 5.9s
#13 [ 9/16] RUN npm run build
#13 0.615
#13 0.615 > gestor-de-pedidos-pigmea@0.0.0 build
#13 0.615 > vite build
#13 0.615
#13 1.140 NODE_ENV=production is not supported in the .env file. Only NODE_ENV=development is supported to create a development build of your project. If you need to set process.env.NODE_ENV, you can set it in the Vite config instead.
#13 1.193 vite v6.4.1 building for production...
#13 2.542 transforming...
#13 3.441 ✓ 37 modules transformed.
#13 3.444 ✗ Build failed in 2.19s
#13 3.445 error during build:
#13 3.445 [vite:esbuild] Transform failed with 1 error:
#13 3.445 /app/components/VendedoresList.tsx:91:14: ERROR: Expected ";" but found "estadísticas"
#13 3.445 file: /app/components/VendedoresList.tsx:91:14
#13 3.445
#13 3.445 Expected ";" but found "estadísticas"
#13 3.445 89 |              document.removeEventListener('mousedown', handleClickOutside);
#13 3.445 90 |          };
#13 3.445 91 |      }, []);ar estadísticas de todos los vendedores en batch
#13 3.445    |                ^
#13 3.445 92 |      useEffect(() => {
#13 3.445 93 |          if (vendedores.length > 0) {
#13 3.445
#13 3.445     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
#13 3.445     at /app/node_modules/esbuild/lib/main.js:736:50
#13 3.445     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
#13 3.445     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
#13 3.445     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
#13 3.445     at Socket.emit (node:events:517:28)
#13 3.445     at addChunk (node:internal/streams/readable:368:12)
#13 3.445     at readableAddChunk (node:internal/streams/readable:341:9)
#13 3.445     at Readable.push (node:internal/streams/readable:278:10)
#13 3.445     at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)
#13 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
> [ 9/16] RUN npm run build:
3.445     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
3.445     at /app/node_modules/esbuild/lib/main.js:736:50
3.445     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
3.445     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
3.445     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
3.445     at Socket.emit (node:events:517:28)
3.445     at addChunk (node:internal/streams/readable:368:12)
3.445     at readableAddChunk (node:internal/streams/readable:341:9)
3.445     at Readable.push (node:internal/streams/readable:278:10)
3.445     at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)
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