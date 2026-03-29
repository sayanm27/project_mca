import sqlite3

DB_NAME = "database.db"

with sqlite3.connect(DB_NAME) as conn:
    cursor = conn.cursor()
    verify_query = "SELECT userid FROM Users WHERE userid = ? AND pwd = ?"
    confirmation = cursor.execute(verify_query, ( 1001,"admin" ))

print(confirmation.fetchone()[0])