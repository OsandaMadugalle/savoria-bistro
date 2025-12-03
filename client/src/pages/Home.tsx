import React from 'react';
import { NavLink } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
import { REVIEWS } from '../constants';

const Home: React.FC = () => {
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

      {/* Featured Review */}
      <section className="py-20 bg-stone-900 text-white text-center px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-6 text-orange-500">
             {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={24} />)}
          </div>
          {REVIEWS.length > 0 ? (
            <>
              <blockquote className="text-2xl md:text-3xl font-serif italic leading-relaxed mb-8">
                "{REVIEWS[0].text}"
              </blockquote>
              <cite className="not-italic text-stone-400 font-medium">— {REVIEWS[0].author}</cite>
            </>
          ) : (
            <blockquote className="text-2xl md:text-3xl font-serif italic leading-relaxed mb-8">
              No reviews yet. Be the first to leave feedback!
            </blockquote>
          )}
          <div className="mt-8">
             <NavLink to="/reviews" className="text-sm border-b border-orange-500 pb-1 hover:text-orange-400 transition-colors">See all reviews</NavLink>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;