import psycopg2
import networkx as nx
import matplotlib.pyplot as plt

import geojson
from shapely import wkt as shapely_wkt
from shapely.geometry import mapping

import json
import pandas as pd
import math

def Create_Graph(cur) -> nx.Graph:
    # Execute the SQL query to retrieve the lines from the table
    #cur.execute("SELECT ogc_fid, ST_AsText(wkb_geometry) FROM grafi_clean")
    cur.execute("SELECT floor_id, ST_AsText(geom), vert FROM graph_classrooms_t_i")

    # Fetch all rows from the executed query
    rows = cur.fetchall()


    # Create a graph
    G = nx.Graph()

    for row in rows:
        floor_id, wkb_geometry, vert = row
        points = wkb_geometry.replace("LINESTRING Z (", "").replace(")", "").split(",")
        for i in range(len(points) - 1):
            point1 = tuple(map(float, points[i].split()[0:2]))
            point2 = tuple(map(float, points[i + 1].split()[0:2]))
            distance = math.sqrt((point2[0] - point1[0])**2 + (point2[1] - point1[1])**2)
            G.add_edge(point1, point2, floor_id=floor_id, weight=distance, vert=vert)
    return G

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

G = Create_Graph(cur)

# Draw the graph
pos = {node: node for node in G.nodes()}
nx.draw(G, pos, with_labels=False, node_size=5, font_size=8)
#plt.show()

def find_shortest_path(graph, source, target):
    return nx.astar_path(graph, source, target)
    return nx.dijkstra_path(graph, source, target)

def Get_Coordinates(cur, nodeId) -> tuple[float]:
    cur.execute(f"SELECT id, ST_AsText(geom) FROM vertices_graph_classrooms_t_i WHERE id = {nodeId}")
    rows = cur.fetchall()[0]

    print(rows[-1])

    point = str(rows[-1]).replace("POINT Z (", "").replace(")", "").split(" ")
    return (float(point[0]), float(point[1]))

# Example usage: Find the shortest path between two nodes
'''source_node = Get_Coordinates(cur, input("Insert source node id: "))
print(source_node)s
target_node = Get_Coordinates(cur, input("Insert target node id: "))'''

source_node = Get_Coordinates(cur, 1126)
print(source_node)
target_node = Get_Coordinates(cur, 244)
shortest_path = find_shortest_path(G, source_node, target_node)
print("Shortest path:", shortest_path)

def export_shortest_path_to_geojson(graph: nx.Graph, path):
    features = []
    for i in range(len(path) - 1):
        edge = graph.get_edge_data(path[i], path[i + 1])
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [path[i], path[i + 1]]
            },
            "properties": {
                "floor_id":  edge['floor_id'],
                "vert": edge['vert'],
            }
        }
        features.append(feature)
        print(graph.get_edge_data(path[i], path[i+1]))

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    with open("shortest_path.geojson", "w") as f:
        json.dump(geojson, f)

export_shortest_path_to_geojson(G, shortest_path)
print("path saved")
# Close the cursor and connection
cur.close()
conn.close()
