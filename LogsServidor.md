root@pigmea-server:~# # Ver por qué la base de datos no está corriendo
docker service ps control-produccin-pigmea-gestionpedidosdb-vcfcjc --no-trunc
ID                          NAME                                                     IMAGE         NODE            DESIRED STATE   CURRENT STATE                     ERROR                       PORTS
obpmhbwaflvwj1crq7p9y0x05   control-produccin-pigmea-gestionpedidosdb-vcfcjc.1       postgres:15   pigmea-server   Ready           Assigned less than a second ago
k5my72z8pguz21iav2cfpd8gi    \_ control-produccin-pigmea-gestionpedidosdb-vcfcjc.1   postgres:15   pigmea-server   Shutdown        Failed less than a second ago     "task: non-zero exit (1)"
ml7eo4i0pld1jvl1htgy9501g    \_ control-produccin-pigmea-gestionpedidosdb-vcfcjc.1   postgres:15   pigmea-server   Shutdown        Failed 6 seconds ago              "task: non-zero exit (1)"
g2g0php9bk3wc87oizexu0rhf    \_ control-produccin-pigmea-gestionpedidosdb-vcfcjc.1   postgres:15   pigmea-server   Shutdown        Failed 13 seconds ago             "task: non-zero exit (1)"
h7eihninei4bb34vzortv4qcq    \_ control-produccin-pigmea-gestionpedidosdb-vcfcjc.1   postgres:15   pigmea-server   Shutdown        Failed 20 seconds ago             "task: non-zero exit (1)"
root@pigmea-server:~# docker service logs control-produccin-pigmea-gestionpedidosdb-vcfcjc --tail 100
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    |
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    | PostgreSQL Database directory appears to contain a database; Skipping initialization
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    |
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    | 2026-01-29 20:49:04.965 UTC [1] LOG:  starting PostgreSQL 15.15 (Debian 15.15-1.pgdg13+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 14.2.0-19) 14.2.0, 64-bit
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    | 2026-01-29 20:49:04.966 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    | 2026-01-29 20:49:04.966 UTC [1] LOG:  listening on IPv6 address "::", port 5432
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    | 2026-01-29 20:49:04.968 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    | 2026-01-29 20:49:04.975 UTC [29] LOG:  database system shutdown was interrupted; last known up at 2026-01-29 19:36:57 UTC
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    | 2026-01-29 20:49:05.252 UTC [29] LOG:  invalid record length at 0/55123428: wanted 24, got 0
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    | 2026-01-29 20:49:05.252 UTC [29] LOG:  invalid primary checkpoint record
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    | 2026-01-29 20:49:05.252 UTC [29] PANIC:  could not locate a valid checkpoint record
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    | 2026-01-29 20:49:05.465 UTC [1] LOG:  startup process (PID 29) was terminated by signal 6: Aborted
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    | 2026-01-29 20:49:05.466 UTC [1] LOG:  aborting startup due to startup process failure
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.k5my72z8pguz@pigmea-server    | 2026-01-29 20:49:05.467 UTC [1] LOG:  database system is shut down
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    |
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    | PostgreSQL Database directory appears to contain a database; Skipping initialization
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    |
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    | 2026-01-29 20:49:17.966 UTC [1] LOG:  starting PostgreSQL 15.15 (Debian 15.15-1.pgdg13+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 14.2.0-19) 14.2.0, 64-bit
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    | 2026-01-29 20:49:17.966 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    | 2026-01-29 20:49:17.966 UTC [1] LOG:  listening on IPv6 address "::", port 5432
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    | 2026-01-29 20:49:17.970 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    | 2026-01-29 20:49:17.975 UTC [28] LOG:  database system shutdown was interrupted; last known up at 2026-01-29 19:36:57 UTC
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    | 2026-01-29 20:49:18.208 UTC [28] LOG:  invalid record length at 0/55123428: wanted 24, got 0
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    | 2026-01-29 20:49:18.209 UTC [28] LOG:  invalid primary checkpoint record
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    | 2026-01-29 20:49:18.209 UTC [28] PANIC:  could not locate a valid checkpoint record
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    | 2026-01-29 20:49:18.521 UTC [1] LOG:  startup process (PID 28) was terminated by signal 6: Aborted
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    | 2026-01-29 20:49:18.522 UTC [1] LOG:  aborting startup due to startup process failure
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.qnao2p7973m6@pigmea-server    | 2026-01-29 20:49:18.525 UTC [1] LOG:  database system is shut down
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    |
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    | PostgreSQL Database directory appears to contain a database; Skipping initialization
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    |
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    | 2026-01-29 20:49:11.493 UTC [1] LOG:  starting PostgreSQL 15.15 (Debian 15.15-1.pgdg13+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 14.2.0-19) 14.2.0, 64-bit
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    | 2026-01-29 20:49:11.494 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    | 2026-01-29 20:49:11.494 UTC [1] LOG:  listening on IPv6 address "::", port 5432
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    | 2026-01-29 20:49:11.497 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    | 2026-01-29 20:49:11.510 UTC [28] LOG:  database system shutdown was interrupted; last known up at 2026-01-29 19:36:57 UTC
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    | 2026-01-29 20:49:11.772 UTC [28] LOG:  invalid record length at 0/55123428: wanted 24, got 0
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    | 2026-01-29 20:49:11.772 UTC [28] LOG:  invalid primary checkpoint record
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    | 2026-01-29 20:49:11.772 UTC [28] PANIC:  could not locate a valid checkpoint record
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    | 2026-01-29 20:49:12.102 UTC [1] LOG:  startup process (PID 28) was terminated by signal 6: Aborted
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    | 2026-01-29 20:49:12.102 UTC [1] LOG:  aborting startup due to startup process failure
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.obpmhbwaflvw@pigmea-server    | 2026-01-29 20:49:12.103 UTC [1] LOG:  database system is shut down
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    |
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    | PostgreSQL Database directory appears to contain a database; Skipping initialization
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    |
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    | 2026-01-29 20:48:58.303 UTC [1] LOG:  starting PostgreSQL 15.15 (Debian 15.15-1.pgdg13+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 14.2.0-19) 14.2.0, 64-bit
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    | 2026-01-29 20:48:58.303 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    | 2026-01-29 20:48:58.303 UTC [1] LOG:  listening on IPv6 address "::", port 5432
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    | 2026-01-29 20:48:58.307 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    | 2026-01-29 20:48:58.317 UTC [28] LOG:  database system shutdown was interrupted; last known up at 2026-01-29 19:36:57 UTC
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    | 2026-01-29 20:48:58.574 UTC [28] LOG:  invalid record length at 0/55123428: wanted 24, got 0
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    | 2026-01-29 20:48:58.574 UTC [28] LOG:  invalid primary checkpoint record
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    | 2026-01-29 20:48:58.574 UTC [28] PANIC:  could not locate a valid checkpoint record
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    | 2026-01-29 20:48:58.885 UTC [1] LOG:  startup process (PID 28) was terminated by signal 6: Aborted
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    | 2026-01-29 20:48:58.885 UTC [1] LOG:  aborting startup due to startup process failure
control-produccin-pigmea-gestionpedidosdb-vcfcjc.1.ml7eo4i0pld1@pigmea-server    | 2026-01-29 20:48:58.887 UTC [1] LOG:  database system is shut down
root@pigmea-server:~#