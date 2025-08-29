# app/main.py
import sys, os, subprocess
from PyQt6.QtWidgets import QApplication, QMainWindow, QWidget, QHBoxLayout
from PyQt6 import uic
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtCore import QUrl, QTimer
from PyQt6.QtWebChannel import QWebChannel

from app.lora_bridge import LoraBridge
from app.control import GroundController

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB_DIR = os.path.join(BASE_DIR, "web")

os.environ["QTWEBENGINE_DICTIONARIES_PATH"] = "/dev/null"

# Nên load config từ file thay vì hardcode
import tomllib
from pathlib import Path

def load_config():
    config_path = Path(__file__).parent.parent / "config" / "settings.toml"
    if config_path.exists():
        with open(config_path, "rb") as f:
            return tomllib.load(f)
    return {}

config = load_config()
port = config.get("port", "COM5")
baudrate = config.get("baudrate", 9600)

# Nên dùng context manager cho HTTP server
from contextlib import contextmanager

@contextmanager
def http_server(web_dir, port=8000):
    process = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port)],
        cwd=web_dir,
        stdout=subprocess.DEVNULL, 
        stderr=subprocess.DEVNULL
    )
    try:
        yield process
    finally:
        process.terminate()
        process.wait(timeout=2)

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        uic.loadUi(os.path.join(BASE_DIR, "app", "ui", "main.ui"), self)

        # 1) HTTP server phục vụ thư mục web/
        self.http_process = subprocess.Popen(
            [sys.executable, "-m", "http.server", "8000"],
            cwd=WEB_DIR,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        print("HTTP server at http://localhost:8000")

        # 2) Bridge
        self.bridge = LoraBridge()

        # 3) Browser + channel
        self.browser = QWebEngineView(self)
        self.channel = QWebChannel()
        self.channel.registerObject("bridge", self.bridge)
        self.browser.page().setWebChannel(self.channel)

        # 4) Load index.html
        QTimer.singleShot(300, lambda: self.browser.load(QUrl("http://localhost:8000/index.html")))

        # 5) Replace placeholder
        placeholder = self.findChild(QWidget, "load_map_widget")
        if placeholder and placeholder.parent() and placeholder.parent().layout():
            layout = placeholder.parent().layout()
            layout.replaceWidget(placeholder, self.browser)
            placeholder.deleteLater()

        # 6) Stretch
        main_layout = self.centralWidget().layout()
        if isinstance(main_layout, QHBoxLayout):
            main_layout.setStretch(0, 0)
            main_layout.setStretch(1, 10)

        # 7) Controller
        self.controller = GroundController(port='COM5', baudrate=9600, gui_bridge=self.bridge)

        self.bridge.set_controller(self.controller)
        self.controller.connect()
        

    def closeEvent(self, event):
        if hasattr(self, 'http_process'):
            self.http_process.terminate()
            try: self.http_process.wait(timeout=2)
            except Exception: self.http_process.kill()
        event.accept()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    w = MainWindow()
    w.show()
    sys.exit(app.exec())
