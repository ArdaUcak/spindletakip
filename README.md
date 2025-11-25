# spindletakip – STS GUI Overview

This application opens with a login screen titled **"Giriş Ekranı"** sized **500×350**. The entire login surface uses a clean white tone with a modern **clam**-style card in the upper third holding widened **Kullanıcı Adı** and **Şifre** fields plus a padded **Giriş** button. The footer text **"Created by: Arda UÇAK"** sits in the bottom-right corner. Enter the credentials **BAKIM** / **MAXIME** to reach the main window titled **"STS-SpindleTakipSistemi"**, which shows the title on the left and a live date-time display on the far right.【F:main.py†L8-L32】【F:main.py†L168-L184】【F:main.py†L504-L551】

## Spindle Takip Sistemi Tab
- **Header & layout:** A compact header row sits above the notebook with bold title text; the tab itself uses framed sections for search and actions in a modern card style.【F:main.py†L86-L109】【F:main.py†L111-L152】
- **Search bar:** A labeled field "Referans ID ile Ara" with an accented **Ara** button to filter by Referans ID.【F:main.py†L138-L145】
- **Actions:** Buttons **Spindle Ekle**, **Seçileni Sil**, and **Seçileni Düzenle** sit in a padded frame. Add/edit buttons open a modal dialog to capture **Referans ID**, **Çalışma Saati**, **Takılı Olduğu Makine**, and **Makinaya Takıldığı Tarih** (defaults to today); **Son Güncelleme** is stamped automatically with the current date in **GG-AA-YYYY** order when saving.【F:main.py†L147-L174】【F:main.py†L263-L304】
- **Table:** Treeview listing columns **İD**, **Referans ID**, **Çalışma Saati**, **Takılı Olduğu Makine**, **Makinaya Takıldığı Tarih**, and **Son Güncelleme**, with alternating row shading for readability.【F:main.py†L156-L186】

## Yedek Takip Sistemi Tab
- **Search bar:** "Referans ID ile Ara" input with an accented **Ara** button to filter by Referans ID, wrapped in a card-styled frame.【F:main.py†L188-L195】
- **Actions:** Buttons **Yedek Ekle**, **Seçileni Sil**, and **Seçileni Düzenle** arranged on a padded row. Add/edit buttons open a modal dialog to capture **Referans ID**, **Açıklama**, **Tamirde mi** (readonly dropdown with **Evet/Hayır**), **Bakıma Gönderilme**, **Geri Dönme**, **Söküldüğü Makine**, and **Sökülme Tarihi** (date defaults to today); **Son Güncelleme** auto-fills with the current date in **GG-AA-YYYY** order at save time (other date fields still default to today for convenience).【F:main.py†L197-L223】【F:main.py†L310-L371】
- **Table:** Treeview columns **İD**, **Referans ID**, **Açıklama**, **Tamirde mi**, **Bakıma Gönderilme**, **Geri Dönme**, **Söküldüğü Makine**, **Sökülme Tarihi**, **Son Güncelleme**, shaded with alternating rows for readability.【F:main.py†L203-L235】

## Export
A bottom-right button labeled **"Excel'e Aktar (CSV)"** exports both tables to `takip_export.csv` in a sectioned format with the added machine and date fields.【F:main.py†L134-L137】【F:main.py†L354-L392】

## Dosya Konumu
All CSV files (`spindle_data.csv`, `yedek_data.csv`, `takip_export.csv`) are stored alongside the executable/script using the `resource_path` helper; in frozen (PyInstaller) builds it resolves to the directory of the executable so data persists across runs instead of the temporary extraction folder.【F:main.py†L16-L24】【F:main.py†L112-L138】

## Bağımlılıklar
No third-party pip packages are required. Run `python dependencies.py` to verify Tkinter availability and install future packages if they are ever added to the helper's list.【F:dependencies.py†L1-L43】

## Çalıştırma
Run the app with Python 3.12 using:

```bash
python main.py
```
The login window appears first; after entering the credentials, the main notebook opens with the Spindle and Yedek tabs.

### Claudsys (LAN başlatıcı)
- `python claudsys.py` komutuyla 0.0.0.0 üzerinde küçük bir web arayüzü açılır (varsayılan port **8000**, `CLAUDSYS_PORT` ile değiştirilebilir).
- Tarayıcıdan aynı ağdaki cihazlarda `http://<sunucu-ip>:8000` adresine gidip **Launch STS GUI** düğmesine basarak bu makinede `main.py` uygulamasını başlatabilirsiniz.
- Sayfa, çalıştırma durumunu gösterir; GUI zaten açıksa düğme pasifleşir.

## Depo Adı
Depo adı **spindletakip** olarak güncellense de uygulama dosyaları (örneğin `main.py`) aynen korunur; mevcut dizinden (`spindletakip2` klasörü) çalıştırmaya devam edebilirsiniz.

