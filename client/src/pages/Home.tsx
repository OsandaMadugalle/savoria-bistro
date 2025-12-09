import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Star, ChevronRight, Clock, Users, Award, Zap } from 'lucide-react';
import { fetchApprovedReviews, fetchMenu, fetchActivePromos, Promo } from '../services/api';
import { Review, MenuItem } from '../types';

const Home: React.FC = () => {
  const [stats, setStats] = useState({ customers: 0, dishes: 0, awards: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [featuredDishes, setFeaturedDishes] = useState<MenuItem[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingPromos, setLoadingPromos] = useState(true);

  useEffect(() => {
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
        const featured = menuItems.filter((item: MenuItem) => item.featured === true);
        setFeaturedDishes(featured);
      } catch (err) {
        console.error('Failed to fetch featured dishes:', err);
      } finally {
        setLoadingFeatured(false);
      }
    };
    loadFeaturedDishes();

    // Fetch active promos
    const loadPromos = async () => {
      try {
        const data = await fetchActivePromos();
        setPromos(data);
      } catch (err) {
        console.error('Failed to fetch promos:', err);
        setPromos([]);
      } finally {
        setLoadingPromos(false);
      }
    };
    loadPromos();
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrollableFeatured = featuredDishes.length > 3;

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.7;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-stone-900 via-orange-900 to-stone-800">
        <div className="absolute inset-0 z-0 opacity-30">
          <img 
            src="/src/assets/hero.jpg" 
            alt="Restaurant Interior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
        </div>
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="inline-block mb-4 sm:mb-6 px-4 sm:px-6 py-2 bg-orange-600/20 border border-orange-400/50 rounded-full backdrop-blur-sm">
            <span className="text-orange-200 sm:text-orange-300 font-semibold text-xs sm:text-sm tracking-widest">Welcome to Savoria</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-3 sm:mb-4 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
            Taste the Tradition,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Served Fresh Daily</span>
          </h1>
          <p className="text-orange-100 max-w-2xl mx-auto text-sm sm:text-base md:text-lg mb-6 sm:mb-10 font-light tracking-wide animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 px-2">
            Experience authentic cuisine crafted with passion, blending local traditions with contemporary culinary artistry.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <NavLink to="/menu" className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-orange-600/50 text-sm">
              Explore Menu
            </NavLink>
            <NavLink to="/reservation" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border-2 border-white/30 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold transition-all hover:border-orange-400 text-sm">
              Book a Table
            </NavLink>
          </div>
        </div>
      </section>



      {/* Stats Section with Animation */}
      <section className="bg-stone-100 py-12 sm:py-16 px-4 border-b border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <Users size={32} className="text-orange-600 mx-auto mb-3 sm:mb-4" />
              <div className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-1 sm:mb-2">
                {Math.round(stats.customers).toLocaleString()}+
              </div>
              <p className="text-stone-600">Satisfied Customers</p>
            </div>
            <div className="text-center">
              <Award size={40} className="text-orange-600 mx-auto mb-4" />
              <div className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-2">
                {Math.round(stats.awards)}
              </div>
              <p className="text-stone-600">Awards & Recognition</p>
            </div>
            <div className="text-center">
              <ChevronRight size={40} className="text-orange-600 mx-auto mb-4" />
              <div className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-2">
                {Math.round(stats.dishes)}
              </div>
              <p className="text-stone-600">Signature Dishes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      {promos.length > 0 && (
        <section className="py-12 sm:py-16 px-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-stone-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-orange-600 font-bold tracking-widest uppercase text-sm mb-2 flex items-center justify-center gap-2">
                <Zap size={18} /> Special Offers
              </h2>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">Limited Time Deals</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promos.map((promo) => (
                <div key={promo._id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-orange-100 hover:border-orange-400">
                  <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-orange-500/20 rounded-full" />
                    <div className="relative z-10">
                      <div className="text-5xl font-bold mb-2">{promo.discount}%</div>
                      <div className="text-orange-100 text-sm font-semibold">DISCOUNT</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-4">
                      <p className="text-sm text-stone-500 mb-1">Promo Code</p>
                      <p className="text-2xl font-bold text-stone-900 font-mono tracking-widest">{promo.code}</p>
                    </div>
                    <p className="text-sm text-stone-600 mb-4">
                      Valid until {new Date(promo.expiryDate).toLocaleDateString()}
                    </p>
                    <NavLink
                      to={`/order?promo=${promo.code}`}
                      onClick={() => {
                        localStorage.setItem('appliedPromoCode', promo.code);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                    >
                      <Zap size={16} /> Claim Offer
                    </NavLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Introduction */}
      <section className="py-20 bg-white/50 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-orange-100 rounded-full -z-10" />
            <img 
              src="/src/assets/Introduction.jpg" 
              alt="Chef Plating" 
              className="rounded-lg shadow-xl w-full object-cover h-[300px] sm:h-[400px] md:h-[500px]"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-orange-600 font-bold tracking-widest uppercase text-sm mb-2">Our Story</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-6">Crafted with Passion</h3>
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
      <section className="py-20 bg-white px-4 border-b border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-orange-600 font-bold tracking-widest uppercase text-sm mb-2">Menu Highlights</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">Chef's Specialties</h3>
            <p className="text-stone-600 max-w-2xl mx-auto">Handpicked dishes that showcase our culinary excellence and commitment to quality ingredients</p>
          </div>
          {loadingFeatured ? (
            <div className="w-full flex justify-center">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-stone-300 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                <p className="text-stone-500 font-medium text-center">Loading specialties...</p>
              </div>
            </div>
          ) : featuredDishes.length > 0 ? (
            <div className="relative">
              <div
                ref={scrollContainerRef}
                className={`${
                  hasScrollableFeatured
                    ? 'flex gap-6 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth pb-4 -mx-4 px-4'
                    : 'grid md:grid-cols-3 gap-8'
                }`}
              >
                {featuredDishes.map((dish: MenuItem, idx: number) => (
                  <div
                    key={dish.id || idx}
                    className={`${hasScrollableFeatured ? 'min-w-[300px]' : ''} group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col flex-shrink-0`}
                  >
                    <div className="relative h-64 overflow-hidden bg-stone-200">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h4 className="text-xl font-serif font-bold text-stone-900 mb-2 truncate">
                        {dish.name}
                      </h4>
                      <p className="text-stone-600 text-sm mb-4 line-clamp-3 flex-1">
                        {dish.description}
                      </p>
                      <div className="flex items-center justify-between border-t border-stone-200 pt-4">
                        <span className="text-2xl font-serif font-bold text-orange-600">${dish.price.toFixed(2)}</span>
                        <NavLink
                          to="/menu"
                          state={{ focusDishId: dish.id }}
                          className="inline-flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200"
                        >
                          Order Now <ChevronRight size={16} />
                        </NavLink>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {hasScrollableFeatured && (
                <>
                  <button
                    onClick={() => scrollFeatured('left')}
                    className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-lg p-3 text-stone-700 hover:text-orange-600 transition-colors duration-200"
                    aria-label="Scroll left"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                  <button
                    onClick={() => scrollFeatured('right')}
                    className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-lg p-3 text-stone-700 hover:text-orange-600 transition-colors duration-200"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="w-full rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-12 text-center">
              <Award size={48} className="mx-auto mb-3 text-stone-400" />
              <p className="text-lg font-medium text-stone-600 mb-2">Coming Soon</p>
              <p className="text-stone-500">
                Our Chef's specialty dishes will be featured here soon. Check back to discover culinary masterpieces!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Restaurant Info Section */}
      <section className="py-16 bg-gradient-to-r from-stone-900 to-stone-800 text-white px-4 border-b border-stone-200/20">
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

      {/* Featured Reviews Section - Rating Breakdown */}
      <section className="py-20 bg-gradient-to-br from-stone-900 via-orange-900 to-stone-900 text-white px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-orange-300 font-bold tracking-widest uppercase text-sm mb-2">Customer Testimonials</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white">What Our Guests Say</h3>
          </div>
          
          {reviews.length > 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 border border-white/20">
              {/* Average Rating */}
              <div className="text-center mb-12">
                <div className="text-6xl font-bold text-orange-400 mb-3">
                  {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                </div>
                <div className="flex justify-center gap-1 text-orange-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      fill={i < Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) ? "currentColor" : "none"} 
                      size={24}
                      className={i < Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) ? "" : "text-stone-500"}
                    />
                  ))}
                </div>
                <p className="text-stone-300 text-sm">Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviews.filter(r => r.rating === rating).length;
                  const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                  return (
                    <div key={rating} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-16">
                        <span className="font-semibold text-orange-400">{rating}</span>
                        <Star fill="currentColor" size={14} className="text-orange-400" />
                      </div>
                      <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-orange-500 h-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-16 text-right">
                        <span className="font-bold text-orange-400">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
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