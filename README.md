# spindletakip – Takip Sistemi GUI Overview

This application opens with a login screen titled **"Giriş Ekranı"** that matches the main window size (**1100×650**) and shows the footer text **"Created by: Arda UÇAK"**. Enter the credentials **BAKIM** / **MAXIME** to reach the main window titled **"Takip Sistemi"**.

## Spindle Takip Sistemi Tab
- **Search bar:** A labeled field "Referans ID ile Ara" with an **Ara** button to filter by Referans ID.【F:main.py†L139-L145】
 - **Actions:** Buttons **Spindle Ekle**, **Seçileni Sil**, and **Seçileni Düzenle** aligned on one row. Add/edit buttons open a modal dialog to capture **Referans ID** and **Çalışma Saati**; **Son Güncelleme** is stamped automatically with the current date in **GG-AA-YYYY** order when saving.【F:main.py†L147-L171】【F:main.py†L262-L300】
- **Table:** Treeview listing columns **id**, **Referans ID**, **Çalışma Saati**, and **Son Güncelleme**.【F:main.py†L175-L181】

## Yedek Takip Sistemi Tab
- **Search bar:** "Referans ID ile Ara" input with an **Ara** button to filter by Referans ID.【F:main.py†L183-L189】
 - **Actions:** Buttons **Yedek Ekle**, **Seçileni Sil**, and **Seçileni Düzenle** arranged on a single row. Add/edit buttons open a modal dialog to capture **Referans ID**, **Açıklama**, **Tamirde mi** (readonly dropdown with **Evet/Hayır**), **Bakıma Gönderilme**, and **Geri Dönme**; **Son Güncelleme** auto-fills with the current date in **GG-AA-YYYY** order at save time (date fields still default to today for convenience).【F:main.py†L191-L218】【F:main.py†L306-L359】
- **Table:** Treeview columns **id**, **Referans ID**, **Açıklama**, **Tamirde mi**, **Bakıma Gönderilme**, **Geri Dönme**, **Son Güncelleme**.【F:main.py†L219-L230】

## Export
A bottom-right button labeled **"Excel'e Aktar (CSV)"** exports both tables to `takip_export.csv` in a sectioned format.【F:main.py†L134-L137】【F:main.py†L350-L378】

## Dosya Konumu
All CSV files (`spindle_data.csv`, `yedek_data.csv`, `takip_export.csv`) are stored alongside the executable/script using the `resource_path` helper so they travel with the build.【F:main.py†L16-L22】【F:main.py†L112-L138】

## Çalıştırma
Run the app with Python 3.12 using:

```bash
python main.py
```
The login window appears first; after entering the credentials, the main notebook opens with the Spindle and Yedek tabs.

## Depo Adı
Depo adı **spindletakip** olarak güncellense de uygulama dosyaları (örneğin `main.py`) aynen korunur; mevcut dizinden (`spindletakip2` klasörü) çalıştırmaya devam edebilirsiniz.
