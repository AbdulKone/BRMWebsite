// Types pour le service worker
interface ServiceWorkerMessage {
  type: string;
  payload?: any;
}

interface CacheInfo {
  cacheSize: number;
}

interface NetworkStatus {
  isOnline: boolean;
  lastOnline?: Date;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean;
  private networkCallbacks: Set<(isOnline: boolean) => void> = new Set();
  private updateBanner: HTMLElement | null = null;
  
  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
    this.setupNetworkListeners();
  }
  
  async register(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('[SW Manager] Service Worker non supporté');
      return false;
    }
    
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('[SW Manager] Service Worker enregistré:', this.registration.scope);
      
      // Écouter les mises à jour
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdateFound();
      });
      
      // Vérifier s'il y a déjà un SW en attente
      if (this.registration.waiting) {
        this.showUpdateAvailable();
      }
      
      // Écouter les changements de contrôleur
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW Manager] Nouveau service worker actif');
      });
      
      return true;
    } catch (error) {
      console.error('[SW Manager] Erreur d\'enregistrement:', error);
      return false;
    }
  }
  
  private handleUpdateFound(): void {
    if (!this.registration) return;
    
    const newWorker = this.registration.installing;
    if (!newWorker) return;
    
    console.log('[SW Manager] Nouvelle version en cours d\'installation');
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        console.log('[SW Manager] Nouvelle version prête');
        this.showUpdateAvailable();
      }
    });
  }
  
  private showUpdateAvailable(): void {
    // Éviter les doublons
    if (this.updateBanner) {
      return;
    }
    
    // Afficher une notification à l'utilisateur
    this.updateBanner = document.createElement('div');
    this.updateBanner.className = 'fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 z-50 text-center shadow-lg';
    this.updateBanner.innerHTML = `
      <div class="flex items-center justify-center space-x-4">
        <p class="text-sm font-medium">Une nouvelle version est disponible !</p>
        <button id="sw-update-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors">
          Mettre à jour
        </button>
        <button id="sw-dismiss-btn" class="text-white hover:text-gray-200 text-lg font-bold">
          ✕
        </button>
      </div>
    `;
    
    document.body.appendChild(this.updateBanner);
    
    // Gérer les clics avec des IDs uniques
    const updateBtn = document.getElementById('sw-update-btn');
    const dismissBtn = document.getElementById('sw-dismiss-btn');
    
    updateBtn?.addEventListener('click', () => {
      this.applyUpdate();
    });
    
    dismissBtn?.addEventListener('click', () => {
      this.dismissUpdate();
    });
    
    // Auto-dismiss après 10 secondes
    setTimeout(() => {
      if (this.updateBanner) {
        this.dismissUpdate();
      }
    }, 10000);
  }
  
  private dismissUpdate(): void {
    if (this.updateBanner) {
      this.updateBanner.remove();
      this.updateBanner = null;
    }
  }
  
  async applyUpdate(): Promise<void> {
    if (!this.registration?.waiting) {
      console.warn('[SW Manager] Aucune mise à jour en attente');
      return;
    }
    
    try {
      // Dire au SW en attente de prendre le contrôle
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' } as ServiceWorkerMessage);
      
      // Nettoyer la bannière
      this.dismissUpdate();
      
      // Afficher un indicateur de chargement
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'fixed top-0 left-0 right-0 bg-green-600 text-white p-2 z-50 text-center text-sm';
      loadingDiv.textContent = 'Mise à jour en cours...';
      document.body.appendChild(loadingDiv);
      
      // Recharger la page une fois que le nouveau SW prend le contrôle
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      }, { once: true });
      
    } catch (error) {
      console.error('[SW Manager] Erreur lors de la mise à jour:', error);
    }
  }
  
  async getCacheSize(): Promise<number> {
    if (!this.registration?.active) {
      console.warn('[SW Manager] Aucun service worker actif');
      return 0;
    }
    
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      const timeout = setTimeout(() => {
        reject(new Error('Timeout lors de la récupération de la taille du cache'));
      }, 5000);
      
      messageChannel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        const data = event.data as CacheInfo;
        resolve(data.cacheSize || 0);
      };
      
      const message: ServiceWorkerMessage = { type: 'GET_CACHE_SIZE' };
      this.registration!.active!.postMessage(message, [messageChannel.port2]);
    });
  }
  
  async clearCache(): Promise<void> {
    if (!('caches' in window)) {
      console.warn('[SW Manager] Cache API non supportée');
      return;
    }
    
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[SW Manager] Cache vidé:', cacheNames.length, 'caches supprimés');
    } catch (error) {
      console.error('[SW Manager] Erreur lors du vidage du cache:', error);
      throw error;
    }
  }
  
  isOnline(): boolean {
    return navigator.onLine;
  }
  
  getNetworkStatus(): NetworkStatus {
    return {
      isOnline: navigator.onLine,
      lastOnline: navigator.onLine ? new Date() : undefined
    };
  }
  
  onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    this.networkCallbacks.add(callback);
    
    // Retourner une fonction de nettoyage
    return () => {
      this.networkCallbacks.delete(callback);
    };
  }
  
  private setupNetworkListeners(): void {
    const handleOnline = () => {
      console.log('[SW Manager] Connexion rétablie');
      this.networkCallbacks.forEach(callback => callback(true));
    };
    
    const handleOffline = () => {
      console.log('[SW Manager] Connexion perdue');
      this.networkCallbacks.forEach(callback => callback(false));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }
  
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }
    
    try {
      const result = await this.registration.unregister();
      console.log('[SW Manager] Service Worker désenregistré');
      this.registration = null;
      return result;
    } catch (error) {
      console.error('[SW Manager] Erreur lors du désenregistrement:', error);
      return false;
    }
  }
  
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
  
  isRegistered(): boolean {
    return this.registration !== null;
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();
export type { ServiceWorkerMessage, CacheInfo, NetworkStatus };