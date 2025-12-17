import sqlite3

conn = sqlite3.connect('data.db')
with open('migration.sql', 'w', encoding='utf-8') as f:
    f.write("CREATE TABLE IF NOT EXISTS system_events (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, payload TEXT, created_at REAL);\n")

    for line in conn.iterdump():
        if "sqlite_sequence" in line or "BEGIN" in line or "COMMIT" in line: continue
        f.write(f"{line}\n")
print("migration.sql created.")