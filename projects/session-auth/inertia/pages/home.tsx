
import HomeController from '#controllers/home_controller'
import { InferPageProps } from '@adonisjs/inertia/types'
import { Head, Link } from '@inertiajs/react'

export default function Home(props: InferPageProps<HomeController, 'index'>) {
  const { user, error, success } = props
  return (
    <>
      <Head title="Homepage" />

      <div className="pt-4 h-full flex flex-col">
        {error && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-red-500 text-white text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-green-500 text-white text-center">
            {success}
          </div>
        )}
        {/* Header */}
        <div className="grow pb-4 bg-gradient-to-b from-sand-1 to-sand-2 flex justify-between items-center px-16 xl:px-8">
          <Link href="/" className="text-lg font-semibold text-primary" as="button">
            Home
          </Link>
          <Link
            href="/logout"
            className="text-lg font-semibold text-primary underline hover:no-underline hover:text-gray-500"
            as="button"
            method="delete"
          >
            Logout
          </Link>
        </div>

        <div className="grow flex flex-col items-center justify-center">
          <h2 className="text-4xl font-bold text-center text-sand-8 xl:text-6xl">
            Welcome back, {user?.fullName}!
          </h2>
        </div>
      </div>
    </>
  )
}
