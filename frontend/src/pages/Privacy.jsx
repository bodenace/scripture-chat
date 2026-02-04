/**
 * Privacy Policy Page
 */

import { Link } from 'react-router-dom';

function Privacy() {
  return (
    <div className="min-h-screen bg-scripture-cream">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-scripture-navy rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">✝</span>
            </div>
            <h1 className="text-xl font-display text-scripture-navy">
              ScriptureChat
            </h1>
          </Link>
          <Link to="/" className="btn-text">
            Back to Chat
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-display text-scripture-navy mb-6">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">1. Introduction</h2>
            <p>
              Welcome to ScriptureChat. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our 
              AI-powered Bible study service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">2. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Account Information:</strong> Email address, name, and password when you create an account.</li>
              <li><strong>Payment Information:</strong> Payment details are processed securely by Stripe. We do not store your full credit card number.</li>
              <li><strong>Chat History:</strong> Your conversations with ScriptureChat are stored to provide continuity and improve your experience.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our service, including questions asked and features used.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Provide and maintain our Bible study AI service</li>
              <li>Process your subscription payments</li>
              <li>Save your chat history for your convenience</li>
              <li>Send important service updates and notifications</li>
              <li>Improve our AI responses and service quality</li>
              <li>Respond to your inquiries and support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">4. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption. We use secure HTTPS connections 
              for all data transmission. Your chat conversations are stored in encrypted databases and are 
              only accessible to you when logged into your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Stripe:</strong> For secure payment processing</li>
              <li><strong>OpenAI:</strong> To power our AI scripture assistant</li>
              <li><strong>MongoDB:</strong> For secure data storage</li>
            </ul>
            <p className="mt-3">
              These services have their own privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Access your personal data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your chat history</li>
              <li>Opt out of marketing communications</li>
              <li>Cancel your subscription at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">7. Cookies</h2>
            <p>
              We use essential cookies to maintain your login session and remember your preferences. 
              We do not use tracking cookies for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">8. Children's Privacy</h2>
            <p>
              ScriptureChat is not intended for children under 13 years of age. We do not knowingly 
              collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes 
              by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our data practices, please contact us at:
            </p>
            <p className="mt-3">
              <strong>Email:</strong> support@scripturechat.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link to="/" className="btn-primary">
            Return to ScriptureChat
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Privacy;
