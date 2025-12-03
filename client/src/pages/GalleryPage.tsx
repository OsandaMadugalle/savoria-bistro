import React, { useState } from 'react';
import { ZoomIn, X } from 'lucide-react';
import { GALLERY_IMAGES } from '../constants';
import { GalleryItem } from '../types';

const GalleryPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">Gallery</h1>
          <p className="text-stone-600 max-w-2xl mx-auto">A glimpse into our atmosphere, our culinary creations, and the moments we share.</p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {GALLERY_IMAGES.map((img) => (
            <div 
              key={img.id} 
              className="relative group cursor-pointer break-inside-avoid rounded-xl overflow-hidden shadow-md"
              onClick={() => setSelectedImage(img)}
            >
              <img 
                src={img.src} 
                alt={img.caption} 
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center p-4">
                   <ZoomIn className="mx-auto mb-2" size={32} />
                   <p className="font-serif font-bold text-lg">{img.caption}</p>
                   <p className="text-xs uppercase tracking-wider text-stone-300">{img.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
             className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
             onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>
          <div 
            className="max-w-5xl w-full max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImage.src} 
              alt={selectedImage.caption} 
              className="w-full h-full object-contain rounded-sm"
            />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <h3 className="text-xl font-serif font-bold">{selectedImage.caption}</h3>
              <p className="text-sm text-stone-300">{selectedImage.category}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;