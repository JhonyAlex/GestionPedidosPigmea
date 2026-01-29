2026-01-29T20:23:52.364Z [dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
2026-01-29T20:23:52.786Z node:internal/modules/cjs/loader:1143
2026-01-29T20:23:52.786Z throw err;
2026-01-29T20:23:52.786Z ^
2026-01-29T20:23:52.786Z Error: Cannot find module '../package.json'
2026-01-29T20:23:52.786Z Require stack:
2026-01-29T20:23:52.786Z - /app/backend/index.js
2026-01-29T20:23:52.786Z at Module._resolveFilename (node:internal/modules/cjs/loader:1140:15)
2026-01-29T20:23:52.786Z at Module._load (node:internal/modules/cjs/loader:981:27)
2026-01-29T20:23:52.786Z at Module.require (node:internal/modules/cjs/loader:1231:19)
2026-01-29T20:23:52.786Z at require (node:internal/modules/helpers:177:18)
2026-01-29T20:23:52.786Z at Object.<anonymous> (/app/backend/index.js:757:21)
2026-01-29T20:23:52.786Z at Module._compile (node:internal/modules/cjs/loader:1364:14)
2026-01-29T20:23:52.786Z at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
2026-01-29T20:23:52.786Z at Module.load (node:internal/modules/cjs/loader:1203:32)
2026-01-29T20:23:52.786Z at Module._load (node:internal/modules/cjs/loader:1019:12)
2026-01-29T20:23:52.786Z at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:128:12) {
2026-01-29T20:23:52.786Z code: 'MODULE_NOT_FOUND',
2026-01-29T20:23:52.786Z requireStack: [ '/app/backend/index.js' ]
2026-01-29T20:23:52.786Z }
2026-01-29T20:23:52.787Z Node.js v18.20.8