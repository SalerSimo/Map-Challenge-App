import psycopg2
import networkx as nx
import matplotlib.pyplot as plt
import sys, time


import geojson
from shapely import wkb as shapely_wkb
from shapely.geometry import mapping
import pandas as pd

def find():
    password = input("insert password: ")

    # Connect to the PostgreSQL database
    conn = psycopg2.connect(
        dbname="Challenge_Map",
        user="postgres",
        password=password,
        host="localhost",
        port=5432
    )

    # Create a cursor object
    cur = conn.cursor()

    # Execute the SQL query to retrieve the lines from the table
    cur.execute("SELECT id, ogc_fid, ST_AsText(geom) FROM \"Vertices\" WHERE id = 3418")

    # Fetch all rows from the executed query
    rows = cur.fetchall()[0]
    print(rows)
    print(len(rows))

    point = str(rows[2]).replace("POINT(", "").replace(")", "").split(" ")
    print(point)


def testFunction(args) -> str:
    return "ciao, come stai zio"

def createGeoJson(args):
    conn = psycopg2.connect(
        dbname="Challenge_Map",
        user="postgres",
        password="password",
        host="localhost",
        port=5432
    )
        
    # Execute the query to fetch data from the table into a pandas DataFrame
    df = pd.read_sql_query("SELECT * FROM classrooms_t_i where floor_id = 'XPTE'", conn)

    # Close the connection
    conn.close()

    # Identify the geometry column (assuming it's named 'geom')
    geom_col = 'geom'

    # Function to convert WKT to GeoJSON geometry
    def wkt_to_geojson(wkb):
        geom = shapely_wkb.loads(wkb, hex=True)
        return mapping(geom)

    # Convert DataFrame to GeoJSON features
    features = []
    for _, row in df.iterrows():
        feature = geojson.Feature(
            geometry=wkt_to_geojson(row[geom_col]),
            properties={col: row[col] for col in df.columns if col != geom_col}
        )
        features.append(feature)

    # Create a FeatureCollection
    feature_collection = geojson.FeatureCollection(features)

    # Save to a GeoJSON file
    with open('classrooms_t_i_TE.geojson', 'w') as f:
        geojson.dump(feature_collection, f)

    print("GeoJSON file created successfully.")



if __name__ == "__main__":
    function_name = sys.argv[1]
    args = sys.argv[2:]
    result = globals()[function_name](args)
    print(result)
