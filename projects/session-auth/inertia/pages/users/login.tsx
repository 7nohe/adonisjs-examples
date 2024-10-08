import SessionController from '#controllers/users/session_controller'
import { InferPageProps } from '@adonisjs/inertia/types'
import { Head, router } from '@inertiajs/react'
import { useState } from 'react'

export default function Login(props: InferPageProps<SessionController, 'create'>) {
  const { error } = props
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault()
    router.post(`/login`, {
      password,
      email,
    })
  }

  const handleGitHubLogin = () => {
    window.location.href = '/github/redirect'
  }

  return (
    <>
      <Head title="Login" />
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        {error && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-red-500 text-white text-center">
            {error}
          </div>
        )}
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
          <h2 className="text-2xl font-bold text-center">Login</h2>
          <form method="post" action="/login" onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login
            </button>
          </form>
          <div className="text-center">OR</div>
          <button
            onClick={handleGitHubLogin}
            className="w-full px-4 py-2 font-bold text-white bg-gray-800 rounded hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Login with GitHub
          </button>
        </div>
      </div>
    </>
  )
}
