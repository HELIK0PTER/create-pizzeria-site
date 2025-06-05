"use client";

import React from 'react';

function ScrollingBanner() {
  const message = "🍕 Offres spéciales : Profitez de 15% de réduction sur toutes les grandes pizzas ! • Livraison gratuite pour toute commande supérieure à 25€ ! 🍕";

  return (
    <div className="w-full bg-yellow-400 text-yellow-900 text-sm overflow-hidden relative">
      <style jsx>{`
        @keyframes scrollText {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); } /* Animer sur la largeur d'un message */
        }
        .scrolling-text-container {
            display: flex;
            width: fit-content; /* Permet au conteneur interne d'avoir la largeur de son contenu */
            animation: scrollText 15s linear infinite; /* Durée ajustée à 15s (plus rapide) */
        }
        .scrolling-text-item {
            white-space: nowrap;
            padding: 0 75rem; /* Espacement augmenté (environ 5 fois 15rem) */
        }
      `}</style>
      <div className="scrolling-text-container py-2 px-4">
        <span className="scrolling-text-item">{message}</span>
        <span className="scrolling-text-item">{message}</span> {/* Duplication du message */}
      </div>
    </div>
  );
}

export default ScrollingBanner; 