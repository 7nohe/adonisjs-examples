import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('users/login')
  }

  async store({ request, auth, response, session }: HttpContext) {
    /**
     * Step 1: Get credentials from the request body
     */
    const { email, password } = request.only(['email', 'password'])

    try {
      /**
       * Step 2: Verify credentials
       */
      const user = await User.verifyCredentials(email, password)

      /**
       * Step 3: Login user
       */
      await auth.use('web').login(user)

      /**
       * Step 4: Send them to a protected route
       */
      session.flash('success', 'Logged in successfully')
      response.redirect('/')
    } catch (error) {
      /**
       * Step 5: Handle login errors
       */
      session.flash('error', "Incorrect email or password")
      response.redirect('/login')
    }
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    response.redirect('/')
  }
}
