# ArtikelSpace – Miro‑styled Article Management System

## 📖 Overview

`ArtikelSpace` is a Flask‑based web application that lets users **create, read, update and delete** articles, manage their profile, and view **engagement analytics** powered by **Pandas**. The UI follows the **Miro Design System**.

## 🗄️ Database Schema (Models)

1. **User (`data_user`)**: `id`, `username`, `email`, `password`, `role` (admin/user).
2. **Article (`articles`)**: `id`, `title`, `category`, `author`, `description`, `published_at`, `user_id`.
3. **VisitLog (`analytics_visit_log`)**: `id`, `article_id`, `active_time_seconds`, `max_scroll_depth`, `interaction_count`, `is_bounce`, `referrer_source`, `created_at`.

## 🗺️ High‑level Flow

```mermaid
flowchart TD
    A[Start – User opens http://127.0.0.1:5000] --> B{Is user logged in?}
    B -- Yes --> C[Navbar shows Profile, Add Article, Admin (if admin)]
    B -- No --> D[Navbar shows Login / Register]
    C --> E{Select page}
    D --> E
    E -->|Home| F[Landing page]
    E -->|All Articles| G[Article List]
    E -->|Add Article| H[Form – POST /add_articel]
    E -->|Profile| I[Profile page]
    E -->|Admin Dashboard| J[Admin page]
    E -->|Analytics| K[Analytics dashboard]
```

## 🚀 API Endpoints

### Auth (`app/routes/auth.py`)

- `POST /registrasi`: Register user.
- `POST /login`: Login user, set session.
- `GET /logout`: Clear session.

### Article (`app/routes/article.py`)

- `POST /add_articel`: Create article.
- `POST /delete_article/<title>`: Delete article by title (Admin only).
- `GET /get_articles`: Get articles (filter by `title` or `author`, or all).
- `GET /api/wiki/search`: Search Wikipedia.
- `GET /api/wiki/preview`: Preview Wikipedia article.

### Profile & Admin (`app/routes/profile.py`, `app/routes/admin.py`)

- `POST /profil_user`: Get logged-in user profile and their articles.
- `POST /admin_dashboard`: Get all users data.

### Analytics (`app/routes/analytics.py`)

- `GET /analytics`: Analytics UI.
- `GET /api/analytics`: Analytics JSON data.
- `POST /analytics/reseed`: Reseed database with Faker.

## 🛠️ Setup & Run

```bash
pip install -r requirements.txt
flask db upgrade
python -m app.services.seeder
python run.py
```

## 📊 How the Pandas Analytics Work (Real VisitLog Data)

The analytics engine uses Pandas to process raw `VisitLog` data joined with `Article` data. It calculates bounce rates based on active time, scroll depth, and interaction count, and aggregates metrics by category and referrer source.

1. **Data Extraction** – All rows from `analytics_article` (50) and `analytics_visit_log` (5.000) are loaded into two `DataFrame`s.
2. **Data Merging** – `VisitLog` is merged with `Article` via `pd.merge(how='left')` to enrich each visit with `category` and `author`.
3. **Bounce Rate (Strict Logic)** – `is_bounce = (active_time_seconds < 10) AND (interaction_count == 0) AND (max_scroll_depth < 20)` — exactly as stored in DB.
4. **Category Aggregations** – `groupby('category').agg(...)` produces per-category `total_visits`, `avg_active_time`, `bounce_rate`, `avg_scroll`, and `active_time_variance` (σ²).
5. **Linear Regression Trend** – `numpy.polyfit` on daily visit counts over the last 30 days yields slope `m` and direction (`up` / `down` / `flat`).
6. **Referrer Breakdown** – `groupby('referrer_source')` shows traffic share per channel (Organik, Media Sosial, Langsung, Tautan Internal).
7. **Top-5 Articles** – Grouped by `article_id` and sorted by `views` (visit count).
8. **Result** – Returned as a nested dict consumed by `analytics.html` and the JSON API.

### 🗄️ Database Models (SQLAlchemy)

```python
class Article(db.Model):
    __tablename__ = "analytics_article"
    id           = db.Column(db.Integer, primary_key=True)
    title        = db.Column(db.String(255), nullable=False)
    category     = db.Column(db.String(100), nullable=False)  # 5 categories
    author       = db.Column(db.String(255), nullable=False)
    published_at = db.Column(db.DateTime, nullable=False)

class VisitLog(db.Model):
    __tablename__ = "analytics_visit_log"
    id                  = db.Column(db.Integer, primary_key=True)
    article_id          = db.Column(db.Integer, db.ForeignKey("analytics_article.id"))
    active_time_seconds = db.Column(db.Integer, nullable=False)  # 2–600
    max_scroll_depth    = db.Column(db.Integer, nullable=False)  # 0–100
    interaction_count   = db.Column(db.Integer, nullable=False)  # 0–15
    is_bounce           = db.Column(db.Boolean, nullable=False)
    referrer_source     = db.Column(db.String(100), nullable=False)
    created_at          = db.Column(db.DateTime, nullable=False)
```

Seeder (`app/services/seeder.py`) uses `Faker('id_ID')` + `random`, commits per 1.000 rows, and enforces the bounce rule exactly.

---

## 📌 Future Improvements

- **Real tracking** (page‑view events, time‑on‑page) instead of simulated numbers.
- **Export** of analytics to CSV/Excel.
- **Role‑based access control** for the analytics page (admin‑only or premium users).
- **Unit tests** for the service layer (`pytest` + `flask-testing`).
- **Dockerisation** for easy deployment.

---

## 📜 License

This project is for educational purposes. Feel free to adapt the Miro design tokens and the analytics logic for your own projects.
