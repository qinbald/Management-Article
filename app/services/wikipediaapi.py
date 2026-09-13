"""
=============================================================================
app/services/wikipediaapi.py
=============================================================================
Modul layanan (service layer) untuk integrasi Wikipedia API ke dalam
aplikasi Flask ArtikelSpace.

ALUR DATA UTAMA
---------------
Browser / CLI
    │
    ▼
[Route Layer]  ──────────────────────────────────────────────────────────────
  GET  /api/wiki/search?q=<query>&lang=id   → search_wiki()
  GET  /api/wiki/preview?title=<title>      → get_wiki_summary()
  POST /api/wiki/import  { title, category, user_id }
                                            → fetch_and_store_wiki()
    │
    ▼
[Service Layer]  (file ini)
  init_wiki(lang)          → Inisialisasi client Wikipedia API
  search_wiki(query, lang) → Cari daftar halaman terkait
  get_wiki_summary(title)  → Ambil ringkasan, URL, kategori, sections
  fetch_and_store_wiki()   → Simpan ke DB (article_db + Article analytics)
  batch_import_wiki()      → Impor banyak topik sekaligus
    │
    ▼
[Database Layer]
  Article (articles)  → Tabel tunggal terpadu untuk konten & analitik
=============================================================================

ALGORITMA UTAMA
---------------
1. init_wiki(lang):
   - Membuat instance wikipediaapi.Wikipedia dengan User-Agent yang valid
     sesuai kebijakan Wikimedia Foundation.
   - User-Agent format: "AppName/Version (contact@email.com)"
   - Parameter `lang` menentukan bahasa Wikipedia (default: 'id' = Indonesia).

2. search_wiki(query, lang, limit):
   - Menggunakan page.links atau prefix search via Wikipedia API.
   - Mengembalikan list dict: [{ 'title': str, 'url': str }]
   - Limit membatasi jumlah hasil agar respons cepat.

3. get_wiki_summary(topic_title, lang, max_chars):
   - Mengambil page object dari Wikipedia.
   - Mengekstrak: title, summary (max_chars karakter pertama dari page.summary),
     full_url, categories (list nama kategori), sections (list judul section).
   - Mengembalikan dict atau None jika halaman tidak ditemukan.

4. fetch_and_store_wiki(topic_title, category_name, user_id, lang, full_text):
   LANGKAH:
   a. Inisialisasi client Wikipedia (init_wiki).
   b. Ambil page object (wiki.page(topic_title)).
   c. Validasi: page.exists() → jika False, return error.
   d. Cek duplikasi di model Article (filter_by title).
   e. Jika belum ada:
      - Tentukan teks: full_text=True → page.text (artikel lengkap),
        False → page.summary (ringkasan ~500 kata).
      - Buat objek Article (title, author, category, description, user_id, published_at).
      - Simpan langsung ke tabel articles (otomatis terhubung dengan relasi User dan VisitLog).
   f. Return dict { success, action, article } untuk respons API.

5. batch_import_wiki(topics, category_name, user_id, lang):
   - Iterasi list topik, panggil fetch_and_store_wiki() untuk setiap topik.
   - Kumpulkan statistik: created, skipped (duplikat), failed (tidak ditemukan).
   - Return dict { success, stats: { created, skipped, failed }, results }.
=============================================================================
"""

import wikipediaapi
from datetime import datetime
from app.models import db, Article


# ─────────────────────────────────────────────────────────────────────────────
# KONSTANTA
# ─────────────────────────────────────────────────────────────────────────────

# User-Agent wajib sesuai kebijakan Wikimedia Foundation.
# Format: "NamaAplikasi/Versi (kontak@email.com)"
WIKI_USER_AGENT = "FlaskArtikelSpace/1.0 (dev@artikelspace.local)"

# Bahasa default Wikipedia
DEFAULT_LANG = "id"

# Jumlah karakter maksimum untuk ringkasan (summary)
DEFAULT_SUMMARY_MAX_CHARS = 1500


# ─────────────────────────────────────────────────────────────────────────────
# FUNGSI 1: init_wiki
# ─────────────────────────────────────────────────────────────────────────────

def init_wiki(lang: str = DEFAULT_LANG) -> wikipediaapi.Wikipedia:
    """
    Menginisialisasi dan mengembalikan client Wikipedia API.

    ALGORITMA:
    - Membuat instance wikipediaapi.Wikipedia dengan User-Agent yang valid.
    - Parameter `lang` menentukan bahasa Wikipedia yang digunakan.
      Contoh: 'id' = Indonesia, 'en' = Inggris, 'ja' = Jepang.

    PARAMETER:
        lang (str): Kode bahasa Wikipedia. Default: 'id' (Indonesia).

    RETURN:
        wikipediaapi.Wikipedia: Instance client Wikipedia API yang siap digunakan.

    CONTOH:
        wiki = init_wiki('id')
        page = wiki.page("Candi Borobudur")
    """
    return wikipediaapi.Wikipedia(
        user_agent=WIKI_USER_AGENT,
        language=lang
    )


# ─────────────────────────────────────────────────────────────────────────────
# FUNGSI 2: search_wiki
# ─────────────────────────────────────────────────────────────────────────────

def search_wiki(query: str, lang: str = DEFAULT_LANG, limit: int = 8) -> list:
    """
    Mencari daftar halaman Wikipedia yang relevan berdasarkan query.

    Menggunakan wiki.search() (MediaWiki search API) — full-text search,
    bukan exact-match. URL dibangun dari title karena fullurl lazy-load.
    """
    wiki = init_wiki(lang)
    try:
        search_results = wiki.search(query, limit=limit)
        results = []
        for title, page in search_results.pages.items():
            # Bangun URL dari title (fullurl lazy, bisa None sebelum di-fetch)
            encoded = title.replace(' ', '_')
            url = f"https://{lang}.wikipedia.org/wiki/{encoded}"
            results.append({'title': title, 'url': url})
        return results
    except Exception:
        return []


# ─────────────────────────────────────────────────────────────────────────────
# FUNGSI 3: get_wiki_summary
# ─────────────────────────────────────────────────────────────────────────────

def get_wiki_summary(topic_title: str, lang: str = DEFAULT_LANG,
                     max_chars: int = DEFAULT_SUMMARY_MAX_CHARS) -> dict | None:
    """
    Mengambil ringkasan dan metadata halaman Wikipedia.

    ALGORITMA:
    - Inisialisasi client Wikipedia.
    - Ambil page object dengan wiki.page(topic_title).
    - Validasi: jika page.exists() == False, return None.
    - Ekstrak data:
        * title      : Judul resmi halaman Wikipedia.
        * summary    : Teks ringkasan (page.summary), dipotong max_chars karakter.
        * full_url   : URL lengkap halaman Wikipedia.
        * categories : List nama kategori (dari page.categories dict).
        * sections   : List judul section level-1 (dari page.sections).
        * lang       : Kode bahasa yang digunakan.
    - Return dict berisi semua data di atas.

    PARAMETER:
        topic_title (str): Judul halaman Wikipedia yang ingin diambil.
        lang        (str): Kode bahasa Wikipedia. Default: 'id'.
        max_chars   (int): Batas karakter ringkasan. Default: 1500.

    RETURN:
        dict | None: Dict metadata artikel, atau None jika halaman tidak ditemukan.

    CONTOH RETURN:
        {
            'title': 'Kecerdasan buatan',
            'summary': 'Kecerdasan buatan (bahasa Inggris: artificial intelligence)...',
            'full_url': 'https://id.wikipedia.org/wiki/Kecerdasan_buatan',
            'categories': ['Kecerdasan buatan', 'Ilmu komputer'],
            'sections': ['Sejarah', 'Jenis-jenis', 'Penerapan'],
            'lang': 'id'
        }
    """
    wiki = init_wiki(lang)
    page = wiki.page(topic_title)

    if not page.exists():
        search_results = wiki.search(topic_title, limit=1)
        if search_results.pages:
            first_title = list(search_results.pages.keys())[0]
            page = wiki.page(first_title)
        if not page.exists():
            return None

    # Ambil ringkasan dan potong sesuai max_chars
    summary_text = page.summary
    if len(summary_text) > max_chars:
        # Potong di batas kata terdekat agar tidak memotong di tengah kata
        summary_text = summary_text[:max_chars].rsplit(' ', 1)[0] + '...'

    # Ambil nama kategori (page.categories adalah dict { nama: WikipediaPage })
    categories = list(page.categories.keys())[:10]  # Batasi 10 kategori

    # Ambil judul section level-1
    sections = [s.title for s in page.sections][:10]  # Batasi 10 section

    return {
        'title': page.title,
        'summary': summary_text,
        'full_url': page.fullurl,
        'categories': categories,
        'sections': sections,
        'lang': lang
    }


# ─────────────────────────────────────────────────────────────────────────────
# FUNGSI 4: fetch_and_store_wiki
# ─────────────────────────────────────────────────────────────────────────────

def fetch_and_store_wiki(
    topic_title: str,
    category_name: str = "Umum",
    user_id: int | None = None,
    lang: str = DEFAULT_LANG,
    full_text: bool = False
) -> dict:
    """
    Mengambil artikel dari Wikipedia dan menyimpannya ke database.

    ALGORITMA (6 langkah):
    ┌─────────────────────────────────────────────────────────────────────┐
    │ LANGKAH 1: Inisialisasi client Wikipedia (init_wiki)                │
    │ LANGKAH 2: Ambil page object (wiki.page(topic_title))               │
    │ LANGKAH 3: Validasi keberadaan halaman (page.exists())              │
    │ LANGKAH 4: Cek duplikasi di article_db (filter_by title)            │
    │ LANGKAH 5: Simpan ke article_db + sinkronisasi ke Article analytics │
    │ LANGKAH 6: Return dict respons { success, action, article }         │
    └─────────────────────────────────────────────────────────────────────┘

    DETAIL LANGKAH 5 (Penyimpanan):
    - Teks artikel:
        * full_text=True  → page.text (teks lengkap artikel, bisa sangat panjang)
        * full_text=False → page.summary (ringkasan ~1-3 paragraf, lebih ringkas)
    - Author diset otomatis: "Wikipedia ({lang})" → misal "Wikipedia (id)"
    - Sinkronisasi ke Article (analytics_article):
        * Cek apakah judul sudah ada di analytics_article.
        * Jika belum, buat record baru dengan category_name dan author yang sama.
        * Ini memastikan artikel baru dari Wikipedia langsung masuk ke dashboard analitik.

    PARAMETER:
        topic_title   (str):      Judul halaman Wikipedia.
        category_name (str):      Kategori artikel. Default: 'Umum'.
        user_id       (int|None): ID user yang mengimpor. None = impor sistem.
        lang          (str):      Kode bahasa Wikipedia. Default: 'id'.
        full_text     (bool):     True = simpan teks lengkap, False = ringkasan.

    RETURN:
        dict: {
            'success' (bool): True jika berhasil atau sudah ada, False jika error.
            'action'  (str):  'created' | 'exists' | 'not_found' | 'error'.
            'message' (str):  Pesan deskriptif.
            'article' (dict): Data artikel yang disimpan (jika success=True).
        }
    """
    # ── LANGKAH 1: Inisialisasi client ──────────────────────────────────────
    wiki = init_wiki(lang)

    # ── LANGKAH 2: Ambil page object ────────────────────────────────────────
    page = wiki.page(topic_title)

    # ── LANGKAH 3: Validasi keberadaan halaman & Fallback Pencarian ─────────
    if not page.exists():
        # Coba cari dengan search API jika pencarian eksak gagal (misal karena huruf kecil/besar)
        search_results = wiki.search(topic_title, limit=1)
        if search_results.pages:
            # Ambil judul dari hasil pertama
            first_title = list(search_results.pages.keys())[0]
            page = wiki.page(first_title)
        
        if not page.exists():
            return {
                'success': False,
                'action': 'not_found',
                'message': f"Halaman Wikipedia '{topic_title}' tidak ditemukan.",
                'article': None
            }

    # ── LANGKAH 4: Cek duplikasi artikel ────────────────────────────────────
    existing = Article.query.filter_by(title=page.title).first()
    if existing:
        return {
            'success': True,
            'action': 'exists',
            'message': f"Artikel '{page.title}' sudah ada di database.",
            'article': {
                'id': existing.id,
                'title': existing.title,
                'author': existing.author,
                'description': existing.description,
                'description_preview': (existing.description or '')[:200] + '...'
                               if existing.description and len(existing.description) > 200
                               else existing.description
            }
        }

    # ── LANGKAH 5: Simpan ke database ───────────────────────────────────────
    try:
        content_text = page.text if full_text else page.summary
        author_label = f"Wikipedia ({lang})"

        # Simpan ke model Article terpadu (konten + analitik)
        new_article = Article(
            title=page.title,
            author=author_label,
            category=category_name,
            description=content_text,
            user_id=user_id,
            published_at=datetime.utcnow()
        )
        db.session.add(new_article)
        db.session.commit()

        # ── LANGKAH 6: Return respons sukses ────────────────────────────────
        return {
            'success': True,
            'action': 'created',
            'message': f"Artikel '{page.title}' berhasil diimpor dari Wikipedia ({lang}).",
            'article': {
                'id': new_article.id,
                'title': new_article.title,
                'author': new_article.author,
                'source_url': page.fullurl or f"https://{lang}.wikipedia.org/wiki/{page.title.replace(' ', '_')}",
                'category': category_name,
                'description': content_text,
                'description_preview': (content_text[:200] + '...')
                                       if len(content_text) > 200 else content_text
            }
        }

    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'action': 'error',
            'message': f"Gagal menyimpan artikel: {str(e)}",
            'article': None
        }


# ─────────────────────────────────────────────────────────────────────────────
# FUNGSI 5: batch_import_wiki
# ─────────────────────────────────────────────────────────────────────────────

def batch_import_wiki(
    topics: list,
    category_name: str = "Umum",
    user_id: int | None = None,
    lang: str = DEFAULT_LANG
) -> dict:
    """
    Mengimpor sekumpulan topik Wikipedia ke database secara batch.

    ALGORITMA:
    - Iterasi setiap topik dalam list `topics`.
    - Panggil fetch_and_store_wiki() untuk setiap topik.
    - Kumpulkan statistik:
        * created : Jumlah artikel baru yang berhasil diimpor.
        * skipped : Jumlah artikel yang sudah ada (duplikat).
        * failed  : Jumlah artikel yang gagal (tidak ditemukan / error DB).
    - Kumpulkan detail hasil setiap topik dalam list `results`.
    - Return dict statistik + detail hasil.

    PARAMETER:
        topics        (list[str]): List judul halaman Wikipedia yang akan diimpor.
        category_name (str):       Kategori untuk semua artikel. Default: 'Umum'.
        user_id       (int|None):  ID user yang mengimpor. None = impor sistem.
        lang          (str):       Kode bahasa Wikipedia. Default: 'id'.

    RETURN:
        dict: {
            'success' (bool): True jika proses selesai (meski ada yang gagal).
            'stats': {
                'total'   (int): Total topik yang diproses.
                'created' (int): Jumlah artikel baru.
                'skipped' (int): Jumlah duplikat yang dilewati.
                'failed'  (int): Jumlah yang gagal.
            },
            'results' (list[dict]): Detail hasil setiap topik.
        }

    CONTOH PENGGUNAAN:
        result = batch_import_wiki(
            topics=["Candi Borobudur", "Kecerdasan buatan", "Batik"],
            category_name="Budaya",
            user_id=1,
            lang="id"
        )
        print(result['stats'])
        # → { 'total': 3, 'created': 2, 'skipped': 1, 'failed': 0 }
    """
    stats = {'total': len(topics), 'created': 0, 'skipped': 0, 'failed': 0}
    results = []

    for topic in topics:
        result = fetch_and_store_wiki(
            topic_title=topic,
            category_name=category_name,
            user_id=user_id,
            lang=lang
        )
        results.append({'topic': topic, **result})

        # Akumulasi statistik berdasarkan action
        if result['action'] == 'created':
            stats['created'] += 1
        elif result['action'] == 'exists':
            stats['skipped'] += 1
        else:
            # 'not_found' atau 'error'
            stats['failed'] += 1

    return {
        'success': True,
        'stats': stats,
        'results': results
    }