# Đọc Excel học viên, lấy đường dẫn ảnh trên gplx_csdt,
# xem ảnh gốc cạnh ảnh nền trắng, rồi backup và đổi nền.
#
# Chạy: python tools/doi_nen_anh.py

from __future__ import annotations

import io
import os
import queue
import re
import subprocess
import sys
import threading
import zipfile
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

import tkinter as tk
import tkinter.font as tkfont
from tkinter import filedialog, messagebox, ttk

REQUIRED_PACKAGES = (
    ("numpy", "numpy"),
    ("openpyxl", "openpyxl"),
    ("pyodbc", "pyodbc"),
    ("PIL", "Pillow"),
)


def probe_libraries() -> list[dict]:
    checks = []
    for module_name, pip_name in REQUIRED_PACKAGES:
        try:
            module = __import__(module_name)
            version = getattr(module, "__version__", "")
            if not version:
                from importlib.metadata import version as package_version
                version = package_version(pip_name)
            checks.append({"name": pip_name, "ok": True, "detail": version or "đã cài", "pip": pip_name})
        except Exception as error:
            checks.append({"name": pip_name, "ok": False, "detail": str(error).split(":")[0], "pip": pip_name})
    try:
        import pyodbc
        drivers = list(pyodbc.drivers())
        chosen = next((item for item in ("ODBC Driver 18 for SQL Server", "ODBC Driver 17 for SQL Server") if item in drivers), "")
        checks.append({
            "name": "ODBC Driver SQL Server",
            "ok": bool(chosen),
            "detail": chosen or "chưa có Driver 17 hoặc 18",
            "pip": "",
        })
    except Exception:
        checks.append({"name": "ODBC Driver SQL Server", "ok": False, "detail": "cần pyodbc trước", "pip": ""})
    return checks


def bind_libraries():
    global np, openpyxl, pyodbc, Image, ImageTk
    import numpy as np
    import openpyxl
    import pyodbc
    from PIL import Image, ImageTk


try:
    bind_libraries()
except Exception:
    np = openpyxl = pyodbc = Image = ImageTk = None

# Mã khóa trên Excel (CSDL mới) -> mã khóa hồ sơ trên gplx_csdt.
COURSE_ALIAS = {
    "79106K260002": "79106K26B0112",
    "79106K260003": "79106K26B0113",
    "79106K260004": "79106K26B015",
    "79106K260005": "79106K26B016",
    "79106K260007": "79106K26B0114",
    "79106K26B01002": "79106K26B0102",
}

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def sql_driver() -> str:
    import pyodbc
    drivers = list(pyodbc.drivers())
    for name in ("ODBC Driver 18 for SQL Server", "ODBC Driver 17 for SQL Server"):
        if name in drivers:
            return name
    raise RuntimeError("Máy chưa có ODBC Driver 17 hoặc 18 for SQL Server.")


def connect_db():
    import pyodbc
    env = load_env(ENV_PATH)
    server = env.get("SQL_SERVER_NAME", "")
    user = env.get("SQL_USERNAME", "")
    password = env.get("SQL_PASSWORD", "")
    if not server or not user or not password:
        raise RuntimeError(f"Thiếu SQL_SERVER_NAME / SQL_USERNAME / SQL_PASSWORD trong {ENV_PATH}")
    password = password.replace("}", "}}")
    conn_str = (
        f"DRIVER={{{sql_driver()}}};"
        f"SERVER={server};"
        "DATABASE=gplx_csdt;"
        f"UID={user};"
        f"PWD={{{password}}};"
        "TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str, timeout=20)


def norm_header(value) -> str:
    return " ".join(str(value or "").strip().upper().split())


def cell_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    if isinstance(value, int):
        return str(value)
    return str(value).strip()


def norm_hang(value: str) -> str:
    text = (value or "").upper().replace(".", "").replace(" ", "")
    if text in {"B01", "B.01"}:
        return "B01"
    return text


def extract_token(htkh: str) -> str:
    match = re.search(r"(\d{5}-\d{8,}(?:-\d+)?)", htkh or "")
    return match.group(1) if match else ""


def zip_arc_name(image_path: str) -> str:
    """Giữ thư mục gốc của ảnh, tính từ GPLX_ANH trở đi."""
    normalized = image_path.replace("/", "\\")
    marker = "GPLX_ANH\\"
    index = normalized.upper().find(marker)
    if index >= 0:
        relative = normalized[index:]
    else:
        parts = [part for part in normalized.split("\\") if part]
        relative = "\\".join(parts[-2:]) if len(parts) >= 2 else parts[-1]
    return relative.replace("\\", "/")


def read_excel(path: Path) -> list[dict]:
    book = openpyxl.load_workbook(path, data_only=True, read_only=True)
    sheet = book.active
    rows = sheet.iter_rows(values_only=True)
    header = None
    header_map = {}
    for row in rows:
        names = [norm_header(cell) for cell in row]
        if "CCCD" in names and any(name in {"KHÓA", "KHOA"} for name in names):
            header = names
            break
    if header is None:
        raise RuntimeError("Không thấy dòng tiêu đề có cột CCCD và KHÓA.")

    def column(*labels: str) -> int | None:
        for label in labels:
            if label in header:
                return header.index(label)
        return None

    idx = {
        "stt": column("STT M3", "STT"),
        "name": column("HỌ VÀ TÊN", "HO VA TEN", "HỌ TÊN"),
        "cccd": column("CCCD"),
        "khoa": column("KHÓA", "KHOA"),
        "hang": column("HẠNG THI", "HANG THI"),
        "htkh": column("HTKH"),
    }
    students = []
    for row in rows:
        cccd = cell_text(row[idx["cccd"]]) if idx["cccd"] is not None else ""
        name = cell_text(row[idx["name"]]) if idx["name"] is not None else ""
        if not cccd and not name:
            continue
        if cccd.isdigit() and len(cccd) < 12:
            cccd = cccd.zfill(12)
        students.append({
            "stt": cell_text(row[idx["stt"]]) if idx["stt"] is not None else "",
            "name": name,
            "cccd": cccd,
            "khoa": cell_text(row[idx["khoa"]]) if idx["khoa"] is not None else "",
            "hang": cell_text(row[idx["hang"]]) if idx["hang"] is not None else "",
            "htkh": cell_text(row[idx["htkh"]]) if idx["htkh"] is not None else "",
        })
    book.close()
    return students


def fetch_records(cccds: list[str]) -> dict[str, list[dict]]:
    found: dict[str, list[dict]] = {}
    if not cccds:
        return found
    conn = connect_db()
    try:
        cur = conn.cursor()
        chunk = 400
        for start in range(0, len(cccds), chunk):
            batch = cccds[start:start + chunk]
            marks = ",".join("?" for _ in batch)
            cur.execute(
                f"""
                SELECT h.MaKhoaHoc, h.MaDK, n.HoVaTen, LTRIM(RTRIM(n.SoCMT)) SoCMT,
                       h.HangDaoTao, h.DuongDanAnh
                FROM NguoiLX n
                JOIN NguoiLX_HoSo h ON n.MaDK = h.MaDK
                WHERE LTRIM(RTRIM(n.SoCMT)) IN ({marks})
                """,
                batch,
            )
            for khoa, madk, hoten, cccd, hang, path in cur.fetchall():
                key = (cccd or "").strip()
                found.setdefault(key, []).append({
                    "khoa": (khoa or "").strip(),
                    "madk": (madk or "").strip(),
                    "name": (hoten or "").strip(),
                    "hang": (hang or "").strip(),
                    "path": (path or "").strip(),
                })
    finally:
        conn.close()
    return found


def choose_record(records: list[dict], khoa: str, htkh: str, hang: str):
    if not records:
        return None, "Không thấy hồ sơ"
    token = extract_token(htkh)

    def same_course(code: str) -> list[dict]:
        return [row for row in records if row["khoa"] == code] if code else []

    exact = same_course(khoa)
    if len(exact) == 1:
        return exact[0], ""
    aliased = same_course(COURSE_ALIAS.get(khoa, ""))
    if len(aliased) == 1:
        return aliased[0], ""

    pool = exact or aliased or records
    if token:
        hit = [row for row in pool if token in row["madk"] or token in row["path"]]
        if len(hit) == 1:
            return hit[0], ""
        if len(hit) > 1:
            pool = hit

    hang_key = norm_hang(hang)
    if hang_key:
        hit = [row for row in pool if norm_hang(row["hang"]) == hang_key]
        if len(hit) == 1:
            return hit[0], ""
        if len(hit) > 1:
            pool = hit
    if len(pool) == 1:
        return pool[0], ""
    courses = ", ".join(sorted({row["khoa"] for row in pool}))
    return None, f"Nhiều hồ sơ: {courses}"


@dataclass
class Student:
    stt: str
    name: str
    cccd: str
    khoa_excel: str
    hang: str
    htkh: str
    name_db: str = ""
    khoa_db: str = ""
    madk: str = ""
    path: str = ""
    note: str = ""
    status: str = ""

    @property
    def ready(self) -> bool:
        return bool(self.path) and not self.note


def load_students(excel_path: Path) -> list[Student]:
    raw_rows = read_excel(excel_path)
    records = fetch_records([row["cccd"] for row in raw_rows if row["cccd"]])
    students = []
    for row in raw_rows:
        chosen, note = choose_record(records.get(row["cccd"], []), row["khoa"], row["htkh"], row["hang"])
        student = Student(
            stt=row["stt"],
            name=row["name"],
            cccd=row["cccd"],
            khoa_excel=row["khoa"],
            hang=row["hang"],
            htkh=row["htkh"],
            note=note,
        )
        if chosen:
            student.name_db = chosen["name"]
            student.khoa_db = chosen["khoa"]
            student.madk = chosen["madk"]
            student.path = chosen["path"]
            if not student.path:
                student.note = "Hồ sơ không có đường dẫn ảnh"
                student.status = "Không có ảnh"
            elif student.khoa_excel and student.khoa_excel != student.khoa_db:
                student.status = "Khác mã khóa"
            else:
                student.status = "Có ảnh"
        else:
            student.status = "Không khớp" if note.startswith("Không") else "Nhiều hồ sơ"
        students.append(student)
    return students


def _neighbors(mask: np.ndarray) -> np.ndarray:
    up = np.zeros_like(mask)
    down = np.zeros_like(mask)
    left = np.zeros_like(mask)
    right = np.zeros_like(mask)
    up[1:] = mask[:-1]
    down[:-1] = mask[1:]
    left[:, 1:] = mask[:, :-1]
    right[:, :-1] = mask[:, 1:]
    return up | down | left | right


def _dilate(mask: np.ndarray, radius: int) -> np.ndarray:
    grown = mask
    for _ in range(radius):
        grown = grown | _neighbors(grown)
    return grown


def white_background(image: Image.Image) -> tuple[Image.Image, bool]:
    """Tách nền xanh nối với mép ảnh và thay bằng trắng. Ảnh không nền xanh được giữ nguyên."""
    source = image.convert("RGB")
    arr = np.asarray(source).astype(np.int16)
    height, width = arr.shape[:2]
    red = arr[:, :, 0]
    green = arr[:, :, 1]
    blue = arr[:, :, 2]

    blueish = (blue >= 80) & (blue > red + 30) & (blue > green + 18) & (red < 190)
    border = np.zeros((height, width), dtype=bool)
    border[0, :] = border[-1, :] = border[:, 0] = border[:, -1] = True
    border_count = int(border.sum())
    if int((blueish & border).sum()) < max(20, int(border_count * 0.2)):
        return source, False

    samples = arr[blueish & border]
    if len(samples) < 10:
        return source, False
    bg = np.median(samples, axis=0).astype(np.float32)
    denom = float(bg[2] - max(bg[0], bg[1]))
    if denom < 25:
        denom = 90.0
    spill = blue.astype(np.float32) - np.maximum(red, green).astype(np.float32)
    alpha = np.clip(1.0 - spill / denom, 0.0, 1.0)

    mask = np.zeros((height, width), dtype=bool)
    seen = np.zeros((height, width), dtype=bool)
    seeds = np.argwhere(border & (alpha <= 0.35))
    pending = deque((int(y), int(x)) for y, x in seeds)
    while pending:
        y, x = pending.pop()
        if seen[y, x]:
            continue
        seen[y, x] = True
        if alpha[y, x] > 0.35:
            continue
        mask[y, x] = True
        if x > 0:
            pending.append((y, x - 1))
        if x + 1 < width:
            pending.append((y, x + 1))
        if y > 0:
            pending.append((y - 1, x))
        if y + 1 < height:
            pending.append((y + 1, x))

    for _ in range(2):
        mask = mask | (_neighbors(mask) & (alpha <= 0.22))
    if mask.mean() < 0.08:
        return source, False

    near = _dilate(mask, 8) & ~mask
    out = arr.astype(np.float32)
    out[mask] = 255

    zone = near & (alpha < 0.98)
    if np.any(zone):
        amount = alpha[zone].astype(np.float32)[:, None]
        pixels = arr[zone].astype(np.float32)
        foreground = (pixels - (1.0 - amount) * bg) / np.clip(amount, 0.05, None)
        foreground = np.clip(foreground, 0, 255)
        composite = foreground * amount + 255.0 * (1.0 - amount)
        composite[amount[:, 0] < 0.08] = 255
        out[zone] = composite

    reach = _dilate(mask, 12)
    strong = reach & (arr[:, :, 2] > 105) & (arr[:, :, 2] > arr[:, :, 0] + 20) & (arr[:, :, 2] > arr[:, :, 1] + 12)
    strong = strong & ~mask
    if np.any(strong):
        amount = alpha[strong].astype(np.float32)[:, None]
        pixels = arr[strong].astype(np.float32)
        foreground = (pixels - (1.0 - amount) * bg) / np.clip(amount, 0.05, None)
        foreground = np.clip(foreground, 0, 255)
        composite = foreground * amount + 255.0 * (1.0 - amount)
        composite[amount[:, 0] < 0.12] = 255
        out[strong] = composite

    result = np.clip(out, 0, 255)
    red_o = result[:, :, 0]
    green_o = result[:, :, 1]
    blue_o = result[:, :, 2]
    spill_left = blue_o - np.maximum(red_o, green_o)
    on_frame = np.zeros((height, width), dtype=bool)
    on_frame[:3, :] = on_frame[-3:, :] = on_frame[:, :3] = on_frame[:, -3:] = True
    despill = (spill_left > 8) & (blue_o > 40) & (on_frame | (blue_o > red_o + 15))
    dark = despill & (np.maximum(np.maximum(red_o, green_o), blue_o) < 180)
    level = np.minimum(red_o, green_o)
    result[dark, 0] = level[dark]
    result[dark, 1] = level[dark]
    result[dark, 2] = level[dark]
    bright = despill & ~dark
    cap = np.maximum(red_o, green_o)
    result[bright, 2] = cap[bright]

    white = (result[:, :, 0] > 246) & (result[:, :, 1] > 246) & (result[:, :, 2] > 246)
    touch = _dilate(white, 3) & ~white
    cyan = touch & (result[:, :, 1] > result[:, :, 0] + 8) & (np.abs(result[:, :, 1] - result[:, :, 2]) < 18)
    gray = np.maximum(result[:, :, 0], np.maximum(result[:, :, 1], result[:, :, 2]))
    result[cyan, 0] = gray[cyan]
    result[cyan, 1] = gray[cyan]
    result[cyan, 2] = gray[cyan]

    return Image.fromarray(result.astype(np.uint8), "RGB"), True


def encode_image(image: Image.Image, target: Path) -> bytes:
    suffix = target.suffix.lower()
    buffer = io.BytesIO()
    if suffix in {".jpg", ".jpeg"}:
        image.save(buffer, format="JPEG", quality=95)
    elif suffix == ".png":
        image.save(buffer, format="PNG")
    else:
        image.save(buffer, format="JPEG2000", irreversible=True, quality_mode="dB", quality_layers=[70])
    return buffer.getvalue()


def replace_one(student: Student, archive: zipfile.ZipFile, stored: set[str]) -> str:
    path = Path(student.path)
    if not path.exists():
        return "không thấy file"
    raw = path.read_bytes()
    with Image.open(io.BytesIO(raw)) as image:
        white, changed = white_background(image)
    if not changed:
        return "không phải nền xanh"
    arc = zip_arc_name(student.path)
    if arc not in stored:
        archive.writestr(arc, raw)
        stored.add(arc)
    temporary = path.with_name(path.name + ".nen-trang.tmp")
    try:
        temporary.write_bytes(encode_image(white, path))
        os.replace(temporary, path)
    except Exception:
        if temporary.exists():
            temporary.unlink()
        raise
    return "đã đổi"


BG = "#E7EEF6"
HEADER = "#0F3D5E"
CARD = "#FFFFFF"
INK = "#1B2A36"
MUTED = "#5C7080"
TEAL = "#0E7C66"
TEAL_DARK = "#0B6554"
BLUE = "#1D6FB8"
BLUE_DARK = "#185E9C"
LINE = "#D3DFEA"
SOFT = "#F4F8FB"


def paint_button(parent, text, command, kind="teal"):
    palette = {
        "teal": (TEAL, "white", TEAL_DARK),
        "blue": (BLUE, "white", BLUE_DARK),
        "ghost": ("#E4EDF6", INK, "#D3E0EC"),
    }
    bg, fg, active = palette[kind]
    button = tk.Button(
        parent, text=text, command=command, bg=bg, fg=fg, activebackground=active, activeforeground=fg,
        relief="flat", bd=0, padx=14, pady=8, cursor="hand2", font=("Segoe UI", 10, "bold"),
    )
    button._palette = palette[kind]
    return button


def set_button_enabled(button, enabled: bool):
    if enabled:
        bg, fg, active = button._palette
        button.configure(state="normal", bg=bg, fg=fg, activebackground=active)
    else:
        button.configure(state="disabled", bg="#D5DEE8", fg="#7D8B98", activebackground="#D5DEE8")


@dataclass
class App:
    root: tk.Tk
    students: list[Student] = field(default_factory=list)
    photos: list = field(default_factory=list)
    jobs: queue.Queue = field(default_factory=queue.Queue)
    busy: bool = False
    excel_path: Path | None = None
    checks: list = field(default_factory=list)

    def __post_init__(self):
        self.mode = "compare"
        self.thumbs = {}
        self.gallery_gen = 0
        self.cards = []
        self.card_slots = {}
        self.gallery_photos = []
        self.selected_index = None
        self.row_frames = {}
        self.name_font = tkfont.Font(root=self.root, family="Segoe UI", size=11)
        self.root.title("Đổi nền ảnh học viên")
        self.root.minsize(1100, 700)
        self.root.configure(bg=BG)
        self._style_tree()
        self._build()
        show_fullscreen(self.root)
        self.root.after(100, self._poll)

    def _style_tree(self):
        style = ttk.Style(self.root)
        if "clam" in style.theme_names():
            style.theme_use("clam")
        style.configure("Green.Horizontal.TProgressbar", troughcolor="#E4EDF6", background=TEAL, bordercolor="#E4EDF6", lightcolor=TEAL, darkcolor=TEAL)

    def _build(self):
        header = tk.Frame(self.root, bg=HEADER, padx=22, pady=16)
        header.pack(fill="x")
        tk.Label(header, text="Đổi nền ảnh học viên", bg=HEADER, fg="white", font=("Segoe UI", 20, "bold")).pack(anchor="w")
        tk.Label(
            header, text="Xem ảnh gốc cạnh ảnh nền trắng, rồi backup đúng thư mục cũ trước khi ghi đè.",
            bg=HEADER, fg="#D5E6F2", font=("Segoe UI", 10),
        ).pack(anchor="w", pady=(2, 0))
        ready = all(item["ok"] for item in self.checks) if self.checks else True
        pill = tk.Label(
            header,
            text="  Thư viện đã đủ  " if ready else "  Thiếu thư viện  ",
            bg="#1F8A70" if ready else "#B45309", fg="white", font=("Segoe UI", 9, "bold"),
        )
        pill.place(relx=1, rely=0.5, x=-22, anchor="e")

        toolbar = tk.Frame(self.root, bg=BG, padx=16, pady=12)
        toolbar.pack(fill="x")
        self.pick_button = paint_button(toolbar, "Chọn file Excel", self.pick_excel, "blue")
        self.pick_button.pack(side="left")
        self.excel_label = tk.Label(toolbar, text="Chưa chọn file", bg=BG, fg=MUTED, font=("Segoe UI", 10))
        self.excel_label.pack(side="left", padx=12)
        self.read_button = paint_button(toolbar, "Đọc danh sách", self.read_students, "teal")
        self.read_button.pack(side="right")
        set_button_enabled(self.read_button, False)

        switch = tk.Frame(self.root, bg=BG, padx=16)
        switch.pack(fill="x")
        self.compare_button = paint_button(switch, "So sánh một người", lambda: self._set_mode("compare"), "teal")
        self.compare_button.pack(side="left")
        self.gallery_button = paint_button(switch, "Hiện tất cả ảnh", lambda: self._set_mode("gallery"), "ghost")
        self.gallery_button.pack(side="left", padx=8)
        tk.Label(switch, text="Tìm", bg=BG, fg=MUTED, font=("Segoe UI", 10)).pack(side="left", padx=(16, 6))
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *_: self._fill_tree())
        search = tk.Entry(switch, textvariable=self.search_var, font=("Segoe UI", 10), relief="flat", width=28, bg="white", fg=INK, insertbackground=INK, highlightthickness=1, highlightbackground=LINE)
        search.pack(side="left", ipady=6, ipadx=8)

        self.body = tk.Frame(self.root, bg=BG)
        self.body.pack(fill="both", expand=True, padx=16, pady=10)
        self._build_compare()
        self._build_gallery()
        self._set_mode("compare")

        footer = tk.Frame(self.root, bg="#F8FBFE", padx=16, pady=12, highlightbackground=LINE, highlightthickness=1)
        footer.pack(fill="x", side="bottom")
        self.one_button = paint_button(footer, "Đổi nền học viên này", lambda: self.replace(False), "blue")
        self.one_button.pack(side="left")
        self.all_button = paint_button(footer, "Đổi nền tất cả và backup ZIP", lambda: self.replace(True), "teal")
        self.all_button.pack(side="left", padx=8)
        self.progress = ttk.Progressbar(footer, style="Green.Horizontal.TProgressbar", mode="determinate", length=240)
        self.progress.pack(side="left", padx=8)
        self.status_label = tk.Label(footer, text="Sẵn sàng. Hãy chọn file Excel để bắt đầu.", bg="#F8FBFE", fg=MUTED, font=("Segoe UI", 10), anchor="w")
        self.status_label.pack(side="left", fill="x", expand=True)
        set_button_enabled(self.one_button, False)
        set_button_enabled(self.all_button, False)

    def _build_compare(self):
        self.compare_page = tk.Frame(self.body, bg=BG)
        pane = ttk.Panedwindow(self.compare_page, orient="horizontal")
        pane.pack(fill="both", expand=True)

        left = tk.Frame(pane, bg=SOFT, highlightbackground=LINE, highlightthickness=1)
        left.grid_columnconfigure(0, weight=1)
        left.grid_rowconfigure(1, weight=1)
        self.list_header = tk.Frame(left, bg="#E4EDF6", highlightbackground="#E4EDF6", highlightthickness=1)
        self.list_header.grid(row=0, column=0, sticky="ew", padx=8, pady=(8, 0))
        for column, text in enumerate(("STT", "Họ tên", "CCCD", "Khóa hồ sơ", "Trạng thái")):
            tk.Label(self.list_header, text=text, bg="#E4EDF6", fg=INK, anchor="w", font=("Segoe UI", 10, "bold"), padx=8, pady=12).grid(row=0, column=column, sticky="ew")
        self.list_canvas = tk.Canvas(left, bg=SOFT, highlightthickness=0)
        list_scroll = ttk.Scrollbar(left, orient="vertical", command=self.list_canvas.yview)
        self.list_canvas.configure(yscrollcommand=list_scroll.set)
        self.list_canvas.grid(row=1, column=0, sticky="nsew", padx=8, pady=(6, 8))
        list_scroll.grid(row=1, column=1, sticky="ns", pady=(6, 8))
        self.list_inner = tk.Frame(self.list_canvas, bg=SOFT)
        self.list_window = self.list_canvas.create_window((0, 0), window=self.list_inner, anchor="nw")
        self.list_inner.bind("<Configure>", lambda _event: self.list_canvas.configure(scrollregion=self.list_canvas.bbox("all")))
        self.list_canvas.bind("<Configure>", self._on_list_resize)
        self.list_canvas.bind("<Enter>", lambda _event: self.list_canvas.bind_all("<MouseWheel>", self._on_list_wheel))
        self.list_canvas.bind("<Leave>", lambda _event: self.list_canvas.unbind_all("<MouseWheel>"))
        pane.add(left, weight=2)

        right = tk.Frame(pane, bg=BG)
        images = tk.Frame(right, bg=BG)
        images.pack(fill="both", expand=True)
        images.columnconfigure(0, weight=1)
        images.columnconfigure(1, weight=1)
        images.rowconfigure(0, weight=1)
        self.left_image = self._image_card(images, 0, "Ảnh hiện tại", BLUE, "Chọn một học viên trong danh sách")
        self.right_image = self._image_card(images, 1, "Sau khi đổi nền trắng", TEAL, "Ảnh nền trắng sẽ hiện ở đây")
        self.info_label = tk.Label(right, text="Ảnh gốc ở bên trái, ảnh nền trắng ở bên phải.", bg=BG, fg=MUTED, font=("Segoe UI", 10), justify="left", anchor="w")
        self.info_label.pack(fill="x", pady=(8, 0))
        pane.add(right, weight=3)

    def _image_card(self, parent, column, title, color, placeholder):
        card = tk.Frame(parent, bg=CARD, highlightbackground=LINE, highlightthickness=1)
        card.grid(row=0, column=column, sticky="nsew", padx=6)
        bar = tk.Frame(card, bg=color, height=8)
        bar.pack(fill="x")
        tk.Label(card, text=title, bg=CARD, fg=INK, font=("Segoe UI", 13, "bold")).pack(anchor="w", padx=14, pady=(10, 0))
        holder = tk.Label(card, text=placeholder, bg=SOFT, fg=MUTED, font=("Segoe UI", 11), justify="center")
        holder.pack(fill="both", expand=True, padx=14, pady=14)
        return holder

    def _build_gallery(self):
        self.gallery_page = tk.Frame(self.body, bg=BG)
        caption = tk.Frame(self.gallery_page, bg=BG)
        caption.pack(fill="x", pady=(0, 8))
        tk.Label(caption, text="Mỗi thẻ có hai ảnh: bên trái là ảnh gốc, bên phải là nền trắng. Bấm một thẻ để xem lớn.", bg=BG, fg=MUTED, font=("Segoe UI", 10)).pack(side="left")
        self.gallery_canvas = tk.Canvas(self.gallery_page, bg=BG, highlightthickness=0)
        gallery_scroll = ttk.Scrollbar(self.gallery_page, orient="vertical", command=self.gallery_canvas.yview)
        self.gallery_canvas.configure(yscrollcommand=gallery_scroll.set)
        gallery_scroll.pack(side="right", fill="y")
        self.gallery_canvas.pack(side="left", fill="both", expand=True)
        self.gallery_inner = tk.Frame(self.gallery_canvas, bg=BG)
        self.gallery_window = self.gallery_canvas.create_window((0, 0), window=self.gallery_inner, anchor="nw")
        self.gallery_inner.bind("<Configure>", lambda _e: self.gallery_canvas.configure(scrollregion=self.gallery_canvas.bbox("all")))
        self.gallery_canvas.bind("<Configure>", self._on_gallery_resize)
        self.gallery_canvas.bind("<Enter>", lambda _e: self.gallery_canvas.bind_all("<MouseWheel>", self._on_gallery_wheel))
        self.gallery_canvas.bind("<Leave>", lambda _e: self.gallery_canvas.unbind_all("<MouseWheel>"))

    def _on_gallery_wheel(self, event):
        self.gallery_canvas.yview_scroll(int(-event.delta / 120), "units")

    def _on_gallery_resize(self, _event):
        self.gallery_canvas.itemconfigure(self.gallery_window, width=self.gallery_canvas.winfo_width())
        self._layout_gallery()

    def _set_mode(self, mode: str):
        self.mode = mode
        self.compare_page.pack_forget()
        self.gallery_page.pack_forget()
        if mode == "gallery":
            self.gallery_page.pack(fill="both", expand=True)
            self.compare_button.configure(bg="#E4EDF6", fg=INK, activebackground="#D3E0EC")
            self.gallery_button.configure(bg=TEAL, fg="white", activebackground=TEAL_DARK)
            self._rebuild_gallery()
            self._load_gallery()
        else:
            self.compare_page.pack(fill="both", expand=True)
            self.compare_button.configure(bg=TEAL, fg="white", activebackground=TEAL_DARK)
            self.gallery_button.configure(bg="#E4EDF6", fg=INK, activebackground="#D3E0EC")
            self.gallery_canvas.unbind_all("<MouseWheel>")
            self.gallery_gen += 1

    def _rebuild_gallery(self):
        for child in self.gallery_inner.winfo_children():
            child.destroy()
        self.cards = []
        self.card_slots = {}
        self.gallery_photos.clear()
        if not self.students:
            tk.Label(self.gallery_inner, text="Chưa có danh sách. Hãy chọn Excel và bấm Đọc danh sách.", bg=BG, fg=MUTED, font=("Segoe UI", 12)).pack(anchor="w", pady=20)
            return
        for index, student in enumerate(self.students):
            card = tk.Frame(self.gallery_inner, bg=CARD, highlightbackground=LINE, highlightthickness=1, padx=10, pady=10)
            tk.Label(card, text=student.name, bg=CARD, fg=INK, font=("Segoe UI", 10, "bold"), anchor="w").pack(fill="x")
            tk.Label(card, text=f"{student.cccd}   ·   {student.khoa_db or student.khoa_excel or '—'}", bg=CARD, fg=MUTED, font=("Segoe UI", 8), anchor="w").pack(fill="x")
            row = tk.Frame(card, bg=CARD)
            row.pack(pady=8)
            original = tk.Label(row, text="Gốc", bg=SOFT, fg=MUTED, width=16, height=9, font=("Segoe UI", 9))
            white = tk.Label(row, text="Nền trắng", bg="#E7F6F1", fg=TEAL, width=16, height=9, font=("Segoe UI", 9))
            original.pack(side="left", padx=(0, 6))
            white.pack(side="left")
            badge = tk.Label(card, text=student.status or "Đang chờ", bg=CARD, fg=MUTED, font=("Segoe UI", 8), anchor="w")
            badge.pack(fill="x")
            self._bind_card(card, index)
            self.cards.append(card)
            self.card_slots[index] = (original, white, badge)
            cached = self.thumbs.get(student.cccd)
            if cached:
                self._apply_thumb(index, cached)
        self._layout_gallery()

    def _bind_card(self, widget, index: int):
        widget.bind("<Button-1>", lambda _event, item=index: self._open_from_gallery(item))
        for child in widget.winfo_children():
            self._bind_card(child, index)

    def _layout_gallery(self):
        if not self.cards:
            return
        term = self.search_var.get().strip().lower() if hasattr(self, "search_var") else ""
        visible = []
        for index, card in enumerate(self.cards):
            student = self.students[index]
            haystack = f"{student.name} {student.cccd} {student.khoa_db} {student.khoa_excel}".lower()
            if term and term not in haystack:
                card.grid_remove()
                continue
            visible.append(card)
        width = max(self.gallery_canvas.winfo_width(), 640)
        columns = max(1, width // 300)
        for index, card in enumerate(visible):
            card.grid(row=index // columns, column=index % columns, padx=8, pady=8, sticky="n")
        for column in range(columns):
            self.gallery_inner.grid_columnconfigure(column, weight=1)

    def _open_from_gallery(self, index: int):
        self._set_mode("compare")
        self._choose_row(index)

    def _load_gallery(self):
        pending = [(index, student) for index, student in enumerate(self.students) if student.ready and student.cccd not in self.thumbs]
        if not pending:
            return
        self.gallery_gen += 1
        generation = self.gallery_gen
        self.progress.configure(maximum=len(pending), value=0)

        def work():
            for done, (index, student) in enumerate(pending, 1):
                if generation != self.gallery_gen:
                    return
                self.jobs.put(("gallery-progress", done, len(pending), student.name))
                try:
                    with Image.open(student.path) as image:
                        original = image.convert("RGB")
                    white, changed = white_background(original)
                    original.thumbnail((150, 200), Image.Resampling.LANCZOS)
                    white.thumbnail((150, 200), Image.Resampling.LANCZOS)
                    self.jobs.put(("thumb", generation, index, student.cccd, original, white, changed, ""))
                except Exception as error:
                    self.jobs.put(("thumb", generation, index, student.cccd, None, None, False, str(error)))
            self.jobs.put(("gallery-done", generation, len(pending)))

        threading.Thread(target=work, daemon=True).start()

    def _apply_thumb(self, index: int, cached: dict):
        original_label, white_label, badge = self.card_slots[index]
        if cached.get("error"):
            original_label.configure(text="Không mở được", image="")
            white_label.configure(text="", image="")
            badge.configure(text="Lỗi file", fg="#B42318")
            return
        original_label.configure(image=cached["original"], text="")
        white_label.configure(image=cached["white"], text="")
        badge.configure(text="Đã tách nền xanh" if cached["changed"] else "Không phải nền xanh", fg=TEAL if cached["changed"] else MUTED)

    def pick_excel(self):
        selected = filedialog.askopenfilename(
            title="Chọn file Excel",
            filetypes=[("Excel", "*.xlsx *.xlsm"), ("Tất cả", "*.*")],
        )
        if not selected:
            return
        self.excel_path = Path(selected)
        self.excel_label.configure(text=self.excel_path.name, fg=INK)
        set_button_enabled(self.read_button, True)

    def read_students(self):
        if not self.excel_path or self.busy:
            return
        self._set_busy(True, "Đang đọc Excel và cơ sở dữ liệu...")
        excel = self.excel_path

        def work():
            try:
                students = load_students(excel)
                self.jobs.put(("students", students))
            except Exception as error:
                self.jobs.put(("error", str(error)))

        threading.Thread(target=work, daemon=True).start()

    def _shorten_name(self, name: str, pixel_width: int) -> str:
        if self.name_font.measure(name) <= pixel_width:
            return name
        suffix = "...."
        if self.name_font.measure(suffix) >= pixel_width:
            return suffix
        low, high = 0, len(name)
        best = suffix
        while low <= high:
            mid = (low + high) // 2
            candidate = name[:mid].rstrip() + suffix
            if self.name_font.measure(candidate) <= pixel_width:
                best = candidate
                low = mid + 1
            else:
                high = mid - 1
        return best

    def _on_list_wheel(self, event):
        self.list_canvas.yview_scroll(int(-event.delta / 120), "units")

    def _on_list_resize(self, event):
        self.list_canvas.itemconfigure(self.list_window, width=event.width)
        self._sync_list_columns(event.width)

    def _sync_list_columns(self, width=None):
        if width is None:
            width = self.list_canvas.winfo_width()
        usable = max(int(width) - 2, 120)
        weights = (8, 28, 22, 24, 18)
        total = sum(weights)
        sizes = [max(56, usable * weight // total) for weight in weights]
        sizes[-1] = max(56, usable - sum(sizes[:-1]))
        self.column_sizes = sizes
        frames = [self.list_header, *self.row_frames.values()]
        for frame in frames:
            for column, size in enumerate(sizes):
                frame.grid_columnconfigure(column, minsize=size, weight=0)
        name_width = max(20, sizes[1] - 28)
        for row in self.row_frames.values():
            name_label = row.grid_slaves(row=0, column=1)
            if not name_label:
                continue
            label = name_label[0]
            label.configure(text=self._shorten_name(getattr(label, "_full_name", label.cget("text")), name_width))

    def _fill_tree(self):
        for child in self.list_inner.winfo_children():
            child.destroy()
        self.row_frames = {}
        term = self.search_var.get().strip().lower()
        shown = 0
        for index, student in enumerate(self.students):
            haystack = f"{student.name} {student.cccd} {student.khoa_db} {student.khoa_excel}".lower()
            if term and term not in haystack:
                continue
            base = "#F7FBFE" if shown % 2 else "#FFFFFF"
            row = tk.Frame(self.list_inner, bg=base, highlightbackground=LINE, highlightthickness=1)
            row.pack(fill="x", pady=(0, 10))
            row._base = base
            values = (student.stt, student.name, student.cccd, student.khoa_db or student.khoa_excel, student.status)
            for column, value in enumerate(values):
                label = tk.Label(row, text=value, bg=base, fg=INK, anchor="w", font=self.name_font, padx=8, pady=12)
                if column == 1:
                    label._full_name = value
                label.grid(row=0, column=column, sticky="ew")
                label.bind("<Button-1>", lambda _event, item=index: self._choose_row(item))
            row.bind("<Button-1>", lambda _event, item=index: self._choose_row(item))
            self.row_frames[index] = row
            shown += 1
        self._sync_list_columns()
        self._paint_rows()
        if hasattr(self, "cards"):
            self._layout_gallery()

    def _paint_rows(self):
        for index, row in self.row_frames.items():
            selected = index == self.selected_index
            color = "#D9EBF8" if selected else row._base
            row.configure(bg=color, highlightbackground=BLUE if selected else LINE, highlightthickness=1)
            for child in row.winfo_children():
                child.configure(bg=color)

    def _choose_row(self, index: int):
        self.selected_index = index
        self._paint_rows()
        self._reveal_row(index)
        self._on_select()

    def _reveal_row(self, index: int):
        row = self.row_frames.get(index)
        if row is None:
            return
        self.list_inner.update_idletasks()
        total = max(self.list_inner.winfo_height(), 1)
        self.list_canvas.yview_moveto(row.winfo_y() / total)

    def _selected(self) -> Student | None:
        if self.selected_index is None or self.selected_index >= len(self.students):
            return None
        return self.students[self.selected_index]

    def _on_select(self, _event=None):
        student = self._selected()
        if student is None or self.busy:
            return
        self._show_student_text(student)
        if not student.path:
            self._clear_images(student.note or "Không có đường dẫn ảnh")
            return
        self.left_image.configure(text="Đang tải ảnh...", image="")
        self.right_image.configure(text="Đang tách nền...", image="")
        self.photos.clear()

        def work():
            try:
                with Image.open(student.path) as image:
                    original = image.convert("RGB")
                white, changed = white_background(original)
                self.jobs.put(("images", student.cccd, original, white, changed))
            except Exception as error:
                self.jobs.put(("image-error", student.cccd, str(error)))

        threading.Thread(target=work, daemon=True).start()

    def _show_student_text(self, student: Student):
        course = student.khoa_db or "—"
        extra = ""
        if student.khoa_excel and student.khoa_db and student.khoa_excel != student.khoa_db:
            extra = f"\nExcel ghi {student.khoa_excel}, hồ sơ nằm ở {student.khoa_db}."
        if student.note:
            extra += f"\n{student.note}"
        self.info_label.configure(
            text=f"{student.name}  |  CCCD {student.cccd}  |  Khóa {course}  |  Mã ĐK {student.madk or '—'}"
            f"\n{student.path or 'Chưa có đường dẫn ảnh'}{extra}"
        )

    def _fit(self, image: Image.Image) -> ImageTk.PhotoImage:
        copy = image.copy()
        copy.thumbnail((460, 620), Image.Resampling.LANCZOS)
        photo = ImageTk.PhotoImage(copy)
        self.photos.append(photo)
        return photo

    def _show_pair(self, original: Image.Image, white: Image.Image, changed: bool):
        self.photos.clear()
        self.left_image.configure(image=self._fit(original), text="")
        self.right_image.configure(image=self._fit(white), text="")
        if changed:
            self.status_label.configure(text="Bên trái là ảnh gốc, bên phải là nền trắng. Chưa ghi đè file.")
        else:
            self.status_label.configure(text="Ảnh này không phải nền xanh, bản xem trước giữ nguyên.")

    def _clear_images(self, message: str):
        self.photos.clear()
        self.left_image.configure(image="", text=message)
        self.right_image.configure(image="", text="Chưa có ảnh nền trắng")

    def replace(self, all_students: bool):
        if self.busy:
            return
        if all_students:
            targets = [student for student in self.students if student.ready]
        else:
            student = self._selected()
            if student is None:
                messagebox.showinfo("Đổi nền", "Chọn một học viên trước.")
                return
            if not student.ready:
                messagebox.showinfo("Đổi nền", student.note or "Học viên này chưa có đường dẫn ảnh.")
                return
            targets = [student]
        if not targets:
            messagebox.showinfo("Đổi nền", "Không có học viên nào có đường dẫn ảnh.")
            return
        if not messagebox.askyesno(
            "Đổi nền",
            f"Backup ảnh gốc của {len(targets)} học viên vào một file ZIP, giữ đúng thư mục gốc.\n"
            "Sau đó ghi đè các ảnh nền xanh bằng ảnh nền trắng.\n\nTiếp tục?",
        ):
            return
        zip_path = filedialog.asksaveasfilename(
            title="Chọn nơi lưu file ZIP backup",
            defaultextension=".zip",
            initialfile=f"BACKUP_NEN_XANH_{datetime.now():%Y%m%d_%H%M%S}.zip",
            filetypes=[("ZIP", "*.zip")],
        )
        if not zip_path:
            return
        self._set_busy(True, "Đang backup và đổi nền...")
        self.progress.configure(maximum=len(targets), value=0)

        def work():
            replaced = 0
            skipped = 0
            missing = 0
            errors = []
            stored: set[str] = set()
            backup_path = zip_path
            try:
                with zipfile.ZipFile(backup_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                    for index, student in enumerate(targets, 1):
                        self.jobs.put(("progress", index, len(targets), student.name))
                        try:
                            result = replace_one(student, archive, stored)
                        except Exception as error:
                            errors.append(f"{student.name}: {error}")
                            continue
                        if result == "đã đổi":
                            replaced += 1
                        elif result == "không thấy file":
                            missing += 1
                        else:
                            skipped += 1
                if not stored:
                    Path(backup_path).unlink(missing_ok=True)
                    backup_path = ""
                self.jobs.put(("done", backup_path, replaced, skipped, missing, errors))
            except Exception as error:
                self.jobs.put(("error", str(error)))

        threading.Thread(target=work, daemon=True).start()

    def _set_busy(self, busy: bool, status: str):
        self.busy = busy
        set_button_enabled(self.pick_button, not busy)
        set_button_enabled(self.read_button, (not busy) and bool(self.excel_path))
        set_button_enabled(self.one_button, (not busy) and bool(self.students))
        set_button_enabled(self.all_button, (not busy) and bool(self.students))
        self.status_label.configure(text=status)

    def _poll(self):
        try:
            while True:
                message = self.jobs.get_nowait()
                kind = message[0]
                if kind == "students":
                    self.students = message[1]
                    self.thumbs.clear()
                    self._fill_tree()
                    self._rebuild_gallery()
                    ready = sum(1 for student in self.students if student.ready)
                    self._set_busy(False, f"Đã đọc {len(self.students)} học viên, {ready} người có đường dẫn ảnh.")
                    if self.mode == "gallery":
                        self._load_gallery()
                elif kind == "images":
                    _kind, cccd, original, white, changed = message
                    current = self._selected()
                    if current and current.cccd == cccd:
                        self._show_pair(original, white, changed)
                        if changed:
                            self.status_label.configure(text="Đang xem ảnh gốc và ảnh nền trắng.")
                elif kind == "image-error":
                    _kind, cccd, text = message
                    current = self._selected()
                    if current and current.cccd == cccd:
                        self._clear_images("Không mở được ảnh")
                        self.status_label.configure(text=text)
                elif kind == "thumb":
                    generation, index, cccd, original, white, changed, error = message[1:]
                    if generation != self.gallery_gen:
                        continue
                    if error or original is None or white is None:
                        self.thumbs[cccd] = {"error": error or "Không mở được ảnh"}
                    else:
                        original_photo = ImageTk.PhotoImage(original)
                        white_photo = ImageTk.PhotoImage(white)
                        self.gallery_photos.extend((original_photo, white_photo))
                        self.thumbs[cccd] = {"original": original_photo, "white": white_photo, "changed": changed, "error": ""}
                    if index in self.card_slots:
                        self._apply_thumb(index, self.thumbs[cccd])
                elif kind == "gallery-progress":
                    _kind, done, total, name = message
                    self.progress.configure(maximum=total, value=done)
                    self.status_label.configure(text=f"Đang tải ảnh {done}/{total}  ·  {name}")
                elif kind == "gallery-done":
                    generation, total = message[1], message[2]
                    if generation == self.gallery_gen:
                        shown = sum(1 for item in self.thumbs.values() if not item.get("error"))
                        self.status_label.configure(text=f"Đã hiện {shown} ảnh trên lưới. Bấm một thẻ để xem lớn.")
                elif kind == "progress":
                    _kind, index, total, name = message
                    self.progress.configure(value=index)
                    self.status_label.configure(text=f"{index}/{total}  {name}")
                elif kind == "done":
                    _kind, zip_path, replaced, skipped, missing, errors = message
                    self._set_busy(False, f"Đã đổi {replaced} ảnh. ZIP: {zip_path}")
                    detail = f"Đã đổi nền: {replaced}\nKhông phải nền xanh: {skipped}\nKhông thấy file: {missing}"
                    if errors:
                        detail += "\n\nLỗi:\n" + "\n".join(errors[:8])
                    detail += f"\n\nBackup: {zip_path}" if zip_path else "\n\nKhông có ảnh nền xanh nên không tạo ZIP."
                    messagebox.showinfo("Xong", detail)
                elif kind == "error":
                    self._set_busy(False, "Có lỗi")
                    messagebox.showerror("Lỗi", message[1])
        except queue.Empty:
            pass
        self.root.after(100, self._poll)


def install_missing(packages: list[str]):
    subprocess.check_call([sys.executable, "-m", "pip", "install", *packages])
    os.execv(sys.executable, [sys.executable, *sys.argv])


def show_fullscreen(root: tk.Tk):
    try:
        root.state("zoomed")
    except tk.TclError:
        root.attributes("-fullscreen", True)


def show_library_gate(root: tk.Tk, checks: list[dict]):
    for child in root.winfo_children():
        child.destroy()
    root.title("Đổi nền ảnh học viên")
    root.minsize(560, 480)
    root.configure(bg=BG)
    show_fullscreen(root)
    header = tk.Frame(root, bg=HEADER, padx=24, pady=18)
    header.pack(fill="x")
    tk.Label(header, text="Kiểm tra thư viện", bg=HEADER, fg="white", font=("Segoe UI", 20, "bold")).pack(anchor="w")
    tk.Label(header, text="Phần mềm kiểm tra các thư viện cần dùng trước khi vào màn hình chính.", bg=HEADER, fg="#D5E6F2", font=("Segoe UI", 10)).pack(anchor="w", pady=(4, 0))

    body = tk.Frame(root, bg=BG, padx=24, pady=16)
    body.pack(fill="both", expand=True)
    missing = []
    for item in checks:
        row = tk.Frame(body, bg=CARD, highlightbackground=LINE, highlightthickness=1, padx=14, pady=10)
        row.pack(fill="x", pady=4)
        mark = "Đủ" if item["ok"] else "Thiếu"
        color = TEAL if item["ok"] else "#B42318"
        tk.Label(row, text=mark, bg=color, fg="white", font=("Segoe UI", 9, "bold"), width=6).pack(side="left")
        tk.Label(row, text=item["name"], bg=CARD, fg=INK, font=("Segoe UI", 11, "bold")).pack(side="left", padx=12)
        tk.Label(row, text=item["detail"], bg=CARD, fg=MUTED, font=("Segoe UI", 10)).pack(side="right")
        if not item["ok"] and item["pip"]:
            missing.append(item["pip"])

    footer = tk.Frame(root, bg="#F8FBFE", padx=24, pady=14)
    footer.pack(fill="x")
    if missing:
        tk.Label(footer, text="Bấm cài để bổ sung thư viện Python còn thiếu. ODBC Driver phải cài riêng nếu dòng đó báo thiếu.", bg="#F8FBFE", fg=MUTED, font=("Segoe UI", 9), wraplength=420, justify="left").pack(side="left")
        paint_button(footer, "Cài thư viện còn thiếu", lambda: install_missing(missing), "teal").pack(side="right")
        return
    tk.Label(footer, text="Các thư viện đã sẵn sàng.", bg="#F8FBFE", fg=TEAL, font=("Segoe UI", 10, "bold")).pack(side="left")
    paint_button(footer, "Vào chương trình", lambda: open_workspace(root, checks), "teal").pack(side="right")
    root.after(1200, lambda: open_workspace(root, checks) if root.winfo_exists() and not getattr(root, "_opened", False) else None)


def open_workspace(root: tk.Tk, checks: list[dict]):
    if getattr(root, "_opened", False):
        return
    root._opened = True
    for child in root.winfo_children():
        child.destroy()
    root.minsize(1100, 700)
    bind_libraries()
    App(root, checks=checks)
    show_fullscreen(root)


def main():
    try:
        from ctypes import windll
        windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        pass
    root = tk.Tk()
    show_library_gate(root, probe_libraries())
    root.mainloop()


if __name__ == "__main__":
    main()
