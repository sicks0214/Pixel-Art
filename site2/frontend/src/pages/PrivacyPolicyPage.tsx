import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to ColorMagic
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">Last Updated: December 2024</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8">
              <p className="text-green-800 font-semibold">
                ColorMagic is committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, and safeguard your data when you use our AI-powered color palette generation service.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-medium text-gray-800 mb-2">1.1 Information You Provide Directly</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Text Input</strong>: Color palette descriptions and prompts you submit to our AI service</li>
                    <li><strong>Image Uploads</strong>: Images you upload for color analysis (processed temporarily and automatically deleted)</li>
                    <li><strong>Contact Information</strong>: Email address and name when you contact us through our support form</li>
                    <li><strong>Feedback and Communications</strong>: Any messages, suggestions, or feedback you send to us</li>
                  </ul>
                </div>

                <h3 className="text-lg font-medium text-gray-800 mb-2 mt-6">1.2 Information We Collect Automatically</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Usage Analytics</strong>: General usage patterns, feature interactions, and performance metrics</li>
                    <li><strong>Technical Information</strong>: Browser type, device information, IP address (anonymized), and operating system</li>
                    <li><strong>Performance Data</strong>: Service response times, error logs, and system performance metrics</li>
                    <li><strong>Preferences</strong>: Language settings and interface preferences stored locally</li>
                  </ul>
                </div>

                <h3 className="text-lg font-medium text-gray-800 mb-2 mt-6">1.3 Information We Do NOT Collect</h3>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>User Accounts</strong>: We do not require or create user accounts or persistent profiles</li>
                    <li><strong>Personal Identifiers</strong>: We do not collect social security numbers, government IDs, or financial information</li>
                    <li><strong>Tracking Cookies</strong>: We do not use invasive tracking cookies or cross-site tracking</li>
                    <li><strong>Sensitive Data</strong>: We do not intentionally collect sensitive personal information</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <div className="space-y-4 text-gray-700">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Primary Service Functions</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Generate AI-powered color palettes from your text inputs</li>
                      <li>• Analyze colors from uploaded images</li>
                      <li>• Provide export capabilities in various formats</li>
                      <li>• Deliver responsive and personalized user experience</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Service Improvement</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Monitor service performance and reliability</li>
                      <li>• Identify and fix technical issues</li>
                      <li>• Enhance AI model accuracy and response quality</li>
                      <li>• Develop new features based on usage patterns</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-2">Communication and Support</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Respond to your inquiries, support requests, and feedback</li>
                    <li>Send important service announcements and updates (when necessary)</li>
                    <li>Provide technical assistance and troubleshooting support</li>
                    <li>Inform you about significant changes to our service or policies</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Processing and Third-Party Services</h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Local Processing</h3>
                  <p className="text-sm mb-2">
                    Our pixel art conversion is performed entirely using our own algorithms:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>All image processing occurs on our servers using open-source libraries</li>
                    <li>No third-party AI services are used for image processing</li>
                    <li>Your images are processed using standard image manipulation algorithms</li>
                    <li>We maintain full control over the processing pipeline</li>
                    <li>No external API calls are made during image conversion</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Image Processing</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Temporary Processing</strong>: Uploaded images are processed temporarily for color extraction</li>
                    <li><strong>Automatic Deletion</strong>: Images are automatically deleted after processing (typically within minutes)</li>
                    <li><strong>No Long-term Storage</strong>: We do not store uploaded images permanently</li>
                    <li><strong>Local Processing Priority</strong>: When possible, image processing occurs client-side in your browser</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Retention and Your Rights</h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Automatic Data Deletion</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Image Uploads</strong>: Deleted immediately after color analysis processing (within minutes)</li>
                    <li><strong>Text Prompts</strong>: Not stored permanently; processed and discarded</li>
                    <li><strong>Session Data</strong>: Cleared when you close your browser or end your session</li>
                    <li><strong>Temporary Files</strong>: Automatically cleaned up by our system processes</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Your Privacy Rights</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Right to Know</strong>: What data we collect and how we use it</li>
                    <li><strong>Right to Delete</strong>: Request deletion of any data we may have</li>
                    <li><strong>Right to Correct</strong>: Update or correct any inaccurate information</li>
                    <li><strong>Right to Object</strong>: Opt out of certain data processing activities</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Security Measures</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Encryption</strong>: All data transmissions use HTTPS/TLS encryption</li>
                    <li><strong>Secure Infrastructure</strong>: Hosted on secure, regularly updated server infrastructure</li>
                    <li><strong>Access Controls</strong>: Limited access to systems and data on a need-to-know basis</li>
                    <li><strong>Open Source Transparency</strong>: Code is publicly available for security review</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Important Security Notice</h3>
                  <p className="text-sm mb-2">Despite our security measures, please be aware:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>No internet service can guarantee 100% security</li>
                    <li>Avoid uploading sensitive or confidential images</li>
                    <li>Do not include personal information in text prompts</li>
                    <li>We cannot control the security of third-party services we integrate with</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">How to Reach Us</h3>
                  <p className="text-sm mb-2">For privacy-related questions, concerns, or requests:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Primary Contact</strong>: <a href="mailto:privacy@colormagic.dev" className="text-blue-600 hover:underline">privacy@colormagic.dev</a></li>
                    <li><strong>General Support</strong>: <a href="mailto:support@colormagic.dev" className="text-blue-600 hover:underline">support@colormagic.dev</a></li>
                    <li><strong>GitHub Issues</strong>: <a href="https://github.com/ColorMagic/ColorMagic/issues" className="text-blue-600 hover:underline">https://github.com/ColorMagic/ColorMagic/issues</a></li>
                    <li><strong>Response Time</strong>: We aim to respond to all privacy inquiries within 30 days</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <h3 className="text-xl font-semibold text-green-900 mb-2">Your Privacy Matters</h3>
              <p className="text-green-800 text-sm">
                We are committed to maintaining your trust through transparent, responsible data handling practices. 
                As an open source project, our privacy practices are subject to community review and continuous improvement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage 