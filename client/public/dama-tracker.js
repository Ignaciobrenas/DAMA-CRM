/**
 * DAMA-CRM Web Analytics & Lead Tracker (v1.2.0)
 * Lightweight, privacy-first tracking script for websites, e-commerce and web apps.
 */
(function (window, document) {
  'use strict';

  var DamaTracker = {
    endpoint: null,
    apiKey: null,
    sessionId: null,
    userEmail: null,
    initialized: false,

    init: function (config) {
      if (this.initialized) return;
      this.endpoint = (config && config.endpoint) || (window.location.origin + '/api/lead-capture/pixel');
      this.apiKey = config && config.apiKey;
      this.sessionId = this.getOrCreateSession();
      this.initialized = true;

      // Track initial pageview
      this.track('pageview', {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
      });

      // Bind automatic unload time tracking
      var startTime = Date.now();
      window.addEventListener('beforeunload', function () {
        var durationSeconds = Math.round((Date.now() - startTime) / 1000);
        DamaTracker.track('time_on_page', {
          durationSeconds: durationSeconds,
          path: window.location.pathname,
        });
      });
    },

    identify: function (email, traits) {
      this.userEmail = email;
      try {
        localStorage.setItem('dama_lead_email', email);
      } catch (e) {}
      this.track('identify', {
        email: email,
        traits: traits || {},
      });
    },

    track: function (event, properties) {
      var email = this.userEmail;
      if (!email) {
        try {
          email = localStorage.getItem('dama_lead_email');
        } catch (e) {}
      }

      var payload = {
        event: event,
        sessionId: this.sessionId,
        email: email || undefined,
        timestamp: new Date().toISOString(),
        properties: properties || {},
        device: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
        },
      };

      if (navigator.sendBeacon) {
        var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(this.endpoint, blob);
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', this.endpoint, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        if (this.apiKey) xhr.setRequestHeader('x-dama-key', this.apiKey);
        xhr.send(JSON.stringify(payload));
      }
    },

    trackCart: function (cartData) {
      this.track('cart_abandoned', {
        items: cartData.items || [],
        total: cartData.total || 0,
        currency: cartData.currency || 'EUR',
        cartUrl: window.location.href,
      });
    },

    getOrCreateSession: function () {
      var sid = null;
      try {
        sid = sessionStorage.getItem('dama_session_id');
        if (!sid) {
          sid = 'dama_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
          sessionStorage.setItem('dama_session_id', sid);
        }
      } catch (e) {
        sid = 'dama_' + Date.now().toString(36);
      }
      return sid;
    },
  };

  window.DamaTracker = DamaTracker;

  // Auto-initialize if attributes are present on script tag
  var currentScript = document.currentScript;
  if (currentScript) {
    var endpoint = currentScript.getAttribute('data-endpoint');
    var apiKey = currentScript.getAttribute('data-key');
    DamaTracker.init({ endpoint: endpoint, apiKey: apiKey });
  }
})(window, document);
