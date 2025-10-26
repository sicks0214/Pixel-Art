import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const DisclaimerPage: React.FC = () => {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Legal Disclaimer</h1>
            <p className="text-gray-600">Last Updated: December 2024</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-amber-500 text-xl">⚠</span>
                </div>
                <div className="ml-3">
                  <p className="text-amber-800 font-semibold">
                    IMPORTANT: Please read this disclaimer carefully before using ColorMagic services.
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Image Processing Limitations</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Processing Accuracy</strong>: Pixel art conversion results are provided for creative use and are not guaranteed to meet specific quality standards.</li>
                  <li><strong>Professional Judgment Required</strong>: Final image usage should incorporate appropriate evaluation for specific project requirements.</li>
                  <li><strong>Algorithm Constraints</strong>: Image processing algorithms may have limitations based on input quality and complexity.</li>
                  <li><strong>Artistic Interpretation</strong>: Generated pixel art represents algorithmic interpretation and may not match artistic intentions.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Availability and Performance</h2>
              <div className="bg-red-50 p-4 rounded-lg">
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>No Uptime Guarantee</strong>: We do not guarantee 24/7 service availability and may experience interruptions due to maintenance, upgrades, or technical failures.</li>
                  <li><strong>Performance Variability</strong>: Service response times may vary due to network conditions, server load, and other technical factors.</li>
                  <li><strong>Infrastructure Dependencies</strong>: Our service relies on hosting infrastructure and image processing libraries, whose interruptions may affect functionality.</li>
                  <li><strong>Data Processing Risks</strong>: While security measures are in place, we cannot completely eliminate risks associated with data transmission and processing.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Commercial Use and Liability</h2>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Commercial Application</strong>: Users must conduct adequate testing and professional evaluation before using generated content in commercial projects.</li>
                  <li><strong>Accessibility Compliance</strong>: We do not guarantee that generated color schemes meet accessibility requirements. Users must verify contrast ratios and readability independently.</li>
                  <li><strong>Device Compatibility</strong>: Colors may appear differently across devices and displays. Users must verify appearance on target platforms.</li>
                  <li><strong>Brand Guidelines</strong>: Users are responsible for ensuring generated colors comply with relevant brand guidelines and corporate standards.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Open Source Project Considerations</h2>
              <div className="bg-green-50 p-4 rounded-lg">
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Community Maintenance</strong>: This project is maintained by the open source community, and service continuity depends on community support.</li>
                  <li><strong>Code Assessment</strong>: While the code is open for review, users must independently assess code security and reliability.</li>
                  <li><strong>Version Changes</strong>: The project may be updated at any time, and functionality or interfaces may change without notice.</li>
                  <li><strong>Contributor Liability</strong>: Code contributors provide contributions under open source licenses and do not assume personal liability for functional defects.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Legal Liability Limitations</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Limitation of Damages</strong>: We shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use of this service.</li>
                  <li><strong>Business Losses</strong>: This includes but is not limited to loss of profits, business interruption, data loss, or other commercial damages.</li>
                  <li><strong>User Responsibility</strong>: Users assume full responsibility for the consequences and risks of using this service.</li>
                  <li><strong>Maximum Liability</strong>: Our total liability shall not exceed the amount paid by the user for the service, if any.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property and Compliance</h2>
              <div className="text-gray-700 space-y-2">
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Copyright Responsibility</strong>: Users must ensure that final works do not infringe upon third-party intellectual property rights.</li>
                  <li><strong>Industry Standards</strong>: Certain industries may have specific color usage regulations that users must comply with.</li>
                  <li><strong>Cultural Sensitivity</strong>: Colors may have different meanings across cultures; users should adjust according to target audiences.</li>
                  <li><strong>Professional Medical Advice</strong>: This service does not provide medical advice. Color therapy applications should be consulted with qualified professionals.</li>
                </ul>
              </div>
            </section>

            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-red-500 text-xl mr-2">⚠</span>
                <p className="font-bold text-red-800">FINAL NOTICE</p>
              </div>
              <p className="text-red-700 text-sm">
                By using this service, you acknowledge that you have read, understood, and agree to assume the associated risks. 
                If you do not agree with this disclaimer, please discontinue use immediately. This service is provided "AS IS" 
                without any express or implied warranties.
              </p>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600 text-sm font-medium">
                ColorMagic Development Team
              </p>
              <p className="text-gray-500 text-xs mt-1">
                We strive to provide quality service, but responsible usage by users is equally important.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DisclaimerPage 