"""
Seeder Script — Generate 5 User, 50 Artikel (Terpadu), dan 5.000 Log Kunjungan realistis.

Menggunakan Faker & random. Commit per 1.000 baris agar hemat memori.
Jalankan:
    python -m app.services.seeder
atau dari Flask shell:
    from app.services.seeder import run_seeder
    run_seeder()
"""

import random
from datetime import datetime, timedelta

from faker import Faker
from werkzeug.security import generate_password_hash

from app import create_app
from app.models import db, User, Article, VisitLog, ReadingSession  # Pastikan User diimpor

fake = Faker('id_ID')  # Locale Indonesia

# ─── Konstanta ────────────────────────────────────────────────────────
CATEGORIES = ['Berita Pendek', 'Teknologi', 'Sejarah', 'Gaya Hidup', 'Sains']
REFERRER_SOURCES = ['Organik (Google)', 'Media Sosial', 'Langsung', 'Tautan Internal']

TOTAL_USERS    = 5
TOTAL_ARTICLES = 50
TOTAL_VISITS   = 5_000
BATCH_SIZE     = 1_000  # commit setiap 1.000 baris


def _seed_users():
    """Generate 5 user dummy untuk direlasikan ke artikel."""
    users = []
    
    # Buat 1 Admin statis agar mudah untuk testing login
    admin = User(
        username="admin_utama",
        email="admin@artikelspace.local",
        password=generate_password_hash("password123"),
        role="admin",
        is_verified=True
    )
    users.append(admin)

    # Buat sisa user secara acak
    for _ in range(TOTAL_USERS - 1):
        user = User(
            username=fake.unique.user_name(),
            email=fake.unique.email(),
            password=generate_password_hash("password123"),
            role="user",
            is_verified=True
        )
        users.append(user)

    db.session.add_all(users)
    db.session.commit()
    print(f" {len(users)} user berhasil di-seed.")
    return users


def _seed_articles(users):
    """Generate 50 artikel lengkap dengan deskripsi dan relasi user."""
    articles = []
    now = datetime.utcnow()
    user_ids = [u.id for u in users]

    for _ in range(TOTAL_ARTICLES):
        published = now - timedelta(days=random.randint(0, 90))
        article = Article(
            title=fake.sentence(nb_words=random.randint(4, 10)).rstrip('.'),
            category=random.choice(CATEGORIES),
            author=fake.name(),
            description=fake.text(max_nb_chars=1000),  # Mengisi teks paragraf dummy
            user_id=random.choice(user_ids),           # Mengikat artikel ke user dummy
            published_at=published,
        )
        articles.append(article)

    db.session.add_all(articles)
    db.session.commit()
    print(f" {len(articles)} artikel berhasil di-seed.")
    return articles


def _seed_visit_logs(articles):
    """Generate 5.000 log kunjungan tersebar 30 hari terakhir."""
    now = datetime.utcnow()
    article_ids = [a.id for a in articles]
    buffer_visit = []
    buffer_session = []

    for i in range(1, TOTAL_VISITS + 1):
        # Sekitar 20% pengunjung berpotensi bounce
        is_quick_exit_candidate = random.random() < 0.20

        if is_quick_exit_candidate:
            active_time = random.randint(2, 9)
            interactions = 0
            scroll_depth = random.randint(0, 19)
        else:
            active_time = random.randint(10, 600)
            interactions = random.randint(0, 15)
            scroll_depth = random.randint(0, 100)

        # Logika bounce rate sesuai spesifikasi
        is_bounce = (active_time < 10) and (interactions == 0) and (scroll_depth < 20)
        
        created_at = now - timedelta(
            days=random.randint(0, 29),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
            seconds=random.randint(0, 59),
        )
        
        article_id = random.choice(article_ids)
        referrer = random.choice(REFERRER_SOURCES)

        visit = VisitLog(
            article_id = article_id,
            active_time_seconds = active_time,
            max_scroll_depth = scroll_depth,
            interaction_count = interactions,
            is_bounce = is_bounce,
            referrer_source = referrer,
            created_at = created_at,
        ) 
        buffer_visit.append(visit)
        
        # Buat juga ReadingSession untuk analitik baru
        import uuid
        session_id = str(uuid.uuid4())
        visitor_id = f"v_{random.randint(1000,9999)}"
        
        rs = ReadingSession(
            article_id=article_id,
            visitor_id=visitor_id,
            session_id=session_id,
            started_at=created_at,
            last_seen_at=created_at + timedelta(seconds=active_time),
            ended_at=created_at + timedelta(seconds=active_time),
            active_seconds=active_time,
            max_scroll_depth=scroll_depth,
            interaction_count=interactions,
            is_bounce=is_bounce,
            referrer_source=referrer,
            created_at=created_at
        )
        buffer_session.append(rs)

        # Commit per batch
        if i % BATCH_SIZE == 0:
            db.session.add_all(buffer_visit)
            db.session.add_all(buffer_session)
            db.session.commit()
            print(f" {i:,} / {TOTAL_VISITS:,} log kunjungan di-commit …")
            buffer_visit = []
            buffer_session = []

    # Sisa yang belum di-commit
    if buffer_visit:
        db.session.add_all(buffer_visit)
        db.session.add_all(buffer_session)
        db.session.commit()
        print(f" {TOTAL_VISITS:,} / {TOTAL_VISITS:,} log kunjungan di-commit (selesai).")


def run_seeder():
    """Entry-point utama seeder."""
    print("\nMemulai proses seeding data analitik …")

    # Hapus data lama dengan urutan Child -> Parent untuk menghindari error FK
    ReadingSession.query.delete()
    VisitLog.query.delete()
    Article.query.delete()
    User.query.delete()
    db.session.commit()
    print("Data lama dibersihkan.")

    # Jalankan proses seeding
    users = _seed_users()
    articles = _seed_articles(users)
    _seed_visit_logs(articles)

    # Kalkulasi hasil untuk report
    total_bounces = VisitLog.query.filter_by(is_bounce=True).count()
    print(f"\nSeeding selesai!")
    print(f"   User     : {User.query.count()}")
    print(f"   Artikel  : {Article.query.count()}")
    print(f"   Kunjungan: {VisitLog.query.count()}")
    print(f"   Bounce   : {total_bounces} ({total_bounces / TOTAL_VISITS * 100:.1f}%)\n")


# ─── Jalankan langsung: python -m app.services.seeder ─────────────────
if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()  # Pastikan semua tabel ada
        run_seeder()