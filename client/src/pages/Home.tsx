import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Star, ChevronRight, Clock, Users, Award, Zap, Check } from 'lucide-react';
import { fetchApprovedReviews, fetchMenu } from '../services/api';
import { Review, MenuItem } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ customers: 0, dishes: 0, awards: 0 });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [featuredDishes, setFeaturedDishes] = useState<MenuItem[]>([]);
  
  // Promo code state - get from localStorage or use default
  const [offerEnabled, setOfferEnabled] = useState(true);
  const [activePromos, setActivePromos] = useState<any[]>([]);
  
  const DEFAULT_PROMOS = [
    { id: 1, code: 'SAVORIA20', discount: 20, active: true },
    { id: 2, code: 'SAVE10', discount: 10, active: true },
  ];

  useEffect(() => {
    // Load promo settings from localStorage
    const storedEnabled = localStorage.getItem('offerEnabled');
    if (storedEnabled !== null) {
      setOfferEnabled(JSON.parse(storedEnabled));
    }
    
    const storedPromos = localStorage.getItem('activePromos');
    if (storedPromos) {
      try {
        const promos = JSON.parse(storedPromos);
        // Filter only active promos
        const active = promos.filter((p: any) => p.active);
        setActivePromos(active.length > 0 ? active : DEFAULT_PROMOS.filter(p => p.active));
      } catch (err) {
        // Fallback to default
        setActivePromos(DEFAULT_PROMOS.filter(p => p.active));
      }
    } else {
      setActivePromos(DEFAULT_PROMOS.filter(p => p.active));
    }
    
    // Animate stats on load
    const animateStats = () => {
      let customers = 0, dishes = 0, awards = 0;
      const interval = setInterval(() => {
        if (customers < 5000) customers += 250;
        if (dishes < 50) dishes += 2;
        if (awards < 12) awards += 0.6;
        setStats({ customers: Math.min(customers, 5000), dishes: Math.min(dishes, 50), awards: Math.min(awards, 12) });
        if (customers >= 5000 && dishes >= 50 && awards >= 12) clearInterval(interval);
      }, 50);
    };
    animateStats();

    // Fetch approved reviews
    const fetchReviews = async () => {
      try {
        const data = await fetchApprovedReviews();
        setReviews(data);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setReviews([]);
      }
    };
    fetchReviews();

    // Fetch featured menu items
    const loadFeaturedDishes = async () => {
      try {
        const menuItems = await fetchMenu();
        const featured = menuItems.filter((item: MenuItem) => item.featured === true).slice(0, 3);
        setFeaturedDishes(featured.length > 0 ? featured : []);
      } catch (err) {
        console.error('Failed to fetch featured dishes:', err);
        setFeaturedDishes([]);
      }
    };
    loadFeaturedDishes();
  }, []);

  const handleClaimOffer = (code: string) => {
    // Copy promo code to clipboard
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    
    // Navigate to menu after a short delay
    setTimeout(() => navigate('/menu'), 500);
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/1920/1080?grayscale&blur=2" 
            alt="Restaurant Interior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
            Taste the Tradition,<br />Served Fresh Daily
          </h1>
          <p className="text-xl text-stone-200 mb-10 font-light tracking-wide animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            A culinary journey through local flavors and modern techniques.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <NavLink to="/menu" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105">
              View Menu
            </NavLink>
            <NavLink to="/reservation" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-full font-semibold transition-all">
              Book a Table
            </NavLink>
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      {offerEnabled && activePromos.length > 0 ? (
        <section className="py-12 px-6 md:px-12 bg-stone-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <Zap size={20} className="text-orange-600" />
              <span className="text-sm font-semibold uppercase tracking-wider text-orange-600">Limited Time Offers</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-8 text-stone-900">Exclusive Deals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activePromos.map((promo) => (
                <div key={promo.id} className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="text-5xl md:text-6xl font-bold mb-2">{promo.discount}%</div>
                      <h3 className="text-xl md:text-2xl font-serif font-bold">Off Your Order</h3>
                      <p className="text-orange-100 mt-3">Use promo code:</p>
                      <p className="font-mono font-bold text-white text-xl bg-black/20 px-3 py-2 rounded mt-2 inline-block">{promo.code}</p>
                      <p className="text-orange-50 text-sm mt-4">Valid for dine-in, takeout, or delivery</p>
                    </div>
                    <button 
                      onClick={() => handleClaimOffer(promo.code)}
                      className={`mt-6 px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                        copiedCode === promo.code 
                          ? 'bg-green-400 text-stone-900' 
                          : 'bg-white text-orange-600 hover:bg-stone-100'
                      }`}
                    >
                      {copiedCode === promo.code ? (
                        <>
                          <Check size={18} />
                          Copied!
                        </>
                      ) : (
                        'Claim Offer'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Stats Section with Animation */}
      <section className="bg-stone-100 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Users size={40} className="text-orange-600 mx-auto mb-4" />
              <div className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-2">
                {Math.round(stats.customers).toLocaleString()}+
              </div>
              <p className="text-stone-600">Satisfied Customers</p>
            </div>
            <div className="text-center">
              <Award size={40} className="text-orange-600 mx-auto mb-4" />
              <div className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-2">
                {Math.round(stats.awards)}
              </div>
              <p className="text-stone-600">Awards & Recognition</p>
            </div>
            <div className="text-center">
              <ChevronRight size={40} className="text-orange-600 mx-auto mb-4" />
              <div className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-2">
                {Math.round(stats.dishes)}
              </div>
              <p className="text-stone-600">Signature Dishes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-orange-100 rounded-full -z-10" />
            <img 
              src="https://picsum.photos/600/800?random=10" 
              alt="Chef Plating" 
              className="rounded-lg shadow-xl w-full object-cover h-[500px]"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-orange-600 font-bold tracking-widest uppercase text-sm mb-2">Our Story</h2>
            <h3 className="text-4xl font-serif font-bold text-stone-900 mb-6">Crafted with Passion</h3>
            <p className="text-stone-600 mb-6 leading-relaxed">
              Founded in 2015, Savoria Bistro began with a simple mission: to create a dining experience that honors local ingredients while pushing the boundaries of traditional cuisine. Our executive chef brings over 20 years of experience from Michelin-starred kitchens around the world.
            </p>
            <div className="grid grid-cols-2 gap-6 mb-8">
               <div className="flex flex-col gap-2">
                  <span className="text-3xl font-serif font-bold text-stone-800">15+</span>
                  <span className="text-sm text-stone-500">Years of Excellence</span>
               </div>
               <div className="flex flex-col gap-2">
                  <span className="text-3xl font-serif font-bold text-stone-800">50+</span>
                  <span className="text-sm text-stone-500">Signature Dishes</span>
               </div>
            </div>
            <div className="flex gap-4">
               <NavLink to="/gallery" className="inline-flex items-center text-orange-600 font-semibold hover:text-orange-700">
                View Gallery <ChevronRight size={18} />
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dishes Section */}
      <section className="py-20 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-orange-600 font-bold tracking-widest uppercase text-sm mb-2">Menu Highlights</h2>
            <h3 className="text-4xl font-serif font-bold text-stone-900 mb-4">Chef's Specialties</h3>
            <p className="text-stone-600 max-w-2xl mx-auto">Handpicked dishes that showcase our culinary excellence and commitment to quality ingredients</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredDishes.length > 0 ? (
              featuredDishes.map((dish: MenuItem, idx: number) => (
                <div key={idx} className="group overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2">
                  <div className="relative h-64 overflow-hidden">
                    <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  </div>
                  <div className="p-6 bg-stone-50 group-hover:bg-orange-50 transition-colors">
                    <h4 className="text-xl font-serif font-bold text-stone-900 mb-2">{dish.name}</h4>
                    <p className="text-stone-600 text-sm mb-2">{dish.description}</p>
                    <p className="text-orange-600 font-bold mb-4">${dish.price.toFixed(2)}</p>
                    <NavLink to="/menu" className="text-orange-600 font-semibold text-sm hover:text-orange-700 flex items-center gap-1">
                      Order Now <ChevronRight size={14} />
                    </NavLink>
                  </div>
                </div>
              ))
            ) : (
              // Fallback demo dishes if no featured items
              [
                { name: 'Pan-Seared Salmon', desc: 'With lemon butter and roasted vegetables', img: 'https://picsum.photos/400/300?random=1', price: 28 },
                { name: 'Beef Wellington', desc: 'Tender filet wrapped in mushroom duxelles', img: 'https://picsum.photos/400/300?random=2', price: 35 },
                { name: 'Truffle Risotto', desc: 'Creamy arborio rice with black truffle shavings', img: 'https://picsum.photos/400/300?random=3', price: 24 },
              ].map((dish, idx) => (
                <div key={idx} className="group overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2">
                  <div className="relative h-64 overflow-hidden">
                    <img src={dish.img} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  </div>
                  <div className="p-6 bg-stone-50 group-hover:bg-orange-50 transition-colors">
                    <h4 className="text-xl font-serif font-bold text-stone-900 mb-2">{dish.name}</h4>
                    <p className="text-stone-600 text-sm mb-2">{dish.desc}</p>
                    <p className="text-orange-600 font-bold mb-4">${dish.price.toFixed(2)}</p>
                    <NavLink to="/menu" className="text-orange-600 font-semibold text-sm hover:text-orange-700 flex items-center gap-1">
                      Order Now <ChevronRight size={14} />
                    </NavLink>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Restaurant Info Section */}
      <section className="py-16 bg-gradient-to-r from-stone-900 to-stone-800 text-white px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="flex gap-4">
            <Clock size={32} className="text-orange-500 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-lg mb-1">Opening Hours</h4>
              <p className="text-stone-300 text-sm">Mon-Thu: 11am - 10pm</p>
              <p className="text-stone-300 text-sm">Fri-Sat: 11am - 11pm</p>
              <p className="text-stone-300 text-sm">Sunday: 10am - 9pm</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 rounded-lg hover:bg-stone-700/50 transition-colors">
            <Users size={32} className="text-orange-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-2">Private Events</h4>
              <p className="text-stone-300 text-sm mb-1">Host your special occasions</p>
              <p className="text-stone-300 text-sm mb-3">Customized menus available</p>
              <NavLink to="/contact" className="text-orange-400 text-sm font-semibold hover:text-orange-300 inline-flex items-center gap-1 transition-colors">
                Learn More <ChevronRight size={16} />
              </NavLink>
            </div>
          </div>
          <div className="flex gap-4">
            <Award size={32} className="text-orange-500 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-lg mb-1">Quality Assured</h4>
              <p className="text-stone-300 text-sm">Fresh local ingredients</p>
              <p className="text-stone-300 text-sm">Sustainable sourcing</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Reviews Section */}
      <section className="py-20 bg-gradient-to-br from-stone-900 via-orange-900 to-stone-900 text-white px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-orange-300 font-bold tracking-widest uppercase text-sm mb-2">Customer Testimonials</h2>
            <h3 className="text-4xl font-serif font-bold text-white">What Our Guests Say</h3>
          </div>
          
          {reviews.length > 0 ? (
            <div className="space-y-8">
              {reviews.slice(0, 3).map((review: Review, idx: number) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 hover:border-orange-400/50 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-1 text-orange-400">
                      {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={20} />)}
                    </div>
                  </div>
                  <blockquote className="text-lg md:text-xl font-serif italic leading-relaxed mb-4 text-white/90">
                    "{review.text}"
                  </blockquote>
                  <cite className="not-italic text-stone-300 font-semibold">— {review.author}</cite>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 border border-white/20 text-center">
              <div className="flex justify-center mb-6 text-orange-400">
                {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={24} />)}
              </div>
              <blockquote className="text-2xl md:text-3xl font-serif italic leading-relaxed mb-6">
                No reviews yet. Be the first to leave feedback!
              </blockquote>
              <NavLink to="/reviews" className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-all">
                Write a Review
              </NavLink>
            </div>
          )}
          
          <div className="mt-12 text-center">
            <NavLink to="/reviews" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-all">
              See All Reviews <ChevronRight size={18} />
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;