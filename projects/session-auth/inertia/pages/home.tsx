import User from '#models/user'
import { Head, Link } from '@inertiajs/react'

export default function Home({ user }: { user: User }) {
  return (
    <>
      <Head title="Homepage" />

      <div className="pt-4 h-full flex flex-col">
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
            Welcome back, {user.fullName}!
          </h2>
        </div>
      </div>
    </>
  )
}
