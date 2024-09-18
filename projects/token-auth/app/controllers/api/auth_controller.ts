import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
  async store({ request }: HttpContext) {
    /**
     * Step 1: Get credentials from the request body
     */
    const { email, password } = request.only(['email', 'password'])

    /**
     * Step 2: Verify credentials
     */
    const user = await User.verifyCredentials(email, password)

    /**
     * Step 3: Create a access token
     */
    const token = await User.accessTokens.create(user)

    /**
     * Step 4: Send the token back as response
     */
    return token
  }

  async destroy({ auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const token = user.currentAccessToken.identifier
    if (!token) {
      return response.badRequest({ message: 'Token not found' })
    }
    await User.accessTokens.delete(user, token)
    return response.ok({ message: 'Logged out' })
  }
}
