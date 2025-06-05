import React from "react";

function ScrollingBanner() {
  const message = `🍕 Offres spéciales : A emporter, pour 1 pizza achetée la 2ème est offerte • En livraison, pour 2 pizzas achetées, la 3ème est offerte ! 🍕`;

  return (
    <div className="w-full bg-yellow-400 text-yellow-900 text-sm overflow-hidden relative">
      <style jsx>{`
        @keyframes scrollText {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .scrolling-text-container {
          display: flex;
          width: fit-content;
          animation: scrollText 60s linear infinite;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
        }

        .scrolling-text-item {
          white-space: nowrap;
          padding: 0 2rem;
          flex-shrink: 0;
        }
      `}</style>
      <div className="scrolling-text-container py-2 px-4 font-bold text-nowrap">
        <span className="scrolling-text-item">{message}</span>
        <span className="scrolling-text-item">{message}</span>
        <span className="scrolling-text-item">{message}</span>
        <span className="scrolling-text-item">{message}</span>
        <span className="scrolling-text-item">{message}</span>
        <span className="scrolling-text-item">{message}</span>
      </div>
    </div>
  );
}

export default ScrollingBanner;
