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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      try {
        console.log('Fetching menu from API...');
        const items = await fetchMenu();
        console.log('Fetched menu items:', items);
        console.log('Number of items:', items?.length);
        console.log('First item:', items?.[0]);
        setMenuItems(items);
      } catch (e) {
        console.error("Failed to load menu", e);
        setError(e instanceof Error ? e.message : 'Failed to load menu');
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
    console.log(`Filtering ${item.name}: category=${matchesCategory}, filters=${matchesFilters}, search=${matchesSearch}, price=${matchesPrice}`);
    return matchesCategory && matchesFilters && matchesSearch && matchesPrice;
  });

  console.log('Total menu items:', menuItems.length);
  console.log('Filtered items:', filteredItems.length);
  console.log('Price range:', priceRange);
  console.log('Active category:', activeCategory);

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
      <div className="bg-gradient-to-br from-stone-900 via-orange-900 to-stone-800 text-white py-12 sm:py-16 px-4 pt-24 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative z-10 text-center px-2">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <Zap size={18} className="text-yellow-300" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-orange-200">Culinary Excellence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-3 sm:mb-4">Our Menu</h1>
          <p className="text-orange-100 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">Explore our carefully curated selection of dishes, featuring locally sourced ingredients and bold flavors crafted with passion.</p>
        </div>
      </div>

      <div className="pt-0 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Controls Section */}
        <div className="py-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 -mx-4 sm:mx-0 sticky top-20 z-30 shadow-sm border border-white/50">
          {/* Search Bar */}
          <div className="relative w-full max-w-sm mx-auto mb-1.5 sm:mb-2">
            <Search className="absolute left-3 top-2 text-stone-400" size={14} />
            <input 
              type="text" 
              placeholder="Search dishes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-full border border-stone-200 focus:ring-1 focus:ring-orange-500 outline-none text-stone-800 placeholder-stone-400 text-xs"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex justify-center mb-1.5 sm:mb-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-transparent max-w-full">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                    activeCategory === cat 
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg' 
                      : 'bg-white text-stone-600 border-2 border-stone-200 hover:border-orange-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center justify-center text-xs">
            {/* Dietary Filters */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 bg-stone-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-stone-200">
              <span className="text-xs font-bold uppercase text-stone-500 tracking-wider mr-1 w-full sm:w-auto">Filter:</span>
              {dietaryOptions.map(option => (
                <button
                  key={option.label}
                  onClick={() => toggleFilter(option.label)}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all transform hover:scale-105 ${
                    activeFilters.includes(option.label)
                      ? 'bg-green-500 text-white shadow-md border border-green-600'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
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
              className="px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 border-stone-200 bg-white text-stone-700 font-semibold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer hover:border-orange-400 transition-colors"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="price-low">Sort: Price (Low to High)</option>
              <option value="price-high">Sort: Price (High to Low)</option>
              <option value="popular">Sort: Popular First</option>
            </select>

            {/* Price Range Filter */}
            <div className="flex items-center gap-2 sm:gap-3 bg-stone-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-stone-200">
              <span className="text-xs font-bold uppercase text-stone-500 tracking-wider">Max:</span>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="w-full cursor-pointer accent-orange-600"
              />
              <span className="text-xs sm:text-sm font-bold text-orange-600 whitespace-nowrap">Rs {priceRange[1]}</span>
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
            {/* DEBUG INFO */}
            <p className="text-xs text-stone-400 mt-1">
              Total items loaded: {menuItems.length} | Filtered: {filteredItems.length}
            </p>
          </div>
        </div>

        {/* Menu Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
             <Loader2 size={40} className="animate-spin text-orange-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md text-center">
              <h3 className="text-xl font-bold text-red-700 mb-2">Unable to Load Menu</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-12">
            {filteredItems.map(item => (
              <div 
                key={item.id || item.name} 
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-2xl shadow-sm border-2 border-stone-100 overflow-hidden hover:shadow-2xl hover:border-orange-400 transition-all cursor-pointer group transform hover:scale-105 flex flex-col"
              >
                {/* Image */}
                <div className="relative overflow-hidden h-56 bg-gradient-to-br from-stone-300 to-stone-200">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Badges */}
                  <div className="absolute top-4 left-4 right-4 flex gap-2 flex-wrap">
                    {item.tags?.includes('Popular') && (
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Zap size={14} /> Popular
                      </div>
                    )}
                    {item.tags?.includes("Chef's Special") && (
                      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        ⭐ Chef's Pick
                      </div>
                    )}
                    {/* Stock Status Badge */}
                    {item.stock !== undefined && item.stock === 0 && (
                      <div className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        Out of Stock
                      </div>
                    )}
                    {item.stock !== undefined && item.stock > 0 && item.stock <= (item.lowStockThreshold || 5) && (
                      <div className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        Only {item.stock} left
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-serif font-bold text-xl text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-2">{item.name}</h3>
                  <p className="text-xs text-orange-600 uppercase tracking-widest font-semibold mt-1">{item.category}</p>
                  
                  <p className="text-sm text-stone-600 mt-3 line-clamp-2 leading-relaxed">{item.description}</p>
                  
                  {/* Dietary Info */}
                  {item.dietary && item.dietary.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3">
                      {item.dietary.slice(0, 2).map(diet => (
                        <span key={diet} className="text-[10px] uppercase tracking-wider bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200 font-semibold">
                          {diet === 'GF' ? '🌾 GF' : diet === 'Vegan' ? '🌱 Vegan' : '🥬 Vegetarian'}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Spacer to push footer down */}
                  <div className="flex-1" />

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-stone-100">
                    <span className="text-2xl font-serif font-bold text-orange-600">Rs {item.price.toFixed(2)}</span>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 font-semibold text-sm rounded-lg group-hover:bg-orange-100 transition-colors">
                      View <ChevronRight size={16} />
                    </div>
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
                 <span className="text-2xl font-bold text-orange-600 pr-10">Rs {selectedItem.price}</span>
               </div>

               <p className="text-stone-600 mb-6 text-lg leading-relaxed border-b border-stone-100 pb-6">
                 {selectedItem.description}
               </p>

               <div className="space-y-6 flex-grow">
                 {/* Stock Status */}
                 {selectedItem.stock !== undefined && (
                    <div className={`p-3 rounded-lg ${selectedItem.stock === 0 ? 'bg-red-50 border border-red-200' : selectedItem.stock <= (selectedItem.lowStockThreshold || 5) ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                       {selectedItem.stock === 0 ? (
                         <p className="text-sm font-bold text-red-700">❌ Out of Stock - Not available for order</p>
                       ) : selectedItem.stock <= (selectedItem.lowStockThreshold || 5) ? (
                         <p className="text-sm font-bold text-amber-700">⚠️ Limited availability - Only {selectedItem.stock} {selectedItem.stock === 1 ? 'item' : 'items'} left</p>
                       ) : (
                         <p className="text-sm font-bold text-green-700">✓ In stock and ready to order</p>
                       )}
                    </div>
                 )}

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
                    disabled={selectedItem.stock === 0}
                    className={`flex-1 font-bold py-3.5 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                      selectedItem.stock === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                        : 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-[1.02] active:scale-95 shadow-orange-200'
                    }`}
                  >
                    <Plus size={20} />
                    {selectedItem.stock === 0 ? 'Out of Stock' : 'Add to Order'}
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