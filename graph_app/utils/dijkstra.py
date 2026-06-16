import heapq

def run_dijkstra(graph, start_node, end_node):
    distances = {node: float('infinity') for node in graph}
    distances[start_node] = 0
    previous_nodes = {node: None for node in graph}
    pq = [(0, start_node)]
    
    steps = []
    visited = set()

    while pq:
        current_distance, current_node = heapq.heappop(pq)
        
        steps.append({
            'current_node': current_node,
            'visited': list(visited),
            'distances': {k: (v if v != float('infinity') else '∞') for k, v in distances.items()}
        })

        if current_node in visited:
            continue
            
        visited.add(current_node)

        if current_node == end_node:
            steps.append({
                'current_node': current_node,
                'visited': list(visited),
                'distances': {k: (v if v != float('infinity') else '∞') for k, v in distances.items()}
            })
            break

        for neighbor, weight in graph[current_node].items():
            if neighbor in visited:
                continue
                
            distance = current_distance + weight
            
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                previous_nodes[neighbor] = current_node
                heapq.heappush(pq, (distance, neighbor))
                
    path = []
    current = end_node
    while current is not None:
        path.insert(0, current)
        current = previous_nodes[current]
        
    if path and path[0] == start_node:
        return {
            'path': path,
            'distance': distances[end_node],
            'steps': steps
        }
    else:
        return {
            'path': [],
            'distance': 'Inalcançável',
            'steps': steps
        }
