import React from 'react';
import { Package } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <div className="bg-muted/40">
      <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-background p-8 sm:p-12 rounded-lg shadow-md">
          <div className="flex flex-col items-center text-center mb-8">
            <Package className="h-10 w-10 mb-4 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              Welcome to Client Portal. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
            </p>

            <h2 className="font-semibold mt-6 mb-2 text-xl">Information We Collect</h2>
            <p>
              We may collect information about you in a variety of ways. The information we may collect via the Application includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Personal Data:</strong> When you register using Google Authentication, we collect personally identifiable information that you voluntarily provide, such as your name, email address, and profile picture.
              </li>
              <li>
                <strong>Usage Data:</strong> We may automatically collect information about how you access and use the application to help us improve our services.
              </li>
            </ul>

            <h2 className="font-semibold mt-6 mb-2 text-xl">Use of Your Information</h2>
            <p>
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and manage your account.</li>
              <li>Personalize your experience within the application.</li>
              <li>Monitor and analyze usage and trends to improve the application.</li>
              <li>Notify you of updates to the application.</li>
            </ul>

            <h2 className="font-semibold mt-6 mb-2 text-xl">Disclosure of Your Information</h2>
            <p>
              We do not share, sell, rent, or trade your personal information with third parties for their commercial purposes. We may share information we have collected about you only in limited situations, such as to comply with legal obligations or to protect our rights.
            </p>

            <h2 className="font-semibold mt-6 mb-2 text-xl">Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable.
            </p>

            <h2 className="font-semibold mt-6 mb-2 text-xl">Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:support@example.com" className="text-primary hover:underline">support@example.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;