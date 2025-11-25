const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { URL } = require('url');

const DEFAULT_PORT = parseInt(process.env.CLAUDSYS_PORT || '8000', 10);
const HOST = '0.0.0.0';
const BASE_DIR = __dirname;
const LOGIN_USER = 'BAKIM';
const LOGIN_PASS = 'MAXIME';

const SPINDLE_HEADERS = [
  'id',
  'Referans ID',
  'Çalışma Saati',
  'Takılı Olduğu Makine',
  'Makinaya Takıldığı Tarih',
  'Son Güncelleme',
];

const YEDEK_HEADERS = [
  'id',
  'Referans ID',
  'Açıklama',
  'Tamirde mi',
  'Bakıma Gönderilme',
  'Geri Dönme',
  'Söküldüğü Makine',
  'Sökülme Tarihi',
  'Son Güncelleme',
];

const FILES = {
  spindle: path.join(BASE_DIR, 'spindle_data.csv'),
  yedek: path.join(BASE_DIR, 'yedek_data.csv'),
  export: path.join(BASE_DIR, 'takip_export.csv'),
};

const DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function todayDate() {
  const now = new Date();
  return DATE_FORMATTER.format(now);
}

function ensureCsv(filePath, headers) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, headers.join(',') + os.EOL, 'utf8');
  }
}

function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (!content) {
    return [];
  }
  const [headerLine, ...rows] = content.split(/\r?\n/);
  const headers = headerLine.split(',');
  return rows
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] ?? '';
      });
      return obj;
    });
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => row[h] ?? '').join(','));
  }
  fs.writeFileSync(filePath, lines.join(os.EOL) + os.EOL, 'utf8');
}

function loadTable(kind) {
  const file = kind === 'spindle' ? FILES.spindle : FILES.yedek;
  const headers = kind === 'spindle' ? SPINDLE_HEADERS : YEDEK_HEADERS;
  ensureCsv(file, headers);
  return parseCsv(file);
}

function saveTable(kind, rows) {
  const file = kind === 'spindle' ? FILES.spindle : FILES.yedek;
  const headers = kind === 'spindle' ? SPINDLE_HEADERS : YEDEK_HEADERS;
  writeCsv(file, headers, rows);
}

function nextId(rows) {
  const maxId = rows.reduce((max, r) => Math.max(max, parseInt(r.id || '0', 10)), 0);
  return String(maxId + 1);
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, status, text, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    ...extraHeaders,
  });
  res.end(text);
}

function handleApi(req, res) {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;
  if (pathname === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, { status: 'ok', time: new Date().toISOString() });
  }

  if (pathname === '/api/spindles' && req.method === 'GET') {
    const search = (urlObj.searchParams.get('referans') || '').toLowerCase();
    const rows = loadTable('spindle').filter((r) =>
      !search || (r['Referans ID'] || '').toLowerCase().includes(search)
    );
    return sendJson(res, 200, rows);
  }

  if (pathname === '/api/yedek' && req.method === 'GET') {
    const search = (urlObj.searchParams.get('referans') || '').toLowerCase();
    const rows = loadTable('yedek').filter((r) =>
      !search || (r['Referans ID'] || '').toLowerCase().includes(search)
    );
    return sendJson(res, 200, rows);
  }

  if (pathname === '/api/export' && req.method === 'POST') {
    const spindle = loadTable('spindle');
    const yedek = loadTable('yedek');
    const lines = [];
    lines.push('--- Spindle Takip ---');
    lines.push('Makine No, Ref, Saat, Takılı Olduğu Makine, Makinaya Takıldığı Tarih, Son Güncelleme');
    for (const row of spindle) {
      lines.push([
        row['id'],
        row['Referans ID'],
        row['Çalışma Saati'],
        row['Takılı Olduğu Makine'],
        row['Makinaya Takıldığı Tarih'],
        row['Son Güncelleme'],
      ].join(','));
    }
    lines.push('');
    lines.push('--- Yedek Takip ---');
    lines.push('Ref No, Açıklama, Tamirde, Gönderildi, Dönen, Söküldüğü Makine, Sökülme Tarihi, Son Güncelleme');
    for (const row of yedek) {
      lines.push([
        row['Referans ID'],
        row['Açıklama'],
        row['Tamirde mi'],
        row['Bakıma Gönderilme'],
        row['Geri Dönme'],
        row['Söküldüğü Makine'],
        row['Sökülme Tarihi'],
        row['Son Güncelleme'],
      ].join(','));
    }
    fs.writeFileSync(FILES.export, lines.join(os.EOL) + os.EOL, 'utf8');
    return sendJson(res, 200, { ok: true, path: FILES.export });
  }

  if (pathname.startsWith('/api/spindles') && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return handleMutate(req, res, 'spindle');
  }

  if (pathname.startsWith('/api/yedek') && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return handleMutate(req, res, 'yedek');
  }

  sendJson(res, 404, { error: 'Not found' });
}

function handleMutate(req, res, kind) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });
  req.on('end', () => {
    let payload = {};
    try {
      payload = body ? JSON.parse(body) : {};
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid JSON' });
    }

    const rows = loadTable(kind);
    const headers = kind === 'spindle' ? SPINDLE_HEADERS : YEDEK_HEADERS;
    const today = todayDate();

    if (req.method === 'POST') {
      if (!payload['Referans ID'] || String(payload['Referans ID']).trim() === '') {
        return sendJson(res, 400, { error: 'Referans ID gerekli' });
      }
      const record = { ...payload };
      record.id = nextId(rows);
      record['Son Güncelleme'] = today;
      headers.forEach((h) => {
        if (record[h] === undefined) {
          record[h] = '';
        }
      });
      rows.push(record);
      saveTable(kind, rows);
      return sendJson(res, 201, record);
    }

    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    const recordId = parts[2];
    if (!recordId) {
      return sendJson(res, 400, { error: 'ID eksik' });
    }

    const idx = rows.findIndex((r) => r.id === recordId);
    if (idx === -1) {
      return sendJson(res, 404, { error: 'Kayıt bulunamadı' });
    }

    if (req.method === 'PUT') {
      const updated = { ...rows[idx], ...payload, id: recordId, 'Son Güncelleme': today };
      headers.forEach((h) => {
        if (updated[h] === undefined) {
          updated[h] = '';
        }
      });
      rows[idx] = updated;
      saveTable(kind, rows);
      return sendJson(res, 200, updated);
    }

    if (req.method === 'DELETE') {
      rows.splice(idx, 1);
      saveTable(kind, rows);
      return sendJson(res, 200, { ok: true });
    }

    sendJson(res, 405, { error: 'Yöntem desteklenmiyor' });
  });
}

function htmlPage(port) {
  const style = `
    :root { --bg: #f7f7f9; --card: #ffffff; --border: #d9d9e0; --accent: #0b5ed7; --text: #1b1b1f; --shadow: rgba(0,0,0,0.08); }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Segoe UI', Tahoma, sans-serif; background: var(--bg); color: var(--text); }
    header { background: #fff; border-bottom: 1px solid var(--border); padding: 16px 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 5; }
    .title { font-size: 20px; font-weight: 700; }
    .clock { text-align: right; color: #555; font-size: 14px; }
    .container { max-width: 1200px; margin: 20px auto 32px; padding: 0 16px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; box-shadow: 0 8px 22px var(--shadow); margin-bottom: 18px; }
    h2 { margin: 0 0 12px; font-size: 18px; }
    label { font-weight: 600; font-size: 13px; }
    input, select, button { font: inherit; padding: 10px; border-radius: 8px; border: 1px solid var(--border); }
    button { background: var(--accent); color: #fff; border: none; cursor: pointer; font-weight: 700; transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease; }
    button:hover { background: #094db4; transform: translateY(-1px); box-shadow: 0 6px 16px var(--shadow); }
    button.secondary { background: #eef1f6; color: #1b1b1f; }
    button.secondary:hover { background: #e1e4ea; box-shadow: none; transform: none; }
    .tabs { display: flex; gap: 12px; margin-bottom: 12px; }
    .tab-btn { padding: 10px 14px; border: 1px solid var(--border); background: #fff; border-radius: 10px; cursor: pointer; font-weight: 700; }
    .tab-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); box-shadow: 0 6px 16px var(--shadow); }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px; border-bottom: 1px solid var(--border); text-align: left; font-size: 13px; }
    th { background: #f1f3f7; }
    tr:nth-child(even) td { background: #fafbff; }
    .section-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
    .section-header input { width: 220px; }
    .message { margin-top: 6px; font-size: 13px; color: #0b5ed7; }
    .table-actions { display: flex; gap: 10px; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; z-index: 10; }
    .modal { width: min(640px, 90vw); background: #fff; border-radius: 14px; border: 1px solid var(--border); box-shadow: 0 16px 32px var(--shadow); padding: 20px; }
    .modal h3 { margin-top: 0; }
    .modal form { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 12px 16px; }
    .modal .actions { grid-column: 1 / -1; display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
    .login-mask { position: fixed; inset: 0; background: linear-gradient(135deg, #eef1f6, #f8f9fb); display: flex; align-items: center; justify-content: center; z-index: 20; }
    .login-card { width: 380px; background: #fff; border: 1px solid var(--border); border-radius: 14px; box-shadow: 0 16px 32px var(--shadow); padding: 28px; display: grid; gap: 12px; }
    .login-card h1 { margin: 0; font-size: 22px; text-align: center; }
    .login-card button { width: 100%; }
    .login-footer { text-align: right; font-size: 12px; color: #555; }
  `;

  const script = `
    const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const $ = (sel) => document.querySelector(sel);

    let activeTab = 'spindle';
    function today() { return dateFormatter.format(new Date()); }

    function setClock() { $('#clock').textContent = new Date().toLocaleString('tr-TR'); }
    setClock();
    setInterval(setClock, 1000);

    function switchTab(tab) {
      activeTab = tab;
      document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.style.display = panel.dataset.tab === tab ? 'block' : 'none');
    }

    function showModal(kind, record = null) {
      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      const modal = document.createElement('div');
      modal.className = 'modal';
      const isSpindle = kind === 'spindle';
      modal.innerHTML = \`
        <h3>\${record ? 'Düzenle' : 'Ekle'} - \${isSpindle ? 'Spindle' : 'Yedek'}</h3>
        <form id="modal-form">
          \${isSpindle ? \`
            <div><label>Referans ID</label><input name="Referans ID" required value="\${record?.['Referans ID'] || ''}"></div>
            <div><label>Çalışma Saati</label><input name="Çalışma Saati" value="\${record?.['Çalışma Saati'] || ''}"></div>
            <div><label>Takılı Olduğu Makine</label><input name="Takılı Olduğu Makine" value="\${record?.['Takılı Olduğu Makine'] || ''}"></div>
            <div><label>Makinaya Takıldığı Tarih</label><input name="Makinaya Takıldığı Tarih" value="\${record?.['Makinaya Takıldığı Tarih'] || today()}"></div>
          \` : \`
            <div><label>Referans ID</label><input name="Referans ID" required value="\${record?.['Referans ID'] || ''}"></div>
            <div><label>Açıklama</label><input name="Açıklama" value="\${record?.['Açıklama'] || ''}"></div>
            <div><label>Tamirde mi</label><select name="Tamirde mi"><option value="Evet" \${record?.['Tamirde mi']==='Evet'?'selected':''}>Evet</option><option value="Hayır" \${record?.['Tamirde mi']==='Hayır'?'selected':''}>Hayır</option></select></div>
            <div><label>Bakıma Gönderilme</label><input name="Bakıma Gönderilme" value="\${record?.['Bakıma Gönderilme'] || today()}"></div>
            <div><label>Geri Dönme</label><input name="Geri Dönme" value="\${record?.['Geri Dönme'] || today()}"></div>
            <div><label>Söküldüğü Makine</label><input name="Söküldüğü Makine" value="\${record?.['Söküldüğü Makine'] || ''}"></div>
            <div><label>Sökülme Tarihi</label><input name="Sökülme Tarihi" value="\${record?.['Sökülme Tarihi'] || today()}"></div>
          \`}
          <div class="actions">
            <button type="button" class="secondary" id="modal-cancel">Vazgeç</button>
            <button type="submit">\${record ? 'Güncelle' : 'Ekle'}</button>
          </div>
        </form>
      \`;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      document.getElementById('modal-cancel').onclick = () => overlay.remove();
      document.getElementById('modal-form').onsubmit = async (e) => {
        e.preventDefault();
        const payload = Object.fromEntries(new FormData(e.target).entries());
        const method = record ? 'PUT' : 'POST';
        const url = '/api/' + (isSpindle ? 'spindles' : 'yedek') + (record ? '/' + record.id : '');
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) {
          const msg = await res.json();
          alert(msg.error || 'Hata');
          return;
        }
        overlay.remove();
        loadTables();
      };
    }

    async function loadTables() {
      const referansSpindle = $('#spindle-search').value.trim();
      const referansYedek = $('#yedek-search').value.trim();
      const sRes = await fetch('/api/spindles' + (referansSpindle ? '?referans=' + encodeURIComponent(referansSpindle) : ''));
      const yRes = await fetch('/api/yedek' + (referansYedek ? '?referans=' + encodeURIComponent(referansYedek) : ''));
      const spindles = await sRes.json();
      const yedek = await yRes.json();
      renderTable('#spindle-body', spindles, 'spindle');
      renderTable('#yedek-body', yedek, 'yedek');
    }

    function renderTable(selector, rows, kind) {
      const body = document.querySelector(selector);
      body.innerHTML = '';
      for (const row of rows) {
        const tr = document.createElement('tr');
        const keys = kind === 'spindle'
          ? ['id','Referans ID','Çalışma Saati','Takılı Olduğu Makine','Makinaya Takıldığı Tarih','Son Güncelleme']
          : ['id','Referans ID','Açıklama','Tamirde mi','Bakıma Gönderilme','Geri Dönme','Söküldüğü Makine','Sökülme Tarihi','Son Güncelleme'];
        for (const k of keys) {
          const td = document.createElement('td');
          td.textContent = row[k] || '';
          tr.appendChild(td);
        }
        const actions = document.createElement('td');
        actions.className = 'table-actions';
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Düzenle';
        editBtn.className = 'secondary';
        editBtn.onclick = () => showModal(kind, row);
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Sil';
        delBtn.onclick = () => deleteRow(kind, row.id);
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        tr.appendChild(actions);
        body.appendChild(tr);
      }
    }

    async function deleteRow(kind, id) {
      if (!confirm('Silmek istediğinize emin misiniz?')) return;
      await fetch('/api/' + (kind === 'spindle' ? 'spindles' : 'yedek') + '/' + id, { method: 'DELETE' });
      loadTables();
    }

    function attachEvents() {
      document.querySelectorAll('.tab-btn').forEach((btn) => btn.onclick = () => switchTab(btn.dataset.tab));
      document.getElementById('spindle-add').onclick = () => showModal('spindle');
      document.getElementById('yedek-add').onclick = () => showModal('yedek');
      document.getElementById('spindle-search').addEventListener('input', () => loadTables());
      document.getElementById('yedek-search').addEventListener('input', () => loadTables());
      document.getElementById('export-btn').addEventListener('click', async () => {
        const res = await fetch('/api/export', { method: 'POST' });
        const data = await res.json();
        document.getElementById('export-msg').textContent = data.ok ? 'takip_export.csv oluşturuldu.' : 'Hata';
        setTimeout(() => document.getElementById('export-msg').textContent = '', 2500);
      });
    }

    function unlockApp() {
      document.querySelector('.login-mask').style.display = 'none';
      switchTab('spindle');
      attachEvents();
      loadTables();
    }

    function bindLogin() {
      const form = document.getElementById('login-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = form.querySelector('[name="user"]').value.trim();
        const pass = form.querySelector('[name="pass"]').value.trim();
        if (user === '${LOGIN_USER}' && pass === '${LOGIN_PASS}') {
          unlockApp();
        } else {
          alert('Kullanıcı adı veya şifre hatalı');
        }
      });
    }

    bindLogin();
  `;

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Claudsys – STS Web</title>
<style>${style}</style>
</head>
<body>
  <header>
    <div class="title">STS-SpindleTakipSistemi (Web)</div>
    <div style="text-align:center; font-weight:600;">Tarayıcıdan Spindle & Yedek Yönetimi</div>
    <div id="clock" class="clock"></div>
  </header>
  <div class="login-mask">
    <div class="login-card">
      <h1>Giriş Ekranı</h1>
      <form id="login-form" style="display:grid; gap:10px;">
        <div>
          <label>Kullanıcı Adı</label>
          <input name="user" required />
        </div>
        <div>
          <label>Şifre</label>
          <input type="password" name="pass" required />
        </div>
        <button type="submit">Giriş</button>
      </form>
      <div class="login-footer">Created by: Arda UÇAK</div>
    </div>
  </div>
  <div class="container">
    <div class="card">
      <div class="tabs">
        <button class="tab-btn active" data-tab="spindle">Spindle Takip Sistemi</button>
        <button class="tab-btn" data-tab="yedek">Yedek Takip Sistemi</button>
      </div>
      <div class="tab-panel" data-tab="spindle">
        <div class="section-header">
          <div><strong>Spindle Listesi</strong></div>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <label>Referans ID:</label>
            <input id="spindle-search" placeholder="Ara" />
            <button id="spindle-add">Spindle Ekle</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>İD</th><th>Referans ID</th><th>Çalışma Saati</th><th>Takılı Olduğu Makine</th><th>Makinaya Takıldığı Tarih</th><th>Son Güncelleme</th><th>İşlemler</th>
            </tr>
          </thead>
          <tbody id="spindle-body"></tbody>
        </table>
      </div>
      <div class="tab-panel" data-tab="yedek" style="display:none;">
        <div class="section-header">
          <div><strong>Yedek Listesi</strong></div>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <label>Referans ID:</label>
            <input id="yedek-search" placeholder="Ara" />
            <button id="yedek-add">Yedek Ekle</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>İD</th><th>Referans ID</th><th>Açıklama</th><th>Tamirde mi</th><th>Bakıma Gönderilme</th><th>Geri Dönme</th><th>Söküldüğü Makine</th><th>Sökülme Tarihi</th><th>Son Güncelleme</th><th>İşlemler</th>
            </tr>
          </thead>
          <tbody id="yedek-body"></tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="section-header">
        <div><strong>Excel'e Aktar (CSV)</strong></div>
        <button id="export-btn">Dışa Aktar</button>
      </div>
      <div id="export-msg" class="message"></div>
    </div>
  </div>
<script>${script}</script>
</body>
</html>`;
}

function startServer(port) {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

    if (pathname.startsWith('/api/')) {
      return handleApi(req, res);
    }

    if (pathname === '/' || pathname === '/launch') {
      return sendText(res, 200, htmlPage(port), 'text/html; charset=utf-8');
    }

    return sendText(res, 200, htmlPage(port), 'text/html; charset=utf-8');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} kullanımda, ${port + 1} deneniyor...`);
      startServer(port + 1);
    } else {
      console.error('Sunucu hatası:', err);
    }
  });

  server.listen(port, HOST, () => {
    console.log(`Claudsys web arayüzü http://${HOST}:${port} üzerinde hazır.`);
  });
}

startServer(DEFAULT_PORT);
