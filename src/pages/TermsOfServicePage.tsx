import React from 'react';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfServicePage = () => {
  return (
    <div className="bg-muted/40">
      <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-background p-8 sm:p-12 rounded-lg shadow-md">
          <div className="flex flex-col items-center text-center mb-8">
            <Package className="h-10 w-10 mb-4 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Client Portal application (the "Service") operated by us.
            </p>

            <h2 className="font-semibold mt-6 mb-2 text-xl">Conditions of Use</h2>
            <p>
              We will provide their services to you, which are subject to the conditions stated below in this document. Every time you visit this application, use its services, or make a purchase, you accept the following conditions. This is why we urge you to read them carefully.
            </p>

            <h2 className="font-semibold mt-6 mb-2 text-xl">Privacy Policy</h2>
            <p>
              Before you continue using our application, we advise you to read our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> regarding our user data collection. It will help you better understand our practices.
            </p>

            <h2 className="font-semibold mt-6 mb-2 text-xl">Accounts</h2>
            <p>
              When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>

            <h2 className="font-semibold mt-6 mb-2 text-xl">Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which our company is established, without regard to its conflict of law provisions.
            </p>

            <h2 className="font-semibold mt-6 mb-2 text-xl">Changes to This Agreement</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. We do so by posting and drawing attention to the updated terms on the Site. Your decision to continue to visit and make use of the Site after such changes have been made constitutes your formal acceptance of the new Terms of Service.
            </p>

            <h2 className="font-semibold mt-6 mb-2 text-xl">Contact Us</h2>
            <p>
              If you have any questions about this Agreement, please feel free to contact us at <a href="mailto:support@example.com" className="text-primary hover:underline">support@example.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;