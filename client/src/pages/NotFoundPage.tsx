import React from 'react';
import { NavLink } from 'react-router-dom';
import { UtensilsCrossed, Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6 animate-in zoom-in-50 duration-500">
        <UtensilsCrossed size={48} />
      </div>
      <h1 className="text-6xl font-serif font-bold text-stone-900 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-stone-800 mb-4">Page Devoured</h2>
      <p className="text-stone-500 max-w-md mb-8">
        Oops! It seems this page was eaten by our hungry AI chef. 
        The dish you are looking for is no longer on the menu.
      </p>
      <NavLink 
        to="/" 
        className="bg-stone-900 hover:bg-stone-800 text-white px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2"
      >
        <Home size={18} /> Return Home
      </NavLink>
    </div>
  );
};

export default NotFoundPage;