# 🍷 Vinocarto

🖥️ **Frontend** : [https://vinocarto.pages.dev](https://vinocarto.pages.dev)
> ⏳ *Note : lors de la première connexion, le site peut mettre jusqu’à **2 minutes** à répondre, le temps que Render réveille le backend endormi.*

---

## 🚀 Technologies utilisées

### Frontend
- **Angular 19**
- **Angular Material**
- **SVG interactifs** chargés dynamiquement
- **Déploiement** : Cloudflare Pages (CI/CD via GitHub)

### Backend
- **Java 21 + Spring Boot (multi-modules)**
- **Spring Security** (CORS dynamique, prêt pour auth future)
- **API REST** pour exposer les données des cartes
- **Flyway** pour la gestion des migrations SQL
- **PostgreSQL** (base relationnelle)
- **Déploiement** : Render (hébergement gratuit avec veille automatique)

---

## 🗺️ Fonctionnalités

- 📍 **Jeu "Point and Click"** : retrouvez une appellation sur la carte à partir d’un nom.
- 🧠 **Jeu "Find All"** : nommez toutes les appellations visibles sur une carte.
- 🧠 **Jeu "Recherche Forcée"** : nommez une appellation montrée sur une carte.
- 📚 **Cartes dynamiques** : SVG interactifs avec régions cliquables.
- 🧩 **Filtrage & tri** : explorez les appellations par nom, type, ou région.
- 🧠 **Descriptions pédagogiques** : pour chaque région viticole (en cours d'ajout)

---