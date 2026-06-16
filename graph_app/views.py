import json
from django.shortcuts import render
from django.http import JsonResponse
from .utils.dijkstra import run_dijkstra

GRAPH_DATA = {
    'Centro': {'Flamengo': 5, 'Araçatiba': 8, 'Boqueirão': 3},
    'Flamengo': {'Centro': 5, 'Araçatiba': 4, 'Ponta Negra': 12},
    'Araçatiba': {'Centro': 8, 'Flamengo': 4, 'Ponta Negra': 6, 'Boqueirão': 2},
    'Boqueirão': {'Centro': 3, 'Araçatiba': 2, 'Itaipuaçu': 10},
    'Ponta Negra': {'Flamengo': 12, 'Araçatiba': 6, 'Itaipuaçu': 7},
    'Itaipuaçu': {'Boqueirão': 10, 'Ponta Negra': 7}
}

def index(request):
    nodes = list(GRAPH_DATA.keys())
    
    vis_nodes = [{"id": n, "label": n} for n in nodes]
    vis_edges = []
    seen_edges = set()
    
    for u, neighbors in GRAPH_DATA.items():
        for v, w in neighbors.items():
            edge_id = tuple(sorted([u, v]))
            if edge_id not in seen_edges:
                seen_edges.add(edge_id)
                vis_edges.append({
                    "id": f"{edge_id[0]}-{edge_id[1]}",
                    "from": u, 
                    "to": v, 
                    "label": f"{w} km", 
                    "weight": w
                })
                
    context = {
        'nodes': nodes,
        'graph_json': json.dumps({'nodes': vis_nodes, 'edges': vis_edges})
    }
    return render(request, 'graph_app/index.html', context)

from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def calculate_route(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            start = data.get('source')
            end = data.get('target')
            
            if not start or not end:
                return JsonResponse({'error': 'Origem e destino são obrigatórios'}, status=400)
                
            if start not in GRAPH_DATA or end not in GRAPH_DATA:
                return JsonResponse({'error': 'Vértice inválido selecionado'}, status=400)
                
            result = run_dijkstra(GRAPH_DATA, start, end)
            
            return JsonResponse(result)
        except json.JSONDecodeError:
             return JsonResponse({'error': 'Dados JSON inválidos'}, status=400)
    
    return JsonResponse({'error': 'Método não permitido'}, status=405)
