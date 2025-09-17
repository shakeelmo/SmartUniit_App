import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Info, ExternalLink, User, Building, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SMART_UNIVERSE_LOGO_BASE64 } from '../../utils/logoBase64';

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);
  const { login, register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowSetupInstructions(false);
    
    if (isSignUp) {
      // Validation for sign-up
      if (!name.trim()) {
        setError('Full name is required');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      
      try {
        await register(email, password, {
          name: name.trim(),
          company: company.trim(),
          phone: phone.trim(),
        });
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } else {
      // Login logic
      try {
        await login(email, password);
      } catch (err: any) {
        const errorMessage = err.message || 'Invalid email or password';
        
        if (errorMessage === 'DEMO_ACCOUNT_NOT_FOUND') {
          setError('Demo account not found in your Supabase project.');
          setShowSetupInstructions(true);
        } else {
          setError(errorMessage);
          
          // Show setup instructions if it's likely a demo account that doesn't exist
          if (errorMessage.includes('Invalid') && 
              (email.includes('@smartuniit.com') || email.includes('admin@') || email.includes('manager@') || email.includes('tech@'))) {
            setShowSetupInstructions(true);
          }
        }
      }
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('admin123');
    setError('');
    setShowSetupInstructions(false);
    setIsSignUp(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setShowSetupInstructions(false);
    // Clear form fields when switching modes
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setCompany('');
    setPhone('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img 
            src={SMART_UNIVERSE_LOGO_BASE64}
            alt="Smart Universe" 
            className="mx-auto h-16 w-auto mb-6"
          />
          <h2 className="text-3xl font-bold text-dark-900">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-dark-600">
            {isSignUp ? 'Sign up for a new account' : 'Sign in to your account'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-dark-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-dark-700 mb-2">
                      Company (Optional)
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                      <input
                        id="company"
                        name="company"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        placeholder="Company name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-dark-700 mb-2">
                      Phone (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder={isSignUp ? 'Create a password (min. 6 characters)' : 'Enter your password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {showSetupInstructions && !isSignUp && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-2">Demo Account Setup Required</p>
                    <p className="mb-3">Choose one of these options to continue:</p>
                    
                    <div className="space-y-4">
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <p className="font-medium text-green-800 mb-2">Option 1: Use Mock Authentication (Recommended for Demo)</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-green-700 ml-2">
                          <li>Open your project's <code className="bg-green-100 px-1 rounded">.env</code> file</li>
                          <li>Comment out or remove these lines:</li>
                          <li className="ml-4 font-mono text-xs bg-green-100 p-1 rounded">
                            # VITE_SUPABASE_URL=...<br/>
                            # VITE_SUPABASE_ANON_KEY=...
                          </li>
                          <li>Refresh this page and try logging in again</li>
                        </ol>
                      </div>
                      
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="font-medium text-blue-800 mb-2">Option 2: Create Demo Users in Supabase</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700 ml-2">
                          <li>
                            <a 
                              href="https://supabase.com/dashboard" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                            >
                              Open Supabase Dashboard <ExternalLink className="w-3 h-3" />
                            </a>
                          </li>
                          <li>Navigate to Authentication → Users</li>
                          <li>Click "Add User" and create these accounts:</li>
                          <li className="ml-4">• admin@smartuniit.com (password: admin123)</li>
                          <li className="ml-4">• manager@smartuniit.com (password: password123)</li>
                          <li className="ml-4">• tech@smartuniit.com (password: password123)</li>
                          <li>Disable "Email Confirmation" in Auth settings</li>
                          <li>Add corresponding records to the 'users' table with appropriate roles</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>

          {/* Quick-fill Account - Only show for login */}
          {!isSignUp && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-dark-600 mb-3 font-medium">Quick Account:</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin@example.com')}
                  className="w-full text-left px-3 py-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-dark-700">Admin</div>
                  <div className="text-dark-500">admin@example.com</div>
                </button>
                <div className="text-xs text-dark-500 mt-2 px-3">
                  <span className="font-medium">Password:</span> admin123
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}