<!-- Owner: Orion Kabeza (DevOps) -->
# Deploy on three servers behind a load balancer

**Fictional demo data only.** The blockers in `docs/OPEN_QUESTIONS.md` still apply: nothing real goes on these servers.

```
                    https://strokecare.orion-labs.dev
                                  |
                          lb-01  (Caddy: HTTPS, load balancing, health checks)
                         /                    \
              web-01 (app + alert worker       web-02 (app)
                      + PostgreSQL)  <----------- database connection
```

| Server | Runs | Compose files |
|---|---|---|
| lb-01 | Caddy | `docker-compose.lb.yml` |
| web-01 | app, alert worker, PostgreSQL | `docker-compose.db.yml` + `docker-compose.web.yml` (`--profile worker`) |
| web-02 | app | `docker-compose.web.yml` |

The alert worker runs on web-01 only, so alerts are not worked out twice. Sign-in tokens are stateless and everything else
(including voice notes) is in PostgreSQL, so either app server can answer any request. Rate limits are counted per server.
The database is a single copy on web-01: if web-01 is down, the app is down. That is acceptable for a demo.

## 1. DNS

Add an `A` record for `strokecare` pointing to **lb-01's public IP** (`35.176.156.38`). It must resolve before step 6,
or Caddy cannot get its certificate. Check from any computer: `nslookup strokecare.orion-labs.dev`.

## 2. On every server: Docker and the code

```bash
curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker $USER && newgrp docker
git clone https://github.com/EricaSheja/stroke_care_development.git app && cd app
git checkout master    # or the branch you are deploying
cp deploy/three-node.env.example .env && chmod 600 .env
hostname -I            # note the private address of each server
```

Fill `.env` on each server: the **same** `DJANGO_SECRET_KEY` and `POSTGRES_PASSWORD` on web-01 and web-02, `BIND_IP` = that
server's private address, and `DB_HOST` as described in the file. On lb-01 also set `WEB1` and `WEB2` to the private
addresses of web-01 and web-02. If the servers cannot reach each other by private address, use the public ones.

## 3. web-01 first (it creates the tables)

```bash
docker compose -f docker-compose.db.yml -f docker-compose.web.yml --profile worker up -d --build
docker compose -f docker-compose.db.yml -f docker-compose.web.yml ps       # wait until web is "healthy"
```

On start the app applies the migrations and loads the reference content (check-in questions, talk board, Learn).

## 4. web-02 second

```bash
docker compose -f docker-compose.web.yml up -d --build
```

Start it only after web-01 is healthy: two servers migrating an empty database at once can collide.

## 5. Firewall (Docker ignores `ufw`, so use the DOCKER-USER chain)

Docker publishes ports around `ufw`, so limit them with `iptables`. If your cloud has security groups, also allow only the
needed traffic there. `ALLOWED` is the address allowed in.

On **web-01** (database only from web-02, app only from lb-01):

```bash
IFACE=$(ip route show default | awk '{print $5; exit}')
LB=<lb-01 private address>; WEB2=<web-02 private address>
sudo iptables -I DOCKER-USER -i $IFACE -p tcp -m conntrack --ctorigdstport 5432 --ctdir ORIGINAL ! -s $WEB2 -j DROP
sudo iptables -I DOCKER-USER -i $IFACE -p tcp -m conntrack --ctorigdstport 8000 --ctdir ORIGINAL ! -s $LB -j DROP
```

On **web-02**: the second rule only (port 8000 from lb-01). Then persist them:
`sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save`.

If the servers talk over public addresses instead, use those in `ALLOWED`/`$LB`/`$WEB2`. Check the rules from outside:
`nc -vz <web-01 public IP> 5432` and `nc -vz <web-01 public IP> 8000` must both fail, from a computer that is not lb-01 or web-02.

## 6. lb-01 last

```bash
docker compose -f docker-compose.lb.yml up -d
docker compose -f docker-compose.lb.yml logs caddy | tail      # look for "certificate obtained"
```

Ports 80 and 443 must be open to the internet on lb-01 (cloud security group and, if enabled, `ufw allow 80,443/tcp`).

## 7. Demo accounts, the emergency number, and checks

On web-01:

```bash
docker compose -f docker-compose.db.yml -f docker-compose.web.yml exec web python manage.py seed_demo --password '<choose one>'
docker compose -f docker-compose.db.yml -f docker-compose.web.yml exec web python manage.py add_emergency_contact \
  --region Rwanda --label "SAMU ambulance" --kind ambulance --phone 912 --verified-by "<name of whoever checked it>"
```

`seed_demo` needs `ALLOW_DEMO_DATA=1` in `.env`. Then:

- Open https://strokecare.orion-labs.dev and sign in as `demo-survivor@example.org`; the Learn page opens without signing in.
- Load balancing: `docker compose -f docker-compose.web.yml logs web` on web-01 and web-02 should both show requests.
- Failover: `docker compose -f docker-compose.web.yml stop web` on web-02, reload the site (it still works), then start it again.
- `curl -I http://strokecare.orion-labs.dev` redirects to HTTPS.

## Updating

On each app server: `git pull && docker compose ... up -d --build` (web-01 first, then web-02). Backups: on web-01,
`docker compose -f docker-compose.db.yml exec db pg_dump -U strokecare strokecare > backup.sql`.

## What was tested

The compose files parse (`docker compose config`). **The rollout on the real servers has not been run yet**, so treat
steps 3 to 6 as the first run and note anything that needed changing.
