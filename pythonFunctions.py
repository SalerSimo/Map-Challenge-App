import math
import networkx as nx
import json
import pandas as pd

def load_geojson(path: str) -> pd.DataFrame:
    with open(path, 'r') as f:
        data = json.load(f)
    df = pd.json_normalize(data['features'])
    return df

def getFloorNumber(floor: str) -> int:
    floor_map = {
        'XS01': -1,
        'XPTE': 0,
        'XP01': 1,
        'XP02': 2,
        'XP03': 3,
        'XP04': 4,
        'XP05': 5
    }
    return floor_map[floor]

def findPath(args):
    accessibility = args[2]
    graph_path = "src/geojson/graphs/graph_classrooms_t_i.geojson"
    vertices = load_geojson('src/geojson/Nodes/vertices.geojson')

    try:
        G = create_graph(accessibility, graph_path)

        source_id = int(args[0])
        target_id = int(args[1])

        source_node = Get_Coordinates(vertices, source_id)
        target_node = Get_Coordinates(vertices, target_id)

        path = nx.astar_path(G, source_node, target_node)
        return export_shortest_path_to_geojson(G, path)
    except:
        return 'false'


def export_shortest_path_to_geojson(graph: nx.Graph, path):
    features = []
    button_features = []
    button_feature_size = 0
    i = 0
    while i < (len(path) - 1):
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
        add = 0


        if '_' in edge['floor_id']:
            next_edge = graph.get_edge_data(path[i + 1], path[i + 2])
            prev_edge = graph.get_edge_data(path[i - 1], path[i])
            start = 0
            max_start = 10
            while start <= max_start:
                start += 1
                if i + start >= len(path) - 1:
                    break
                check_edge = graph.get_edge_data(path[i + start], path[i + start + 1])
                if '_' in check_edge['floor_id']:
                    pos1 = [(path[i][0] + path[i + 1][0]) / 2, (path[i][1] + path[i + 1][1]) / 2,]
                    pos2 = [(path[i + start][0] + path[i + start + 1][0]) / 2, (path[i + start][1] + path[i + start + 1][1]) / 2,]
                    length = math.sqrt((pos1[0] - pos2[0])**2 + (pos1[1] - pos2[1])**2)
                    if length < 5e-5:
                        next_edge = graph.get_edge_data(path[i + start + 1], path[i + start + 2])
                        add = start + 1
                        max_start += 10

            floors = []
            floors.append(prev_edge['floor_id'])
            floors.append(next_edge['floor_id'])

            if getFloorNumber(floors[0]) < getFloorNumber(floors[1]):
                src = "../src/img/arrow_up.png"
            else:
                src = "../src/img/arrow_down.png"
            button_feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": path[i]
                },
                "properties": {
                    "floor_id":  floors[0],
                    "to_floor": floors[1],
                    "icon": {
                        'html': f'<div onclick="setStep(\'{floors[1]}\', {button_feature_size + 1})" class="change-floor"><img src="{src}" class="button-image"></img></div>',
                        'className': 'change-floor'
                    },
                    "distance": edge['weight']
                }
            }
            button_features.append(button_feature)
            button_feature_size += 1

        i += max(add, 1)
        
    icons_features = []
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": path[0]
        },
        "properties": {
            "floor_id":  graph.get_edge_data(path[0], path[1])['floor_id'],
            "icon": {
                'html': f'<div class="destination-div" style="background-color: transparent; transform: translate(-50%, -92%);"><img src="../src/img/start_position.svg" class="destination-icon"></img></div>',
                'className': 'change-floor'
            },
            "distance": edge['weight']
        }
    }

    icons_features.append(feature)
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": path[len(path) - 1]
        },
        "properties": {
            "floor_id":  graph.get_edge_data(path[len(path) - 2], path[len(path) - 1])['floor_id'],
            "icon": {
                'html': f'<div class="destination-div" style="background-color: white;"><img src="../src/img/destination_icon.svg" class="destination-icon"></img></div>',
                'className': 'change-floor'
            },
            "distance": edge['weight']
        }
    }
    icons_features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    button_geojson = {
        "type": "FeatureCollection",
        "features": button_features
    }
    icons_geojson = {
        "type": "FeatureCollection",
        "features": icons_features
    }

    with open("src/geojson/paths/shortest_path.geojson", "w") as f:
        json.dump(geojson, f)
    with open("src/geojson/paths/buttons.geojson", "w") as f:
        json.dump(button_geojson, f)
    with open("src/geojson/paths/icons.geojson", "w") as f:
        json.dump(icons_geojson, f)

    return path[0], graph.get_edge_data(path[0], path[1])['floor_id'], path[len(path) - 1], graph.get_edge_data(path[len(path) - 2], path[len(path) - 1])['floor_id']


def Get_Coordinates(vertices, nodeId: int) -> tuple[float, float]:
    row = vertices[vertices['properties.id'] == nodeId]
    point = row['geometry.coordinates'].values[0][0:2]
    return (float(point[0]), float(point[1]))


def create_graph(accessibility, path) -> nx.Graph:
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