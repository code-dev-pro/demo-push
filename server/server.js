import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import webpush from 'web-push';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5177', 'https://demo-push-notifications.vercel.app', 'https://demo-push-o2fiphz55-laurenthenemanedukeasycoms-projects.vercel.app', 'https://demo-push.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(bodyParser.json());

// Route de base pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ message: 'Serveur de notifications push opérationnel' });
});

// Utiliser des clés VAPID fixes au lieu de les générer à chaque démarrage
// Dans un environnement de production, ces clés devraient être stockées de manière sécurisée
const vapidKeys = {
  publicKey: 'BNLjvulQ-v3LvcNqGZOset2E55WY5XD4JKuNxeW3x2k6L_SHvVK0LlYMQDTIu_zH9GuoifWGHeRpzL85hc0bHWs',
  privateKey: 'dgPwKs3O5BYdxSEo4Av8nMsaPjEiffvTogA-74O47yI'
};

// Configuration des clés VAPID pour web-push
webpush.setVapidDetails(
  'mailto:exemple@domaine.com', // Remplacer par une adresse e-mail valide
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Stocker les abonnements (en mémoire pour cette démo)
// Dans un environnement de production, utilisez une base de données
const subscriptions = [];

// Variable pour activer/désactiver les notifications automatiques
let autoNotificationsEnabled = true; // Activé par défaut
let autoNotificationsInterval = null;
const AUTO_NOTIFICATION_DELAY = 10000; // 10 secondes

// Route pour récupérer la clé publique VAPID
app.get('/api/vapidPublicKey', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Route pour s'abonner aux notifications
app.post('/api/subscribe', (req, res) => {
  try {
    const subscription = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Données d\'abonnement invalides' });
    }
    
    // Stocker l'abonnement
    subscriptions.push(subscription);
    
    // Envoyer une notification de confirmation
    const payload = JSON.stringify({
      title: 'Bienvenue!',
      body: 'Vous êtes maintenant abonné aux notifications push!',
      icon: '/notification-icon.png'
    });
    
    webpush.sendNotification(subscription, payload)
      .then(() => {
      
        res.status(200).json({ success: true, message: 'Notification envoyée avec succès' });
      })
      .catch(err => {
       
        res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de la notification', error: err.message });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors du traitement de la requête d\'abonnement', error: error.message });
  }
});

// Fonction pour envoyer une notification à tous les abonnés
const sendNotificationToAll = async (title, body) => {
  if (!title || !body) {
    return { success: false, message: 'Titre et corps requis pour la notification' };
  }
  
  if (subscriptions.length === 0) {
    
    return { success: true, message: 'Aucun abonné disponible, mais la requête a été traitée avec succès', sent: 0 };
  }
  
  const payload = JSON.stringify({
    title,
    body,
    icon: '/notification-icon.png'
  });
  
  try {
    const sendPromises = subscriptions.map(subscription => 
      webpush.sendNotification(subscription, payload)
        .catch(err => {
          // Si l'abonnement n'est plus valide, on pourrait le supprimer ici
          return err;
        })
    );
    
    await Promise.all(sendPromises);
    return { success: true, message: 'Notifications envoyées avec succès' };
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications:', error);
    return { success: false, message: 'Erreur lors de l\'envoi des notifications' };
  }
};

// Route pour envoyer une notification à tous les abonnés
app.post('/api/notify', async (req, res) => {
  const { title, body } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ success: false, message: 'Le titre et le corps sont requis' });
  }
  
  const result = await sendNotificationToAll(title, body);
  
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

// Route pour activer/désactiver les notifications automatiques
app.post('/api/auto-notify', (req, res) => {
  const { enabled, interval } = req.body;
  
  if (enabled) {
    // Activer les notifications automatiques
    if (!autoNotificationsEnabled) {
      autoNotificationsEnabled = true;
      
      // Intervalle en millisecondes (par défaut 10 secondes)
      const notifyInterval = interval || 10000;
      
      autoNotificationsInterval = setInterval(() => {
        if (subscriptions.length > 0) {
          const now = new Date().toLocaleTimeString();
          sendNotificationToAll('Notification automatique', `Cette notification a été envoyée automatiquement à ${now}`);
        }
      }, notifyInterval);
      
      res.status(200).json({ success: true, message: 'Notifications automatiques activées' });
    } else {
      res.status(200).json({ success: true, message: 'Les notifications automatiques sont déjà activées' });
    }
  } else {
    // Désactiver les notifications automatiques
    if (autoNotificationsEnabled) {
      autoNotificationsEnabled = false;
      
      if (autoNotificationsInterval) {
        clearInterval(autoNotificationsInterval);
        autoNotificationsInterval = null;
      }
      
      res.status(200).json({ success: true, message: 'Notifications automatiques désactivées' });
    } else {
      res.status(200).json({ success: true, message: 'Les notifications automatiques sont déjà désactivées' });
    }
  }
});

// Port d'écoute
const PORT = 5001;

// Démarrer le serveur HTTP
app.listen(PORT, () => {
  // Démarrer automatiquement l'intervalle de notifications
  if (autoNotificationsEnabled) {
    autoNotificationsInterval = setInterval(() => {
      if (subscriptions.length > 0) {
        const now = new Date().toLocaleTimeString();
        
        sendNotificationToAll('Notification automatique', `Cette notification a été envoyée automatiquement à ${now}`);
      } 
    }, AUTO_NOTIFICATION_DELAY);
   
  }
});
