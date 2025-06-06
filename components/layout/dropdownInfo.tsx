import { useState, useEffect } from 'react'
import { Phone, ChevronRight, ChevronLeft } from 'lucide-react'

// Hook personnalisé pour gérer le scroll
const useScrollPosition = () => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const [lastScrollPosition, setLastScrollPosition] = useState(0);

    useEffect(() => {
        const updatePosition = () => {
            setLastScrollPosition(scrollPosition);
            setScrollPosition(window.pageYOffset);
        };

        // Ajouter l'écouteur
        window.addEventListener('scroll', updatePosition);

        // Mettre à jour la position initiale
        updatePosition();

        // Nettoyer
        return () => window.removeEventListener('scroll', updatePosition);
    }, [scrollPosition]);

    return { scrollPosition, lastScrollPosition };
};

const DropdownInfo = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [isTopLeft, setIsTopLeft] = useState(false);
    const { scrollPosition, lastScrollPosition } = useScrollPosition();

    useEffect(() => {
        // Si on scrolle vers le bas et qu'on dépasse 250px
        if (scrollPosition > lastScrollPosition && scrollPosition > 250) {
            setIsTopLeft(true);
            setIsOpen(false);
        }
        // Si on scrolle vers le haut
        if (scrollPosition < lastScrollPosition) {
            setIsTopLeft(false);
            setIsOpen(true);
        }
    }, [scrollPosition, lastScrollPosition]);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return(
        <div 
            className={`fixed ${isTopLeft ? 'top-16' : 'top-40'} left-0 transform -translate-y-1/2 z-50 transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-[calc(100%-20px)]'}`}
        >
            <div className="bg-white shadow-lg rounded-r-lg p-3 relative border border-gray-100">
                <button 
                    onClick={toggleDropdown}
                    className="absolute -right-2.5 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-md 
                             hover:bg-blue-50 hover:scale-110 active:scale-95 transition-all duration-200
                             border border-gray-100 group"
                >
                    {isOpen ? (
                        <ChevronLeft className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    )}
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-blue-50 p-1.5 rounded-full">
                        <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Appelez-nous</span>
                        <a 
                            href="tel:+33600000000" 
                            className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium"
                        >
                            +33 6 00 00 00 00
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DropdownInfo;