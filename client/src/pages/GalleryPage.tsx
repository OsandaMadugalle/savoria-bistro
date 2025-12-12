import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Loader2, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-stone-900 via-orange-900 to-stone-800 text-white py-12 sm:py-16 px-4 pt-24 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 text-center px-2">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <Zap size={18} className="text-yellow-300" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-orange-200">Memorable Moments</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-3 sm:mb-4">Our Gallery</h1>
          <p className="text-orange-100 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">Explore the ambiance, artistry, and memories we create every day at Savoria Bistro.</p>
          {isAdmin && (
            <button 
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-4 rounded-xl transition-all transform hover:scale-105 font-semibold shadow-lg"
            >
              <Upload size={20} /> Add to Gallery
            </button>
          )}
        </div>
      </div>

      <div className="pt-0 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={40} className="animate-spin text-orange-600" />
          </div>
        ) : galleryImages.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-12 mt-8 [column-fill:_balance]">
            {galleryImages.map((img) => (
              <div 
                key={img._id || img.id} 
                className="mb-4 break-inside-avoid relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all group bg-stone-100"
              >
                <img 
                  src={img.src} 
                  alt={img.caption} 
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105 bg-stone-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                {isAdmin && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(img._id);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10"
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="font-semibold text-sm line-clamp-2">{img.caption}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-stone-50 rounded-xl border border-dashed border-stone-300">
            <p className="text-stone-600 font-medium text-2xl mb-2">No images found</p>
            <p className="text-stone-500 text-sm">Upload images to get started</p>
          </div>
        )}
        </div>
      </div>

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div 
            className="bg-white rounded-lg md:rounded-xl shadow-lg max-w-xs sm:max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-200">
              <h2 className="text-lg sm:text-2xl font-serif font-bold text-stone-900">Upload Image</h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-stone-500 hover:text-stone-700"
              >
                <X size={20} className="sm:size-24" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1 sm:mb-2">Caption</label>
                <input 
                  type="text"
                  value={uploadForm.caption}
                  onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
                  placeholder="e.g., Main Dining Area"
                  className="w-full px-2 sm:px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1 sm:mb-2">Category</label>
                <input 
                  type="text"
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  placeholder="e.g., Ambiance, Food, Staff"
                  className="w-full px-2 sm:px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1 sm:mb-2">Image</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-2 sm:px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
                {uploadForm.file && (
                  <p className="text-xs text-stone-600 mt-1">{uploadForm.file.name}</p>
                )}
              </div>

              {uploadError && (
                <p className="text-xs sm:text-sm text-red-600 bg-red-50 p-2 rounded">{uploadError}</p>
              )}

              <div className="flex gap-2 pt-2 sm:pt-4">
                <button 
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-semibold text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-3 sm:px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-400 text-white rounded-lg transition-colors font-semibold text-sm"
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