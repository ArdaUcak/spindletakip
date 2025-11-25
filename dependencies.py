"""Dependency helper for STS application.

This script validates runtime prerequisites and installs any pip
packages if they are ever added. Currently, the app uses only the
standard library and Tkinter bundled with Python.
"""

from __future__ import annotations

import subprocess
import sys

REQUIRED_PACKAGES: list[str] = []


def ensure_tkinter_available() -> None:
    try:
        import tkinter  # noqa: F401
    except ImportError as exc:  # pragma: no cover - runtime check
        raise SystemExit(
            "Tkinter is required but not installed. "
            "Please install your OS-specific Tk bindings (e.g., 'sudo apt install python3-tk')."
        ) from exc


def install_packages(packages: list[str]) -> None:
    if not packages:
        print("No pip packages to install for this project.")
        return

    command = [sys.executable, "-m", "pip", "install", *packages]
    print("Running:", " ".join(command))
    subprocess.check_call(command)


def main() -> None:
    ensure_tkinter_available()
    install_packages(REQUIRED_PACKAGES)
    print("All dependencies are satisfied.")


if __name__ == "__main__":
    main()
