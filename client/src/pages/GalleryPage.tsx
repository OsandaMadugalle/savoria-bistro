import React, { useState, useEffect } from 'react';
import { ZoomIn, X, Upload, Trash2 } from 'lucide-react';
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

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'masterAdmin';

  useEffect(() => {
    loadGalleryImages();
  }, []);

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
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">Gallery</h1>
          <p className="text-stone-600 max-w-2xl mx-auto">A glimpse into our atmosphere, our culinary creations, and the moments we share.</p>
          {isAdmin && (
            <button 
              onClick={() => setShowUploadModal(true)}
              className="mt-4 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Upload size={18} /> Upload Image
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-stone-600">Loading gallery...</p>
          </div>
        ) : galleryImages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-600">Gallery is empty. Check back soon!</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {galleryImages.map((img) => (
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