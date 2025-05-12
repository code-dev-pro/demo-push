# Démo de Notifications In-App et Push

Cette application de démonstration montre comment implémenter des notifications in-app et des notifications push dans une application React avec Vite. Elle utilise un serveur Express pour gérer les notifications push.

## Fonctionnalités

Cette démo prend en charge trois types de notifications :

1. **Notifications in-app** : Affichées uniquement à l'intérieur de l'application via react-toastify (toasts)
2. **Notifications système** : Notifications natives du système d'exploitation, affichées via l'API Notification du navigateur
3. **Notifications push** : Notifications qui peuvent être reçues même lorsque l'application est fermée, via un service worker et l'API Web Push

Autres fonctionnalités :
- Service worker pour gérer les notifications push en arrière-plan
- Serveur Express pour gérer les abonnements et l'envoi des notifications push
- Interface utilisateur intuitive pour tester les différents types de notifications

## Schéma explicatif des systèmes de notifications

```
+------------------+     +-----------------+     +--------------------+
|                  |     |                 |     |                    |
| NOTIFICATIONS    |     | NOTIFICATIONS   |     | NOTIFICATIONS      |
| IN-APP (TOASTS)  |     | SYSTÈME        |     | PUSH              |
|                  |     |                 |     |                    |
+------------------+     +-----------------+     +--------------------+
        |                        |                         |
        v                        v                         v
+------------------+     +-----------------+     +--------------------+
| React + Toastify |     | API Notification|     | Service Worker     |
| (dans le DOM)    |     | du navigateur   |     | + API Web Push     |
+------------------+     +-----------------+     +--------------------+
        |                        |                         |
        v                        v                         v
+------------------+     +-----------------+     +--------------------+
| Visibles         |     | Visibles hors   |     | Visibles même si  |
| uniquement dans  |     | de l'application|     | l'application est  |
| l'application    |     | mais navigateur |     | fermée            |
| ouverte          |     | doit être ouvert|     |                    |
+------------------+     +-----------------+     +--------------------+
                                                           |
                                                           v
                                                 +--------------------+
                                                 | Serveur Express    |
                                                 | (gère abonnements  |
                                                 | et envoi)          |
                                                 +--------------------+
```

### Flux des notifications push

1. **Abonnement** : L'utilisateur s'abonne aux notifications push via l'API Web Push
2. **Stockage** : Le serveur stocke l'abonnement (endpoint, clés, etc.)
3. **Envoi** : Le serveur envoie une notification via le service de push du navigateur
4. **Réception** : Le service worker reçoit la notification et l'affiche, même si l'application est fermée

### Comparaison des types de notifications

| Type          | Visibilité                    | Technologie                | Persistance             |
|---------------|--------------------------------|----------------------------|-------------------------|
| In-App        | Dans l'application uniquement  | React + Toastify           | Disparaissent après un délai |
| Système       | Hors application, navigateur ouvert | API Notification         | Restent jusqu'à interaction |
| Push          | Même avec application fermée   | Service Worker + Web Push  | Restent dans le centre de notifications |

## Prérequis

- Node.js (version 14 ou supérieure)
- npm ou yarn

## Installation

1. Installez les dépendances de l'application React :

```bash
npm install
```

2. Installez les dépendances du serveur Express :

```bash
cd server
npm install
cd ..
```

## Démarrage

1. Démarrez le serveur Express :

```bash
cd server
npm start
```

Le serveur démarrera sur le port 5001. Vous verrez les clés VAPID générées dans la console.

2. Dans un autre terminal, démarrez l'application React :

```bash
npm run dev
```

L'application démarrera sur http://localhost:5173.

## Utilisation

1. Ouvrez l'application dans votre navigateur
2. Cliquez sur "S'abonner aux notifications push" pour autoriser les notifications push
3. Saisissez un titre et un message pour la notification
4. Testez les différents types de notifications :
   - **Notification in-app** : Affiche un toast à l'intérieur de l'application
   - **Notification système** : Affiche une notification native du système d'exploitation
   - **Notification push** : Envoie une notification qui s'affichera même lorsque l'application n'est pas au premier plan ou est fermée

## Notes

- Les notifications push ne fonctionnent que dans les navigateurs modernes qui prennent en charge l'API Web Push
- Les notifications push ne fonctionnent qu'en HTTPS, sauf sur localhost pour le développement
- Pour un déploiement en production, vous devrez générer des clés VAPID persistantes et les stocker de manière sécurisée
