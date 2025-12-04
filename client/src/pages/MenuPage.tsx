import React, { useState, useEffect } from 'react';
import { Search, X, Leaf, Sprout, Wheat, Loader2, ChevronRight, Clock, Flame, Utensils, Info, Plus } from 'lucide-react';
import { MenuItem } from '../types';
import { fetchMenu } from '../services/api';

interface MenuPageProps {
  addToCart: (item: MenuItem) => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ addToCart }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMenu = async () => {
      setIsLoading(true);
      try {
        const items = await fetchMenu();
        setMenuItems(items);
      } catch (e) {
        console.error("Failed to load menu", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadMenu();
  }, []);
  
  const categories = ['All', 'Starter', 'Main', 'Dessert', 'Drink'];
  const dietaryOptions = [
    { label: 'Vegetarian', icon: <Leaf size={14} /> },
    { label: 'Vegan', icon: <Sprout size={14} /> },
    { label: 'GF', icon: <Wheat size={14} className="line-through decoration-stone-500" /> },
  ];

  const toggleFilter = (tag: string) => {
    setActiveFilters(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const resetFilters = () => {
    setActiveCategory('All');
    setActiveFilters([]);
    setSearchTerm('');
  };

  const hasActiveFilters = activeCategory !== 'All' || activeFilters.length > 0 || searchTerm !== '';

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesFilters = activeFilters.length === 0 || activeFilters.every(filter => item.tags.includes(filter));
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesFilters && matchesSearch;
  });

  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">Our Menu</h1>
          <p className="text-stone-600 max-w-2xl mx-auto">Explore our carefully curated selection of dishes, featuring locally sourced ingredients and bold flavors.</p>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col items-center gap-6 mb-12">
          {/* Search Bar */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-3.5 text-stone-400" size={20} />
            <input 
              type="text" 
              placeholder="Search dishes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm text-stone-800 placeholder-stone-400"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat 
                    ? 'bg-stone-900 text-white shadow-md' 
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-orange-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Dietary Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white px-6 py-2 rounded-full border border-stone-200 shadow-sm">
             <span className="text-xs font-bold uppercase text-stone-400 tracking-wider mr-2">Dietary:</span>
             {dietaryOptions.map(option => (
               <button
                  key={option.label}
                  onClick={() => toggleFilter(option.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    activeFilters.includes(option.label)
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-stone-50 border-transparent text-stone-500 hover:bg-stone-100'
                  }`}
               >
                 {option.icon}
                 {option.label}
               </button>
             ))}
          </div>

          {hasActiveFilters && (
            <button 
              onClick={resetFilters}
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-orange-600 transition-colors px-4 py-2 hover:bg-stone-100 rounded-full"
            >
              <X size={16} /> Clear All Filters
            </button>
          )}
        </div>

        {/* Menu Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
             <Loader2 size={40} className="animate-spin text-orange-600" />
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredItems.map(item => (
              <div 
                key={item._id || item.id || item.name} 
                onClick={() => setSelectedItem(item)}
                className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex gap-4 hover:shadow-lg hover:border-orange-100 transition-all cursor-pointer group"
              >
                <div className="relative overflow-hidden rounded-lg w-28 h-28 flex-shrink-0">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover bg-stone-200 transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg text-stone-900 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                      <span className="font-bold text-orange-600">${item.price}</span>
                    </div>
                    <p className="text-sm text-stone-500 mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex gap-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[10px] uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-1 rounded-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <span className="text-xs text-orange-600 font-medium group-hover:underline flex items-center gap-1">
                      View Details <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-stone-50 rounded-xl border border-dashed border-stone-300">
             <div className="inline-block p-4 bg-stone-100 rounded-full mb-4">
                <Leaf size={32} className="text-stone-400" />
             </div>
             <h3 className="text-lg font-bold text-stone-600">No dishes found</h3>
             <p className="text-stone-500">Try adjusting your search or filters.</p>
             <button onClick={resetFilters} className="mt-4 text-orange-600 font-medium hover:underline">Clear All Filters</button>
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col md:flex-row relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full text-stone-600 hover:text-red-500 transition-colors shadow-sm"
            >
              <X size={24} />
            </button>

            {/* Image Side */}
            <div className="w-full md:w-1/2 h-64 md:h-auto relative">
               <img 
                 src={selectedItem.image} 
                 alt={selectedItem.name} 
                 className="absolute inset-0 w-full h-full object-cover"
               />
               <div className="absolute top-4 left-4 flex gap-2">
                  {selectedItem.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-white/90 backdrop-blur text-xs font-bold uppercase tracking-wider text-stone-800 rounded-sm shadow-sm">
                        {tag}
                      </span>
                  ))}
               </div>
            </div>

            {/* Content Side */}
            <div className="w-full md:w-1/2 p-8 flex flex-col">
               <div className="flex justify-between items-start mb-2">
                 <div>
                    <span className="text-orange-600 font-bold uppercase tracking-widest text-xs mb-1 block">{selectedItem.category}</span>
                    <h2 className="text-3xl font-serif font-bold text-stone-900 leading-tight">{selectedItem.name}</h2>
                 </div>
                 <span className="text-2xl font-bold text-orange-600">${selectedItem.price}</span>
               </div>

               <p className="text-stone-600 mb-6 text-lg leading-relaxed border-b border-stone-100 pb-6">
                 {selectedItem.description}
               </p>

               <div className="space-y-6 flex-grow">
                 {/* Details Grid */}
                 <div className="grid grid-cols-2 gap-4">
                    {selectedItem.prepTime && (
                       <div className="flex items-center gap-3 text-stone-600">
                          <div className="bg-orange-50 p-2 rounded-full text-orange-500"><Clock size={20} /></div>
                          <div>
                             <span className="block text-xs font-bold uppercase text-stone-400">Prep Time</span>
                             <span className="font-semibold">{selectedItem.prepTime} mins</span>
                          </div>
                       </div>
                    )}
                    {selectedItem.calories && (
                       <div className="flex items-center gap-3 text-stone-600">
                          <div className="bg-orange-50 p-2 rounded-full text-orange-500"><Flame size={20} /></div>
                          <div>
                             <span className="block text-xs font-bold uppercase text-stone-400">Calories</span>
                             <span className="font-semibold">{selectedItem.calories} kcal</span>
                          </div>
                       </div>
                    )}
                 </div>

                 {/* Ingredients */}
                 {selectedItem.ingredients && (
                    <div>
                       <div className="flex items-center gap-2 mb-3">
                          <Utensils size={18} className="text-orange-500" />
                          <h4 className="font-bold text-stone-900">Key Ingredients</h4>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {selectedItem.ingredients.map((ing, i) => (
                             <span key={i} className="px-3 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg">
                                {ing}
                             </span>
                          ))}
                       </div>
                    </div>
                 )}
               </div>

               {/* Action Footer */}
               <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between gap-4">
                  <div className="text-xs text-stone-400 flex items-start gap-1 max-w-[50%]">
                     <Info size={14} className="mt-0.5 flex-shrink-0" />
                     <p>Please inform our staff about any allergies before ordering.</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Plus size={20} />
                    Add to Order
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;