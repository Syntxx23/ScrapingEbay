const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

// Fungsi delay supaya tidak terlalu cepat scrape tiap produk
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const GEMINI_API_KEY = "AIzaSyDmPi01ElZWrVBPvdimfCUwVbUltz02y6c"; // Ganti dengan API key kamu

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractProductDataFromHTML(data) {
  const snippet = data.snippet.slice(0, 10000); // Batas aman untuk Gemini

  const prompt = `
Kamu adalah AI yang mengekstrak data produk dari HTML halaman eBay.

Berikut adalah cuplikan HTML produk:

${snippet}

Tugasmu:
1. Cari nama produk dari tag: <h1 class="x-item-title__mainTitle">, ambil isi <span> di dalamnya.
2) Cari harga produk dari tag div.x-bin-price__content > div.x-price-primary > span.ux-textspans di dalamnya.
3. Cari deskripsi dari elemen dengan class "vim d-item-description" (ambil teks di dalamnya jika ada).
4. Link produk: ${data.link} (gunakan ini sebagai link produk meskipun ada link lain di HTML).

Jika data tidak ditemukan, tulis "-".

Jawaban hanya dalam format JSON, **tanpa kode tambahan atau markdown**:
{
  "name": "Nama produk",
  "price": "Harga produk",
  "description": "Deskripsi produk",
  "link": "Link produk"
}
`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    let textResponse =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Clean if AI wraps it with ```json or other noise
    textResponse = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(textResponse);

    // Overwrite link to ensure accuracy
    parsed.link = data.link;

    return parsed;
  } catch (error) {
    if (error.response) {
      console.error("Error AI response:", error.response.data);
    } else {
      console.error("Error AI message:", error.message);
    }
    return { name: "-", price: "-", description: "-", link: data.link };
  }
}

// Fungsi scrape list produk di eBay dengan paginasi
async function scrapeEbayProducts(searchUrl) {
  let products = [];
  let nextPageUrl = searchUrl;

  let i = 0;

  while (nextPageUrl && products.length < 5) {
    console.log(`Scraping halaman: ${nextPageUrl}`);

    try {
      const { data: html } = await axios.get(nextPageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
        }
      });
      const $ = cheerio.load(html);

      const productLinks = $("li.s-item a.s-item__link")
        .map((i, el) => $(el).attr("href"))
        .get()
        .filter((href) => href && href.includes("/itm/")); // ✅ hanya link ke produk asli

      for (const link of productLinks) {
        if (products.length >= 5) break;

        try {
          await delay(1000);

          const { data: detailHtml } = await axios.get(link, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
            }
          });

          fs.writeFileSync(`detail-product${i++}.html`, detailHtml, "utf-8");

          const $detail = cheerio.load(detailHtml);
          const name = $detail("h1.x-item-title__mainTitle span")
            .first()
            .text()
            .trim();

          const priceRaw = $detail(
            "div.x-bin-price__content > div.x-price-primary > span.ux-textspans"
          )
            .first()
            .text()
            .trim();

          // Ekstrak angka harga dari teks, contoh: "US $211.40" -> "211.40"
          const priceMatch = priceRaw.match(/US \$([\d,.]+)/);
          const price = priceMatch ? priceMatch[1] : "-";

          const productData = await extractProductDataFromHTML({
            snippet: detailHtml,
            link: link
          });

          productData.name = name || productData.name || "-"; // Gunakan hasil HTML langsung jika ada
          productData.price = price || productData.price || "-";
          products.push(productData);
          console.log("Produk ditambahkan:", productData);
        } catch (e) {
          console.warn("Gagal ambil detail produk:", e.message);
          fs.appendFileSync("error-links.txt", `${link}\n`);
          products.push({ name: "-", price: "-", description: "-", link });
        }
      }

      // Stop looping halaman jika sudah dapat 5 produk
      if (products.length >= 5) break;

      // Ambil halaman selanjutnya
      let nextLink =
        $("a.pagination__next").attr("href") || $("a[rel='next']").attr("href");

      if (nextLink) {
        nextPageUrl = new URL(nextLink, nextPageUrl).href;
      } else {
        nextPageUrl = null;
      }
    } catch (e) {
      console.error("Gagal scrape halaman list:", e.message);
      break;
    }
  }

  return products;
}

// Contoh panggilan fungsi
(async () => {
  const searchUrl = "https://www.ebay.com/sch/i.html?_nkw=iphone";

  const allProducts = await scrapeEbayProducts(searchUrl);
  fs.writeFileSync("products.json", JSON.stringify(allProducts, null, 2));
  console.log("Scraping selesai. Total produk:", allProducts.length);
  console.log("Data produk disimpan di products.json");
})();