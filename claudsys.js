const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const APP_SCRIPT = path.join(__dirname, 'main.py');
const DEFAULT_PORT = parseInt(process.env.CLAUDSYS_PORT || '8000', 10);
const PYTHON_CMD = process.env.CLAUDSYS_PYTHON || process.env.PYTHON || 'python';

let childProcess = null;

function status() {
  if (childProcess && childProcess.exitCode === null) {
    return 'running';
  }
  childProcess = null;
  return 'idle';
}

function launchGui() {
  if (status() === 'running') {
    return false;
  }
  try {
    childProcess = spawn(PYTHON_CMD, [APP_SCRIPT], { detached: true, stdio: 'ignore' });
    childProcess.unref();
    childProcess.on('exit', () => {
      childProcess = null;
    });
    childProcess.on('error', () => {
      childProcess = null;
    });
    return true;
  } catch (err) {
    console.error('Failed to launch GUI:', err);
    childProcess = null;
    return false;
  }
}

function render(body, serverAddress) {
  const now = new Date();
  const timestamp = now.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `<!DOCTYPE html>
  <html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <title>Claudsys Launcher</title>
    <style>
      body { font-family: Arial, sans-serif; background:#f4f4f7; color:#1f2933; margin:0; padding:0; }
      header { background:#1f2933; color:#fefefe; padding:16px 24px; display:flex; justify-content:space-between; align-items:center; }
      main { max-width:720px; margin:40px auto; padding:24px; background:#fff; border-radius:12px; box-shadow:0 4px 18px rgba(0,0,0,0.08); }
      button { background:#2563eb; border:none; color:#fff; padding:12px 20px; font-size:16px; border-radius:8px; cursor:pointer; }
      button:disabled { background:#94a3b8; cursor:not-allowed; }
      .status { margin-top:16px; font-weight:600; }
      footer { text-align:center; margin-top:32px; color:#52606d; font-size:14px; }
    </style>
  </head>
  <body>
    <header>
      <div><strong>Claudsys</strong> — LAN Launcher</div>
      <div>${timestamp}</div>
    </header>
    <main>
      <h1>STS-SpindleTakipSistemi</h1>
      <p>Bu makinede masaüstü GUI'yi başlatmak için tarayıcıdan tıklayın.</p>
      ${body}
      <footer>Serving on ${serverAddress}</footer>
    </main>
  </body>
  </html>`;
}

function getLanAddress(port) {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return `${net.address}:${port}`;
      }
    }
  }
  return `localhost:${port}`;
}

function handleRequest(req, res, port) {
  if (req.method === 'GET' && req.url === '/') {
    const currentStatus = status();
    const disabled = currentStatus === 'running' ? 'disabled' : '';
    const message = currentStatus === 'running' ? 'GUI zaten çalışıyor.' : 'GUI\'yi başlatmak için tıklayın.';
    const body = `
      <form method="post" action="/launch">
        <button type="submit" ${disabled}>STS GUI\'yi Başlat</button>
      </form>
      <div class="status">Durum: ${currentStatus}</div>
      <p>${message}</p>
    `;
    const html = render(body, getLanAddress(port));
    const data = Buffer.from(html, 'utf-8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': data.length,
    });
    res.end(data);
    return;
  }

  if (req.method === 'POST' && req.url === '/launch') {
    let launched = false;
    try {
      launched = launchGui();
    } catch (err) {
      console.error('Launch error:', err);
    }
    const body = `<div class="status">${launched ? 'STS GUI başlatıldı.' : 'GUI zaten çalışıyor veya başlatılamadı.'}</div>`;
    const html = render(body, getLanAddress(port));
    const data = Buffer.from(html, 'utf-8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': data.length,
    });
    res.end(data);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
}

function startServer(port = DEFAULT_PORT) {
  const server = http.createServer((req, res) => handleRequest(req, res, port));
  server.listen(port, '0.0.0.0', () => {
    console.log(`Claudsys running on http://${getLanAddress(port)} (LAN) and http://localhost:${port}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
