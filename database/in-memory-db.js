// Pure JavaScript In-Memory SQLite Compatible Database for YARMUK Restaurant
// Replaces better-sqlite3 native bindings with a zero-dependency in-memory engine

class Database {
    static store = null;
    static nextId = null;

    static initStore() {
        if (!Database.store) {
            Database.store = {
                users: [],
                reservations: [],
                contact_messages: [],
                menu_items: [],
                orders: [],
                order_items: []
            };
            Database.nextId = {
                users: 1,
                reservations: 1,
                contact_messages: 1,
                menu_items: 1,
                orders: 1,
                order_items: 1
            };
        }
    }

    constructor(dbPath) {
        this.path = dbPath;
        Database.initStore();
    }

    pragma(setting) {
        return null;
    }

    exec(sql) {
        // Tables are initialized in memory
        return null;
    }

    transaction(fn) {
        return (...args) => fn(...args);
    }

    export() {
        const json = JSON.stringify(Database.store, null, 2);
        return Buffer.from(json, 'utf8');
    }

    close() {
        // In-memory connection close
    }

    prepare(sql) {
        const clean = sql.trim().replace(/\s+/g, ' ');
        const store = Database.store;
        const nextId = Database.nextId;

        return {
            run: (...params) => {
                let lastInsertRowid = 1;
                let changes = 1;

                if (/^INSERT INTO users/i.test(clean)) {
                    const [username, email, password] = params;
                    if (store.users.some(u => u.username === username || u.email === email)) {
                        throw new Error('UNIQUE constraint failed: users.username or users.email');
                    }
                    const user = {
                        id: nextId.users++,
                        username,
                        email,
                        password,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    store.users.push(user);
                    lastInsertRowid = user.id;
                } else if (/^INSERT INTO reservations/i.test(clean)) {
                    let user_id, name, email, phone, date, time, guests;
                    if (params.length === 7) {
                        [user_id, name, email, phone, date, time, guests] = params;
                    } else {
                        [name, email, phone, date, time, guests] = params;
                        user_id = null;
                    }
                    const res = {
                        id: nextId.reservations++,
                        user_id: user_id ? Number(user_id) : null,
                        name,
                        email,
                        phone,
                        date,
                        time,
                        guests: Number(guests),
                        status: 'pending',
                        created_at: new Date().toISOString()
                    };
                    store.reservations.push(res);
                    lastInsertRowid = res.id;
                } else if (/^INSERT INTO menu_items/i.test(clean)) {
                    const [category, name, description, price, image_url] = params;
                    const item = {
                        id: nextId.menu_items++,
                        category,
                        name,
                        description,
                        price: Number(price),
                        image_url: image_url || '',
                        available: 1,
                        created_at: new Date().toISOString()
                    };
                    store.menu_items.push(item);
                    lastInsertRowid = item.id;
                } else if (/^INSERT INTO contact_messages/i.test(clean)) {
                    const [name, email, subject, message] = params;
                    const msg = {
                        id: nextId.contact_messages++,
                        name,
                        email,
                        subject: subject || '',
                        message,
                        status: 'unread',
                        created_at: new Date().toISOString()
                    };
                    store.contact_messages.push(msg);
                    lastInsertRowid = msg.id;
                } else if (/^INSERT INTO orders/i.test(clean)) {
                    const [user_id, reservation_id, total_amount] = params;
                    const ord = {
                        id: nextId.orders++,
                        user_id: user_id ? Number(user_id) : null,
                        reservation_id: reservation_id ? Number(reservation_id) : null,
                        total_amount: Number(total_amount),
                        status: 'pending',
                        created_at: new Date().toISOString()
                    };
                    store.orders.push(ord);
                    lastInsertRowid = ord.id;
                } else if (/^INSERT INTO order_items/i.test(clean)) {
                    const [order_id, menu_item_id, quantity, price] = params;
                    const oi = {
                        id: nextId.order_items++,
                        order_id: Number(order_id),
                        menu_item_id: Number(menu_item_id),
                        quantity: Number(quantity),
                        price: Number(price)
                    };
                    store.order_items.push(oi);
                    lastInsertRowid = oi.id;
                } else if (/^DELETE FROM (\w+)/i.test(clean)) {
                    const match = clean.match(/^DELETE FROM (\w+)/i);
                    const tableName = match[1];
                    if (store[tableName]) {
                        changes = store[tableName].length;
                        store[tableName] = [];
                    }
                }

                return { lastInsertRowid, changes };
            },

            get: (...params) => {
                if (/SELECT COUNT\(\*\) as count FROM (\w+)/i.test(clean)) {
                    const match = clean.match(/SELECT COUNT\(\*\) as count FROM (\w+)/i);
                    const tableName = match[1];
                    const count = store[tableName] ? store[tableName].length : 0;
                    return { count };
                }

                if (/SELECT \* FROM users WHERE username = \?/i.test(clean)) {
                    const [username] = params;
                    return store.users.find(u => u.username === username) || null;
                }

                if (/SELECT id, username, email, created_at FROM users WHERE id = \?/i.test(clean)) {
                    const [id] = params;
                    const u = store.users.find(u => u.id === Number(id));
                    if (!u) return null;
                    return { id: u.id, username: u.username, email: u.email, created_at: u.created_at };
                }

                if (/SELECT \* FROM users WHERE email = \?/i.test(clean)) {
                    const [email] = params;
                    return store.users.find(u => u.email === email) || null;
                }

                return null;
            },

            all: (...params) => {
                if (/sqlite_master WHERE type='table'/i.test(clean)) {
                    return [
                        { name: 'users' },
                        { name: 'reservations' },
                        { name: 'contact_messages' },
                        { name: 'menu_items' },
                        { name: 'orders' },
                        { name: 'order_items' }
                    ];
                }

                if (/SELECT \* FROM (\w+)$/i.test(clean)) {
                    const match = clean.match(/SELECT \* FROM (\w+)$/i);
                    const tableName = match[1];
                    return store[tableName] ? [...store[tableName]] : [];
                }

                if (/SELECT \* FROM menu_items WHERE category = \? AND available = 1/i.test(clean)) {
                    const [cat] = params;
                    return store.menu_items.filter(m => m.category === cat && m.available === 1);
                }

                if (/SELECT \* FROM menu_items WHERE available = 1/i.test(clean)) {
                    return store.menu_items.filter(m => m.available === 1);
                }

                if (/SELECT \* FROM reservations WHERE user_id = \?/i.test(clean)) {
                    const [userId] = params;
                    return store.reservations
                        .filter(r => r.user_id === Number(userId))
                        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
                }

                return [];
            }
        };
    }
}

module.exports = Database;
