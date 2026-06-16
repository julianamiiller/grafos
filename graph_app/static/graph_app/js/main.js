'use strict';
const POSITIONS = {
    'Centro':      { x: 0.18, y: 0.38 },
    'Boqueirão':   { x: 0.22, y: 0.72 },
    'Flamengo':    { x: 0.46, y: 0.16 },
    'Araçatiba':   { x: 0.52, y: 0.52 },
    'Ponta Negra': { x: 0.76, y: 0.32 },
    'Itaipuaçu':   { x: 0.80, y: 0.72 },
};
const C = {
    bg:           '#02050e',
    nodeDefault:  '#0f1629',
    nodeBorder:   '#00e5ff',
    nodeVisited:  '#1e2a3a',
    nodeBorderV:  '#3b82f6',
    nodeCurrent:  '#3b0a18',
    nodeBorderC:  '#ef4444',
    nodePath:     '#2a1f0a',
    nodeBorderP:  '#ff8c00',
    edgeDefault:  'rgba(0, 229, 255, 0.2)',
    edgePath:     '#ff8c00',
    labelNode:    '#f8fafc',
    labelEdge:    '#64748b',
    labelEdgePath:'#ff8c00',
};
const R = 26;            
const FONT_N = `bold 12px Inter, sans-serif`;
const FONT_E = `600 11px Inter, sans-serif`;
let canvas, ctx;
let W = 0, H = 0;
let graphData  = null;
let nodeStates = {};   
let edgeStates = {};   
let isAnimating = false;
let stepCount   = 0;
function init() {
    canvas = document.getElementById('graph-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    const resize = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr  = window.devicePixelRatio || 1;
        W = rect.width  || 800;
        H = rect.height || 480;
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
        if (graphData) draw();
    };
    resize();
    window.addEventListener('resize', resize);
    const dataEl = document.getElementById('graph-data');
    if (!dataEl) return;
    graphData = JSON.parse(dataEl.textContent);
    graphData.nodes.forEach(n => { nodeStates[n.id] = 'default'; });
    graphData.edges.forEach(e => { edgeStates[e.id] = 'default'; });
    draw();
    document.getElementById('route-form').addEventListener('submit', handleSubmit);
}
async function handleSubmit(e) {
    e.preventDefault();
    if (isAnimating) return;
    const source = document.getElementById('source').value;
    const target = document.getElementById('target').value;
    if (!source || !target)    { alert('Selecione origem e destino.'); return; }
    if (source === target)     { alert('Origem e destino devem ser diferentes.'); return; }
    const btn = document.getElementById('calc-btn');
    btn.disabled = true;
    btn.textContent = 'Calculando…';
    document.getElementById('canvas-hint').style.opacity = '0';
    document.getElementById('result-card').classList.add('hidden');
    document.getElementById('steps-card').classList.add('hidden');
    try {
        const res = await fetch('/api/calculate-route/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source, target })
        });
        const data = await res.json();
        if (!res.ok) { alert(data.error || 'Erro ao calcular rota.'); return; }
        renderResult(data);
        await animate(data.steps, data.path);
    } catch (err) {
        console.error(err);
        alert('Erro de conexão com o servidor.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Executar Dijkstra`;
    }
}
function renderResult(data) {
    document.getElementById('res-distance').textContent =
        typeof data.distance === 'number' ? `${data.distance} km` : data.distance;
    document.getElementById('res-hops').textContent = data.path.length;
    const pathEl = document.getElementById('res-path');
    pathEl.innerHTML = '';
    data.path.forEach((node, i) => {
        const chip = document.createElement('span');
        chip.className = 'route-node';
        chip.textContent = node;
        pathEl.appendChild(chip);
        if (i < data.path.length - 1) {
            const arr = document.createElement('span');
            arr.className = 'route-arrow-icon';
            arr.textContent = '→';
            pathEl.appendChild(arr);
        }
    });
    document.getElementById('result-card').classList.remove('hidden');
}
function initTable(steps) {
    if (!steps || !steps.length) return null;
    const allNodes = Object.keys(steps[0].distances).sort();
    const stepsCard = document.getElementById('steps-card');
    stepsCard.classList.remove('hidden');
    const thead = document.getElementById('dt-head');
    const tbody = document.getElementById('dt-body');
    thead.innerHTML = '<th>Nó Atual</th>' + allNodes.map(n => `<th>${n}</th>`).join('');
    tbody.innerHTML = '';
    stepCount = 0;
    document.getElementById('step-counter').textContent = '0 passos';
    return { allNodes, tbody };
}
function addTableRow(tableCtx, step, prevDistances) {
    if (!tableCtx) return;
    const { allNodes, tbody } = tableCtx;
    stepCount++;
    document.getElementById('step-counter').textContent = `${stepCount} passo${stepCount > 1 ? 's' : ''}`;
    const tr = document.createElement('tr');
    tr.className = 'row-active';
    const tdName = document.createElement('td');
    tdName.className = 'cell-current';
    tdName.innerHTML = `<strong>${step.current_node}</strong>`;
    tr.appendChild(tdName);
    allNodes.forEach(n => {
        const td  = document.createElement('td');
        const val = step.distances[n];
        const was = prevDistances ? prevDistances[n] : null;
        const updated = prevDistances && was !== val && val !== '∞';
        if (n === step.current_node) td.className = 'cell-current';
        else if (updated)            td.className = 'cell-updated';
        td.textContent = val;
        tr.appendChild(td);
    });
    tbody.appendChild(tr);
    tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => tr.classList.remove('row-active'), 800);
}
async function animate(steps, finalPath) {
    isAnimating = true;
    resetColors();
    const tableCtx = initTable(steps);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let prevDist = null;
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        step.visited.forEach(v => {
            if (nodeStates[v] !== 'current') nodeStates[v] = 'visited';
        });
        nodeStates[step.current_node] = 'current';
        draw();
        addTableRow(tableCtx, step, prevDist);
        prevDist = { ...step.distances };
        await sleep(850);
        nodeStates[step.current_node] = 'visited';
    }
    await sleep(300);
    if (finalPath && finalPath.length > 1) {
        for (let i = 0; i < finalPath.length; i++) {
            nodeStates[finalPath[i]] = 'path';
            if (i < finalPath.length - 1) {
                const edgeId = [finalPath[i], finalPath[i+1]].sort().join('-');
                if (edgeStates.hasOwnProperty(edgeId)) edgeStates[edgeId] = 'path';
            }
            draw();
            await sleep(400);
        }
    }
    isAnimating = false;
}
function resetColors() {
    graphData.nodes.forEach(n => { nodeStates[n.id] = 'default'; });
    graphData.edges.forEach(e => { edgeStates[e.id] = 'default'; });
    draw();
}
function nodePos(id) {
    const p = POSITIONS[id];
    if (!p) return { x: W/2, y: H/2 };
    return { x: p.x * W, y: p.y * H };
}
function draw() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    graphData.edges.forEach(e => drawEdge(e));
    graphData.nodes.forEach(n => drawNode(n));
}
function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    const step = 50;
    for (let x = 0; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
}
function drawEdge(e) {
    const a = nodePos(e.from);
    const b = nodePos(e.to);
    const state = edgeStates[e.id] || 'default';
    const isPath = state === 'path';
    ctx.save();
    if (isPath) {
        ctx.shadowColor = C.edgePath;
        ctx.shadowBlur  = 16;
        ctx.strokeStyle = C.edgePath;
        ctx.lineWidth   = 4;
        ctx.setLineDash([]);
    } else {
        ctx.strokeStyle = C.edgeDefault;
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([6, 5]);
    }
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    ctx.font = FONT_E;
    const tw = ctx.measureText(e.label).width;
    const ph = 16, pv = 5, pad = 7;
    ctx.fillStyle = isPath ? 'rgba(250,204,21,0.12)' : 'rgba(6,9,18,0.85)';
    ctx.strokeStyle = isPath ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(mx - tw/2 - pad, my - ph/2 - 1, tw + pad*2, ph + 2, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle   = isPath ? C.labelEdgePath : C.labelEdge;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.label, mx, my);
    ctx.restore();
}
function drawNode(n) {
    const { x, y } = nodePos(n.id);
    const state = nodeStates[n.id] || 'default';
    let fill, border, glowColor, glowSize;
    switch (state) {
        case 'current':
            fill = C.nodeCurrent; border = C.nodeBorderC; glowColor = C.nodeBorderC; glowSize = 22; break;
        case 'visited':
            fill = C.nodeVisited; border = C.nodeBorderV; glowColor = C.nodeBorderV; glowSize = 10; break;
        case 'path':
            fill = C.nodePath;    border = C.nodeBorderP; glowColor = C.nodeBorderP; glowSize = 24; break;
        default:
            fill = C.nodeDefault; border = C.nodeBorder;  glowColor = C.nodeBorder;  glowSize = 12;
    }
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur  = glowSize;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth   = state === 'path' || state === 'current' ? 2.5 : 1.8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (state === 'path') {
        ctx.beginPath();
        ctx.arc(x, y, R - 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(250,204,21,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    ctx.font = FONT_N;
    ctx.fillStyle    = state === 'visited' ? '#64748b' : '#f1f5f9';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const parts = n.label.split(' ');
    if (parts.length === 1 && n.label.length <= 8) {
        ctx.fillText(n.label, x, y);
    } else if (parts.length === 2) {
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(parts[0], x, y - 6);
        ctx.fillText(parts[1], x, y + 7);
    } else {
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText(n.label, x, y);
    }
    ctx.restore();
}
document.addEventListener('DOMContentLoaded', init);
