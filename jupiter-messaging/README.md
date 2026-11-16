# Jupiter Messaging 🪐

Discord-style real-time chat. **Spring Boot 3 + Spring Security (JWT) + Spring Data JPA + STOMP/SockJS**, **MySQL 8**, and a **React + Vite + Tailwind** dark cosmic UI with a spinning 3D Earth (cobe) on every profile.

```
jupiter-messaging/
├── docker-compose.yml          # MySQL 8 (+ optional Adminer web UI)
├── backend/                    # Java 17, Maven
│   └── src/main/java/com/jupiter/
│       ├── model/  repo/  dto/  service/  web/  security/  config/
└── frontend/                   # React 18, Vite, Tailwind, lucide-react
    └── src/components/  (AuthScreen, NavRail, Sidebar, ChatArea, MembersList, ProfileModal, Globe, Modals)
```

## Requirements
Java 17+, Maven 3.9+, Node 18+, Docker (or a local MySQL 8).

## 1. Start the MySQL database
```bash
docker compose up -d          # run from the jupiter-messaging/ folder
docker compose ps             # wait until jupiter-mysql is "healthy"
```
Without compose, the same thing as one command:
```bash
docker run -d --name jupiter-mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root_pw -e MYSQL_DATABASE=jupiter \
  -e MYSQL_USER=jupiter -e MYSQL_PASSWORD=jupiter_pw \
  -v jupiter_mysql_data:/var/lib/mysql \
  mysql:8.0 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```
Using a MySQL you already have installed instead of Docker:
```sql
CREATE DATABASE jupiter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'jupiter'@'%' IDENTIFIED BY 'jupiter_pw';
GRANT ALL PRIVILEGES ON jupiter.* TO 'jupiter'@'%';
```
Tables are created automatically by Hibernate on first start (`ddl-auto: update`).

## 2. Run the backend (port 8080)
```bash
cd backend
mvn spring-boot:run
```
On first start the seeder creates: users **nova, orion, luna, atlas** (password `password123`), the server **Jupiter HQ** (invite code `JUPITER1`) with `#general`, `#random` and a voice channel, sample messages, and a DM.
Override DB settings with env vars: `DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD JWT_SECRET`.

## 3. Run the frontend (port 5173)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**. Vite proxies `/api` and `/ws` to the backend.

## Verification codes
Registering creates an unverified account and prints a banner in the **Spring Boot console**:
```
JUPITER VERIFICATION CODE for you@example.com:   482913
```
Type it into the verification screen (valid 10 minutes). New accounts auto-join Jupiter HQ.
To demand a code on every unknown browser/device too: `VERIFY_NEW_DEVICES=true mvn spring-boot:run`.
Real email: add `spring-boot-starter-mail`, set `spring.mail.*`, and send from `AuthService.sendCode`.

## Check that messages really land in MySQL
```bash
docker exec -it jupiter-mysql mysql -ujupiter -pjupiter_pw jupiter \
  -e "SELECT m.id, u.username, c.name AS channel, m.content, m.created_at FROM messages m JOIN users u ON u.id=m.author_id JOIN channels c ON c.id=m.channel_id ORDER BY m.id DESC LIMIT 10;"
```
Or open Adminer at http://localhost:8081 (System: MySQL, Server: `mysql`, user `jupiter`, password `jupiter_pw`, DB `jupiter`).

## Maintenance
```bash
docker compose stop            # stop, keep data
docker compose down -v         # wipe the database completely (re-seeds on next backend start)
```
Port 3306 busy? Change the left side of `"3306:3306"` in `docker-compose.yml` and start the backend with `DB_PORT=<new port>`.

## Try it
1. Log in as `nova` in one browser and `orion` in a private window: messages, typing indicators, presence dots and Notes update live.
2. Click any avatar for the profile card; use the gear icon to upload a banner/avatar, post a 60-char note, and toggle **Share location on globe**.
3. `+` in the left rail creates a server or joins by invite code; `+` beside Direct messages starts a DM or group chat.

## Scope notes
- Voice channels are listed in the UI only (no audio).
- The globe shows continents as a dot map (cobe); swap in `react-globe.gl` if you want drawn country border lines.
- City picker uses a built-in list of 20 cities (no geocoding API needed).
- Everyone registered appears in the "new DM" list (no friend-request system).
