import psycopg2


conn = psycopg2.connect(
    dbname="Challenge_Map",
    user="postgres",
    password="password",
    host="localhost",
    port=5432
)

cur = conn.cursor()

cur.execute("SELECT category_it FROM classrooms_t_i GROUP BY category_it")

rows = cur.fetchall()
for row in rows:
    print(row)