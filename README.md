# 🛒 Scraping Data Produk eBay + AI Gemini

Proyek ini adalah sistem **web scraping otomatis** yang mengambil data produk dari situs **eBay** berdasarkan kata kunci pencarian, lalu memanfaatkan **AI Gemini (Google Generative Language API)** untuk mengekstrak informasi penting dari HTML produk.

### 🔍 Tujuan Proyek
Membuat tools scraping berbasis Node.js yang:
- Mengambil detail produk dari eBay (judul, harga, dan deskripsi).
- Menggunakan **Gemini AI** untuk membaca HTML dan mengambil informasi produk secara cerdas.
- Menyimpan hasil dalam format **JSON**.

---

## 🚀 Fitur

- ✅ Web scraping menggunakan `axios` dan `cheerio`
- 🤖 Ekstraksi data produk menggunakan **Gemini AI**
- 📄 Simpan hasil ke file `products.json`
- 🔄 Scrape hingga 5 produk pertama dari hasil pencarian
- 🧠 Toleransi error dan retry pada scraping

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Keterangan |
|----------|-------------|
| Node.js | Runtime environment |
| Axios | HTTP client untuk fetch halaman |
| Cheerio | Library untuk parsing HTML (mirip jQuery) |
| Gemini AI | Google AI untuk ekstrak data dari HTML |
| fs | Menyimpan file hasil scraping |
| eBay | Target data scraping |

---

## ⚙️ Cara Menjalankan

### 1. Clone Repositori

```bash
git clone https://github.com/Syntxx23/ScrapingEbay.git
cd ScrapingEbay

### 2.  Install Dependencies
npm i
npm i axios cheerio
npm i @google/generative-ai

### 3. Tambahkan API Key Gemini
const GEMINI_API_KEY = "GANTI_DENGAN_API_KEY_MU";

### 4. Jalankan project
node gemini.js

🧪 Contoh Output
[
  {
    "name": "Apple iPhone 13 Pro Max - 256GB - Graphite",
    "price": "899.99",
    "description": "Used iPhone 13 Pro Max in great condition. No scratches. Includes charger.",
    "link": "https://www.ebay.com/itm/examplelink"
  },
  ...
]
