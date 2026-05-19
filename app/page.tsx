import Link from 'next/link'
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { Camera, CheckCircle, Zap, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Camera className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold">TaskHub</h1>
        </div>
        <div className="flex gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <button className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                Go to Dashboard
              </button>
            </Link>
          </SignedIn>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI-Powered Product Photography Studio
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Transform your product images with AI. Generate professional photography with consistent products across multiple backgrounds and settings.
        </p>
        <SignedOut>
          <SignUpButton mode="modal">
            <button className="px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg">
              Start Creating Now
            </button>
          </SignUpButton>
        </SignedOut>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <Zap className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">AI Generation</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Generate 8 professional product images with consistent product appearance across all variations.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <Users className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Task Management</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Admins assign tasks, users complete them. Email notifications keep everyone in sync.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Quality Control</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Review, accept, or request revisions. Ensure every image meets your standards.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2026 TaskHub. All rights reserved.</p>
      </footer>
    </div>
  )
}
