"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const FilterZone = ({
  items,
  action,
  selectedCategory,
}: {
  items: { id: number; name: string }[];
  action: (categoryId: number | null) => void;
  selectedCategory: number | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    setIsOpen(window.scrollY > 300 && isScrollingUp);
  }, [isScrollingUp, lastScroll]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const isScrollingUpNow = currentScroll < lastScroll && currentScroll > 100;

      if (!isScrollingUpNow) {
        // Si on remonte, on met à jour immédiatement
        setIsScrollingUp(false);
      } else {
        // Si on descend, on attend 300ms avant de mettre à jour
        setTimeout(() => {
          setIsScrollingUp(true);
        }, 100);
      }

      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  return (
    <div
      className={cn(
        "mb-8 sticky top-0 left-46 z-10 w-full transition-transform duration-300",
        isOpen ? "translate-y-[115px]" : "translate-y-0"
      )}
    >
      <div className="flex flex-wrap justify-center w-full gap-2 bg-white/80 backdrop-blur-sm py-4 px-2 text-xs md:text-base">
        <button
          onClick={() => action(null)}
          className={cn(
            "px-2 md:px-4 py-2 rounded-full border transition-colors",
            !selectedCategory
              ? "bg-red-600 text-white border-red-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-red-600"
          )}
        >
          Tous les produits
        </button>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => action(item.id)}
            className={cn(
              "px-2 md:px-4 py-2 rounded-full border transition-colors",
              selectedCategory === item.id
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-red-600"
            )}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterZone;
