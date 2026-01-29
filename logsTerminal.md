root@pigmea-server:~# docker service logs control-produccin-pigmea-produccionpgimea-7mvrtg --tail 100
root@pigmea-server:~# docker inspect lnpz9ivnaftdc3s6wfspngr7l
[]
Error: No such object: lnpz9ivnaftdc3s6wfspngr7l
root@pigmea-server:~# docker image ls | grep pigmea
control-produccin-pigmea-produccionpgimea-7mvrtg   latest    099604c21097   6 minutes ago       157MB
root@pigmea-server:~# docker run --rm -it --env-file .env control-produccin-pigmea-produccionpgimea-7mvrtg sh
docker: open .env: no such file or directory

Run 'docker run --help' for more information
root@pigmea-server:~# # Crear .env temporal
echo "PORT=3001" > .env
echo "DATABASE_URL=postgresql://pigmea_user:Pigmea_2025_DbSecure42@172.17.0.1:5432/gestion_pedidos" >> .env
echo "NODE_ENV=production" >> .env

# Correr contenedor manualmente para ver el error
docker run --rm -it --env-file .env control-produccin-pigmea-produccionpgimea-7mvrtg sh
/app $ npm start
npm error code ENOENT
npm error syscall open
npm error path /app/package.json
npm error errno -2
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/app/package.json'
npm error enoent This is related to npm not being able to find a file.
npm error enoent
npm error A complete log of this run can be found in: /home/nodejs/.npm/_logs/2026-01-29T21_34_30_559Z-debug-0.log
/app $ ls -R
.:
backend  dist

./backend:
deploy.sh             keep-alive.sh         node_modules          permissions-map.json  setup-db.sh
docker-entrypoint.sh  middleware            package-lock.json     postgres-client.js    test-bcrypt.js
index.js              migrations.js         package.json          scripts               test-sql.sh

./backend/middleware:
auth.js         db-health.js    permissions.js

./backend/node_modules:
@socket.io                  es-errors                   lodash.once                 qs
@types                      es-object-atoms             math-intrinsics             range-parser
accepts                     escape-html                 media-typer                 raw-body
array-flatten               etag                        merge-descriptors           safe-buffer
base64id                    express                     methods                     safer-buffer
bcryptjs                    express-rate-limit          mime                        semver
body-parser                 finalhandler                mime-db                     send
buffer-equal-constant-time  forwarded                   mime-types                  serve-static
bytes                       fresh                       ms                          setprototypeof
call-bind-apply-helpers     function-bind               negotiator                  side-channel
call-bound                  get-intrinsic               object-assign               side-channel-list
compressible                get-proto                   object-inspect              side-channel-map
compression                 gopd                        on-finished                 side-channel-weakmap
content-disposition         has-symbols                 on-headers                  socket.io
content-type                hasown                      parseurl                    socket.io-adapter
cookie                      helmet                      path-to-regexp              socket.io-parser
cookie-signature            http-errors                 pg                          split2
cors                        iconv-lite                  pg-cloudflare               statuses
debug                       inherits                    pg-connection-string        toidentifier
depd                        ipaddr.js                   pg-int8                     type-is
destroy                     jsonwebtoken                pg-pool                     undici-types
dotenv                      jwa                         pg-protocol                 unpipe
dunder-proto                jws                         pg-types                    utils-merge
ecdsa-sig-formatter         lodash.includes             pgpass                      uuid
ee-first                    lodash.isboolean            postgres-array              vary
encodeurl                   lodash.isinteger            postgres-bytea              ws
engine.io                   lodash.isnumber             postgres-date               xtend
engine.io-parser            lodash.isplainobject        postgres-interval
es-define-property          lodash.isstring             proxy-addr

./backend/node_modules/@socket.io:
component-emitter

./backend/node_modules/@socket.io/component-emitter:
LICENSE       Readme.md     lib           package.json

./backend/node_modules/@socket.io/component-emitter/lib:
cjs  esm

./backend/node_modules/@socket.io/component-emitter/lib/cjs:
index.d.ts    index.js      package.json

./backend/node_modules/@socket.io/component-emitter/lib/esm:
index.d.ts    index.js      package.json

./backend/node_modules/@types:
cors  node

./backend/node_modules/@types/cors:
LICENSE       README.md     index.d.ts    package.json

./backend/node_modules/@types/node:
LICENSE                   dns.d.ts                  package.json              timers.d.ts
README.md                 dom-events.d.ts           path.d.ts                 tls.d.ts
assert                    domain.d.ts               perf_hooks.d.ts           trace_events.d.ts
assert.d.ts               events.d.ts               process.d.ts              ts5.6
async_hooks.d.ts          fs                        punycode.d.ts             ts5.7
buffer.buffer.d.ts        fs.d.ts                   querystring.d.ts          tty.d.ts
buffer.d.ts               globals.d.ts              readline                  url.d.ts
child_process.d.ts        globals.typedarray.d.ts   readline.d.ts             util.d.ts
cluster.d.ts              http.d.ts                 repl.d.ts                 v8.d.ts
compatibility             http2.d.ts                sea.d.ts                  vm.d.ts
console.d.ts              https.d.ts                sqlite.d.ts               wasi.d.ts
constants.d.ts            index.d.ts                stream                    worker_threads.d.ts
crypto.d.ts               inspector.d.ts            stream.d.ts               zlib.d.ts
dgram.d.ts                module.d.ts               string_decoder.d.ts
diagnostics_channel.d.ts  net.d.ts                  test.d.ts
dns                       os.d.ts                   timers

./backend/node_modules/@types/node/assert:
strict.d.ts

./backend/node_modules/@types/node/compatibility:
iterators.d.ts

./backend/node_modules/@types/node/dns:
promises.d.ts

./backend/node_modules/@types/node/fs:
promises.d.ts

./backend/node_modules/@types/node/readline:
promises.d.ts

./backend/node_modules/@types/node/stream:
consumers.d.ts  promises.d.ts   web.d.ts

./backend/node_modules/@types/node/timers:
promises.d.ts

./backend/node_modules/@types/node/ts5.6:
buffer.buffer.d.ts       compatibility            globals.typedarray.d.ts  index.d.ts

./backend/node_modules/@types/node/ts5.6/compatibility:
float16array.d.ts

./backend/node_modules/@types/node/ts5.7:
compatibility  index.d.ts

./backend/node_modules/@types/node/ts5.7/compatibility:
float16array.d.ts

./backend/node_modules/accepts:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/array-flatten:
LICENSE           README.md         array-flatten.js  package.json

./backend/node_modules/base64id:
CHANGELOG.md  LICENSE       README.md     lib           package.json

./backend/node_modules/base64id/lib:
base64id.js

./backend/node_modules/bcryptjs:
LICENSE       bin           dist          index.js      scripts       tests
README.md     bower.json    externs       package.json  src

./backend/node_modules/bcryptjs/bin:
bcrypt

./backend/node_modules/bcryptjs/dist:
README.md         bcrypt.js         bcrypt.min.js     bcrypt.min.js.gz  bcrypt.min.map

./backend/node_modules/bcryptjs/externs:
bcrypt.js       minimal-env.js

./backend/node_modules/bcryptjs/scripts:
build.js

./backend/node_modules/bcryptjs/src:
bcrypt      bcrypt.js   bower.json  wrap.js

./backend/node_modules/bcryptjs/src/bcrypt:
impl.js  prng     util     util.js

./backend/node_modules/bcryptjs/src/bcrypt/prng:
README.md  accum.js   isaac.js

./backend/node_modules/bcryptjs/src/bcrypt/util:
base64.js

./backend/node_modules/bcryptjs/tests:
quickbrown.txt  suite.js

./backend/node_modules/body-parser:
HISTORY.md    LICENSE       README.md     SECURITY.md   index.js      lib           package.json

./backend/node_modules/body-parser/lib:
read.js  types

./backend/node_modules/body-parser/lib/types:
json.js        raw.js         text.js        urlencoded.js

./backend/node_modules/buffer-equal-constant-time:
LICENSE.txt   README.md     index.js      package.json  test.js

./backend/node_modules/bytes:
History.md    LICENSE       Readme.md     index.js      package.json

./backend/node_modules/call-bind-apply-helpers:
CHANGELOG.md        actualApply.js      functionApply.js    index.js            test
LICENSE             applyBind.d.ts      functionCall.d.ts   package.json        tsconfig.json
README.md           applyBind.js        functionCall.js     reflectApply.d.ts
actualApply.d.ts    functionApply.d.ts  index.d.ts          reflectApply.js

./backend/node_modules/call-bind-apply-helpers/test:
index.js

./backend/node_modules/call-bound:
CHANGELOG.md   README.md      index.js       test
LICENSE        index.d.ts     package.json   tsconfig.json

./backend/node_modules/call-bound/test:
index.js

./backend/node_modules/compressible:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/compression:
HISTORY.md    LICENSE       README.md     index.js      node_modules  package.json

./backend/node_modules/compression/node_modules:
negotiator

./backend/node_modules/compression/node_modules/negotiator:
HISTORY.md    LICENSE       README.md     index.js      lib           package.json

./backend/node_modules/compression/node_modules/negotiator/lib:
charset.js    encoding.js   language.js   mediaType.js

./backend/node_modules/content-disposition:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/content-type:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/cookie:
LICENSE       README.md     SECURITY.md   index.js      package.json

./backend/node_modules/cookie-signature:
History.md    Readme.md     index.js      package.json

./backend/node_modules/cors:
CONTRIBUTING.md  HISTORY.md       LICENSE          README.md        lib              package.json

./backend/node_modules/cors/lib:
index.js

./backend/node_modules/debug:
CHANGELOG.md    Makefile        component.json  node.js         src
LICENSE         README.md       karma.conf.js   package.json

./backend/node_modules/debug/src:
browser.js        debug.js          index.js          inspector-log.js  node.js

./backend/node_modules/depd:
History.md    LICENSE       Readme.md     index.js      lib           package.json

./backend/node_modules/depd/lib:
browser

./backend/node_modules/depd/lib/browser:
index.js

./backend/node_modules/destroy:
LICENSE       README.md     index.js      package.json

./backend/node_modules/dotenv:
CHANGELOG.md  README-es.md  SECURITY.md   config.js     package.json
LICENSE       README.md     config.d.ts   lib

./backend/node_modules/dotenv/lib:
cli-options.js  env-options.js  main.d.ts       main.js

./backend/node_modules/dunder-proto:
CHANGELOG.md   README.md      get.js         set.d.ts       test
LICENSE        get.d.ts       package.json   set.js         tsconfig.json

./backend/node_modules/dunder-proto/test:
get.js    index.js  set.js

./backend/node_modules/ecdsa-sig-formatter:
CODEOWNERS    LICENSE       README.md     package.json  src

./backend/node_modules/ecdsa-sig-formatter/src:
ecdsa-sig-formatter.d.ts  ecdsa-sig-formatter.js    param-bytes-for-alg.js

./backend/node_modules/ee-first:
LICENSE       README.md     index.js      package.json

./backend/node_modules/encodeurl:
LICENSE       README.md     index.js      package.json

./backend/node_modules/engine.io:
LICENSE       README.md     build         node_modules  package.json  wrapper.mjs

./backend/node_modules/engine.io/build:
contrib         engine.io.js    server.d.ts     socket.d.ts     transport.d.ts  transports      userver.d.ts
engine.io.d.ts  parser-v3       server.js       socket.js       transport.js    transports-uws  userver.js

./backend/node_modules/engine.io/build/contrib:
types.cookie.d.ts  types.cookie.js

./backend/node_modules/engine.io/build/parser-v3:
index.d.ts  index.js    utf8.d.ts   utf8.js

./backend/node_modules/engine.io/build/transports:
index.d.ts          polling-jsonp.d.ts  polling.d.ts        websocket.d.ts      webtransport.d.ts
index.js            polling-jsonp.js    polling.js          websocket.js        webtransport.js

./backend/node_modules/engine.io/build/transports-uws:
index.d.ts      index.js        polling.d.ts    polling.js      websocket.d.ts  websocket.js

./backend/node_modules/engine.io/node_modules:
cookie  debug   ms

./backend/node_modules/engine.io/node_modules/cookie:
LICENSE       README.md     SECURITY.md   index.js      package.json

./backend/node_modules/engine.io/node_modules/debug:
LICENSE       README.md     package.json  src

./backend/node_modules/engine.io/node_modules/debug/src:
browser.js  common.js   index.js    node.js

./backend/node_modules/engine.io/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/engine.io-parser:
LICENSE       Readme.md     build         package.json

./backend/node_modules/engine.io-parser/build:
cjs  esm

./backend/node_modules/engine.io-parser/build/cjs:
commons.d.ts               decodePacket.browser.js    encodePacket.browser.js    index.js
commons.js                 decodePacket.d.ts          encodePacket.d.ts          package.json
contrib                    decodePacket.js            encodePacket.js
decodePacket.browser.d.ts  encodePacket.browser.d.ts  index.d.ts

./backend/node_modules/engine.io-parser/build/cjs/contrib:
base64-arraybuffer.d.ts  base64-arraybuffer.js

./backend/node_modules/engine.io-parser/build/esm:
commons.d.ts               decodePacket.browser.js    encodePacket.browser.js    index.js
commons.js                 decodePacket.d.ts          encodePacket.d.ts          package.json
contrib                    decodePacket.js            encodePacket.js
decodePacket.browser.d.ts  encodePacket.browser.d.ts  index.d.ts

./backend/node_modules/engine.io-parser/build/esm/contrib:
base64-arraybuffer.d.ts  base64-arraybuffer.js

./backend/node_modules/es-define-property:
CHANGELOG.md   README.md      index.js       test
LICENSE        index.d.ts     package.json   tsconfig.json

./backend/node_modules/es-define-property/test:
index.js

./backend/node_modules/es-errors:
CHANGELOG.md   eval.d.ts      index.js       range.js       syntax.d.ts    tsconfig.json  uri.d.ts
LICENSE        eval.js        package.json   ref.d.ts       syntax.js      type.d.ts      uri.js
README.md      index.d.ts     range.d.ts     ref.js         test           type.js

./backend/node_modules/es-errors/test:
index.js

./backend/node_modules/es-object-atoms:
CHANGELOG.md                 RequireObjectCoercible.js    index.js                     test
LICENSE                      ToObject.d.ts                isObject.d.ts                tsconfig.json
README.md                    ToObject.js                  isObject.js
RequireObjectCoercible.d.ts  index.d.ts                   package.json

./backend/node_modules/es-object-atoms/test:
index.js

./backend/node_modules/escape-html:
LICENSE       Readme.md     index.js      package.json

./backend/node_modules/etag:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/express:
History.md    LICENSE       Readme.md     index.js      lib           package.json

./backend/node_modules/express/lib:
application.js  middleware      response.js     utils.js
express.js      request.js      router          view.js

./backend/node_modules/express/lib/middleware:
init.js   query.js

./backend/node_modules/express/lib/router:
index.js  layer.js  route.js

./backend/node_modules/express-rate-limit:
dist           license.md     package.json   readme.md      tsconfig.json

./backend/node_modules/express-rate-limit/dist:
index.cjs    index.d.cts  index.d.mts  index.d.ts   index.mjs

./backend/node_modules/finalhandler:
HISTORY.md    LICENSE       README.md     SECURITY.md   index.js      package.json

./backend/node_modules/forwarded:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/fresh:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/function-bind:
CHANGELOG.md       README.md          index.js           test
LICENSE            implementation.js  package.json

./backend/node_modules/function-bind/test:
index.js

./backend/node_modules/get-intrinsic:
CHANGELOG.md  LICENSE       README.md     index.js      package.json  test

./backend/node_modules/get-intrinsic/test:
GetIntrinsic.js

./backend/node_modules/get-proto:
CHANGELOG.md                 Object.getPrototypeOf.js     Reflect.getPrototypeOf.js    package.json
LICENSE                      README.md                    index.d.ts                   test
Object.getPrototypeOf.d.ts   Reflect.getPrototypeOf.d.ts  index.js                     tsconfig.json

./backend/node_modules/get-proto/test:
index.js

./backend/node_modules/gopd:
CHANGELOG.md   README.md      gOPD.js        index.js       test
LICENSE        gOPD.d.ts      index.d.ts     package.json   tsconfig.json

./backend/node_modules/gopd/test:
index.js

./backend/node_modules/has-symbols:
CHANGELOG.md   README.md      index.js       shams.d.ts     test
LICENSE        index.d.ts     package.json   shams.js       tsconfig.json

./backend/node_modules/has-symbols/test:
index.js  shams     tests.js

./backend/node_modules/has-symbols/test/shams:
core-js.js                   get-own-property-symbols.js

./backend/node_modules/hasown:
CHANGELOG.md   LICENSE        README.md      index.d.ts     index.js       package.json   tsconfig.json

./backend/node_modules/helmet:
CHANGELOG.md  README.md     index.cjs     index.d.mts   package.json
LICENSE       SECURITY.md   index.d.cts   index.mjs

./backend/node_modules/http-errors:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/iconv-lite:
Changelog.md  LICENSE       README.md     encodings     lib           package.json

./backend/node_modules/iconv-lite/encodings:
dbcs-codec.js           internal.js             sbcs-data.js            utf7.js
dbcs-data.js            sbcs-codec.js           tables
index.js                sbcs-data-generated.js  utf16.js

./backend/node_modules/iconv-lite/encodings/tables:
big5-added.json      cp949.json           eucjp.json           gbk-added.json
cp936.json           cp950.json           gb18030-ranges.json  shiftjis.json

./backend/node_modules/iconv-lite/lib:
bom-handling.js  extend-node.js   index.d.ts       index.js         streams.js

./backend/node_modules/inherits:
LICENSE              README.md            inherits.js          inherits_browser.js  package.json

./backend/node_modules/ipaddr.js:
LICENSE        README.md      ipaddr.min.js  lib            package.json

./backend/node_modules/ipaddr.js/lib:
ipaddr.js       ipaddr.js.d.ts

./backend/node_modules/jsonwebtoken:
LICENSE       decode.js     lib           package.json  verify.js
README.md     index.js      node_modules  sign.js

./backend/node_modules/jsonwebtoken/lib:
JsonWebTokenError.js              asymmetricKeyDetailsSupported.js  timespan.js
NotBeforeError.js                 psSupported.js                    validateAsymmetricKey.js
TokenExpiredError.js              rsaPssKeyDetailsSupported.js

./backend/node_modules/jsonwebtoken/node_modules:
ms

./backend/node_modules/jsonwebtoken/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/jwa:
LICENSE       README.md     index.js      package.json

./backend/node_modules/jws:
CHANGELOG.md  LICENSE       index.js      lib           package.json  readme.md

./backend/node_modules/jws/lib:
data-stream.js    sign-stream.js    tostring.js       verify-stream.js

./backend/node_modules/lodash.includes:
LICENSE       README.md     index.js      package.json

./backend/node_modules/lodash.isboolean:
LICENSE       README.md     index.js      package.json

./backend/node_modules/lodash.isinteger:
LICENSE       README.md     index.js      package.json

./backend/node_modules/lodash.isnumber:
LICENSE       README.md     index.js      package.json

./backend/node_modules/lodash.isplainobject:
LICENSE       README.md     index.js      package.json

./backend/node_modules/lodash.isstring:
LICENSE       README.md     index.js      package.json

./backend/node_modules/lodash.once:
LICENSE       README.md     index.js      package.json

./backend/node_modules/math-intrinsics:
CHANGELOG.md         floor.js             isNegativeZero.d.ts  mod.js               sign.js
LICENSE              isFinite.d.ts        isNegativeZero.js    package.json         test
README.md            isFinite.js          max.d.ts             pow.d.ts             tsconfig.json
abs.d.ts             isInteger.d.ts       max.js               pow.js
abs.js               isInteger.js         min.d.ts             round.d.ts
constants            isNaN.d.ts           min.js               round.js
floor.d.ts           isNaN.js             mod.d.ts             sign.d.ts

./backend/node_modules/math-intrinsics/constants:
maxArrayLength.d.ts  maxSafeInteger.d.ts  maxValue.d.ts
maxArrayLength.js    maxSafeInteger.js    maxValue.js

./backend/node_modules/math-intrinsics/test:
index.js

./backend/node_modules/media-typer:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/merge-descriptors:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/methods:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/mime:
CHANGELOG.md  LICENSE       README.md     cli.js        mime.js       package.json  src           types.json

./backend/node_modules/mime/src:
build.js  test.js

./backend/node_modules/mime-db:
HISTORY.md    LICENSE       README.md     db.json       index.js      package.json

./backend/node_modules/mime-types:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/negotiator:
HISTORY.md    LICENSE       README.md     index.js      lib           package.json

./backend/node_modules/negotiator/lib:
charset.js    encoding.js   language.js   mediaType.js

./backend/node_modules/object-assign:
index.js      license       package.json  readme.md

./backend/node_modules/object-inspect:
CHANGELOG.md          example               package-support.json  readme.markdown       test-core-js.js
LICENSE               index.js              package.json          test                  util.inspect.js

./backend/node_modules/object-inspect/example:
all.js       circular.js  fn.js        inspect.js

./backend/node_modules/object-inspect/test:
bigint.js         element.js        global.js         inspect.js        toStringTag.js
browser           err.js            has.js            lowbyte.js        undef.js
circular.js       fakes.js          holes.js          number.js         values.js
deep.js           fn.js             indent-option.js  quoteStyle.js

./backend/node_modules/object-inspect/test/browser:
dom.js

./backend/node_modules/on-finished:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/on-headers:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/parseurl:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/path-to-regexp:
LICENSE       Readme.md     index.js      package.json

./backend/node_modules/pg:
LICENSE       README.md     esm           lib           package.json

./backend/node_modules/pg/esm:
index.mjs

./backend/node_modules/pg/lib:
client.js                 crypto                    native                    stream.js
connection-parameters.js  defaults.js               query.js                  type-overrides.js
connection.js             index.js                  result.js                 utils.js

./backend/node_modules/pg/lib/crypto:
cert-signatures.js  sasl.js             utils-legacy.js     utils-webcrypto.js  utils.js

./backend/node_modules/pg/lib/native:
client.js  index.js   query.js

./backend/node_modules/pg-cloudflare:
LICENSE       README.md     dist          esm           package.json  src

./backend/node_modules/pg-cloudflare/dist:
empty.d.ts    empty.js      empty.js.map  index.d.ts    index.js      index.js.map

./backend/node_modules/pg-cloudflare/esm:
index.mjs

./backend/node_modules/pg-cloudflare/src:
empty.ts    index.ts    types.d.ts

./backend/node_modules/pg-connection-string:
LICENSE       README.md     esm           index.d.ts    index.js      package.json

./backend/node_modules/pg-connection-string/esm:
index.mjs

./backend/node_modules/pg-int8:
LICENSE       README.md     index.js      package.json

./backend/node_modules/pg-pool:
LICENSE       README.md     esm           index.js      package.json

./backend/node_modules/pg-pool/esm:
index.mjs

./backend/node_modules/pg-protocol:
LICENSE       README.md     dist          esm           package.json  src

./backend/node_modules/pg-protocol/dist:
b.d.ts                           inbound-parser.test.d.ts         outbound-serializer.test.d.ts
b.js                             inbound-parser.test.js           outbound-serializer.test.js
b.js.map                         inbound-parser.test.js.map       outbound-serializer.test.js.map
buffer-reader.d.ts               index.d.ts                       parser.d.ts
buffer-reader.js                 index.js                         parser.js
buffer-reader.js.map             index.js.map                     parser.js.map
buffer-writer.d.ts               messages.d.ts                    serializer.d.ts
buffer-writer.js                 messages.js                      serializer.js
buffer-writer.js.map             messages.js.map                  serializer.js.map

./backend/node_modules/pg-protocol/esm:
index.js

./backend/node_modules/pg-protocol/src:
b.ts                         inbound-parser.test.ts       outbound-serializer.test.ts  testing
buffer-reader.ts             index.ts                     parser.ts                    types
buffer-writer.ts             messages.ts                  serializer.ts

./backend/node_modules/pg-protocol/src/testing:
buffer-list.ts   test-buffers.ts

./backend/node_modules/pg-protocol/src/types:
chunky.d.ts

./backend/node_modules/pg-types:
Makefile         index.d.ts       index.test-d.ts  package.json
README.md        index.js         lib              test

./backend/node_modules/pg-types/lib:
arrayParser.js    binaryParsers.js  builtins.js       textParsers.js

./backend/node_modules/pg-types/test:
index.js  types.js

./backend/node_modules/pgpass:
README.md     lib           package.json

./backend/node_modules/pgpass/lib:
helper.js  index.js

./backend/node_modules/postgres-array:
index.d.ts    index.js      license       package.json  readme.md

./backend/node_modules/postgres-bytea:
index.js      license       package.json  readme.md

./backend/node_modules/postgres-date:
index.js      license       package.json  readme.md

./backend/node_modules/postgres-interval:
index.d.ts    index.js      license       package.json  readme.md

./backend/node_modules/proxy-addr:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/qs:
CHANGELOG.md  LICENSE.md    README.md     dist          lib           package.json  test

./backend/node_modules/qs/dist:
qs.js

./backend/node_modules/qs/lib:
formats.js    index.js      parse.js      stringify.js  utils.js

./backend/node_modules/qs/test:
empty-keys-cases.js  parse.js             stringify.js         utils.js

./backend/node_modules/range-parser:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/raw-body:
HISTORY.md    LICENSE       README.md     SECURITY.md   index.d.ts    index.js      package.json

./backend/node_modules/safe-buffer:
LICENSE       README.md     index.d.ts    index.js      package.json

./backend/node_modules/safer-buffer:
LICENSE            Readme.md          package.json       tests.js
Porting-Buffer.md  dangerous.js       safer.js

./backend/node_modules/semver:
LICENSE       bin           functions     internal      preload.js    ranges
README.md     classes       index.js      package.json  range.bnf

./backend/node_modules/semver/bin:
semver.js

./backend/node_modules/semver/classes:
comparator.js  index.js       range.js       semver.js

./backend/node_modules/semver/functions:
clean.js          compare-loose.js  gt.js             lte.js            parse.js          rsort.js
cmp.js            compare.js        gte.js            major.js          patch.js          satisfies.js
coerce.js         diff.js           inc.js            minor.js          prerelease.js     sort.js
compare-build.js  eq.js             lt.js             neq.js            rcompare.js       valid.js

./backend/node_modules/semver/internal:
constants.js      debug.js          identifiers.js    lrucache.js       parse-options.js  re.js

./backend/node_modules/semver/ranges:
gtr.js             ltr.js             min-satisfying.js  outside.js         subset.js          valid.js
intersects.js      max-satisfying.js  min-version.js     simplify.js        to-comparators.js

./backend/node_modules/send:
HISTORY.md    LICENSE       README.md     SECURITY.md   index.js      node_modules  package.json

./backend/node_modules/send/node_modules:
encodeurl  ms

./backend/node_modules/send/node_modules/encodeurl:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/send/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/serve-static:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/setprototypeof:
LICENSE       README.md     index.d.ts    index.js      package.json  test

./backend/node_modules/setprototypeof/test:
index.js

./backend/node_modules/side-channel:
CHANGELOG.md   README.md      index.js       test
LICENSE        index.d.ts     package.json   tsconfig.json

./backend/node_modules/side-channel/test:
index.js

./backend/node_modules/side-channel-list:
CHANGELOG.md   README.md      index.js       package.json   tsconfig.json
LICENSE        index.d.ts     list.d.ts      test

./backend/node_modules/side-channel-list/test:
index.js

./backend/node_modules/side-channel-map:
CHANGELOG.md   README.md      index.js       test
LICENSE        index.d.ts     package.json   tsconfig.json

./backend/node_modules/side-channel-map/test:
index.js

./backend/node_modules/side-channel-weakmap:
CHANGELOG.md   README.md      index.js       test
LICENSE        index.d.ts     package.json   tsconfig.json

./backend/node_modules/side-channel-weakmap/test:
index.js

./backend/node_modules/socket.io:
LICENSE       Readme.md     client-dist   dist          node_modules  package.json  wrapper.mjs

./backend/node_modules/socket.io/client-dist:
socket.io.esm.min.js          socket.io.js.map              socket.io.msgpack.min.js
socket.io.esm.min.js.map      socket.io.min.js              socket.io.msgpack.min.js.map
socket.io.js                  socket.io.min.js.map

./backend/node_modules/socket.io/dist:
broadcast-operator.d.ts  index.js                 socket-types.d.ts        typed-events.js
broadcast-operator.js    namespace.d.ts           socket-types.js          uws.d.ts
client.d.ts              namespace.js             socket.d.ts              uws.js
client.js                parent-namespace.d.ts    socket.js
index.d.ts               parent-namespace.js      typed-events.d.ts

./backend/node_modules/socket.io/node_modules:
debug  ms

./backend/node_modules/socket.io/node_modules/debug:
LICENSE       README.md     package.json  src

./backend/node_modules/socket.io/node_modules/debug/src:
browser.js  common.js   index.js    node.js

./backend/node_modules/socket.io/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/socket.io-adapter:
LICENSE       Readme.md     dist          node_modules  package.json

./backend/node_modules/socket.io-adapter/dist:
cluster-adapter.d.ts    contrib                 in-memory-adapter.js    index.js
cluster-adapter.js      in-memory-adapter.d.ts  index.d.ts

./backend/node_modules/socket.io-adapter/dist/contrib:
yeast.d.ts  yeast.js

./backend/node_modules/socket.io-adapter/node_modules:
debug  ms

./backend/node_modules/socket.io-adapter/node_modules/debug:
LICENSE       README.md     package.json  src

./backend/node_modules/socket.io-adapter/node_modules/debug/src:
browser.js  common.js   index.js    node.js

./backend/node_modules/socket.io-adapter/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/socket.io-parser:
LICENSE       Readme.md     build         node_modules  package.json

./backend/node_modules/socket.io-parser/build:
cjs        esm        esm-debug

./backend/node_modules/socket.io-parser/build/cjs:
binary.d.ts     binary.js       index.d.ts      index.js        is-binary.d.ts  is-binary.js    package.json

./backend/node_modules/socket.io-parser/build/esm:
binary.d.ts     binary.js       index.d.ts      index.js        is-binary.d.ts  is-binary.js    package.json

./backend/node_modules/socket.io-parser/build/esm-debug:
binary.d.ts     binary.js       index.d.ts      index.js        is-binary.d.ts  is-binary.js    package.json

./backend/node_modules/socket.io-parser/node_modules:
debug  ms

./backend/node_modules/socket.io-parser/node_modules/debug:
LICENSE       README.md     package.json  src

./backend/node_modules/socket.io-parser/node_modules/debug/src:
browser.js  common.js   index.js    node.js

./backend/node_modules/socket.io-parser/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/split2:
LICENSE       README.md     bench.js      index.js      package.json  test.js

./backend/node_modules/statuses:
HISTORY.md    LICENSE       README.md     codes.json    index.js      package.json

./backend/node_modules/toidentifier:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/type-is:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/undici-types:
LICENSE                    cookies.d.ts               handlers.d.ts              patch.d.ts
README.md                  diagnostics-channel.d.ts   header.d.ts                pool-stats.d.ts
agent.d.ts                 dispatcher.d.ts            index.d.ts                 pool.d.ts
api.d.ts                   env-http-proxy-agent.d.ts  interceptors.d.ts          proxy-agent.d.ts
balanced-pool.d.ts         errors.d.ts                mock-agent.d.ts            readable.d.ts
cache-interceptor.d.ts     eventsource.d.ts           mock-call-history.d.ts     retry-agent.d.ts
cache.d.ts                 fetch.d.ts                 mock-client.d.ts           retry-handler.d.ts
client-stats.d.ts          formdata.d.ts              mock-errors.d.ts           util.d.ts
client.d.ts                global-dispatcher.d.ts     mock-interceptor.d.ts      utility.d.ts
connector.d.ts             global-origin.d.ts         mock-pool.d.ts             webidl.d.ts
content-type.d.ts          h2c-client.d.ts            package.json               websocket.d.ts

./backend/node_modules/unpipe:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/utils-merge:
LICENSE       README.md     index.js      package.json

./backend/node_modules/uuid:
CHANGELOG.md     CONTRIBUTING.md  LICENSE.md       README.md        dist             package.json     wrapper.mjs

./backend/node_modules/uuid/dist:
bin                md5-browser.js     parse.js           sha1.js            v35.js
commonjs-browser   md5.js             regex.js           stringify.js       v4.js
esm-browser        native-browser.js  rng-browser.js     uuid-bin.js        v5.js
esm-node           native.js          rng.js             v1.js              validate.js
index.js           nil.js             sha1-browser.js    v3.js              version.js

./backend/node_modules/uuid/dist/bin:
uuid

./backend/node_modules/uuid/dist/commonjs-browser:
index.js      native.js     parse.js      rng.js        stringify.js  v3.js         v4.js         validate.js
md5.js        nil.js        regex.js      sha1.js       v1.js         v35.js        v5.js         version.js

./backend/node_modules/uuid/dist/esm-browser:
index.js      native.js     parse.js      rng.js        stringify.js  v3.js         v4.js         validate.js
/app $ ls -R
.:
backend  dist

./backend:
deploy.sh             keep-alive.sh         node_modules          permissions-map.json  setup-db.sh
docker-entrypoint.sh  middleware            package-lock.json     postgres-client.js    test-bcrypt.js
index.js              migrations.js         package.json          scripts               test-sql.sh

./backend/middleware:
auth.js         db-health.js    permissions.js

./backend/node_modules:
@socket.io                  es-errors                   lodash.once                 qs
@types                      es-object-atoms             math-intrinsics             range-parser
accepts                     escape-html                 media-typer                 raw-body
array-flatten               etag                        merge-descriptors           safe-buffer
base64id                    express                     methods                     safer-buffer
bcryptjs                    express-rate-limit          mime                        semver
body-parser                 finalhandler                mime-db                     send
buffer-equal-constant-time  forwarded                   mime-types                  serve-static
bytes                       fresh                       ms                          setprototypeof
call-bind-apply-helpers     function-bind               negotiator                  side-channel
call-bound                  get-intrinsic               object-assign               side-channel-list
compressible                get-proto                   object-inspect              side-channel-map
compression                 gopd                        on-finished                 side-channel-weakmap
content-disposition         has-symbols                 on-headers                  socket.io
content-type                hasown                      parseurl                    socket.io-adapter
cookie                      helmet                      path-to-regexp              socket.io-parser
cookie-signature            http-errors                 pg                          split2
cors                        iconv-lite                  pg-cloudflare               statuses
debug                       inherits                    pg-connection-string        toidentifier
depd                        ipaddr.js                   pg-int8                     type-is
destroy                     jsonwebtoken                pg-pool                     undici-types
dotenv                      jwa                         pg-protocol                 unpipe
dunder-proto                jws                         pg-types                    utils-merge
ecdsa-sig-formatter         lodash.includes             pgpass                      uuid
ee-first                    lodash.isboolean            postgres-array              vary
encodeurl                   lodash.isinteger            postgres-bytea              ws
engine.io                   lodash.isnumber             postgres-date               xtend
engine.io-parser            lodash.isplainobject        postgres-interval
es-define-property          lodash.isstring             proxy-addr

./backend/node_modules/@socket.io:
component-emitter

./backend/node_modules/@socket.io/component-emitter:
LICENSE       Readme.md     lib           package.json

./backend/node_modules/@socket.io/component-emitter/lib:
cjs  esm

./backend/node_modules/@socket.io/component-emitter/lib/cjs:
index.d.ts    index.js      package.json

./backend/node_modules/@socket.io/component-emitter/lib/esm:
index.d.ts    index.js      package.json

./backend/node_modules/@types:
cors  node

./backend/node_modules/@types/cors:
LICENSE       README.md     index.d.ts    package.json

./backend/node_modules/@types/node:
LICENSE                   dns.d.ts                  package.json              timers.d.ts
README.md                 dom-events.d.ts           path.d.ts                 tls.d.ts
assert                    domain.d.ts               perf_hooks.d.ts           trace_events.d.ts
assert.d.ts               events.d.ts               process.d.ts              ts5.6
async_hooks.d.ts          fs                        punycode.d.ts             ts5.7
buffer.buffer.d.ts        fs.d.ts                   querystring.d.ts          tty.d.ts
buffer.d.ts               globals.d.ts              readline                  url.d.ts
child_process.d.ts        globals.typedarray.d.ts   readline.d.ts             util.d.ts
cluster.d.ts              http.d.ts                 repl.d.ts                 v8.d.ts
compatibility             http2.d.ts                sea.d.ts                  vm.d.ts
console.d.ts              https.d.ts                sqlite.d.ts               wasi.d.ts
constants.d.ts            index.d.ts                stream                    worker_threads.d.ts
crypto.d.ts               inspector.d.ts            stream.d.ts               zlib.d.ts
dgram.d.ts                module.d.ts               string_decoder.d.ts
diagnostics_channel.d.ts  net.d.ts                  test.d.ts
dns                       os.d.ts                   timers

./backend/node_modules/@types/node/assert:
strict.d.ts

./backend/node_modules/@types/node/compatibility:
iterators.d.ts

./backend/node_modules/@types/node/dns:
promises.d.ts

./backend/node_modules/@types/node/fs:
promises.d.ts

./backend/node_modules/@types/node/readline:
promises.d.ts

./backend/node_modules/@types/node/stream:
consumers.d.ts  promises.d.ts   web.d.ts

./backend/node_modules/@types/node/timers:
promises.d.ts

./backend/node_modules/@types/node/ts5.6:
buffer.buffer.d.ts       compatibility            globals.typedarray.d.ts  index.d.ts

./backend/node_modules/@types/node/ts5.6/compatibility:
float16array.d.ts

./backend/node_modules/@types/node/ts5.7:
compatibility  index.d.ts

./backend/node_modules/@types/node/ts5.7/compatibility:
float16array.d.ts

./backend/node_modules/accepts:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/array-flatten:
LICENSE           README.md         array-flatten.js  package.json

./backend/node_modules/base64id:
CHANGELOG.md  LICENSE       README.md     lib           package.json

./backend/node_modules/base64id/lib:
base64id.js

./backend/node_modules/bcryptjs:
LICENSE       bin           dist          index.js      scripts       tests
README.md     bower.json    externs       package.json  src

./backend/node_modules/bcryptjs/bin:
bcrypt

./backend/node_modules/bcryptjs/dist:
README.md         bcrypt.js         bcrypt.min.js     bcrypt.min.js.gz  bcrypt.min.map

./backend/node_modules/bcryptjs/externs:
bcrypt.js       minimal-env.js

./backend/node_modules/bcryptjs/scripts:
build.js

./backend/node_modules/bcryptjs/src:
bcrypt      bcrypt.js   bower.json  wrap.js

./backend/node_modules/bcryptjs/src/bcrypt:
impl.js  prng     util     util.js

./backend/node_modules/bcryptjs/src/bcrypt/prng:
README.md  accum.js   isaac.js

./backend/node_modules/bcryptjs/src/bcrypt/util:
base64.js

./backend/node_modules/bcryptjs/tests:
quickbrown.txt  suite.js

./backend/node_modules/body-parser:
HISTORY.md    LICENSE       README.md     SECURITY.md   index.js      lib           package.json

./backend/node_modules/body-parser/lib:
read.js  types

./backend/node_modules/body-parser/lib/types:
json.js        raw.js         text.js        urlencoded.js

./backend/node_modules/buffer-equal-constant-time:
LICENSE.txt   README.md     index.js      package.json  test.js

./backend/node_modules/bytes:
History.md    LICENSE       Readme.md     index.js      package.json

./backend/node_modules/call-bind-apply-helpers:
CHANGELOG.md        actualApply.js      functionApply.js    index.js            test
LICENSE             applyBind.d.ts      functionCall.d.ts   package.json        tsconfig.json
README.md           applyBind.js        functionCall.js     reflectApply.d.ts
actualApply.d.ts    functionApply.d.ts  index.d.ts          reflectApply.js

./backend/node_modules/call-bind-apply-helpers/test:
index.js

./backend/node_modules/call-bound:
CHANGELOG.md   README.md      index.js       test
LICENSE        index.d.ts     package.json   tsconfig.json

./backend/node_modules/call-bound/test:
index.js

./backend/node_modules/compressible:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/compression:
HISTORY.md    LICENSE       README.md     index.js      node_modules  package.json

./backend/node_modules/compression/node_modules:
negotiator

./backend/node_modules/compression/node_modules/negotiator:
HISTORY.md    LICENSE       README.md     index.js      lib           package.json

./backend/node_modules/compression/node_modules/negotiator/lib:
charset.js    encoding.js   language.js   mediaType.js

./backend/node_modules/content-disposition:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/content-type:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/cookie:
LICENSE       README.md     SECURITY.md   index.js      package.json

./backend/node_modules/cookie-signature:
History.md    Readme.md     index.js      package.json

./backend/node_modules/cors:
CONTRIBUTING.md  HISTORY.md       LICENSE          README.md        lib              package.json

./backend/node_modules/cors/lib:
index.js

./backend/node_modules/debug:
CHANGELOG.md    Makefile        component.json  node.js         src
LICENSE         README.md       karma.conf.js   package.json

./backend/node_modules/debug/src:
browser.js        debug.js          index.js          inspector-log.js  node.js

./backend/node_modules/depd:
History.md    LICENSE       Readme.md     index.js      lib           package.json

./backend/node_modules/depd/lib:
browser

./backend/node_modules/depd/lib/browser:
index.js

./backend/node_modules/destroy:
LICENSE       README.md     index.js      package.json

./backend/node_modules/dotenv:
CHANGELOG.md  README-es.md  SECURITY.md   config.js     package.json
LICENSE       README.md     config.d.ts   lib

./backend/node_modules/dotenv/lib:
cli-options.js  env-options.js  main.d.ts       main.js

./backend/node_modules/dunder-proto:
CHANGELOG.md   README.md      get.js         set.d.ts       test
LICENSE        get.d.ts       package.json   set.js         tsconfig.json

./backend/node_modules/dunder-proto/test:
get.js    index.js  set.js

./backend/node_modules/ecdsa-sig-formatter:
CODEOWNERS    LICENSE       README.md     package.json  src

./backend/node_modules/ecdsa-sig-formatter/src:
ecdsa-sig-formatter.d.ts  ecdsa-sig-formatter.js    param-bytes-for-alg.js

./backend/node_modules/ee-first:
LICENSE       README.md     index.js      package.json

./backend/node_modules/encodeurl:
LICENSE       README.md     index.js      package.json

./backend/node_modules/engine.io:
LICENSE       README.md     build         node_modules  package.json  wrapper.mjs

./backend/node_modules/engine.io/build:
contrib         engine.io.js    server.d.ts     socket.d.ts     transport.d.ts  transports      userver.d.ts
engine.io.d.ts  parser-v3       server.js       socket.js       transport.js    transports-uws  userver.js

./backend/node_modules/engine.io/build/contrib:
types.cookie.d.ts  types.cookie.js

./backend/node_modules/engine.io/build/parser-v3:
index.d.ts  index.js    utf8.d.ts   utf8.js

./backend/node_modules/engine.io/build/transports:
index.d.ts          polling-jsonp.d.ts  polling.d.ts        websocket.d.ts      webtransport.d.ts
index.js            polling-jsonp.js    polling.js          websocket.js        webtransport.js

./backend/node_modules/engine.io/build/transports-uws:
index.d.ts      index.js        polling.d.ts    polling.js      websocket.d.ts  websocket.js

./backend/node_modules/engine.io/node_modules:
cookie  debug   ms

./backend/node_modules/engine.io/node_modules/cookie:
LICENSE       README.md     SECURITY.md   index.js      package.json

./backend/node_modules/engine.io/node_modules/debug:
LICENSE       README.md     package.json  src

./backend/node_modules/engine.io/node_modules/debug/src:
browser.js  common.js   index.js    node.js

./backend/node_modules/engine.io/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/engine.io-parser:
LICENSE       Readme.md     build         package.json

./backend/node_modules/engine.io-parser/build:
cjs  esm

./backend/node_modules/engine.io-parser/build/cjs:
commons.d.ts               decodePacket.browser.js    encodePacket.browser.js    index.js
commons.js                 decodePacket.d.ts          encodePacket.d.ts          package.json
contrib                    decodePacket.js            encodePacket.js
decodePacket.browser.d.ts  encodePacket.browser.d.ts  index.d.ts

./backend/node_modules/engine.io-parser/build/cjs/contrib:
base64-arraybuffer.d.ts  base64-arraybuffer.js

./backend/node_modules/engine.io-parser/build/esm:
commons.d.ts               decodePacket.browser.js    encodePacket.browser.js    index.js
commons.js                 decodePacket.d.ts          encodePacket.d.ts          package.json
contrib                    decodePacket.js            encodePacket.js
decodePacket.browser.d.ts  encodePacket.browser.d.ts  index.d.ts

./backend/node_modules/engine.io-parser/build/esm/contrib:
base64-arraybuffer.d.ts  base64-arraybuffer.js

./backend/node_modules/es-define-property:
CHANGELOG.md   README.md      index.js       test
LICENSE        index.d.ts     package.json   tsconfig.json

./backend/node_modules/es-define-property/test:
index.js

./backend/node_modules/es-errors:
CHANGELOG.md   eval.d.ts      index.js       range.js       syntax.d.ts    tsconfig.json  uri.d.ts
LICENSE        eval.js        package.json   ref.d.ts       syntax.js      type.d.ts      uri.js
README.md      index.d.ts     range.d.ts     ref.js         test           type.js

./backend/node_modules/es-errors/test:
index.js

./backend/node_modules/es-object-atoms:
CHANGELOG.md                 RequireObjectCoercible.js    index.js                     test
LICENSE                      ToObject.d.ts                isObject.d.ts                tsconfig.json
README.md                    ToObject.js                  isObject.js
RequireObjectCoercible.d.ts  index.d.ts                   package.json

./backend/node_modules/es-object-atoms/test:
index.js

./backend/node_modules/escape-html:
LICENSE       Readme.md     index.js      package.json

./backend/node_modules/etag:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/express:
History.md    LICENSE       Readme.md     index.js      lib           package.json

./backend/node_modules/express/lib:
application.js  middleware      response.js     utils.js
express.js      request.js      router          view.js

./backend/node_modules/express/lib/middleware:
init.js   query.js

./backend/node_modules/express/lib/router:
index.js  layer.js  route.js

./backend/node_modules/express-rate-limit:
dist           license.md     package.json   readme.md      tsconfig.json

./backend/node_modules/express-rate-limit/dist:
index.cjs    index.d.cts  index.d.mts  index.d.ts   index.mjs

./backend/node_modules/finalhandler:
HISTORY.md    LICENSE       README.md     SECURITY.md   index.js      package.json

./backend/node_modules/forwarded:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/fresh:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/function-bind:
CHANGELOG.md       README.md          index.js           test
LICENSE            implementation.js  package.json

./backend/node_modules/function-bind/test:
index.js

./backend/node_modules/get-intrinsic:
CHANGELOG.md  LICENSE       README.md     index.js      package.json  test

./backend/node_modules/get-intrinsic/test:
GetIntrinsic.js

./backend/node_modules/get-proto:
CHANGELOG.md                 Object.getPrototypeOf.js     Reflect.getPrototypeOf.js    package.json
LICENSE                      README.md                    index.d.ts                   test
Object.getPrototypeOf.d.ts   Reflect.getPrototypeOf.d.ts  index.js                     tsconfig.json

./backend/node_modules/get-proto/test:
index.js

./backend/node_modules/gopd:
CHANGELOG.md   README.md      gOPD.js        index.js       test
LICENSE        gOPD.d.ts      index.d.ts     package.json   tsconfig.json

./backend/node_modules/gopd/test:
index.js

./backend/node_modules/has-symbols:
CHANGELOG.md   README.md      index.js       shams.d.ts     test
LICENSE        index.d.ts     package.json   shams.js       tsconfig.json

./backend/node_modules/has-symbols/test:
index.js  shams     tests.js

./backend/node_modules/has-symbols/test/shams:
core-js.js                   get-own-property-symbols.js

./backend/node_modules/hasown:
CHANGELOG.md   LICENSE        README.md      index.d.ts     index.js       package.json   tsconfig.json

./backend/node_modules/helmet:
CHANGELOG.md  README.md     index.cjs     index.d.mts   package.json
LICENSE       SECURITY.md   index.d.cts   index.mjs

./backend/node_modules/http-errors:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/iconv-lite:
Changelog.md  LICENSE       README.md     encodings     lib           package.json

./backend/node_modules/iconv-lite/encodings:
dbcs-codec.js           internal.js             sbcs-data.js            utf7.js
dbcs-data.js            sbcs-codec.js           tables
index.js                sbcs-data-generated.js  utf16.js

./backend/node_modules/iconv-lite/encodings/tables:
big5-added.json      cp949.json           eucjp.json           gbk-added.json
cp936.json           cp950.json           gb18030-ranges.json  shiftjis.json

./backend/node_modules/iconv-lite/lib:
bom-handling.js  extend-node.js   index.d.ts       index.js         streams.js

./backend/node_modules/inherits:
LICENSE              README.md            inherits.js          inherits_browser.js  package.json

./backend/node_modules/ipaddr.js:
LICENSE        README.md      ipaddr.min.js  lib            package.json

./backend/node_modules/ipaddr.js/lib:
ipaddr.js       ipaddr.js.d.ts

./backend/node_modules/jsonwebtoken:
LICENSE       decode.js     lib           package.json  verify.js
README.md     index.js      node_modules  sign.js

./backend/node_modules/jsonwebtoken/lib:
JsonWebTokenError.js              asymmetricKeyDetailsSupported.js  timespan.js
NotBeforeError.js                 psSupported.js                    validateAsymmetricKey.js
TokenExpiredError.js              rsaPssKeyDetailsSupported.js

./backend/node_modules/jsonwebtoken/node_modules:
ms

./backend/node_modules/jsonwebtoken/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/jwa:
LICENSE       README.md     index.js      package.json

./backend/node_modules/jws:
CHANGELOG.md  LICENSE       index.js      lib           package.json  readme.md

./backend/node_modules/jws/lib:
data-stream.js    sign-stream.js    tostring.js       verify-stream.js

./backend/node_modules/lodash.includes:
LICENSE       README.md     index.js      package.json

./backend/node_modules/lodash.isboolean:
LICENSE       README.md     index.js      package.json

./backend/node_modules/lodash.isinteger:
LICENSE       README.md     index.js      package.json

./backend/node_modules/lodash.isnumber:
LICENSE       README.md     index.js      package.json

./backend/node_modules/lodash.isplainobject:
LICENSE       README.md     index.js      package.json

./backend/node_modules/lodash.isstring:
LICENSE       README.md     index.js      package.json

./backend/node_modules/lodash.once:
LICENSE       README.md     index.js      package.json

./backend/node_modules/math-intrinsics:
CHANGELOG.md         floor.js             isNegativeZero.d.ts  mod.js               sign.js
LICENSE              isFinite.d.ts        isNegativeZero.js    package.json         test
README.md            isFinite.js          max.d.ts             pow.d.ts             tsconfig.json
abs.d.ts             isInteger.d.ts       max.js               pow.js
abs.js               isInteger.js         min.d.ts             round.d.ts
constants            isNaN.d.ts           min.js               round.js
floor.d.ts           isNaN.js             mod.d.ts             sign.d.ts

./backend/node_modules/math-intrinsics/constants:
maxArrayLength.d.ts  maxSafeInteger.d.ts  maxValue.d.ts
maxArrayLength.js    maxSafeInteger.js    maxValue.js

./backend/node_modules/math-intrinsics/test:
index.js

./backend/node_modules/media-typer:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/merge-descriptors:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/methods:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/mime:
CHANGELOG.md  LICENSE       README.md     cli.js        mime.js       package.json  src           types.json

./backend/node_modules/mime/src:
build.js  test.js

./backend/node_modules/mime-db:
HISTORY.md    LICENSE       README.md     db.json       index.js      package.json

./backend/node_modules/mime-types:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/negotiator:
HISTORY.md    LICENSE       README.md     index.js      lib           package.json

./backend/node_modules/negotiator/lib:
charset.js    encoding.js   language.js   mediaType.js

./backend/node_modules/object-assign:
index.js      license       package.json  readme.md

./backend/node_modules/object-inspect:
CHANGELOG.md          example               package-support.json  readme.markdown       test-core-js.js
LICENSE               index.js              package.json          test                  util.inspect.js

./backend/node_modules/object-inspect/example:
all.js       circular.js  fn.js        inspect.js

./backend/node_modules/object-inspect/test:
bigint.js         element.js        global.js         inspect.js        toStringTag.js
browser           err.js            has.js            lowbyte.js        undef.js
circular.js       fakes.js          holes.js          number.js         values.js
deep.js           fn.js             indent-option.js  quoteStyle.js

./backend/node_modules/object-inspect/test/browser:
dom.js

./backend/node_modules/on-finished:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/on-headers:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/parseurl:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/path-to-regexp:
LICENSE       Readme.md     index.js      package.json

./backend/node_modules/pg:
LICENSE       README.md     esm           lib           package.json

./backend/node_modules/pg/esm:
index.mjs

./backend/node_modules/pg/lib:
client.js                 crypto                    native                    stream.js
connection-parameters.js  defaults.js               query.js                  type-overrides.js
connection.js             index.js                  result.js                 utils.js

./backend/node_modules/pg/lib/crypto:
cert-signatures.js  sasl.js             utils-legacy.js     utils-webcrypto.js  utils.js

./backend/node_modules/pg/lib/native:
client.js  index.js   query.js

./backend/node_modules/pg-cloudflare:
LICENSE       README.md     dist          esm           package.json  src

./backend/node_modules/pg-cloudflare/dist:
empty.d.ts    empty.js      empty.js.map  index.d.ts    index.js      index.js.map

./backend/node_modules/pg-cloudflare/esm:
index.mjs

./backend/node_modules/pg-cloudflare/src:
empty.ts    index.ts    types.d.ts

./backend/node_modules/pg-connection-string:
LICENSE       README.md     esm           index.d.ts    index.js      package.json

./backend/node_modules/pg-connection-string/esm:
index.mjs

./backend/node_modules/pg-int8:
LICENSE       README.md     index.js      package.json

./backend/node_modules/pg-pool:
LICENSE       README.md     esm           index.js      package.json

./backend/node_modules/pg-pool/esm:
index.mjs

./backend/node_modules/pg-protocol:
LICENSE       README.md     dist          esm           package.json  src

./backend/node_modules/pg-protocol/dist:
b.d.ts                           inbound-parser.test.d.ts         outbound-serializer.test.d.ts
b.js                             inbound-parser.test.js           outbound-serializer.test.js
b.js.map                         inbound-parser.test.js.map       outbound-serializer.test.js.map
buffer-reader.d.ts               index.d.ts                       parser.d.ts
buffer-reader.js                 index.js                         parser.js
buffer-reader.js.map             index.js.map                     parser.js.map
buffer-writer.d.ts               messages.d.ts                    serializer.d.ts
buffer-writer.js                 messages.js                      serializer.js
buffer-writer.js.map             messages.js.map                  serializer.js.map

./backend/node_modules/pg-protocol/esm:
index.js

./backend/node_modules/pg-protocol/src:
b.ts                         inbound-parser.test.ts       outbound-serializer.test.ts  testing
buffer-reader.ts             index.ts                     parser.ts                    types
buffer-writer.ts             messages.ts                  serializer.ts

./backend/node_modules/pg-protocol/src/testing:
buffer-list.ts   test-buffers.ts

./backend/node_modules/pg-protocol/src/types:
chunky.d.ts

./backend/node_modules/pg-types:
Makefile         index.d.ts       index.test-d.ts  package.json
README.md        index.js         lib              test

./backend/node_modules/pg-types/lib:
arrayParser.js    binaryParsers.js  builtins.js       textParsers.js

./backend/node_modules/pg-types/test:
index.js  types.js

./backend/node_modules/pgpass:
README.md     lib           package.json

./backend/node_modules/pgpass/lib:
helper.js  index.js

./backend/node_modules/postgres-array:
index.d.ts    index.js      license       package.json  readme.md

./backend/node_modules/postgres-bytea:
index.js      license       package.json  readme.md

./backend/node_modules/postgres-date:
index.js      license       package.json  readme.md

./backend/node_modules/postgres-interval:
index.d.ts    index.js      license       package.json  readme.md

./backend/node_modules/proxy-addr:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/qs:
CHANGELOG.md  LICENSE.md    README.md     dist          lib           package.json  test

./backend/node_modules/qs/dist:
qs.js

./backend/node_modules/qs/lib:
formats.js    index.js      parse.js      stringify.js  utils.js

./backend/node_modules/qs/test:
empty-keys-cases.js  parse.js             stringify.js         utils.js

./backend/node_modules/range-parser:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/raw-body:
HISTORY.md    LICENSE       README.md     SECURITY.md   index.d.ts    index.js      package.json

./backend/node_modules/safe-buffer:
LICENSE       README.md     index.d.ts    index.js      package.json

./backend/node_modules/safer-buffer:
LICENSE            Readme.md          package.json       tests.js
Porting-Buffer.md  dangerous.js       safer.js

./backend/node_modules/semver:
LICENSE       bin           functions     internal      preload.js    ranges
README.md     classes       index.js      package.json  range.bnf

./backend/node_modules/semver/bin:
semver.js

./backend/node_modules/semver/classes:
comparator.js  index.js       range.js       semver.js

./backend/node_modules/semver/functions:
clean.js          compare-loose.js  gt.js             lte.js            parse.js          rsort.js
cmp.js            compare.js        gte.js            major.js          patch.js          satisfies.js
coerce.js         diff.js           inc.js            minor.js          prerelease.js     sort.js
compare-build.js  eq.js             lt.js             neq.js            rcompare.js       valid.js

./backend/node_modules/semver/internal:
constants.js      debug.js          identifiers.js    lrucache.js       parse-options.js  re.js

./backend/node_modules/semver/ranges:
gtr.js             ltr.js             min-satisfying.js  outside.js         subset.js          valid.js
intersects.js      max-satisfying.js  min-version.js     simplify.js        to-comparators.js

./backend/node_modules/send:
HISTORY.md    LICENSE       README.md     SECURITY.md   index.js      node_modules  package.json

./backend/node_modules/send/node_modules:
encodeurl  ms

./backend/node_modules/send/node_modules/encodeurl:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/send/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/serve-static:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/setprototypeof:
LICENSE       README.md     index.d.ts    index.js      package.json  test

./backend/node_modules/setprototypeof/test:
index.js

./backend/node_modules/side-channel:
CHANGELOG.md   README.md      index.js       test
LICENSE        index.d.ts     package.json   tsconfig.json

./backend/node_modules/side-channel/test:
index.js

./backend/node_modules/side-channel-list:
CHANGELOG.md   README.md      index.js       package.json   tsconfig.json
LICENSE        index.d.ts     list.d.ts      test

./backend/node_modules/side-channel-list/test:
index.js

./backend/node_modules/side-channel-map:
CHANGELOG.md   README.md      index.js       test
LICENSE        index.d.ts     package.json   tsconfig.json

./backend/node_modules/side-channel-map/test:
index.js

./backend/node_modules/side-channel-weakmap:
CHANGELOG.md   README.md      index.js       test
LICENSE        index.d.ts     package.json   tsconfig.json

./backend/node_modules/side-channel-weakmap/test:
index.js

./backend/node_modules/socket.io:
LICENSE       Readme.md     client-dist   dist          node_modules  package.json  wrapper.mjs

./backend/node_modules/socket.io/client-dist:
socket.io.esm.min.js          socket.io.js.map              socket.io.msgpack.min.js
socket.io.esm.min.js.map      socket.io.min.js              socket.io.msgpack.min.js.map
socket.io.js                  socket.io.min.js.map

./backend/node_modules/socket.io/dist:
broadcast-operator.d.ts  index.js                 socket-types.d.ts        typed-events.js
broadcast-operator.js    namespace.d.ts           socket-types.js          uws.d.ts
client.d.ts              namespace.js             socket.d.ts              uws.js
client.js                parent-namespace.d.ts    socket.js
index.d.ts               parent-namespace.js      typed-events.d.ts

./backend/node_modules/socket.io/node_modules:
debug  ms

./backend/node_modules/socket.io/node_modules/debug:
LICENSE       README.md     package.json  src

./backend/node_modules/socket.io/node_modules/debug/src:
browser.js  common.js   index.js    node.js

./backend/node_modules/socket.io/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/socket.io-adapter:
LICENSE       Readme.md     dist          node_modules  package.json

./backend/node_modules/socket.io-adapter/dist:
cluster-adapter.d.ts    contrib                 in-memory-adapter.js    index.js
cluster-adapter.js      in-memory-adapter.d.ts  index.d.ts

./backend/node_modules/socket.io-adapter/dist/contrib:
yeast.d.ts  yeast.js

./backend/node_modules/socket.io-adapter/node_modules:
debug  ms

./backend/node_modules/socket.io-adapter/node_modules/debug:
LICENSE       README.md     package.json  src

./backend/node_modules/socket.io-adapter/node_modules/debug/src:
browser.js  common.js   index.js    node.js

./backend/node_modules/socket.io-adapter/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/socket.io-parser:
LICENSE       Readme.md     build         node_modules  package.json

./backend/node_modules/socket.io-parser/build:
cjs        esm        esm-debug

./backend/node_modules/socket.io-parser/build/cjs:
binary.d.ts     binary.js       index.d.ts      index.js        is-binary.d.ts  is-binary.js    package.json

./backend/node_modules/socket.io-parser/build/esm:
binary.d.ts     binary.js       index.d.ts      index.js        is-binary.d.ts  is-binary.js    package.json

./backend/node_modules/socket.io-parser/build/esm-debug:
binary.d.ts     binary.js       index.d.ts      index.js        is-binary.d.ts  is-binary.js    package.json

./backend/node_modules/socket.io-parser/node_modules:
debug  ms

./backend/node_modules/socket.io-parser/node_modules/debug:
LICENSE       README.md     package.json  src

./backend/node_modules/socket.io-parser/node_modules/debug/src:
browser.js  common.js   index.js    node.js

./backend/node_modules/socket.io-parser/node_modules/ms:
index.js      license.md    package.json  readme.md

./backend/node_modules/split2:
LICENSE       README.md     bench.js      index.js      package.json  test.js

./backend/node_modules/statuses:
HISTORY.md    LICENSE       README.md     codes.json    index.js      package.json

./backend/node_modules/toidentifier:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/type-is:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/undici-types:
LICENSE                    cookies.d.ts               handlers.d.ts              patch.d.ts
README.md                  diagnostics-channel.d.ts   header.d.ts                pool-stats.d.ts
agent.d.ts                 dispatcher.d.ts            index.d.ts                 pool.d.ts
api.d.ts                   env-http-proxy-agent.d.ts  interceptors.d.ts          proxy-agent.d.ts
balanced-pool.d.ts         errors.d.ts                mock-agent.d.ts            readable.d.ts
cache-interceptor.d.ts     eventsource.d.ts           mock-call-history.d.ts     retry-agent.d.ts
cache.d.ts                 fetch.d.ts                 mock-client.d.ts           retry-handler.d.ts
client-stats.d.ts          formdata.d.ts              mock-errors.d.ts           util.d.ts
client.d.ts                global-dispatcher.d.ts     mock-interceptor.d.ts      utility.d.ts
connector.d.ts             global-origin.d.ts         mock-pool.d.ts             webidl.d.ts
content-type.d.ts          h2c-client.d.ts            package.json               websocket.d.ts

./backend/node_modules/unpipe:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/utils-merge:
LICENSE       README.md     index.js      package.json

./backend/node_modules/uuid:
CHANGELOG.md     CONTRIBUTING.md  LICENSE.md       README.md        dist             package.json     wrapper.mjs

./backend/node_modules/uuid/dist:
bin                md5-browser.js     parse.js           sha1.js            v35.js
commonjs-browser   md5.js             regex.js           stringify.js       v4.js
esm-browser        native-browser.js  rng-browser.js     uuid-bin.js        v5.js
esm-node           native.js          rng.js             v1.js              validate.js
index.js           nil.js             sha1-browser.js    v3.js              version.js

./backend/node_modules/uuid/dist/bin:
uuid

./backend/node_modules/uuid/dist/commonjs-browser:
index.js      native.js     parse.js      rng.js        stringify.js  v3.js         v4.js         validate.js
md5.js        nil.js        regex.js      sha1.js       v1.js         v35.js        v5.js         version.js

./backend/node_modules/uuid/dist/esm-browser:
index.js      native.js     parse.js      rng.js        stringify.js  v3.js         v4.js         validate.js
md5.js        nil.js        regex.js      sha1.js       v1.js         v35.js        v5.js         version.js

./backend/node_modules/uuid/dist/esm-node:
index.js      native.js     parse.js      rng.js        stringify.js  v3.js         v4.js         validate.js
md5.js        nil.js        regex.js      sha1.js       v1.js         v35.js        v5.js         version.js

./backend/node_modules/vary:
HISTORY.md    LICENSE       README.md     index.js      package.json

./backend/node_modules/ws:
LICENSE       README.md     browser.js    index.js      lib           package.json  wrapper.mjs

./backend/node_modules/ws/lib:
buffer-util.js         extension.js           receiver.js            subprotocol.js         websocket.js
constants.js           limiter.js             sender.js              validation.js
event-target.js        permessage-deflate.js  stream.js              websocket-server.js

./backend/node_modules/xtend:
LICENSE       README.md     immutable.js  mutable.js    package.json  test.js

./backend/scripts:
aplicar-migraciones-optimizacion.sh  auto-archive-old-pedidos.js          verificar-estado-bd.sh

./dist:
assets      icon.png    index.html  logo.png

./dist/assets:
dnd-DtNVwobw.js        index-B0cSY_55.js      index.es-CZQ-cXMs.js   purify.es-DpMHVkxQ.js  vendor-DtuzQOD1.js
/app $