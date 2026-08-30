# VTCG

VTCG (Virtual Trading Card Game) is an online platform that allows users to collect, trade, and display virtual trading cards from popular TCGs. Users can create accounts, open virtual card packs, manage their collections, build decks, and trade cards with other users.

## Local Development

### 1. Install dependencies

```bash
npm i
```

### 2. Set up environment variables

Create an `env.json` file in the root directory:

```json
{
    "api": {
        "baseUrl": "https://openapi.tcgtracking.com/v1",
        "games": [
            "Magic: The Gathering",
            "Pokemon"
        ],
        "rarityMap": {
            "Common": "C",
            "Uncommon": "U",
            "Rare": "R",
            "Mythic Rare": "M"
        }
    }
}
```

Create a `.env` file:

```env
PGUSER=YOURPOSTGRESUSER
PGPORT=5432
PGHOST=localhost
PGPASSWORD=YOURPOSTGRESPASSWORD
PGDATABASE=vtcg
```

Replace the PostgreSQL username and password with your local credentials.

### 3. Set up the database

Create the `vtcg` database and run the setup script:

```bash
createdb -U YOURPOSTGRESUSER vtcg
psql -U YOURPOSTGRESUSER -d vtcg -f setup.sql
```

### 4. Start the server

```bash
npm run start:local
```

Visit `http://localhost:3000`.

## Deployment

### 1. Create Postgres

```bash
fly postgres create
```

Use the **Development** configuration and name the cluster `vtcgdb`.

### 2. Create the Fly app

```bash
fly launch
```

Use `vtcg` as the app name and select **None** for Postgres.

### 3. Attach Postgres

```bash
fly postgres attach vtcgdb --app vtcg
```

### 4. Set up the database

```bash
fly postgres connect -a vtcgdb < setup.sql
```

### 5. Deploy

```bash
fly deploy
```

View logs with:

```bash
fly logs -a vtcg
```

Redeploy changes with `fly deploy`.
