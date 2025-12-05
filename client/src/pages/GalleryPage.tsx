import React, { useState, useEffect } from 'react';
import { ZoomIn, X, Upload, Trash2, ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import { fetchGalleryImages, uploadGalleryImage, deleteGalleryImage } from '../services/api';
import { User } from '../types';

interface GalleryPageProps {
  user: User | null;
}

interface GalleryImage {
  _id?: string;
  id?: string;
  src: string;
  caption: string;
  category: string;
  uploadedBy?: string;
  uploadedByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ user }) => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ caption: '', category: '', file: null as File | null });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'masterAdmin';

  useEffect(() => {
    loadGalleryImages();
  }, []);

  // Get unique categories
  const categories = ['All', ...new Set(galleryImages.map(img => img.category))];

  // Filter images by category and search
  const filteredImages = galleryImages.filter(img => {
    const matchesCategory = selectedCategory === 'All' || img.category === selectedCategory;
    const matchesSearch = img.caption.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Find current image index for navigation
  const currentImageIndex = filteredImages.findIndex(img => img._id === selectedImage?._id || img.id === selectedImage?.id);

  // Handle image navigation
  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setSelectedImage(filteredImages[currentImageIndex - 1]);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < filteredImages.length - 1) {
      setSelectedImage(filteredImages[currentImageIndex + 1]);
    }
  };

  // Prevent scroll when lightbox is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  const loadGalleryImages = async () => {
    try {
      setLoading(true);
      const images = await fetchGalleryImages();
      setGalleryImages(images);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setUploadForm({ ...uploadForm, file: e.target.files[0] });
      setUploadError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.caption || !uploadForm.category || !uploadForm.file) {
      setUploadError('All fields are required');
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await uploadGalleryImage({
          caption: uploadForm.caption,
          category: uploadForm.category,
          imageBase64: base64,
          uploadedBy: user?.email || '',
          uploadedByName: user?.name || ''
        });
        setUploadForm({ caption: '', category: '', file: null });
        setShowUploadModal(false);
        loadGalleryImages();
        showNotification('success', 'Image uploaded successfully!');
      };
      reader.readAsDataURL(uploadForm.file);
    } catch (error) {
      setUploadError('Failed to upload image');
      showNotification('error', 'Failed to upload image');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string | undefined) => {
    if (!imageId || !window.confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await deleteGalleryImage(imageId);
      loadGalleryImages();
      showNotification('success', 'Image deleted successfully!');
    } catch (error) {
      showNotification('error', 'Failed to delete image');
      console.error('Failed to delete image:', error);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-stone-900 via-orange-900 to-stone-800 text-white py-16 px-4 pt-24 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Our Gallery</h1>
          <p className="text-orange-100 max-w-2xl mx-auto text-lg">A glimpse into our atmosphere, our culinary creations, and the moments we share with our guests.</p>
          {isAdmin && (
            <button 
              onClick={() => setShowUploadModal(true)}
              className="mt-6 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-full transition-all transform hover:scale-105 font-semibold shadow-lg"
            >
              <Upload size={18} /> Upload Image
            </button>
          )}
        </div>
      </div>

      <div className="pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filter Section */}
          <div className="mb-12 space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-3.5 text-stone-400" size={20} />
              <input 
                type="text" 
                placeholder="Search images..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-stone-200 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm text-stone-800 placeholder-stone-400"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map(cat => {
                const count = galleryImages.filter(img => img.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                      selectedCategory === cat 
                        ? 'bg-stone-900 text-white shadow-md' 
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-orange-300'
                    }`}
                  >
                    {cat}
                    {cat !== 'All' && <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

        {/* Results Count */}
        {!loading && galleryImages.length > 0 && (
          <div className="text-center mb-8">
            <p className="text-stone-600 font-medium">
              Showing <span className="text-orange-600 font-bold">{filteredImages.length}</span> {filteredImages.length === 1 ? 'image' : 'images'}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={40} className="animate-spin text-orange-600" />
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-stone-300">
            <ZoomIn size={40} className="text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600 font-medium">No images found</p>
            <p className="text-stone-500 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredImages.map((img) => (
              <div 
                key={img._id || img.id} 
                className="relative group cursor-pointer break-inside-avoid rounded-xl overflow-hidden shadow-md"
              >
                <img 
                  src={img.src} 
                  alt={img.caption} 
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  onClick={() => setSelectedImage(img)}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between p-4">
                  <div 
                    className="flex-1 flex items-center justify-center"
                    onClick={() => setSelectedImage(img)}
                  >
                    <div className="text-white text-center">
                      <ZoomIn className="mx-auto mb-2" size={32} />
                      <p className="font-serif font-bold text-lg">{img.caption}</p>
                      <p className="text-xs uppercase tracking-wider text-stone-300">{img.category}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(img._id);
                      }}
                      className="ml-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} className="text-white" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
             className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
             onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>

          {/* Navigation Buttons */}
          {currentImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 p-2 hover:bg-white/10 rounded-lg"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {currentImageIndex < filteredImages.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 p-2 hover:bg-white/10 rounded-lg"
            >
              <ChevronRight size={32} />
            </button>
          )}

          <div 
            className="max-w-5xl w-full max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImage.src} 
              alt={selectedImage.caption} 
              className="w-full h-full object-contain rounded-sm"
            />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 text-white">
              <h3 className="text-2xl font-serif font-bold mb-2">{selectedImage.caption}</h3>
              <p className="text-sm text-stone-300 mb-2">{selectedImage.category}</p>
              {selectedImage.createdAt && (
                <p className="text-xs text-stone-400">{new Date(selectedImage.createdAt).toLocaleDateString()}</p>
              )}
              {/* Image Counter */}
              <div className="mt-4 text-xs text-stone-300 flex items-center justify-between">
                <span>{currentImageIndex + 1} / {filteredImages.length}</span>
                {filteredImages.length > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      disabled={currentImageIndex === 0}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      disabled={currentImageIndex === filteredImages.length - 1}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white text-sm font-medium z-40 animate-in fade-in slide-in-from-top-2 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="text-2xl font-serif font-bold text-stone-900">Upload Image</h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-stone-500 hover:text-stone-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Caption</label>
                <input 
                  type="text"
                  value={uploadForm.caption}
                  onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
                  placeholder="e.g., Main Dining Area"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Category</label>
                <input 
                  type="text"
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  placeholder="e.g., Ambiance, Food, Staff"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Image</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {uploadForm.file && (
                  <p className="text-xs text-stone-600 mt-1">{uploadForm.file.name}</p>
                )}
              </div>

              {uploadError && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{uploadError}</p>
              )}

              <div className="flex gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-400 text-white rounded-lg transition-colors font-semibold"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;