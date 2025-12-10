import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-900 to-orange-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-6 hover:text-orange-400 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-4xl font-serif font-bold">Terms of Service</h1>
          <p className="text-orange-200 mt-2">Last updated: December 8, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Agreement to Terms</h2>
            <p className="text-stone-700 leading-relaxed">
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Use License</h2>
            <p className="text-stone-700 leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on Savoria Bistro's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-stone-700 space-y-2">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on the website</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Disclaimer</h2>
            <p className="text-stone-700 leading-relaxed">
              The materials on Savoria Bistro's website are provided on an 'as is' basis. Savoria Bistro makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Limitations</h2>
            <p className="text-stone-700 leading-relaxed">
              In no event shall Savoria Bistro or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption,) arising out of the use or inability to use the materials on Savoria Bistro's website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Accuracy of Materials</h2>
            <p className="text-stone-700 leading-relaxed">
              The materials appearing on Savoria Bistro's website could include technical, typographical, or photographic errors. Savoria Bistro does not warrant that any of the materials on the website are accurate, complete, or current. Savoria Bistro may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Links</h2>
            <p className="text-stone-700 leading-relaxed">
              Savoria Bistro has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Savoria Bistro of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Modifications</h2>
            <p className="text-stone-700 leading-relaxed">
              Savoria Bistro may revise these terms of service for the website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Governing Law</h2>
            <p className="text-stone-700 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of [Your Country] and you irrevocably submit to the exclusive jurisdiction of the courts located in [Your Country].
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Contact Us</h2>
            <p className="text-stone-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-4 bg-stone-50 p-4 rounded-lg">
              <p className="text-stone-700"><strong>Email:</strong> support@savoriabistro.com</p>
              <p className="text-stone-700"><strong>Address:</strong> Savoria Bistro, 123 Galle Road, Colombo 03, Sri Lanka</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
