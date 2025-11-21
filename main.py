import csv
import os
import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime

APP_TITLE = "Takip Sistemi"
LOGIN_TITLE = "Giriş Ekranı"
USERNAME = "BAKIM"
PASSWORD = "MAXIME"
WINDOW_SIZE = "1100x650"
DATE_FORMAT = "%Y-%m-%d"


def resource_path(filename: str) -> str:
    base_path = os.path.abspath(os.path.dirname(__file__))
    return os.path.join(base_path, filename)


class DataManager:
    def __init__(self, filename, headers):
        self.filepath = resource_path(filename)
        self.headers = headers
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.filepath):
            with open(self.filepath, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=self.headers)
                writer.writeheader()

    def _read_all(self):
        with open(self.filepath, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            return list(reader)

    def _write_all(self, rows):
        with open(self.filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.headers)
            writer.writeheader()
            writer.writerows(rows)

    def _next_id(self):
        rows = self._read_all()
        if not rows:
            return 1
        return max(int(row["id"]) for row in rows) + 1

    def add_record(self, data):
        rows = self._read_all()
        data["id"] = str(self._next_id())
        rows.append(data)
        self._write_all(rows)
        return data["id"]

    def update_record(self, record_id, data):
        rows = self._read_all()
        updated = False
        for row in rows:
            if row["id"] == record_id:
                row.update(data)
                updated = True
                break
        if updated:
            self._write_all(rows)
        return updated

    def delete_record(self, record_id):
        rows = self._read_all()
        new_rows = [row for row in rows if row["id"] != record_id]
        if len(new_rows) != len(rows):
            self._write_all(new_rows)
            return True
        return False

    def search(self, **filters):
        rows = self._read_all()
        results = []
        for row in rows:
            match = True
            for key, value in filters.items():
                if value and value.strip():
                    if value.lower() not in row.get(key, "").lower():
                        match = False
                        break
            if match:
                results.append(row)
        return results

    def all_records(self):
        return self._read_all()


class MainApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title(APP_TITLE)
        self.root.geometry(WINDOW_SIZE)
        self.root.resizable(False, False)

        self.spindle_manager = DataManager(
            "spindle_data.csv",
            ["id", "Referans ID", "Çalışma Saati", "Son Güncelleme"],
        )
        self.yedek_manager = DataManager(
            "yedek_data.csv",
            [
                "id",
                "Referans ID",
                "Açıklama",
                "Tamirde mi",
                "Bakıma Gönderilme",
                "Geri Dönme",
                "Son Güncelleme",
            ],
        )

        self._build_ui()
        self._refresh_spindle_tree()
        self._refresh_yedek_tree()

    def _build_ui(self):
        notebook = ttk.Notebook(self.root)
        notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        spindle_frame = ttk.Frame(notebook)
        yedek_frame = ttk.Frame(notebook)
        notebook.add(spindle_frame, text="Spindle Takip Sistemi")
        notebook.add(yedek_frame, text="Yedek Takip Sistemi")

        self._build_spindle_tab(spindle_frame)
        self._build_yedek_tab(yedek_frame)

        export_frame = ttk.Frame(self.root)
        export_frame.pack(fill=tk.X, padx=10, pady=5)
        export_button = ttk.Button(export_frame, text="Excel'e Aktar (CSV)", command=self._export_data)
        export_button.pack(side=tk.RIGHT)

    def _build_spindle_tab(self, parent):
        form_frame = ttk.LabelFrame(parent, text="Spindle Bilgileri")
        form_frame.pack(fill=tk.X, padx=10, pady=10)

        labels = ["Referans ID", "Çalışma Saati", "Son Güncelleme"]
        self.spindle_entries = {}
        for i, label in enumerate(labels):
            ttk.Label(form_frame, text=label).grid(row=0, column=i * 2, padx=5, pady=5, sticky=tk.W)
            entry = ttk.Entry(form_frame)
            entry.grid(row=0, column=i * 2 + 1, padx=5, pady=5, sticky=tk.W)
            self.spindle_entries[label] = entry

        self.spindle_entries["Son Güncelleme"].insert(0, datetime.now().strftime(DATE_FORMAT))

        search_frame = ttk.Frame(parent)
        search_frame.pack(fill=tk.X, padx=10)
        ttk.Label(search_frame, text="Referans ID ile Ara:").pack(side=tk.LEFT, padx=5, pady=5)
        self.spindle_search_entry = ttk.Entry(search_frame)
        self.spindle_search_entry.pack(side=tk.LEFT, padx=5, pady=5)
        ttk.Button(search_frame, text="Ara", command=self._search_spindle).pack(side=tk.LEFT, padx=5, pady=5)

        btn_frame = ttk.Frame(parent)
        btn_frame.pack(fill=tk.X, padx=10)
        ttk.Button(btn_frame, text="Spindle Ekle", command=self._add_spindle).pack(side=tk.LEFT, padx=5, pady=5)
        ttk.Button(btn_frame, text="Seçileni Sil", command=self._delete_spindle).pack(side=tk.LEFT, padx=5, pady=5)
        ttk.Button(btn_frame, text="Seçileni Düzenle", command=self._edit_spindle).pack(side=tk.LEFT, padx=5, pady=5)

        tree_frame = ttk.Frame(parent)
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        columns = ["id", "Referans ID", "Çalışma Saati", "Son Güncelleme"]
        self.spindle_tree = ttk.Treeview(tree_frame, columns=columns, show="headings")
        for col in columns:
            self.spindle_tree.heading(col, text=col)
            self.spindle_tree.column(col, width=150, anchor=tk.W)
        self.spindle_tree.pack(fill=tk.BOTH, expand=True)
        self.spindle_tree.bind("<<TreeviewSelect>>", self._on_spindle_select)

    def _build_yedek_tab(self, parent):
        form_frame = ttk.LabelFrame(parent, text="Yedek Bilgileri")
        form_frame.pack(fill=tk.X, padx=10, pady=10)

        labels = [
            "Referans ID",
            "Açıklama",
            "Tamirde mi",
            "Bakıma Gönderilme",
            "Geri Dönme",
            "Son Güncelleme",
        ]
        self.yedek_entries = {}
        for i, label in enumerate(labels):
            ttk.Label(form_frame, text=label).grid(row=0, column=i * 2, padx=5, pady=5, sticky=tk.W)
            entry = ttk.Entry(form_frame)
            entry.grid(row=0, column=i * 2 + 1, padx=5, pady=5, sticky=tk.W)
            self.yedek_entries[label] = entry

        today = datetime.now().strftime(DATE_FORMAT)
        self.yedek_entries["Bakıma Gönderilme"].insert(0, today)
        self.yedek_entries["Geri Dönme"].insert(0, today)
        self.yedek_entries["Son Güncelleme"].insert(0, today)

        search_frame = ttk.Frame(parent)
        search_frame.pack(fill=tk.X, padx=10)
        ttk.Label(search_frame, text="Referans ID ile Ara:").pack(side=tk.LEFT, padx=5, pady=5)
        self.yedek_search_entry = ttk.Entry(search_frame)
        self.yedek_search_entry.pack(side=tk.LEFT, padx=5, pady=5)
        ttk.Button(search_frame, text="Ara", command=self._search_yedek).pack(side=tk.LEFT, padx=5, pady=5)

        btn_frame = ttk.Frame(parent)
        btn_frame.pack(fill=tk.X, padx=10)
        ttk.Button(btn_frame, text="Yedek Ekle", command=self._add_yedek).pack(side=tk.LEFT, padx=5, pady=5)
        ttk.Button(btn_frame, text="Seçileni Sil", command=self._delete_yedek).pack(side=tk.LEFT, padx=5, pady=5)
        ttk.Button(btn_frame, text="Seçileni Düzenle", command=self._edit_yedek).pack(side=tk.LEFT, padx=5, pady=5)

        tree_frame = ttk.Frame(parent)
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        columns = [
            "id",
            "Referans ID",
            "Açıklama",
            "Tamirde mi",
            "Bakıma Gönderilme",
            "Geri Dönme",
            "Son Güncelleme",
        ]
        self.yedek_tree = ttk.Treeview(tree_frame, columns=columns, show="headings")
        for col in columns:
            self.yedek_tree.heading(col, text=col)
            self.yedek_tree.column(col, width=150, anchor=tk.W)
        self.yedek_tree.pack(fill=tk.BOTH, expand=True)
        self.yedek_tree.bind("<<TreeviewSelect>>", self._on_yedek_select)

    def _get_entry_values(self, entries):
        return {label: entry.get().strip() for label, entry in entries.items()}

    def _refresh_spindle_tree(self, rows=None):
        for item in self.spindle_tree.get_children():
            self.spindle_tree.delete(item)
        rows = rows if rows is not None else self.spindle_manager.all_records()
        for row in rows:
            self.spindle_tree.insert("", tk.END, values=[row.get(col, "") for col in self.spindle_tree["columns"]])

    def _on_spindle_select(self, event=None):
        selected = self.spindle_tree.selection()
        if not selected:
            return
        values = self.spindle_tree.item(selected[0], "values")
        columns = self.spindle_tree["columns"]
        for col, val in zip(columns[1:], values[1:]):
            entry = self.spindle_entries.get(col)
            if entry is not None:
                entry.delete(0, tk.END)
                entry.insert(0, val)

    def _refresh_yedek_tree(self, rows=None):
        for item in self.yedek_tree.get_children():
            self.yedek_tree.delete(item)
        rows = rows if rows is not None else self.yedek_manager.all_records()
        for row in rows:
            self.yedek_tree.insert("", tk.END, values=[row.get(col, "") for col in self.yedek_tree["columns"]])

    def _on_yedek_select(self, event=None):
        selected = self.yedek_tree.selection()
        if not selected:
            return
        values = self.yedek_tree.item(selected[0], "values")
        columns = self.yedek_tree["columns"]
        for col, val in zip(columns[1:], values[1:]):
            entry = self.yedek_entries.get(col)
            if entry is not None:
                entry.delete(0, tk.END)
                entry.insert(0, val)

    def _add_spindle(self):
        values = self._get_entry_values(self.spindle_entries)
        if not values["Referans ID"]:
            messagebox.showerror("Hata", "Referans ID zorunludur.")
            return
        self.spindle_manager.add_record(values)
        self._refresh_spindle_tree()
        messagebox.showinfo("Başarılı", "Kayıt eklendi.")

    def _delete_spindle(self):
        selected = self.spindle_tree.selection()
        if not selected:
            messagebox.showerror("Hata", "Silmek için bir kayıt seçin.")
            return
        record_id = self.spindle_tree.item(selected[0], "values")[0]
        if self.spindle_manager.delete_record(record_id):
            self._refresh_spindle_tree()
            messagebox.showinfo("Başarılı", "Kayıt silindi.")

    def _edit_spindle(self):
        selected = self.spindle_tree.selection()
        if not selected:
            messagebox.showerror("Hata", "Düzenlemek için bir kayıt seçin.")
            return
        record_id = self.spindle_tree.item(selected[0], "values")[0]
        values = self._get_entry_values(self.spindle_entries)
        if not values["Referans ID"]:
            messagebox.showerror("Hata", "Referans ID zorunludur.")
            return
        self.spindle_manager.update_record(record_id, values)
        self._refresh_spindle_tree()
        messagebox.showinfo("Başarılı", "Kayıt güncellendi.")

    def _search_spindle(self):
        query = self.spindle_search_entry.get().strip()
        results = self.spindle_manager.search(**{"Referans ID": query}) if query else self.spindle_manager.all_records()
        self._refresh_spindle_tree(results)

    def _add_yedek(self):
        values = self._get_entry_values(self.yedek_entries)
        if not values["Referans ID"]:
            messagebox.showerror("Hata", "Referans ID zorunludur.")
            return
        self.yedek_manager.add_record(values)
        self._refresh_yedek_tree()
        messagebox.showinfo("Başarılı", "Kayıt eklendi.")

    def _delete_yedek(self):
        selected = self.yedek_tree.selection()
        if not selected:
            messagebox.showerror("Hata", "Silmek için bir kayıt seçin.")
            return
        record_id = self.yedek_tree.item(selected[0], "values")[0]
        if self.yedek_manager.delete_record(record_id):
            self._refresh_yedek_tree()
            messagebox.showinfo("Başarılı", "Kayıt silindi.")

    def _edit_yedek(self):
        selected = self.yedek_tree.selection()
        if not selected:
            messagebox.showerror("Hata", "Düzenlemek için bir kayıt seçin.")
            return
        record_id = self.yedek_tree.item(selected[0], "values")[0]
        values = self._get_entry_values(self.yedek_entries)
        if not values["Referans ID"]:
            messagebox.showerror("Hata", "Referans ID zorunludur.")
            return
        self.yedek_manager.update_record(record_id, values)
        self._refresh_yedek_tree()
        messagebox.showinfo("Başarılı", "Kayıt güncellendi.")

    def _search_yedek(self):
        query = self.yedek_search_entry.get().strip()
        results = self.yedek_manager.search(**{"Referans ID": query}) if query else self.yedek_manager.all_records()
        self._refresh_yedek_tree(results)

    def _export_data(self):
        spindle_rows = self.spindle_manager.all_records()
        yedek_rows = self.yedek_manager.all_records()
        export_path = resource_path("takip_export.csv")

        with open(export_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["--- Spindle Takip ---"])
            writer.writerow(["Referans ID", "Saat", "Son Güncelleme"])
            for row in spindle_rows:
                writer.writerow([
                    row.get("Referans ID", ""),
                    row.get("Çalışma Saati", ""),
                    row.get("Son Güncelleme", ""),
                ])
            writer.writerow([])
            writer.writerow(["--- Yedek Takip ---"])
            writer.writerow(["Referans ID", "Açıklama", "Tamirde", "Gönderildi", "Dönen", "Son Güncelleme"])
            for row in yedek_rows:
                writer.writerow([
                    row.get("Referans ID", ""),
                    row.get("Açıklama", ""),
                    row.get("Tamirde mi", ""),
                    row.get("Bakıma Gönderilme", ""),
                    row.get("Geri Dönme", ""),
                    row.get("Son Güncelleme", ""),
                ])
        messagebox.showinfo("Başarılı", f"Veriler {export_path} dosyasına aktarıldı.")

    def run(self):
        self.root.mainloop()


def show_login():
    login_root = tk.Tk()
    login_root.title(LOGIN_TITLE)
    login_root.resizable(False, False)

    frame = ttk.Frame(login_root, padding=20)
    frame.pack()

    ttk.Label(frame, text="Kullanıcı Adı").grid(row=0, column=0, padx=5, pady=5, sticky=tk.W)
    user_entry = ttk.Entry(frame)
    user_entry.grid(row=0, column=1, padx=5, pady=5)

    ttk.Label(frame, text="Şifre").grid(row=1, column=0, padx=5, pady=5, sticky=tk.W)
    pass_entry = ttk.Entry(frame, show="*")
    pass_entry.grid(row=1, column=1, padx=5, pady=5)

    def attempt_login(event=None):
        username = user_entry.get().strip()
        password = pass_entry.get().strip()
        if username == USERNAME and password == PASSWORD:
            login_root.destroy()
            app = MainApp()
            app.run()
        else:
            messagebox.showerror("Hata", "Kullanıcı adı veya şifre hatalı.")

    login_button = ttk.Button(frame, text="Giriş", command=attempt_login)
    login_button.grid(row=2, column=0, columnspan=2, pady=10)

    login_root.bind("<Return>", attempt_login)
    user_entry.focus()
    login_root.mainloop()


if __name__ == "__main__":
    show_login()
