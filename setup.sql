
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
    cnd VARCHAR(3) NOT NULL, -- NM/LP/MP/HP/DMG
    is_tradable BOOLEAN DEFAULT FALSE
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

    status VARCHAR(20) DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE trade_cards (
    id SERIAL PRIMARY KEY,

    trade_id INT REFERENCES trades(id) ON DELETE CASCADE,
    user_card_id INT REFERENCES user_cards(id),

    trade_side VARCHAR(10) NOT NULL
        CHECK (trade_side IN ('OFFER', 'REQUEST')),

    UNIQUE (trade_id, user_card_id)
);

CREATE TABLE trade_listings (
    id SERIAL PRIMARY KEY,

    user_card_id INT NOT NULL REFERENCES user_cards(id),
    preferred_card_id INT REFERENCES cards(id),

    note TEXT,

    status VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'CLOSED', 'FULFILLED')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE decks (
    id SERIAL PRIMARY KEY,

    user_id INT REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deck_cards (
    deck_id INT REFERENCES decks(id) ON DELETE CASCADE,
    user_card_id INT REFERENCES user_cards(id),

    PRIMARY KEY (deck_id, user_card_id)
);

CREATE TABLE metadata (
    key TEXT PRIMARY KEY,
    value TEXT
);

