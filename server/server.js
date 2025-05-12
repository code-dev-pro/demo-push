import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import webpush from 'web-push';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Générer des clés VAPID pour les notifications push
// Dans un environnement de production, ces clés devraient être stockées de manière sécurisée
const vapidKeys = webpush.generateVAPIDKeys();

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
let autoNotificationsEnabled = false;
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
  if (!title || !body || subscriptions.length === 0) {
    console.log('Impossible d\'envoyer des notifications: titre/corps manquant ou aucun abonné');
    return { success: false, message: 'Titre/corps manquant ou aucun abonné' };
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
  } catch (err) {
    console.error('Erreur lors de l\'envoi des notifications:', err);
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
      
      // Intervalle en millisecondes (par défaut 30 secondes)
      const notifyInterval = interval || 30000;
      
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

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
