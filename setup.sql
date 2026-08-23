
CREATE DATABASE vtcg;
-- Connect to the database before running the rest

\c vtcg
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(25) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    bio VARCHAR(160),
    packs_opened INT DEFAULT 0,
    cards_owned INT DEFAULT 0,
    trade_up_opens INT DEFAULT 0,
    daily_pack_opens INT DEFAULT 5,
    pack_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cards (
    id SERIAL PRIMARY KEY,

    api_card_id VARCHAR(100) UNIQUE,
    game VARCHAR(50),
    set_name VARCHAR(100),

    name VARCHAR(255) NOT NULL,
    rarity VARCHAR(1), -- M/R/U/C
    card_number VARCHAR(50),
    ext_data JSONB,

    img_url TEXT
);

CREATE TABLE pack_history (
    id SERIAL PRIMARY KEY,

    user_id INT REFERENCES users(id) ON DELETE CASCADE,

    game VARCHAR(50),
    set_name VARCHAR(100),

    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_cards (
    id SERIAL PRIMARY KEY,

    card_id INT REFERENCES cards(id),
    user_id INT REFERENCES users(id),
    pack_history_id INT REFERENCES pack_history(id),

    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cnd VARCHAR(3) NOT NULL -- NM/LP/MP/HP/DMG
);

CREATE TABLE friends (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    friend_id INT REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,

    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT REFERENCES users(id) ON DELETE CASCADE,

    message TEXT NOT NULL,

    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT FALSE
);

CREATE TABLE trades (
    id SERIAL PRIMARY KEY,

    sender_id INT REFERENCES users(id),
    receiver_id INT REFERENCES users(id),

    status VARCHAR(20) DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE trade_cards (
    id SERIAL PRIMARY KEY,

    trade_id INT REFERENCES trades(id) ON DELETE CASCADE,
    user_card_id INT REFERENCES user_cards(id),

    offered_by INT REFERENCES users(id)
);

CREATE TABLE decks (
    id SERIAL PRIMARY KEY,

    user_id INT REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quantity of a card in a deck; enforced app-side to not exceed how many
-- of that card the user owns (COUNT(*) FROM user_cards). The same card can
-- appear in multiple decks at once - only its per-deck quantity is capped.
CREATE TABLE deck_cards (
    deck_id INT REFERENCES decks(id) ON DELETE CASCADE,
    card_id INT REFERENCES cards(id),
    quantity INT NOT NULL DEFAULT 1,

    PRIMARY KEY (deck_id, card_id)
);

-- Cards a user wants but doesn't (fully) own, independent of any deck.
CREATE TABLE wishlist_cards (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    card_id INT REFERENCES cards(id),
    quantity INT NOT NULL DEFAULT 1,

    PRIMARY KEY (user_id, card_id)
);

CREATE TABLE metadata (
    key TEXT PRIMARY KEY,
    value TEXT
);

