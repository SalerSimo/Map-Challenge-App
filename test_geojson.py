import pandas as pd
import json
import networkx as nx
import math
import matplotlib.pyplot as plt


def load_geojson(path: str) -> pd.DataFrame:
    #url = "src/geojson/graphs/graph_classrooms_t_i.geojson"

    with open(path, 'r') as f:
        data = json.load(f)
    # Flatten the GeoJSON features
    df = pd.json_normalize(data['features'])
    return df


def create_graph(accessibility, path) -> nx.Graph:
    #path = "src/geojson/graphs/graph_classrooms_t_i.geojson"
    #path = "src/geojson/graphs/graph_central_site_01.geojson"

    df = load_geojson(path)

    G = nx.Graph()

    for index, row in df.iterrows():
        floor_id = row['properties.floor_id']
        coordinates = row['geometry.coordinates']
        vert = row['properties.vert']
        no_disab = row['properties.no_disab']

        if(accessibility == '1' and no_disab == 1):
            continue

        point1 = tuple(coordinates[0][0:2])
        point2 = tuple(coordinates[1][0:2])
        
        distance = math.sqrt((point2[0] - point1[0])**2 + (point2[1] - point1[1])**2)

        if(accessibility == '1' and '_' in floor_id and distance > 5e-6):
            continue

        if(accessibility == '0' and '_' in floor_id and (distance < 6e-6 or no_disab == 0)):
            distance = distance * 1000

        G.add_edge(point1, point2, floor_id=floor_id, weight=distance, vert=vert)

    return G



'''
G = create_graph(0)
print("graph_loaded")

pos = {node: node for node in G.nodes}

# Draw the graph
plt.figure(figsize=(10, 10))
nx.draw(G, pos, with_labels=False, node_size=10, node_color='red', edge_color='gray')
plt.xlabel("X (or Longitude)")
plt.ylabel("Y (or Latitude)")
plt.title("Graph with Real-World Coordinates")
plt.axis('equal')
plt.grid(True)
plt.show()



conn = psycopg2.connect(
        dbname="Challenge_Map",
        user="postgres",
        password="password",
        host="localhost",
        port=5432
    )
cur = conn.cursor()

G = pythonFunctions.Create_Graph(cur, 0)
print("graph_loaded")

pos = {node: node for node in G.nodes}

# Draw the graph
plt.figure(figsize=(10, 10))
nx.draw(G, pos, with_labels=False, node_size=10, node_color='red', edge_color='gray')
plt.xlabel("X (or Longitude)")
plt.ylabel("Y (or Latitude)")
plt.title("Graph with Real-World Coordinates")
plt.axis('equal')
plt.grid(True)
plt.show()'''