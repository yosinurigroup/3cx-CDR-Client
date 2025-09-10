import { useEffect, useCallback, useState } from 'react'

interface GoogleLoginButtonProps {
  onGoogleLogin: (credential: string) => void
  isLoading?: boolean
  disabled?: boolean
}

declare global {
  interface Window {
    google: any
    gapi: any
  }
}

export default function GoogleLoginButton({ onGoogleLogin, isLoading, disabled }: GoogleLoginButtonProps) {
  const [googleReady, setGoogleReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleGoogleCallback = useCallback((response: any) => {
    console.log('Google callback received:', response)
    setIsProcessing(false)
    
    if (response.credential) {
      console.log('Valid credential received, processing login...')
      onGoogleLogin(response.credential)
    } else {
      console.error('No credential received from Google:', response)
      setInitError('Failed to receive Google credentials')
      alert('Google Sign-In failed to provide credentials. Please try again.')
    }
  }, [onGoogleLogin])

  const initializeGoogleSignIn = useCallback(() => {
    console.log('Attempting to initialize Google Sign-In...')
    
    if (!window.google?.accounts) {
      console.error('Google Sign-In API not loaded')
      setInitError('Google Sign-In API not available')
      return false
    }

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      console.log('Initializing with client ID:', clientId)
      
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: 'popup',
        use_fedcm_for_prompt: false  // Explicitly disable FedCM
      })
      
      console.log('Google Sign-In initialized successfully')
      setGoogleReady(true)
      setInitError(null)
      return true
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error)
      setInitError(`Initialization failed: ${error}`)
      return false
    }
  }, [handleGoogleCallback])

  useEffect(() => {
    console.log('GoogleLoginButton mounted, checking for Google API...')
    
    const initializeWhenReady = () => {
      if (window.google?.accounts) {
        console.log('Google API found, initializing...')
        initializeGoogleSignIn()
      } else {
        console.log('Google API not ready yet, waiting...')
        const checkInterval = setInterval(() => {
          if (window.google?.accounts) {
            console.log('Google API now available, initializing...')
            clearInterval(checkInterval)
            initializeGoogleSignIn()
          }
        }, 500)

        // Stop checking after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          if (!googleReady) {
            console.error('Google API failed to load within 10 seconds')
            setInitError('Google Sign-In API failed to load')
          }
        }, 10000)
      }
    }

    initializeWhenReady()
  }, [initializeGoogleSignIn, googleReady])

  const handleClick = () => {
    console.log('Google Sign-In button clicked')
    
    if (!googleReady) {
      console.error('Google Sign-In not ready')
      alert('Google Sign-In is not ready yet. Please wait and try again.')
      return
    }

    if (isProcessing) {
      console.log('Sign-in already in progress')
      return
    }

    if (!window.google?.accounts) {
      console.error('Google API not available when clicking')
      alert('Google Sign-In API is not available. Please refresh the page and try again.')
      return
    }

    console.log('Starting Google Sign-In process...')
    setIsProcessing(true)
    setInitError(null)

    try {
      // First try the prompt method
      window.google.accounts.id.prompt((notification: any) => {
        console.log('Google prompt notification:', notification)
        
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Prompt failed, trying alternative button method...')
          // If prompt fails due to FedCM, create a hidden Google button and click it
          createAndClickGoogleButton()
        } else if (notification.isDismissedMoment()) {
          console.log('User dismissed Google sign-in')
          setIsProcessing(false)
        }
      })
    } catch (error) {
      console.error('Error showing Google Sign-In prompt:', error)
      console.log('Trying alternative button method...')
      createAndClickGoogleButton()
    }
  }

  const createAndClickGoogleButton = () => {
    try {
      // Create a temporary container for the Google button
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.top = '-9999px'
      tempContainer.style.left = '-9999px'
      tempContainer.style.visibility = 'hidden'
      document.body.appendChild(tempContainer)

      // Render the official Google button
      window.google.accounts.id.renderButton(tempContainer, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left'
      })

      // Wait a moment for the button to render, then click it
      setTimeout(() => {
        const googleBtn = tempContainer.querySelector('[role="button"]') as HTMLElement
        if (googleBtn) {
          console.log('Clicking rendered Google button...')
          googleBtn.click()
        } else {
          console.error('Could not find rendered Google button')
          setIsProcessing(false)
          alert('Google Sign-In is currently unavailable. This may be due to browser security settings. Please try enabling third-party cookies or use email/password login.')
        }
        
        // Clean up the temporary container after a delay
        setTimeout(() => {
          if (document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer)
          }
        }, 1000)
      }, 100)
    } catch (error) {
      console.error('Error creating Google button:', error)
      setIsProcessing(false)
      alert('Google Sign-In failed. Please try again or use email/password login.')
    }
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <button
        type="button"
        disabled={true}
        className="w-full flex justify-center items-center px-4 py-3 border border-red-300 rounded-lg text-sm font-medium text-red-600 bg-red-50 cursor-not-allowed"
      >
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Google Sign-In Error
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading || !googleReady || isProcessing}
      className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
    >
      {isLoading || isProcessing ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {isProcessing ? 'Opening Google Sign-In...' : 'Signing in with Google...'}
        </>
      ) : !googleReady ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading Google...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </>
      )}
    </button>
  )
}
