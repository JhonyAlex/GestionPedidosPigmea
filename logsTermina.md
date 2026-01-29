root@pigmea-server:~# # Buscar el archivo de migración en todo el sistema
find / -name "036-add-antivaho-realizado.sql" 2>/dev/null

# Buscar en volúmenes de Docker
find /var/lib/docker/volumes/ -name "*.sql" 2>/dev/null | grep -i migr

# Ver información del servicio para encontrar dónde monta los archivos
docker service inspect control-produccin-pigmea-produccionpgimea-7mvrtg --format '{{json .Spec.TaskTemplate.ContainerSpec}}' | jq
/var/lib/docker/overlay2/payqzjdkbi7d8ce2t8mljq8d9/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/6eyg3my5nqycqoo2447sw7e5x/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/elhfzliael91ose8tbyvxmyef/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/rhawouxgm6clnm2l2cjrbn630/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/c1v4cy2in6oz735vjwk4vt2h7/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/s36ft08kb5wei0rd82fhbtlfy/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/ojuvoevggrhhjw90be6upgs0a/diff/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/n65jrhv79fzg8222yjmbdhhst/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/n7jf7co2i0px1bxyhmxesatnj/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/wadv8p92zf2bbh5dpyave7axm/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/kjv3dy5wbi343as1kf5wx2lb5/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/nhjvx6cpjwx0t016j6t7w1j1p/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/nh1dnno6cjw9r10uk28u87hp1/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/nk3u99ibczhhlq3pxlp9txkme/diff/app/database/migrations/036-add-antivaho-realizado.sql
/var/lib/docker/overlay2/sq84q0szvxfyh9pypdux49eb3/diff/app/database/migrations/036-add-antivaho-realizado.sql
/etc/dokploy/applications/control-produccin-pigmea-produccionpgimea-7mvrtg/code/database/migrations/036-add-antivaho-realizado.sql
Command 'jq' not found, but can be installed with:
snap install jq  # version 1.5+dfsg-1, or
apt  install jq  # version 1.7.1-3ubuntu0.24.04.1
See 'snap info jq' for additional versions.
root@pigmea-server:~# 