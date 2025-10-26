import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const TermsOfServicePage: React.FC = () => {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-600">Last Updated: December 2024</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
              <p className="text-blue-800 font-semibold">
                By accessing and using ColorMagic AI Palette Tool, you agree to be bound by these Terms of Service and all applicable laws and regulations.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Service Description</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  ColorMagic is an AI-powered color palette generation tool that provides the following services:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>AI Palette Generation</strong>: Generate intelligent color schemes based on text descriptions</li>
                  <li><strong>Image Color Analysis</strong>: Extract and analyze colors from uploaded images</li>
                  <li><strong>Export Capabilities</strong>: Export palettes in multiple formats including PNG, CSS, and JSON</li>
                  <li><strong>Free Access</strong>: All core features are provided free of charge</li>
                  <li><strong>Open Source</strong>: The project is open source and community-driven</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. User Obligations and Conduct</h2>
              <div className="space-y-4 text-gray-700">
                <p>By using our service, you agree to:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Lawful Use</strong>: Use the service only for lawful purposes and in accordance with these Terms</li>
                    <li><strong>Prohibited Activities</strong>: Not engage in any malicious attacks, spam distribution, or other abusive behaviors</li>
                    <li><strong>Content Responsibility</strong>: Take full responsibility for any content you upload, ensuring you have appropriate rights</li>
                    <li><strong>Community Standards</strong>: Adhere to open source community guidelines and behavioral standards</li>
                    <li><strong>Legal Compliance</strong>: Comply with all applicable laws and regulations in your jurisdiction</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Intellectual Property Rights</h2>
              <div className="space-y-4 text-gray-700">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Your Rights</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Full ownership of uploaded content</li>
                      <li>• Unrestricted use of generated palettes</li>
                      <li>• No copyright restrictions on results</li>
                      <li>• Commercial use permitted</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Our Rights</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Open source license governs code usage</li>
                      <li>• Service improvements based on usage patterns</li>
                      <li>• Third-party AI services subject to their terms</li>
                      <li>• Community contributions under project license</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. AI Service Provisions</h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-amber-800 mb-2">Important AI Disclaimers:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>AI-generated color palettes are provided for reference purposes only</li>
                    <li>Results may not be suitable for all applications or cultural contexts</li>
                    <li>Professional design judgment should be applied to final implementations</li>
                    <li>We do not guarantee accuracy, completeness, or commercial viability of generated content</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Service Availability and Modifications</h2>
              <div className="space-y-4 text-gray-700">
                <p>As an open source project, we reserve the right to:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>Service Updates</strong>: Modify, update, or discontinue features at any time</li>
                  <li><strong>Maintenance</strong>: Perform necessary system maintenance and upgrades</li>
                  <li><strong>Terms Revision</strong>: Update these Terms of Service with prior notice for material changes</li>
                  <li><strong>Community Direction</strong>: Project development may be influenced by community needs and contributions</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Open Source Specific Terms</h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Open Source Benefits:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Full source code transparency and community review</li>
                    <li>Permission to fork and modify under applicable open source license</li>
                    <li>Community-driven feature development and bug fixes</li>
                    <li>No vendor lock-in - you can run your own instance</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Open Source Considerations:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Service continuity depends on community support and maintenance</li>
                    <li>Development priorities may change based on community consensus</li>
                    <li>Contributors provide code under open source licenses without individual liability</li>
                    <li>Third-party integrations may have separate terms and limitations</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="font-semibold text-red-800 mb-2">Important Legal Notice:</p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>No Warranties</strong>: Service is provided "AS IS" without any express or implied warranties</li>
                    <li><strong>Damage Limitations</strong>: We shall not be liable for any direct, indirect, incidental, or consequential damages</li>
                    <li><strong>Service Interruptions</strong>: No liability for service downtime, data loss, or technical failures</li>
                    <li><strong>Third-Party Services</strong>: Not responsible for failures or issues with integrated third-party services</li>
                    <li><strong>User Responsibility</strong>: Users assume full responsibility for their use of generated content</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
              <div className="space-y-4 text-gray-700">
                <p>Your privacy is important to us. Key principles:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>Minimal Data Collection</strong>: We collect only necessary data for service functionality</li>
                  <li><strong>Temporary Processing</strong>: Uploaded images are processed temporarily and automatically deleted</li>
                  <li><strong>No Personal Profiles</strong>: We do not create persistent user profiles or accounts</li>
                  <li><strong>Local Processing</strong>: Image processing is performed entirely on our servers without third-party AI services</li>
                </ul>
                <p className="mt-4">
                  For detailed information, please review our <strong>Privacy Policy</strong>.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Dispute Resolution</h2>
              <div className="space-y-4 text-gray-700">
                <p>In case of disputes or concerns:</p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Primary Method</strong>: GitHub Issues for technical and service-related concerns</li>
                    <li><strong>Community Mediation</strong>: Leverage open source community for conflict resolution</li>
                    <li><strong>Governing Law</strong>: These terms are governed by applicable international law</li>
                    <li><strong>Good Faith Resolution</strong>: Priority on amicable resolution through discussion</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>For questions, concerns, or suggestions regarding these Terms of Service:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>GitHub Issues</strong>: <a href="https://github.com/ColorMagic/ColorMagic/issues" className="text-blue-600 hover:underline">https://github.com/ColorMagic/ColorMagic/issues</a></li>
                    <li><strong>Email Support</strong>: support@colormagic.dev</li>
                    <li><strong>Community Discussions</strong>: GitHub Discussions forum</li>
                    <li><strong>Project Repository</strong>: <a href="https://github.com/ColorMagic/ColorMagic" className="text-blue-600 hover:underline">https://github.com/ColorMagic/ColorMagic</a></li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Effective Date and Changes</h2>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>Effective Date</strong>: These Terms of Service are effective as of December 2024</li>
                  <li><strong>Notification of Changes</strong>: Material changes will be announced through the application and GitHub</li>
                  <li><strong>Version Control</strong>: Previous versions are available in the project's GitHub repository</li>
                  <li><strong>Acceptance</strong>: Continued use of the service constitutes acceptance of updated terms</li>
                </ul>
              </div>
            </section>

            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Thank You for Using ColorMagic</h3>
              <p className="text-blue-800 text-sm">
                We are committed to providing a high-quality, transparent, and community-driven service. 
                Your understanding and cooperation help us maintain a positive environment for all users.
              </p>
              <div className="mt-4 text-xs text-blue-600">
                <p><strong>ColorMagic Development Team</strong></p>
                <p>Open Source • Community Driven • Free Forever</p>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>
                By continuing to use this service, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfServicePage 