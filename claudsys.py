import http.server
import os
import socket
import subprocess
import sys
import threading
from datetime import datetime

APP_SCRIPT = os.path.join(os.path.abspath(os.path.dirname(__file__)), "main.py")
DEFAULT_PORT = int(os.environ.get("CLAUDSYS_PORT", "8000"))


class LauncherState:
    def __init__(self):
        self.process = None
        self.lock = threading.Lock()

    def status(self):
        with self.lock:
            if self.process is None:
                return "idle"
            if self.process.poll() is None:
                return "running"
            self.process = None
            return "idle"

    def launch(self):
        with self.lock:
            if self.process is None or self.process.poll() is not None:
                self.process = subprocess.Popen([sys.executable, APP_SCRIPT])
                return True
            return False


state = LauncherState()


class ClaudsysHandler(http.server.BaseHTTPRequestHandler):
    def _html(self, body: str) -> bytes:
        page = f"""
        <!DOCTYPE html>
        <html lang=\"tr\">
        <head>
            <meta charset=\"UTF-8\" />
            <title>Claudsys Launcher</title>
            <style>
                body {{ font-family: Arial, sans-serif; background:#f4f4f7; color:#1f2933; margin:0; padding:0; }}
                header {{ background:#1f2933; color:#fefefe; padding:16px 24px; display:flex; justify-content:space-between; align-items:center; }}
                main {{ max-width:720px; margin:40px auto; padding:24px; background:#fff; border-radius:12px; box-shadow:0 4px 18px rgba(0,0,0,0.08); }}
                button {{ background:#2563eb; border:none; color:#fff; padding:12px 20px; font-size:16px; border-radius:8px; cursor:pointer; }}
                button:disabled {{ background:#94a3b8; cursor:not-allowed; }}
                .status {{ margin-top:16px; font-weight:600; }}
                footer {{ text-align:center; margin-top:32px; color:#52606d; font-size:14px; }}
            </style>
        </head>
        <body>
            <header>
                <div><strong>Claudsys</strong> — LAN Launcher</div>
                <div>{datetime.now().strftime('%d-%m-%Y %H:%M:%S')}</div>
            </header>
            <main>
                <h1>STS-SpindleTakipSistemi</h1>
                <p>Launch the desktop GUI on this host so others on your LAN can use it.</p>
                {body}
                <footer>Serving on {self.server.server_address[0]}:{self.server.server_address[1]}</footer>
            </main>
        </body>
        </html>
        """
        return page.encode("utf-8")

    def do_GET(self):
        status = state.status()
        button_state = "disabled" if status == "running" else ""
        message = "GUI is already running." if status == "running" else "Click launch to start the GUI." 
        body = f"""
            <form method=\"post\" action=\"/launch\">
                <button type=\"submit\" {button_state}>Launch STS GUI</button>
            </form>
            <div class=\"status\">Status: {status}</div>
            <p>{message}</p>
        """
        content = self._html(body)
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self):
        if self.path != "/launch":
            self.send_error(404)
            return
        launched = state.launch()
        if launched:
            body = "<div class=\"status\">Launched STS GUI.</div>"
        else:
            body = "<div class=\"status\">GUI already running.</div>"
        content = self._html(body)
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format, *args):  # noqa: A003
        return


def run_server(port=DEFAULT_PORT):
    server_address = ("0.0.0.0", port)
    httpd = http.server.ThreadingHTTPServer(server_address, ClaudsysHandler)
    host_ip = socket.gethostbyname(socket.gethostname())
    print(f"Claudsys running on http://{host_ip}:{port} (LAN) and http://localhost:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    run_server()
