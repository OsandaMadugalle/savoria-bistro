import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, X, Leaf, Sprout, Wheat, Loader2, ChevronRight, Clock, Flame, Utensils, Info, Plus, Zap } from 'lucide-react';
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
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'popular'>('name');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedItem]);

  useEffect(() => {
    const focusDishId = (location.state as any)?.focusDishId;
    if (!focusDishId || menuItems.length === 0) return;
    const match = menuItems.find(item => item.id === focusDishId);
    if (match) {
      setSelectedItem(match);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, menuItems, navigate]);

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

  let filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const relevantTags = new Set([...(item.tags || []), ...(item.dietary || [])]);
    const matchesFilters = activeFilters.length === 0 || activeFilters.every(filter => relevantTags.has(filter));
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    return matchesCategory && matchesFilters && matchesSearch && matchesPrice;
  });

  // Apply sorting
  if (sortBy === 'price-low') {
    filteredItems = [...filteredItems].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredItems = [...filteredItems].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'popular') {
    // Mark some items as popular (can be based on data later)
    filteredItems = [...filteredItems].sort((a, b) => {
      const aPopular = a.tags?.includes('Popular') ? 1 : 0;
      const bPopular = b.tags?.includes('Popular') ? 1 : 0;
      return bPopular - aPopular;
    });
  } else {
    filteredItems = [...filteredItems].sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-stone-900 via-orange-900 to-stone-800 text-white py-16 px-4 pt-24 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap size={20} className="text-yellow-300" />
            <span className="text-sm font-semibold uppercase tracking-wider text-orange-200">Culinary Excellence</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Our Menu</h1>
          <p className="text-orange-100 max-w-2xl mx-auto text-lg">Explore our carefully curated selection of dishes, featuring locally sourced ingredients and bold flavors crafted with passion.</p>
        </div>
      </div>

      <div className="pt-0 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Controls Section */}
        <div className="pt-12 pb-12">
          {/* Search Bar */}
          <div className="relative w-full max-w-md mx-auto mb-8">
            <Search className="absolute left-4 top-3.5 text-stone-400" size={20} />
            <input 
              type="text" 
              placeholder="Search dishes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm text-stone-800 placeholder-stone-400 transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
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

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-center flex-wrap">
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

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 rounded-full border border-stone-200 bg-white text-stone-700 font-semibold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
            >
              <option value="name">Sort by: Name</option>
              <option value="price-low">Sort by: Price (Low to High)</option>
              <option value="price-high">Sort by: Price (High to Low)</option>
              <option value="popular">Sort by: Popular</option>
            </select>

            {/* Price Range Filter */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-stone-200 shadow-sm">
              <span className="text-xs font-bold uppercase text-stone-400 tracking-wider">Price:</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="w-24 cursor-pointer"
              />
              <span className="text-sm font-semibold text-stone-600 whitespace-nowrap">${priceRange[1]}</span>
            </div>
          </div>

          {hasActiveFilters && (
            <button 
              onClick={resetFilters}
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-orange-600 transition-colors px-4 py-2 hover:bg-stone-100 rounded-full mx-auto mb-8"
            >
              <X size={16} /> Clear All Filters
            </button>
          )}

          {/* Results Count */}
          <div className="text-center mb-8">
            <p className="text-stone-600 font-medium">
              Showing <span className="text-orange-600 font-bold">{filteredItems.length}</span> {filteredItems.length === 1 ? 'dish' : 'dishes'}
            </p>
          </div>
        </div>

        {/* Menu Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
             <Loader2 size={40} className="animate-spin text-orange-600" />
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-12">
            {filteredItems.map(item => (
              <div 
                key={item.id || item.name} 
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all cursor-pointer group"
              >
                {/* Image */}
                <div className="relative overflow-hidden h-48 bg-stone-200">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Badge */}
                  {item.tags?.includes('Popular') && (
                    <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Zap size={12} /> Popular
                    </div>
                  )}
                  {item.tags?.includes("Chef's Special") && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      ⭐ Chef's Pick
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-stone-900 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                      <p className="text-xs text-stone-400 uppercase tracking-wider">{item.category}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-stone-600 mb-3 line-clamp-2">{item.description}</p>
                  
                  {/* Tags */}
                  <div className="flex gap-2 flex-wrap mb-4">
                    {item.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-1 rounded-sm">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                    <span className="text-2xl font-bold text-orange-600">${item.price}</span>
                    <span className="text-xs text-orange-600 font-medium group-hover:underline flex items-center gap-1">
                      View <ChevronRight size={14} />
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
              className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white rounded-full text-stone-600 hover:text-red-500 transition-colors shadow-sm"
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
               <div className="flex justify-between items-start mb-2 gap-4 relative">
                 <div>
                    <span className="text-orange-600 font-bold uppercase tracking-widest text-xs mb-1 block">{selectedItem.category}</span>
                    <h2 className="text-3xl font-serif font-bold text-stone-900 leading-tight">{selectedItem.name}</h2>
                 </div>
                 <span className="text-2xl font-bold text-orange-600 pr-10">${selectedItem.price}</span>
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