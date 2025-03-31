# Mobile User Management

```ts
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function PasscodeManagement() {
  const router = useRouter()
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newWorker, setNewWorker] = useState({
    name: '',
    role: 'warehouse',
    passcode: '',
    email: ''
  })
  const [adminUser, setAdminUser] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase.auth.getUser()

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .single()

      if (!roleData || roleData.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setAdminUser(userData.user)
      fetchWorkers()
    }

    checkAdmin()
  }, [router])

  const fetchWorkers = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('worker_passcodes')
        .select('*')
        .order('worker_name')

      if (error) throw error
      setWorkers(data || [])
    } catch (error) {
      console.error('Error fetching workers:', error)
      setError('Failed to load workers')
    } finally {
      setLoading(false)
    }
  }

  const generatePasscode = () => {
    // Generate a random 4-digit passcode
    const passcode = Math.floor(1000 + Math.random() * 9000).toString()
    setNewWorker({ ...newWorker, passcode })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewWorker({ ...newWorker, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      // First check if passcode is already used
      const { data: existingPasscode } = await supabase
        .from('worker_passcodes')
        .select('id')
        .eq('passcode', newWorker.passcode)
        .single()

      if (existingPasscode) {
        throw new Error('This passcode is already in use. Please generate a new one.')
      }

      // Create auth user if email is provided
      let userId = null

      if (newWorker.email) {
        // Use admin API to create user
        const response = await fetch('/api/auth/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newWorker.email,
            password: Math.random().toString(36).slice(-10), // Random password
            user_metadata: {
              full_name: newWorker.name,
              role: newWorker.role
            }
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create user')
        }

        userId = data.user.id
      } else {
        // If no email, create a placeholder user
        const response = await fetch('/api/auth/create-placeholder-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newWorker.name,
            role: newWorker.role
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create placeholder user')
        }

        userId = data.user.id
      }

      // Create worker passcode entry
      const { error: passcodeError } = await supabase
        .from('worker_passcodes')
        .insert({
          user_id: userId,
          worker_name: newWorker.name,
          role: newWorker.role,
          passcode: newWorker.passcode,
          created_by: adminUser.id
        })

      if (passcodeError) throw passcodeError

      setMessage(`Worker ${newWorker.name} added successfully with passcode ${newWorker.passcode}`)
      setNewWorker({
        name: '',
        role: 'warehouse',
        passcode: '',
        email: ''
      })

      fetchWorkers()
    } catch (error) {
      console.error('Error adding worker:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetPasscode = async (workerId) => {
    if (!confirm('Are you sure you want to reset this passcode?')) {
      return
    }

    setLoading(true)

    try {
      // Generate new passcode
      const newPasscode = Math.floor(1000 + Math.random() * 9000).toString()

      // Update in database
      const { error } = await supabase
        .from('worker_passcodes')
        .update({
          passcode: newPasscode,
          updated_at: new Date(),
          updated_by: adminUser.id
        })
        .eq('id', workerId)

      if (error) throw error

      setMessage('Passcode reset successfully')
      fetchWorkers()
    } catch (error) {
      console.error('Error resetting passcode:', error)
      setError('Failed to reset passcode')
    } finally {
      setLoading(false)
    }
  }

  const deactivateWorker = async (workerId) => {
    if (!confirm('Are you sure you want to deactivate this worker?')) {
      return
    }

    setLoading(true)

    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('worker_passcodes')
        .update({
          is_active: false,
          updated_at: new Date(),
          updated_by: adminUser.id
        })
        .eq('id', workerId)

      if (error) throw error

      setMessage('Worker deactivated successfully')
      fetchWorkers()
    } catch (error) {
      console.error('Error deactivating worker:', error)
      setError('Failed to deactivate worker')
    } finally {
      setLoading(false)
    }
  }

  if (!adminUser) {
    return <div className="p-8 text-center">Checking admin rights...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Worker Passcode Management</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">Worker Passcode Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {/* Add new worker form */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Worker</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Worker Name *
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={newWorker.name}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                Role *
              </label>
              <select
                id="role"
                name="role"
                value={newWorker.role}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="warehouse">Warehouse</option>
                <option value="production">Production</option>
                <option value="shipping">Shipping</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email (Optional)
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={newWorker.email}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <p className="text-xs text-gray-500 mt-1">
                If provided, worker can also log in via email/password
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="passcode">
                Passcode *
              </label>
              <div className="flex">
                <input
                  id="passcode"
                  type="text"
                  name="passcode"
                  value={newWorker.passcode}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  pattern="[0-9]{4}"
                  maxLength="4"
                  required
                />
                <button
                  type="button"
                  onClick={generatePasscode}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-r"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Worker'}
            </button>
          </div>
        </form>
      </div>

      {/* Workers list */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <h2 className="text-xl font-semibold mb-4">Active Workers</h2>

        {loading && workers.length === 0 ? (
          <p className="text-center py-4">Loading workers...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Name</th>
                  <th className="py-2 px-4 border-b">Role</th>
                  <th className="py-2 px-4 border-b">Passcode</th>
                  <th className="py-2 px-4 border-b">Last Login</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">
                      No workers found
                    </td>
                  </tr>
                ) : (
                  workers.filter(worker => worker.is_active !== false).map(worker => (
                    <tr key={worker.id}>
                      <td className="py-2 px-4 border-b">{worker.worker_name}</td>
                      <td className="py-2 px-4 border-b capitalize">{worker.role}</td>
                      <td className="py-2 px-4 border-b font-mono">{worker.passcode}</td>
                      <td className="py-2 px-4 border-b">
                        {worker.last_login_at ? new Date(worker.last_login_at).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-2 px-4 border-b">
                        <button
                          onClick={() => resetPasscode(worker.id)}
                          className="text-blue-500 hover:text-blue-700 mr-3"
                        >
                          Reset Passcode
                        </button>
                        <button
                          onClick={() => deactivateWorker(worker.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```
