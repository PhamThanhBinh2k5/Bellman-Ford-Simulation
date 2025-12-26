/* script.js */

let edges = [];
let positions = {};
let uniqueVertices = [];
let selectedNode = null;
let dragOffset = { x: 0, y: 0 };

/* ================= INIT & EVENT LISTENERS ================= */

window.onload = function() {
    updateGraphData(); 
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('sourceVertex').addEventListener('change', clearResult);
};

function clearResult() {
    document.getElementById('resultBox').innerHTML = "<h3>Kết quả</h3>";
    document.getElementById('pathBox').innerHTML = "";
    document.getElementById('iterationTable').innerHTML = "";
    resetGraphColors();
}

/* ================= FILE UPLOAD & PARSING ================= */

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { parseGraphData(e.target.result); };
    reader.readAsText(file);
    event.target.value = ''; 
}

function parseGraphData(content) {
    edges = [];
    const lines = content.trim().split('\n');
    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
            edges.push({ u: parseInt(parts[0]), v: parseInt(parts[1]), w: parseInt(parts[2]) });
        }
    });
    updateGraphData();
}

/* ================= DATA MANAGEMENT ================= */

function addNewEdge() { edges.push({ u: 0, v: 0, w: 0 }); updateGraphData(); }
function removeEdge(index) { edges.splice(index, 1); updateGraphData(); }
function updateEdgeValue(index, field, value) { edges[index][field] = parseInt(value);
     updateGraphData(); }

function getUniqueVertices() {
    const set = new Set();
    edges.forEach(e => { if (!isNaN(e.u)) set.add(e.u); if (!isNaN(e.v)) set.add(e.v); });
    return Array.from(set).sort((a, b) => a - b);
}

function updateGraphData() {
    uniqueVertices = getUniqueVertices();
    document.getElementById('numVertices').value = uniqueVertices.length;
    renderEdgeTable();
    updateControlOptions();
    generateNodePositions();
    drawGraph();
}

function updateControlOptions() {
    const sourceSelect = document.getElementById('sourceVertex');
    const targetSelect = document.getElementById('targetVertex');
    const currentSource = parseInt(sourceSelect.value);
    const currentTarget = targetSelect.value; 

    sourceSelect.innerHTML = "";
    targetSelect.innerHTML = "<option value='all'>Tất cả</option>"; 

    if (uniqueVertices.length === 0) return;

    uniqueVertices.forEach(v => {
        sourceSelect.innerHTML += `<option value="${v}">Đỉnh ${v}</option>`;
        targetSelect.innerHTML += `<option value="${v}">Đỉnh ${v}</option>`;
    });

    if (uniqueVertices.includes(currentSource)) sourceSelect.value = currentSource;
    else sourceSelect.value = uniqueVertices[0];

    if (currentTarget === 'all' || uniqueVertices.includes(parseInt(currentTarget))) 
        targetSelect.value = currentTarget;
    else targetSelect.value = 'all';
}

function renderEdgeTable() {
    const tbody = document.getElementById('edgeTableBody');
    let html = "";
    edges.forEach((e, i) => {
        html += `<tr>
            <td><input type="number" value="${e.u}" onchange="updateEdgeValue(${i}, 'u', this.value)"></td>
            <td><input type="number" value="${e.v}" onchange="updateEdgeValue(${i}, 'v', this.value)"></td>
            <td><input type="number" value="${e.w}" onchange="updateEdgeValue(${i}, 'w', this.value)"></td>
            <td><button class="btn-delete" onclick="removeEdge(${i})">✖</button></td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

/* ================= VISUALIZATION (CANVAS) ================= */

function generateNodePositions() {
    if (Object.keys(positions).length > 0 && uniqueVertices.every(v => positions[v])) return;
    positions = {};
    const V = uniqueVertices.length;
    let width = 600, height = 400;
    const cx = width / 2, cy = height / 2;
    const r = Math.min(width, height) / 2 - 50;

    uniqueVertices.forEach((vId, index) => {
        let angle = (2 * Math.PI * index) / V - Math.PI/2; 
        positions[vId] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
}

function drawGraph() {
    const svg = document.getElementById('graphCanvas');
    let defs = svg.querySelector('defs');
    svg.innerHTML = ""; 
    if(defs) svg.appendChild(defs);
    else {
        svg.innerHTML += `
        <defs>
            <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#2196F3" /></marker>
            <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#4CAF50" /></marker>
            <marker id="arrow-yellow" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#ffd43b" /></marker>
            <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#ff0000" /></marker>
        </defs>`;
    }

    edges.forEach((e) => {
        const p1 = positions[e.u];
        const p2 = positions[e.v];
        if (!p1 || !p2) return;

        let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y);
        line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
        line.setAttribute("class", "edge");
        line.setAttribute("stroke", "#90caf9");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("marker-end", "url(#arrow-blue)");
        line.setAttribute("data-u", e.u);
        line.setAttribute("data-v", e.v);
        svg.appendChild(line);

        let midX = (p1.x + p2.x) / 2;
        let midY = (p1.y + p2.y) / 2;
        let bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bg.setAttribute("x", midX - 10); bg.setAttribute("y", midY - 10);
        bg.setAttribute("width", 20); bg.setAttribute("height", 20);
        bg.setAttribute("fill", "white");
        bg.setAttribute("class", "weight-bg");
        svg.appendChild(bg);

        let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", midX); text.setAttribute("y", midY);
        text.setAttribute("dy", "0.3em");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "edge-weight");
        text.setAttribute("fill", "#555");
        text.textContent = e.w;
        svg.appendChild(text);
    });

    uniqueVertices.forEach(vId => {
        const p = positions[vId];
        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("onmousedown", `startDrag(event, ${vId})`);
        g.setAttribute("class", "node-group");

        let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", p.x); circle.setAttribute("cy", p.y);
        circle.setAttribute("r", 18);
        circle.setAttribute("class", "node");
        circle.setAttribute("id", `node-circle-${vId}`);
        circle.setAttribute("stroke", "#2196F3");
        circle.setAttribute("stroke-width", "2");
        circle.setAttribute("fill", "white");

        let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", p.x); text.setAttribute("y", p.y);
        text.setAttribute("dy", "0.3em");
        text.setAttribute("class", "node-text");
        text.setAttribute("id", `node-text-${vId}`);
        text.setAttribute("text-anchor", "middle");
        text.textContent = vId;

        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);
    });
}

/* ================= HELPER FUNCTIONS FOR DISPLAY ================= */

function formatVal(dist, parent) {
    let d = (dist === Infinity) ? "∞" : dist;
    let p = (parent === null || parent === undefined) ? "-" : parent;
    return `(${d}, ${p})`;
}

function resetGraphColors() {
    document.querySelectorAll('.edge').forEach(l => {
        l.setAttribute("stroke", "#90caf9");
        l.setAttribute("stroke-width", "2");
        l.setAttribute("marker-end", "url(#arrow-blue)");
    });
    document.querySelectorAll('.node').forEach(c => {
        c.setAttribute("fill", "white");
        c.setAttribute("stroke", "#2196F3");
    });
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function highlightEdgeAndNodes(u, v, isHighlight) {
    const line = document.querySelector(`.edge[data-u='${u}'][data-v='${v}']`);
    const nodeU = document.getElementById(`node-circle-${u}`);
    const nodeV = document.getElementById(`node-circle-${v}`);

    if (isHighlight) {
        if(line) {
            line.setAttribute("stroke", "#ffd43b");
            line.setAttribute("stroke-width", "4");
            line.setAttribute("marker-end", "url(#arrow-yellow)");
            line.parentNode.appendChild(line);
        }
        if(nodeU) { nodeU.setAttribute("fill", "#FFF9C4"); nodeU.setAttribute("stroke", "#FBC02D"); }
        if(nodeV) { nodeV.setAttribute("fill", "#FFF9C4"); nodeV.setAttribute("stroke", "#FBC02D"); }
    } else {
        if(line) {
            line.setAttribute("stroke", "#90caf9");
            line.setAttribute("stroke-width", "2");
            line.setAttribute("marker-end", "url(#arrow-blue)");
        }
        if(nodeU) { nodeU.setAttribute("fill", "white"); nodeU.setAttribute("stroke", "#2196F3"); }
        if(nodeV) { nodeV.setAttribute("fill", "white"); nodeV.setAttribute("stroke", "#2196F3"); }
    }
}
/* ================= ALGORITHMS (UPDATED: ADD 'KQVL' ROW SUMMARY) ================= */
/* ================= ALGORITHMS (2 TABLES VERSION) ================= */

async function runBellmanFord() {
    clearResult();
    const source = parseInt(document.getElementById('sourceVertex').value);
    const V = uniqueVertices.length;
    let dist = {};
    let parent = {};
    uniqueVertices.forEach(v => { dist[v] = Infinity; parent[v] = null; });
    dist[source] = 0;

    // --- SETUP BẢNG 1 (MA TRẬN) ---
    const table1 = document.getElementById('iterationTable');
    let headerHTML = `<thead><tr><th>(u,v)</th><th>w</th>`;
    uniqueVertices.forEach(v => headerHTML += `<th>Đỉnh ${v}</th>`);
    headerHTML += `</tr></thead><tbody>`;
    // Hàng khởi tạo Bảng 1
    headerHTML += `<tr class="init-row"><td>Khởi tạo</td><td>-</td>`;
    uniqueVertices.forEach(v => headerHTML += `<td>${formatVal(dist[v], parent[v])}</td>`);
    headerHTML += `</tr>`;
    table1.innerHTML = headerHTML;
    const tbody1 = table1.querySelector('tbody');

    // --- SETUP BẢNG 2 (NHẬT KÝ CHI TIẾT) ---
    const table2 = document.getElementById('detailedLogTable');
    // Reset lại nội dung bảng 2 (chỉ giữ lại header)
    table2.innerHTML = `
        <thead>
            <tr style="background-color: #e3f2fd;">
                <th style="padding:8px; border:1px solid #ccc;">Vòng lặp</th>
                <th style="padding:8px; border:1px solid #ccc;">u</th>
                <th style="padding:8px; border:1px solid #ccc;">v</th>
                <th style="padding:8px; border:1px solid #ccc;">w(u,v)</th>
                <th style="padding:8px; border:1px solid #ccc;">dist[v] trước</th>
                <th style="padding:8px; border:1px solid #ccc;">dist[v] sau</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody2 = table2.querySelector('tbody');


    // --- MAIN LOOP ---
    let changeInLoop = true;
    for (let k = 1; k <= V - 1; k++) {
        changeInLoop = false;
        
        // Hàng tiêu đề vòng lặp cho Bảng 1
        let rowIter = document.createElement('tr');
        rowIter.innerHTML = `<td colspan="${2 + V}" class="iteration-header">Bắt đầu vòng lặp ${k}</td>`;
        tbody1.appendChild(rowIter);
        rowIter.scrollIntoView({ behavior: "smooth", block: "center" });
        await sleep(300);

        // Duyệt từng cạnh
        for (const e of edges) {
            let u = e.u, v = e.v, w = e.w;
            let updated = false;
            
            // Lưu giá trị cũ để in vào Bảng 2
            let oldDistV = dist[v]; 

            // Highlight cạnh
            await highlightEdgeAndNodes(u, v, true);
            await sleep(100);

            // === LOGIC THƯ GIÃN ===
            if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                parent[v] = u;
                updated = true;
                changeInLoop = true;
            }

            // === CẬP NHẬT BẢNG 1 (MA TRẬN) ===
            let row1 = document.createElement('tr');
            row1.innerHTML = `<td>(${u},${v})</td><td>${w}</td>`;
            uniqueVertices.forEach(node => {
                let cell = document.createElement('td');
                if (node === v) {
                    cell.innerHTML = formatVal(dist[node], parent[node]);
                    if (updated) cell.className = "cell-updated"; 
                    else cell.style.color = "#000"; 
                } else {
                    cell.innerHTML = "";
                }
                row1.appendChild(cell);
            });
            tbody1.appendChild(row1);

            // === CẬP NHẬT BẢNG 2 (NHẬT KÝ CHI TIẾT) ===
            // Chỉ thêm dòng vào bảng 2 nếu dist[u] != Infinity (có thể xét được)
            // hoặc bạn có thể bỏ điều kiện if để hiện tất cả các lần xét
            let row2 = document.createElement('tr');
            let valOld = (oldDistV === Infinity) ? "∞" : oldDistV;
            let valNew = (dist[v] === Infinity) ? "∞" : dist[v];
            
            let colorStyle = updated ? "color:red; font-weight:bold;" : "color:black;";
            let bgStyle = updated ? "background-color:#FFF3E0;" : "";

            row2.innerHTML = `
                <td style="padding:5px; border:1px solid #ccc;">${k}</td>
                <td style="padding:5px; border:1px solid #ccc;">${u}</td>
                <td style="padding:5px; border:1px solid #ccc;">${v}</td>
                <td style="padding:5px; border:1px solid #ccc;">${w}</td>
                <td style="padding:5px; border:1px solid #ccc;">${valOld}</td>
                <td style="padding:5px; border:1px solid #ccc; ${colorStyle} ${bgStyle}">${valNew}</td>
            `;
            tbody2.appendChild(row2);
            // Tự động cuộn bảng 2 xuống dòng mới nhất
            row2.scrollIntoView({ behavior: "smooth", block: "nearest" });


            // Bỏ highlight
            await highlightEdgeAndNodes(u, v, false);
        }

        // --- KQVL k cho Bảng 1 ---
        let rowSummary = document.createElement('tr');
        rowSummary.style.backgroundColor = "#E3F2FD"; 
        rowSummary.innerHTML = `<td style="font-weight:bold; color:#1565C0">KQVL ${k}</td><td>-</td>`;
        uniqueVertices.forEach(v => {
            rowSummary.innerHTML += `<td style="font-weight:bold; color:#1565C0">${formatVal(dist[v], parent[v])}</td>`;
        });
        tbody1.appendChild(rowSummary);
        await sleep(500);

        if (!changeInLoop) {
             let rowStop = document.createElement('tr');
             rowStop.innerHTML = `<td colspan="${2 + V}" style="text-align:left; color:#666; font-style:italic;">→ Không có thay đổi, dừng thuật toán.</td>`;
             tbody1.appendChild(rowStop);
             break;
        }
    }

    // --- CHECK NEGATIVE CYCLE ---
    let negativeCycle = false;
    for (const e of edges) {
        if (dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]) {
            negativeCycle = true;
            const line = document.querySelector(`.edge[data-u='${e.u}'][data-v='${e.v}']`);
            if(line) { line.setAttribute("stroke", "red"); line.setAttribute("marker-end", "url(#arrow-red)"); }
        }
    }

    // --- FINAL RESULT ---
    let rowFinal = document.createElement('tr');
    rowFinal.innerHTML = `<td style="color:red;font-weight:bold">KQ Chung Cuộc</td><td>-</td>`;
    uniqueVertices.forEach(v => {
        rowFinal.innerHTML += `<td class="cell-final">${formatVal(dist[v], parent[v])}</td>`;
    });
    tbody1.appendChild(rowFinal);
    rowFinal.scrollIntoView({ behavior: "smooth", block: "center" });

    // Render Text & Highlight Path
    const resultBox = document.getElementById('resultBox');
    const pathBox = document.getElementById('pathBox');
    
    if (negativeCycle) {
        resultBox.innerHTML = "<h3 style='color:red'>❌ Đồ thị có chu trình âm!</h3>";
        pathBox.innerHTML = "";
    } else {
        resultBox.innerHTML = "<h3 style='color:green'>✅ Hoàn tất, không có chu trình âm</h3>";
        let target = document.getElementById('targetVertex').value;
        highlightFinalPath(parent, source, target);
        
        let pTxt = "<strong>Đường đi ngắn nhất:</strong><br>";
        if (target !== 'all') {
            pTxt += getPathString(parent, source, parseInt(target));
        } else {
             uniqueVertices.forEach(t => {
                 if(t !== source) pTxt += `Đến ${t}: ${getPathString(parent, source, t)}<br>`;
             });
        }
        pathBox.innerHTML = pTxt;
    }
}

async function runDijkstra() {
    clearResult();
    const source = parseInt(document.getElementById('sourceVertex').value);
    if (edges.some(e => e.w < 0)) { alert("Dijkstra không chạy được với cạnh âm!"); return; }

    let dist = {};
    let parent = {};
    let visited = {};
    uniqueVertices.forEach(v => { dist[v] = Infinity; parent[v] = null; visited[v] = false; });
    dist[source] = 0;

    const table = document.getElementById('iterationTable');
    let headerHTML = `<thead><tr><th>Đỉnh xét u</th><th>w(u,v)</th>`;
    uniqueVertices.forEach(v => headerHTML += `<th>${v}</th>`);
    headerHTML += `</tr></thead><tbody>`;
    
    headerHTML += `<tr class="init-row"><td>Khởi tạo</td><td>-</td>`;
    uniqueVertices.forEach(v => headerHTML += `<td>${formatVal(dist[v], parent[v])}</td>`);
    headerHTML += `</tr>`;
    table.innerHTML = headerHTML;
    const tbody = table.querySelector('tbody');

    let pq = [{ id: source, dist: 0 }];
    let loopCount = 0; // Biến đếm số lần xét đỉnh

    while (pq.length > 0) {
        pq.sort((a, b) => a.dist - b.dist);
        const current = pq.shift();
        const u = current.id;

        if (visited[u]) continue;
        visited[u] = true;
        loopCount++; // Tăng biến đếm vòng lặp

        const nodeU = document.getElementById(`node-circle-${u}`);
        if(nodeU) nodeU.setAttribute("fill", "#BBDEFB");

        let rowIter = document.createElement('tr');
        rowIter.innerHTML = `<td colspan="${2 + uniqueVertices.length}" class="iteration-header">Xét đỉnh cố định: ${u} (d=${dist[u]})</td>`;
        tbody.appendChild(rowIter);
        rowIter.scrollIntoView({ behavior: "smooth", block: "center" });
        await sleep(300);

        const neighbors = edges.filter(e => e.u === u);
        for (const e of neighbors) {
            let v = e.v;
            let updated = false;

            await highlightEdgeAndNodes(u, v, true);
            await sleep(150);

            if (!visited[v] && dist[u] + e.w < dist[v]) {
                dist[v] = dist[u] + e.w;
                parent[v] = u;
                pq.push({ id: v, dist: dist[v] });
                updated = true;
            }

            let row = document.createElement('tr');
            row.innerHTML = `<td> -> ${v}</td><td>${e.w}</td>`;
            uniqueVertices.forEach(node => {
                let cell = document.createElement('td');
                if (node === v) {
                    cell.innerHTML = formatVal(dist[node], parent[node]);
                    if (updated) {
                         cell.className = "cell-updated";
                    } else {
                         cell.style.color = "#000";
                    }
                } else {
                    cell.innerHTML = "";
                }
                row.appendChild(cell);
            });
            tbody.appendChild(row);

            await highlightEdgeAndNodes(u, v, false);
        }
        if(nodeU) nodeU.setAttribute("fill", "#E3F2FD");

        // --- TẠO HÀNG KẾT QUẢ VÒNG LẶP (KQVL) CHO DIJKSTRA ---
        let rowSummary = document.createElement('tr');
        rowSummary.style.backgroundColor = "#E3F2FD";
        // Vì Dijkstra không lặp "Lần 1, Lần 2" như Bellman mà lặp theo số đỉnh xét
        // Ta vẫn dùng KQVL + số thứ tự để bạn dễ theo dõi
        rowSummary.innerHTML = `<td style="font-weight:bold; color:#1565C0">KQVL ${loopCount} (sau ${u})</td><td>-</td>`;
        uniqueVertices.forEach(v => {
            rowSummary.innerHTML += `<td style="font-weight:bold; color:#1565C0">${formatVal(dist[v], parent[v])}</td>`;
        });
        tbody.appendChild(rowSummary);
        await sleep(300);
    }

    let rowFinal = document.createElement('tr');
    rowFinal.innerHTML = `<td style="color:red;font-weight:bold">KQ Chung Cuộc</td><td>-</td>`;
    uniqueVertices.forEach(v => rowFinal.innerHTML += `<td class="cell-final">${formatVal(dist[v], parent[v])}</td>`);
    tbody.appendChild(rowFinal);
    
    let target = document.getElementById('targetVertex').value;
    highlightFinalPath(parent, source, target);
    let pTxt = "<strong>Kết quả Dijkstra:</strong><br>";
    if (target !== 'all') {
        pTxt += getPathString(parent, source, parseInt(target));
    } else {
            uniqueVertices.forEach(t => {
                if(t !== source) pTxt += `Đến ${t}: ${getPathString(parent, source, t)}<br>`;
            });
    }
    document.getElementById('pathBox').innerHTML = pTxt;
}

/* ================= DRAG & DROP ================= */
// (Giữ nguyên logic Drag & Drop đã fix ở câu trả lời trước)
function getMousePosition(evt) {
    const svg = document.getElementById('graphCanvas');
    const CTM = svg.getScreenCTM();
    if (CTM) {
        return { x: (evt.clientX - CTM.e) / CTM.a, y: (evt.clientY - CTM.f) / CTM.d };
    } else {
        const rect = svg.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }
}
function startDrag(evt, nodeId) {
    evt.preventDefault();
    selectedNode = nodeId;
    const coord = getMousePosition(evt);
    dragOffset.x = coord.x - positions[nodeId].x;
    dragOffset.y = coord.y - positions[nodeId].y;
}
function drag(evt) {
    if (selectedNode === null) return;
    evt.preventDefault();
    const coord = getMousePosition(evt);
    positions[selectedNode] = { x: coord.x - dragOffset.x, y: coord.y - dragOffset.y };
    drawGraph();
}
function endDrag() { selectedNode = null; }


/* ================= PHẦN BỔ SUNG: XỬ LÝ HIỂN THỊ ĐƯỜNG ĐI ================= */

// 1. Hàm truy vết và trả về chuỗi text (Ví dụ: "0 ➝ 2 ➝ 3")
function getPathString(parent, source, target) {
    let s = parseInt(source);
    let t = parseInt(target);

    if (s === t) return s.toString();
    
    // Nếu đích không có cha (và khác nguồn) => Không có đường đi
    if (parent[t] === null || parent[t] === undefined) return "Không có đường đi";

    let path = [];
    let curr = t;
    
    // Truy vết ngược từ Đích về Nguồn
    while (curr !== null && curr !== undefined) {
        path.unshift(curr);
        if (curr === s) break;
        curr = parent[curr];
    }

    // Nếu sau khi truy vết mà phần tử đầu tiên không phải nguồn => Đồ thị không liên thông
    if (path[0] !== s) return "Không có đường đi";

    return path.join(" ➝ ");
}

// 2. Hàm tô màu xanh lá cây (Green) cho đường đi ngắn nhất trên hình vẽ
function highlightFinalPath(parent, source, target) {
    // Nếu chọn "Tất cả" thì chỉ hiện text, không tô màu trên hình để tránh rối
    if (target === 'all') return;

    let s = parseInt(source);
    let t = parseInt(target);
    let curr = t;

    // Kiểm tra tính hợp lệ
    if ((parent[curr] === null || parent[curr] === undefined) && curr !== s) return;

    while (curr !== null && curr !== undefined) {
        let p = parent[curr]; // Lấy đỉnh cha
        
        if (p !== null && p !== undefined) {
            // Tìm thẻ SVG của cạnh nối từ p -> curr
            const line = document.querySelector(`.edge[data-u='${p}'][data-v='${curr}']`);
            
            if (line) {
                // Đổi màu sang xanh lá đậm
                line.setAttribute("stroke", "#128f18ff"); 
                line.setAttribute("stroke-width", "4");
                line.setAttribute("marker-end", "url(#arrow-green)"); // Đổi mũi tên sang xanh
                
                // Thủ thuật: Đưa dòng này xuống cuối SVG để nó nổi lên trên các dòng khác
                line.parentNode.appendChild(line);
            }
            curr = p; // Lùi về đỉnh cha
        } else {
            break;
        }
        
        if (curr === s) break; // Đã lùi về tới nguồn
    }
}
// 2. Hàm tô màu xanh lá cây (Green) cho đường đi ngắn nhất trên hình vẽ
function highlightFinalPath(parent, source, target) {
    let s = parseInt(source);
    let targetsToTrace = [];

    // BƯỚC 1: Xác định danh sách các đỉnh cần tô màu đường đi
    if (target === 'all') {
        // Nếu chọn "Tất cả", ta sẽ duyệt qua mọi đỉnh trong đồ thị
        targetsToTrace = uniqueVertices; 
    } else {
        // Nếu chọn 1 đỉnh cụ thể, chỉ thêm đỉnh đó vào danh sách
        targetsToTrace = [parseInt(target)];
    }

    // BƯỚC 2: Duyệt qua từng đỉnh đích và truy vết ngược về nguồn
    targetsToTrace.forEach(t => {
        let curr = t;

        // Nếu đỉnh hiện tại là nguồn hoặc không có cha (không đến được) thì bỏ qua
        if (curr === s || parent[curr] === null || parent[curr] === undefined) return;

        // Vòng lặp truy vết từ Con -> Cha
        while (curr !== null && curr !== undefined && curr !== s) {
            let p = parent[curr]; // Lấy đỉnh cha
            
            if (p !== null && p !== undefined) {
                // Tìm thẻ SVG của cạnh nối từ p -> curr
                const line = document.querySelector(`.edge[data-u='${p}'][data-v='${curr}']`);
                
                if (line) {
                    // Đổi màu sang xanh lá đậm
                    line.setAttribute("stroke", "#43A047"); // Màu xanh lá tươi hơn một chút
                    line.setAttribute("stroke-width", "4");
                    line.setAttribute("marker-end", "url(#arrow-green)"); // Đổi mũi tên sang xanh
                    
                    // Thủ thuật: Đưa dòng này xuống cuối SVG để nó nổi lên trên các đường khác
                    line.parentNode.appendChild(line);
                }
                curr = p; // Lùi về đỉnh cha để tiếp tục tô đoạn tiếp theo
            } else {
                break; // Ngắt nếu không tìm thấy cha
            }
        }
    });
}

// Hàm tạo hiệu ứng chớp màu Cam khi cập nhật thành công
async function flashUpdatedEdge(u, v) {
    const line = document.querySelector(`.edge[data-u='${u}'][data-v='${v}']`);
    if (line) {
        // Lưu lại màu cũ (đang là vàng do đang highlight)
        line.setAttribute("stroke", "#FF5722"); // Màu Cam Đậm báo hiệu Update
        line.setAttribute("stroke-width", "5");
        // Dừng lại 1 chút để mắt người kịp nhìn thấy sự thay đổi
        await sleep(400); 
    }
}