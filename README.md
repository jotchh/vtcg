# VTCG
VTCG (Virtual Trading Card Game) is an online-platform that allows users to collect, trade, and display virtual trading cards from popular TCGs. Users can create accounts, open virtual card packs, manager their collections, build decks, and trade cards with other users.

### Development setup
1. **Clone the repository**
```bash
git clone https://github.com/yourusername/vtcg.git
cd vtcg
```

2. **Install dependencies**
```bash
npm i
```

3. **Set up environment variables**
create a `env.sjon` file in the root dir
```json
{
    "pool": {
        "host": "localhost",
        "user": "yourUsername",
        "password": "yourPassword",
        "database": "vtcg",
        "port": 5432
    },
    "api": {
        "baseUrl": "https://openapi.tcgtracking.com/v1",
        "games": [
            "Magic: The Gathering"
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

4. **Create the PostgreSQL database**
Run the setup script:
```bash
psql -U postgres -f setup.sql
```

Or, if you've already created the database:
```bash
psql -U USERNAME -d vtcg -f setup.sql
```

5. **Start development server**
```bash
npm run start
```

