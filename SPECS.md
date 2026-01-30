# 🏃‍♂️ Run-Finder - Cahier des Charges Technique

## 1. Vue d'ensemble

**Run-Finder** est une application web permettant aux sportifs de trouver des événements (courses à pied, trails, marathons) autour d'une position géographique donnée.

**Objectif Portfolio :** Démontrer une expertise en **Géomatique Web (GIS)**, manipulation de **PostgreSQL/PostGIS**, et automatisation de traitement de données (**ETL**).

---

## 2. Architecture Technique

### 2.1 Stack Technologique

- **Frontend :** Next.js 14+ (App Router), Tailwind CSS.
- **Cartographie :** React-Leaflet (Librairie Open Source basée sur OpenStreetMap).
- **Backend :** Next.js API Routes (Serverless functions).
- **Base de Données :** PostgreSQL avec extension **PostGIS**.
- **ORM :** Prisma (Support natif ou requêtes brutes pour les fonctions spatiales).
- **Infra :** Docker Compose, Caddy (Reverse Proxy), CI/CD GitHub Actions.

### 2.2 Infrastructure Docker

- **Conteneur App :** Node.js (Next.js).
- **Conteneur DB :** Image `postgis/postgis:16-3.4-alpine`.
- **Volume :** Persistance des données PostgreSQL (`pgdata`).

---

## 3. Modèle de Données (Schéma BDD)

La table principale `Race` est enrichie pour stocker les plages de distance et de dénivelé.

### Table `Race`

| Champ           | Type SQL                   | Description                                                  |
| :-------------- | :------------------------- | :----------------------------------------------------------- |
| `id`            | SERIAL (PK)                | Identifiant interne.                                         |
| `external_id`   | VARCHAR (Unique)           | ID unique source (ex: "datagouv_12345") pour l'upsert.       |
| `name`          | VARCHAR                    | Nom de l'événement (ex: "Eco-Trail de Paris").               |
| `date`          | TIMESTAMP                  | Date de l'événement.                                         |
| `city`          | VARCHAR                    | Ville de départ.                                             |
| `location`      | **GEOGRAPHY(Point, 4326)** | Coordonnées GPS. Indexé via **GIST**.                        |
| `types`         | **TEXT[]**                 | Tags des types (ex: `['trail', 'road']`).                    |
| `min_km`        | DECIMAL                    | Distance la plus courte proposée.                            |
| `max_km`        | DECIMAL                    | Distance la plus longue proposée.                            |
| `min_dplus`     | INTEGER                    | Dénivelé positif min (ex: 100).                              |
| `max_dplus`     | INTEGER                    | Dénivelé positif max (ex: 2500).                             |
| `raw_distances` | JSONB                      | Détail brut (ex: `[{"km": 20, "dplus": 1000}, {"km": 10}]`). |
| `url`           | VARCHAR                    | Lien inscription/infos.                                      |
| `source`        | VARCHAR                    | Origine de la donnée.                                        |

---

## 4. Fonctionnalités (MVP)

### 4.1 Interface Utilisateur (Frontend)

1. **Géolocalisation & Recherche :**
   - Bouton "Autour de moi" (API Navigateur).
   - Recherche par ville (Autocomplétion via API Adresse Gouv).
   - Slider "Rayon" (10km à 200km).
2. **Filtres Avancés :**
   - **Type :** Checkboxes (Route, Trail, Triathlon, Autre).
   - **Distance :** Slider double "Min - Max" (ex: 10km - 42km).
   - **Dénivelé (D+) :** Slider double ou seuils (ex: "Min 500m D+").
   - **Date :** Sélecteur "À partir de...".
3. **Carte Interactive :**
   - Marqueurs cliquables.
   - **Clustering :** Regroupement des points proches.
   - Popup résumée (Nom, Date, Type, Max D+).
4. **Liste synchronisée :**
   - Cartes affichées sous la map ou sidebar.
   - Tri par proximité géographique.

### 4.2 API Backend (`GET /api/races/search`)

L'API traduit les filtres front en requête SQL PostGIS dynamique.

- **Paramètres :** `lat`, `lng`, `radius`, `types`, `min_dist`, `max_dist`, `min_dplus`, `max_dplus`.
- **Logique SQL (Pseudo-code) :**

  ```sql
  SELECT *, ST_Distance(location, user_point) as dist
  FROM races
  WHERE ST_DWithin(location, user_point, radius_meters)
  AND types && ARRAY[selected_types]
  AND max_km >= user_min_dist AND min_km <= user_max_dist
  AND max_dplus >= user_min_dplus -- Filtre Dénivelé
  ORDER BY dist ASC;
  ```

---

## 5. Stratégie d'Import (ETL & Classification)

Le script d'import (`scripts/import.ts`) doit maintenant parser les dénivelés.

### 5.1 Source

- **Source :** `data.gouv.fr` (Fichier CSV des courses hors stade).

### 5.2 Algorithme de Traitement

Pour chaque ligne du CSV :

1. **Nettoyage & Géocodage :** (Idem précédent).
2. **Classification Heuristique (Regex) :**
   - _Détection Type :_ (Idem précédent).
   - _Extraction Distances :_ Scanner motifs `XXkm`.
   - _Extraction Dénivelé (Nouveau) :_
     - Scanner le nom de la course pour trouver les motifs : `\d+D\+`, `\d+m D\+`, `\d+ d\+`.
     - Ex: "Trail du Ventoux 46km 2800D+" -> `max_dplus = 2800`.
     - Ex: "10km plat" -> `max_dplus = 0` (ou null).
3. **Sauvegarde (Upsert) :**
   - Mise à jour des colonnes `min_dplus` et `max_dplus`.

---

## 6. Roadmap de Développement

### Phase 1 : Socle Technique (Jours 1-2)

- [ ] Initialiser Repo Git & Projet Next.js.
- [ ] Docker Compose : App + **PostGIS**.
- [ ] Prisma : Définir le schéma `Race` (avec D+).
- [ ] Créer un script de seed avec données variées (Plat vs Montagne).

### Phase 2 : Backend & Intelligence (Jours 3-4)

- [ ] Coder l'API de recherche spatiale.
- [ ] Développer le script d'ETL (Regex Distance ET Dénivelé).
- [ ] Tester l'import sur un vrai fichier Open Data.

### Phase 3 : Frontend & Carto (Jours 5-6)

- [ ] Intégrer React-Leaflet.
- [ ] Créer les filtres UI (Distance, D+) et connecter à l'API.
- [ ] Afficher les infos D+ dans les Popups et les Cartes.

### Phase 4 : Polish & Deploy (Jour 7)

- [ ] UI/UX : Responsive design.
- [ ] Déploiement CI/CD sur VPS.
