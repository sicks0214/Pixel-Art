import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SEO from '@/components/SEO'

const ContactPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    message: '',
    sendCopy: false
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // 模拟表单提交
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      console.log('Form submitted:', formData)
    }, 2000)
  }

  const handleClear = () => {
    setFormData({
      email: '',
      name: '',
      message: '',
      sendCopy: false
    })
  }

  const handleBack = () => {
    navigate(-1)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-purple-50">
        <SEO
          title="Thank You - Pixel Art Converter"
          description="Thank you for contacting Pixel Art Converter. We'll get back to you soon."
          url="https://pixelartland.cc/contact/"
        />
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to ColorMagic
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Contact Us</h1>
          </div>

          {/* Success Message */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your message has been submitted successfully. We'll get back to you within 24-48 hours.
            </p>
            <div className="space-x-4">
              <button
                onClick={handleBack}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Back to ColorMagic
              </button>
              <button
                onClick={() => setIsSubmitted(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-purple-50">
      <SEO
        title="Contact Us - Pixel Art Converter"
        description="Get in touch with Pixel Art Converter. We're here to help with your pixel art conversion needs."
        url="https://pixelartland.cc/contact/"
      />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to ColorMagic
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Contact Us</h1>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Form Header */}
          <div className="bg-purple-600 text-white p-6 rounded-t-lg">
            <h2 className="text-xl font-semibold mb-2">Contact ColorMagic.App</h2>
            <p className="text-purple-100 text-sm">
              Simply fill in the contact form below, and we'll get back to you within the next 24-48 hours.
            </p>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 text-sm font-medium">U</span>
                </div>
                <span className="text-gray-700 text-sm">colormagic.support@gmail.com</span>
              </div>
              <button className="text-blue-600 text-sm hover:underline">
                Switch account
              </button>
            </div>
            <p className="text-xs text-red-500 mt-2">* Indicates required question</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Your email"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Please describe your question, feedback, or issue in detail..."
                required
                rows={6}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include details about: Bug reports, feature requests, technical issues, general feedback, or business inquiries.
              </p>
            </div>

            {/* Send Copy Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="sendCopy"
                id="sendCopy"
                checked={formData.sendCopy}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="sendCopy" className="ml-2 block text-sm text-gray-700">
                Send me a copy of my responses.
              </label>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">Page 1 of 1</span>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Clear form
              </button>
            </div>
          </form>

          {/* Footer Icons */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex justify-center space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-blue-600 text-xs">G</span>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                <span className="text-red-600 text-xs">M</span>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                <span className="text-yellow-600 text-xs">D</span>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <span className="text-green-600 text-xs">S</span>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-600 text-xs">?</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage 