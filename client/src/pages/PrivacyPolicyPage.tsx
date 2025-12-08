import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
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
          <h1 className="text-4xl font-serif font-bold">Privacy Policy</h1>
          <p className="text-orange-200 mt-2">Last updated: December 8, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Introduction</h2>
            <p className="text-stone-700 leading-relaxed">
              Savoria Bistro ("we", "us", "our", or "Company") operates the Savoria Bistro website and services. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Information Collection and Use</h2>
            <p className="text-stone-700 leading-relaxed mb-4">
              We collect several different types of information for various purposes to provide and improve our Service to you.
            </p>
            <h3 className="text-xl font-semibold text-stone-800 mb-2">Types of Data Collected:</h3>
            <ul className="list-disc list-inside text-stone-700 space-y-2">
              <li><strong>Personal Data:</strong> Name, email address, phone number, address, payment information</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our website and services</li>
              <li><strong>Location Data:</strong> Information about your location if you grant permission</li>
              <li><strong>Device Information:</strong> Browser type, IP address, operating system</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Use of Data</h2>
            <p className="text-stone-700 leading-relaxed mb-4">
              Savoria Bistro uses the collected data for various purposes:
            </p>
            <ul className="list-disc list-inside text-stone-700 space-y-2">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To process your orders and payments</li>
              <li>To send you promotional emails and newsletters (with your consent)</li>
              <li>To monitor and analyze trends, usage, and activities</li>
              <li>To detect, prevent, and address technical issues</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Security of Data</h2>
            <p className="text-stone-700 leading-relaxed">
              The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Cookies</h2>
            <p className="text-stone-700 leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Contact Us</h2>
            <p className="text-stone-700 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 bg-stone-50 p-4 rounded-lg">
              <p className="text-stone-700"><strong>Email:</strong> privacy@savoriabistro.com</p>
              <p className="text-stone-700"><strong>Address:</strong> Savoria Bistro, Your City, Your Country</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
