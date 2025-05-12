import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'
import {
  isPushNotificationSupported,
  askUserPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  sendInAppNotification,
  sendPushNotification
} from './utils/pushNotifications'

function App() {
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [autoNotificationsEnabled, setAutoNotificationsEnabled] = useState(false);
  
  useEffect(() => {
    // Vérifier si les notifications push sont supportées
    const supported = isPushNotificationSupported();
    setPushSupported(supported);
    
    // Vérifier la permission actuelle
    if (supported) {
      setPushPermission(Notification.permission);
      
      // Enregistrer le service worker
      registerServiceWorker();
    }
  }, []);
  
  // Gérer l'abonnement aux notifications push
  const handleSubscribe = async () => {
    try {
      // Demander la permission si nécessaire
      if (pushPermission !== 'granted') {
        const permission = await askUserPermission();
        setPushPermission(permission);
        
        if (permission !== 'granted') {
          sendInAppNotification(
            'Permission refusée',
            'Vous devez autoriser les notifications pour recevoir des notifications push.',
            toast
          );
          return;
        }
      }
      
      // S'abonner aux notifications push
      const subscription = await subscribeToPushNotifications();
      
      if (subscription) {
        setSubscribed(true);
        sendInAppNotification(
          'Abonnement réussi',
          'Vous êtes maintenant abonné aux notifications push!',
          toast
        );
      } else {
        sendInAppNotification(
          'Échec de l\'abonnement',
          'Une erreur s\'est produite lors de l\'abonnement aux notifications push.',
          toast
        );
      }
    } catch (error) {
      sendInAppNotification(
        'Erreur',
        `Erreur lors de l'abonnement: ${error.message}`,
        toast
      );
    }
  };
  
  // Gérer l'envoi d'une notification in-app
  const handleSendInAppNotification = () => {
    if (!notificationTitle || !notificationBody) {
      toast.warning('Veuillez saisir un titre et un message pour la notification.');
      return;
    }
    
    sendInAppNotification(notificationTitle, notificationBody, toast);
  };
  
  // Gérer l'envoi d'une notification système locale
  const handleSendSystemNotification = async () => {
    if (!notificationTitle || !notificationBody) {
      toast.warning('Veuillez saisir un titre et un message pour la notification.');
      return;
    }
    
    try {
      // Vérifier si les notifications sont supportées
      if (!('Notification' in window)) {
        toast.error('Votre navigateur ne supporte pas les notifications système.');
        return;
      }
      
      // Vérifier la permission actuelle
      if (Notification.permission === 'denied') {
        toast.error(
          'Les notifications sont bloquées par votre navigateur. Veuillez modifier les paramètres de votre navigateur pour autoriser les notifications.'
        );
        return;
      }
      
      // Utiliser directement l'API Notification pour garantir une notification système
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Permission refusée pour les notifications système.');
          return;
        }
      }
      
      // Créer directement une notification système
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Utiliser le service worker pour afficher la notification
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification(notificationTitle, {
          body: notificationBody,
          icon: '/notification-icon.png',
          badge: '/notification-icon.png',
          vibrate: [200, 100, 200],
          tag: 'demo-notification',
          requireInteraction: true,
          silent: false
        });
      } else {
        // Utiliser l'API Notification directement
        const notification = new Notification(notificationTitle, {
          body: notificationBody,
          icon: '/notification-icon.png',
          badge: '/notification-icon.png',
          vibrate: [200, 100, 200],
          tag: 'demo-notification',
          requireInteraction: true,
          silent: false
        });
        
        notification.onclick = function() {
          window.focus();
          notification.close();
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification système:', error);
      toast.error(
        `Erreur: ${error.message}`
      );
    }
  };
  
  // Gérer l'envoi d'une notification push
  const handleSendPushNotification = async () => {
    if (!notificationTitle || !notificationBody) {
      toast.warning('Veuillez saisir un titre et un message pour la notification.');
      return;
    }
    
    try {
      const result = await sendPushNotification(notificationTitle, notificationBody);
      
      if (result.success) {
        sendInAppNotification(
          'Notification envoyée',
          'La notification push a été envoyée avec succès!',
          toast
        );
      } else {
        sendInAppNotification(
          'Échec de l\'envoi',
          `Erreur lors de l'envoi de la notification push: ${result.message}`,
          toast
        );
      }
    } catch (error) {
      sendInAppNotification(
        'Erreur',
        `Erreur lors de l'envoi de la notification push: ${error.message}`,
        toast
      );
    }
  };
  
  // Gérer l'activation/désactivation des notifications automatiques
  const handleToggleAutoNotifications = async () => {
    if (!subscribed) {
      toast.warning('Vous devez d\'abord vous abonner aux notifications push.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5001/api/auto-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !autoNotificationsEnabled })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAutoNotificationsEnabled(!autoNotificationsEnabled);
        toast.success(data.message);
      } else {
        toast.error(`Erreur: ${data.message}`);
      }
    } catch (error) {
      toast.error(`Erreur: ${error.message}`);
    }
  };
  
  return (
    <div className="app-container">
      <ToastContainer />
      
      <h1>Démo de Notifications</h1>
      
      <div className="card">
        <h2>État des Notifications Push</h2>
        <p>
          <strong>Support des notifications push:</strong> {pushSupported ? 'Oui' : 'Non'}
        </p>
        <p>
          <strong>Permission:</strong> {pushPermission}
        </p>
        <p>
          <strong>Abonné:</strong> {subscribed ? 'Oui' : 'Non'}
        </p>
        
        {pushSupported && !subscribed && (
          <button onClick={handleSubscribe} className="btn primary">
            S'abonner aux notifications push
          </button>
        )}
      </div>
      
      <div className="card">
        <h2>Envoyer une Notification</h2>
        
        <div className="form-group">
          <label htmlFor="notification-title">Titre:</label>
          <input
            type="text"
            id="notification-title"
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            placeholder="Titre de la notification"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="notification-body">Message:</label>
          <textarea
            id="notification-body"
            value={notificationBody}
            onChange={(e) => setNotificationBody(e.target.value)}
            placeholder="Message de la notification"
            rows={3}
          />
        </div>
        
        <div className="button-group">
          <button onClick={handleSendInAppNotification} className="btn secondary">
            Envoyer une notification in-app
          </button>
          
          <button onClick={handleSendSystemNotification} className="btn info">
            Envoyer une notification système
          </button>
          
          <button 
            onClick={handleSendPushNotification} 
            className="btn primary"
            disabled={!subscribed}
          >
            Envoyer une notification push
          </button>
        </div>
        
        {subscribed && (
          <div className="auto-notifications">
            <button 
              onClick={handleToggleAutoNotifications} 
              className={`btn ${autoNotificationsEnabled ? 'danger' : 'success'}`}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {autoNotificationsEnabled ? 'Désactiver' : 'Activer'} les notifications push automatiques
            </button>
            {autoNotificationsEnabled && (
              <p className="info-text">
                Des notifications push seront envoyées automatiquement toutes les 10 secondes.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
