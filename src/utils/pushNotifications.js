// Utilitaire pour gérer les notifications push

// Fonction pour vérifier si les notifications push sont supportées
export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Fonction pour demander la permission de notifications
export async function askUserPermission() {
  return await Notification.requestPermission();
}

// Fonction pour enregistrer le service worker
export async function registerServiceWorker() {
  if (!isPushNotificationSupported()) {
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    return registration;
  } catch {
    return null;
  }
}

// Fonction pour obtenir la clé publique VAPID du serveur
export async function getVapidPublicKey() {
  try {
    const response = await fetch('http://localhost:5001/api/vapidPublicKey');
    const data = await response.json();
    return data.publicKey;
  } catch {
    return null;
  }
}

// Fonction pour convertir la clé publique en Uint8Array
function urlBase64ToUint8Array(base64String) {
  // Ajouter le padding si nécessaire
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  
  // Remplacer les caractères URL-safe par les caractères base64 standard
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Décoder la chaîne base64
  const rawData = window.atob(base64);
  
  // Convertir en Uint8Array
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Fonction pour s'abonner aux notifications push
export async function subscribeToPushNotifications() {
  if (!isPushNotificationSupported()) {
    return null;
  }
  
  try {
    // Demander la permission
    const permission = await askUserPermission();
    
    if (permission !== 'granted') {
      throw new Error('Permission refusée');
    }
    
    // Enregistrer le service worker
    const registration = await registerServiceWorker();
    
    if (!registration) {
      throw new Error('Échec de l\'enregistrement du service worker');
    }
    
    // Obtenir la clé publique VAPID
    const vapidPublicKey = await getVapidPublicKey();
    
    if (!vapidPublicKey) {
      throw new Error('Échec de la récupération de la clé publique VAPID');
    }
    
    // Convertir la clé publique
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    
    // Vérifier si le navigateur est déjà abonné
    const existingSubscription = await registration.pushManager.getSubscription();
    
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
    }
    
    // S'abonner aux notifications push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });
    
    // Envoyer l'abonnement au serveur
    const response = await fetch('http://localhost:5001/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    });
    
    await response.json();
    
    return subscription;
  } catch {
    return null;
  }
}

// Fonction pour envoyer une notification in-app (toast)
export function sendInAppNotification(title, message, toast) {
  toast.info(
    `${title}\n${message}`,
    {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    }
  );
}

// Fonction pour envoyer une notification système locale
export async function sendSystemNotification(title, message) {
  // Vérifier si les notifications sont supportées
  if (!('Notification' in window)) {
    return false;
  }
  
  // Vérifier la permission actuelle
  let permission = Notification.permission;
  
  // Si la permission n'est pas accordée, la demander
  if (permission !== 'granted') {
    permission = await Notification.requestPermission();
  }
  
  // Si la permission est accordée, envoyer la notification
  if (permission === 'granted') {
    // Essayer d'abord d'utiliser le service worker si disponible
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        // Utiliser le service worker pour afficher la notification
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification(title, {
          body: message,
          icon: '/notification-icon.png',
          badge: '/notification-icon.png',
          vibrate: [200, 100, 200],
          tag: 'demo-notification',
          requireInteraction: true,
          silent: false
        });
        
        return true;
      } catch {
        return false;
      }
    } else {
      try {
        // Utiliser l'API Notification directement si le service worker n'est pas disponible
        const notification = new Notification(title, {
          body: message,
          icon: '/notification-icon.png',
          badge: '/notification-icon.png',
          vibrate: [200, 100, 200],
          tag: 'demo-notification',
          requireInteraction: true,
          silent: false
        });
        
        // Gérer le clic sur la notification
        notification.onclick = function() {
          window.focus();
          notification.close();
        };
        
        return true;
      } catch {
        return false;
      }
    }
  } else {
    return false;
  }
}

// Fonction pour envoyer une notification push à tous les abonnés via le serveur
export async function sendPushNotification(title, body) {
  try {
    const response = await fetch('http://localhost:5001/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body })
    });
    
    const data = await response.json();
    return data;
  } catch {
    return { success: false, message: 'Erreur lors de l\'envoi de la notification push' };
  }
}
