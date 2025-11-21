# Takip Sistemi GUI Overview

This application opens with a login screen titled **"Giriş Ekranı"**. Enter the credentials **BAKIM** / **MAXIME** to reach the main window titled **"Takip Sistemi"** (fixed size 1100×650).

## Spindle Takip Sistemi Tab
- **Form row:** Entries for **Referans ID**, **Çalışma Saati**, and **Son Güncelleme** (pre-filled with today’s date).【F:main.py†L139-L152】
- **Search bar:** A labeled field "Referans ID ile Ara" with an **Ara** button to filter by Referans ID.【F:main.py†L153-L159】
- **Actions:** Buttons **Spindle Ekle**, **Seçileni Sil**, and **Seçileni Düzenle** aligned on one row.【F:main.py†L160-L165】
- **Table:** Treeview listing columns **id**, **Referans ID**, **Çalışma Saati**, and **Son Güncelleme**; selecting a row back-fills the form for edits.【F:main.py†L166-L175】【F:main.py†L243-L254】

## Yedek Takip Sistemi Tab
- **Form row:** Entries for **Referans ID**, **Açıklama**, **Tamirde mi**, **Bakıma Gönderilme**, **Geri Dönme**, and **Son Güncelleme** (dates default to today).【F:main.py†L177-L200】
- **Search bar:** "Referans ID ile Ara" input with an **Ara** button to filter by Referans ID.【F:main.py†L201-L207】
- **Actions:** Buttons **Yedek Ekle**, **Seçileni Sil**, and **Seçileni Düzenle** arranged on a single row.【F:main.py†L208-L213】
- **Table:** Treeview columns **id**, **Referans ID**, **Açıklama**, **Tamirde mi**, **Bakıma Gönderilme**, **Geri Dönme**, **Son Güncelleme**; selecting a row fills the form for editing.【F:main.py†L214-L231】【F:main.py†L262-L273】

## Export
A bottom-right button labeled **"Excel'e Aktar (CSV)"** exports both tables to `takip_export.csv` in a sectioned format.【F:main.py†L134-L137】【F:main.py†L350-L378】
