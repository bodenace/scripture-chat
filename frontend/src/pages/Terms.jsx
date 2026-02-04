/**
 * Terms of Service Page
 */

import { Link } from 'react-router-dom';

function Terms() {
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
        <h1 className="text-3xl font-display text-scripture-navy mb-6">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ScriptureChat, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">2. Description of Service</h2>
            <p>
              ScriptureChat is an AI-powered Bible study assistant that helps users explore and understand 
              Christian scripture. Our service uses artificial intelligence to provide responses about 
              Biblical topics, but should not be considered a replacement for pastoral guidance, 
              professional counseling, or personal Bible study.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">3. Subscription and Payment</h2>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>ScriptureChat offers a monthly subscription service at $4.99 per month.</li>
              <li>Payment is processed securely through Stripe.</li>
              <li>Subscriptions automatically renew monthly unless cancelled.</li>
              <li>You may cancel your subscription at any time through your account dashboard.</li>
              <li>Refunds are handled on a case-by-case basis. Contact support for refund requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">4. User Accounts</h2>
            <p>To use ScriptureChat's full features, you must:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be at least 13 years of age</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">5. Acceptable Use</h2>
            <p>When using ScriptureChat, you agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to manipulate or abuse the AI system</li>
              <li>Share your account with others</li>
              <li>Use automated scripts or bots to access the service</li>
              <li>Harass, threaten, or harm other users or our staff</li>
              <li>Attempt to reverse-engineer or copy our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">6. AI Limitations and Disclaimer</h2>
            <p>
              <strong>Important:</strong> ScriptureChat uses artificial intelligence to generate responses. 
              While we strive for accuracy and faithfulness to Biblical teachings:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>AI responses may occasionally contain errors or misinterpretations</li>
              <li>The service is not a substitute for reading the Bible directly</li>
              <li>Responses should not replace guidance from qualified pastors or theologians</li>
              <li>For serious spiritual, emotional, or life decisions, seek appropriate professional counsel</li>
              <li>Different Christian denominations may interpret scripture differently</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">7. Intellectual Property</h2>
            <p>
              The ScriptureChat service, including its design, features, and content (excluding Bible verses 
              which are in the public domain or used under license), is owned by ScriptureChat and protected 
              by intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">8. Limitation of Liability</h2>
            <p>
              ScriptureChat is provided "as is" without warranties of any kind. We are not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Decisions made based on AI responses</li>
              <li>Service interruptions or technical issues</li>
              <li>Loss of data or chat history</li>
              <li>Any indirect, incidental, or consequential damages</li>
            </ul>
            <p className="mt-3">
              Our total liability shall not exceed the amount you paid for the service in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these terms. 
              You may also delete your account at any time. Upon termination, your right to use the 
              service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">10. Changes to Terms</h2>
            <p>
              We may modify these terms at any time. Continued use of the service after changes 
              constitutes acceptance of the modified terms. We will notify users of significant 
              changes via email or in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">11. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with applicable laws. 
              Any disputes shall be resolved through good-faith negotiation or, if necessary, 
              binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-scripture-navy mt-8 mb-4">12. Contact Us</h2>
            <p>
              If you have questions about these Terms of Service, please contact us at:
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

export default Terms;
