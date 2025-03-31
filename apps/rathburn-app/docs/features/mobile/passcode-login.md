# Mobile Login Component

```ts
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import Head from 'next/head'

export default function MobileLogin() {
  const router = useRouter()
  const [passcode, setPasscode] = useState(['', '', '', '']) // 4-digit passcode
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: userData } = await supabase.auth.getUser()
        setCurrentUser(userData.user)

        // If they're logged in but session is old, allow them to continue
        // but show who is currently logged in
      }
    }

    checkSession()
  }, [])

  const handlePasscodeChange = (index, value) => {
    if (value === '' || /^[0-9]$/.test(value)) {
      const newPasscode = [...passcode]
      newPasscode[index] = value
      setPasscode(newPasscode)

      // Auto-focus next input
      if (value !== '' && index < 3) {
        document.getElementById(`passcode-${index + 1}`).focus()
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fullPasscode = passcode.join('')

    if (fullPasscode.length !== 4) {
      setError('Please enter a 4-digit passcode')
      setLoading(false)
      return
    }

    try {
      // Call our API route that handles passcode authentication
      const response = await fetch('/api/auth/passcode-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: fullPasscode })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login')
      }

      // Redirect to mobile dashboard on success
      router.push('/mobile/dashboard')
    } catch (error) {
      setError(error.message)
      // Clear passcode on error
      setPasscode(['', '', '', ''])
      // Focus first input
      document.getElementById('passcode-0').focus()
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setPasscode(['', '', '', ''])
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <Head>
        <title>Mobile Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <main className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Warehouse Scanner</h1>

        {currentUser && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-center">
              Currently logged in as: <strong>{currentUser.email || currentUser.user_metadata?.full_name || 'Worker'}</strong>
            </p>
            <div className="mt-2 flex justify-center">
              <button
                onClick={() => router.push('/mobile/dashboard')}
                className="mr-2 bg-blue-500 text-white py-2 px-4 rounded"
              >
                Continue
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-300 text-gray-800 py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {!currentUser && (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-3 text-center">
                  Enter your work passcode
                </label>
                <div className="flex justify-center space-x-4">
                  {passcode.map((digit, index) => (
                    <input
                      key={index}
                      id={`passcode-${index}`}
                      type="tel"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handlePasscodeChange(index, e.target.value)}
                      className="w-12 h-14 text-center text-2xl border rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                      required
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Need help? Contact your supervisor.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
```
