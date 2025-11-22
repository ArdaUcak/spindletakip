# spindletakip – Takip Sistemi GUI Overview

This application opens with a login screen titled **"Giriş Ekranı"** sized **500×350**. The widened **Kullanıcı Adı** and **Şifre** fields sit in the upper third of the window with generous spacing, and the footer text **"Created by: Arda UÇAK"** appears in the bottom-right corner. Enter the credentials **BAKIM** / **MAXIME** to reach the main window titled **"Takip Sistemi"**.

## Spindle Takip Sistemi Tab
- **Search bar:** A labeled field "Referans ID ile Ara" with an **Ara** button to filter by Referans ID.【F:main.py†L139-L145】
- **Actions:** Buttons **Spindle Ekle**, **Seçileni Sil**, and **Seçileni Düzenle** aligned on one row. Add/edit buttons open a modal dialog to capture **Referans ID**, **Çalışma Saati**, **Takılı Olduğu Makine**, and **Makinaya Takıldığı Tarih** (defaults to today); **Son Güncelleme** is stamped automatically with the current date in **GG-AA-YYYY** order when saving.【F:main.py†L147-L174】【F:main.py†L263-L304】
- **Table:** Treeview listing columns **id**, **Referans ID**, **Çalışma Saati**, **Takılı Olduğu Makine**, **Makinaya Takıldığı Tarih**, and **Son Güncelleme**.【F:main.py†L177-L185】

## Yedek Takip Sistemi Tab
- **Search bar:** "Referans ID ile Ara" input with an **Ara** button to filter by Referans ID.【F:main.py†L183-L189】
- **Actions:** Buttons **Yedek Ekle**, **Seçileni Sil**, and **Seçileni Düzenle** arranged on a single row. Add/edit buttons open a modal dialog to capture **Referans ID**, **Açıklama**, **Tamirde mi** (readonly dropdown with **Evet/Hayır**), **Bakıma Gönderilme**, **Geri Dönme**, **Söküldüğü Makine**, and **Sökülme Tarihi** (date defaults to today); **Son Güncelleme** auto-fills with the current date in **GG-AA-YYYY** order at save time (other date fields still default to today for convenience).【F:main.py†L191-L223】【F:main.py†L310-L371】
- **Table:** Treeview columns **id**, **Referans ID**, **Açıklama**, **Tamirde mi**, **Bakıma Gönderilme**, **Geri Dönme**, **Söküldüğü Makine**, **Sökülme Tarihi**, **Son Güncelleme**.【F:main.py†L224-L235】

## Export
A bottom-right button labeled **"Excel'e Aktar (CSV)"** exports both tables to `takip_export.csv` in a sectioned format with the added machine and date fields.【F:main.py†L134-L137】【F:main.py†L354-L392】

## Dosya Konumu
All CSV files (`spindle_data.csv`, `yedek_data.csv`, `takip_export.csv`) are stored alongside the executable/script using the `resource_path` helper; in frozen (PyInstaller) builds it resolves to the directory of the executable so data persists across runs instead of the temporary extraction folder.【F:main.py†L16-L24】【F:main.py†L112-L138】

## Çalıştırma
Run the app with Python 3.12 using:

```bash
python main.py
```
The login window appears first; after entering the credentials, the main notebook opens with the Spindle and Yedek tabs.

## Depo Adı
Depo adı **spindletakip** olarak güncellense de uygulama dosyaları (örneğin `main.py`) aynen korunur; mevcut dizinden (`spindletakip2` klasörü) çalıştırmaya devam edebilirsiniz.
