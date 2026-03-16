import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-amber-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <span className="text-lg font-bold text-white">Privacy Policy</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16 prose prose-invert prose-amber max-w-none">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
          <p className="text-muted-foreground">
            ZTech Electronics Limited ("we," "us," or "our") operates ElectroDoctor. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
          </p>
        </section>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
          <h3 className="text-lg font-medium text-foreground/90">2.1 Personal Information</h3>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li>Name and email address (during account registration)</li>
            <li>Device information submitted for diagnosis</li>
            <li>Usage data and interaction patterns within the app</li>
          </ul>
          <h3 className="text-lg font-medium text-foreground/90">2.2 Uploaded Content</h3>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li>Photos and videos of devices uploaded for AI diagnosis</li>
            <li>Chat messages and troubleshooting queries</li>
            <li>Feedback and ratings on AI responses</li>
          </ul>
          <h3 className="text-lg font-medium text-foreground/90">2.3 Automatically Collected Data</h3>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li>Browser type and version</li>
            <li>Device type and operating system</li>
            <li>IP address and approximate location</li>
            <li>Pages visited and time spent on the Service</li>
          </ul>
        </section>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li>To provide and maintain the diagnostic Service</li>
            <li>To improve AI model accuracy using anonymized feedback data</li>
            <li>To communicate with you about your account and Service updates</li>
            <li>To detect and prevent fraud, abuse, and security incidents</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-foreground">4. AI & Machine Learning</h2>
          <p className="text-muted-foreground">
            Your feedback and diagnostic interactions may be used to train and improve our AI models. All training data is anonymized and aggregated. You can opt out of AI training data collection by contacting us at the email below.
          </p>
        </section>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-foreground">5. Data Sharing & Third Parties</h2>
          <p className="text-muted-foreground">We do not sell your personal information. We may share data with:</p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li><strong>Service Providers:</strong> Cloud hosting, AI processing, and analytics services that help us operate the platform</li>
            <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>
        </section>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-foreground">6. Data Security</h2>
          <p className="text-muted-foreground">
            We implement industry-standard security measures including encryption in transit (TLS), row-level security policies on our database, and secure authentication protocols. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-foreground">7. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain your personal information for as long as your account is active or as needed to provide the Service. Diagnostic data and chat history are retained for 12 months to enable issue tracking. You may request deletion of your data at any time.
          </p>
        </section>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-foreground">8. Your Rights</h2>
          <p className="text-muted-foreground">Depending on your jurisdiction, you may have the right to:</p>
          <ul className="text-muted-foreground space-y-2 list-disc pl-6">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict processing of your data</li>
            <li>Data portability — receive your data in a structured format</li>
          </ul>
        </section>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-foreground">9. Cookies & Tracking</h2>
          <p className="text-muted-foreground">
            We use essential cookies for authentication and session management. We use analytics cookies to understand how the Service is used. You can manage cookie preferences through the cookie consent banner displayed when you first visit the site.
          </p>
        </section>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-foreground">10. Children's Privacy</h2>
          <p className="text-muted-foreground">
            The Service is not directed to children under 16. We do not knowingly collect personal information from children under 16. If we learn we have collected data from a child under 16, we will delete it promptly.
          </p>
        </section>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-foreground">11. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-foreground">12. Contact Us</h2>
          <p className="text-muted-foreground">
            For privacy-related inquiries, contact us at{' '}
            <a href="mailto:privacy@ztechelectronics.com" className="text-primary hover:underline">privacy@ztechelectronics.com</a>
          </p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
