import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class GithubController {
  redirect({ ally }: HttpContext) {
    return ally.use('github').redirect((req) => {
      req.scopes(['user'])
    })
  }

  async callback({ ally, auth, response, session }: HttpContext) {
    const github = ally.use('github')
    if (github.accessDenied()) {
      session.flash('error', 'Access was denied')
      return response.redirect().toPath('/login')
    }

    if (github.stateMisMatch()) {
      session.flash('error', 'Request expired. Retry again')
      return response.redirect().toPath('/login')
    }

    if (github.hasError()) {
      session.flash('error', 'Unable to authenticate. Retry again')
      return response.redirect().toPath('/login')
    }

    const githubUser = await github.user()
    const user = await User.firstOrCreate(
      {
        email: githubUser.email,
      },
      {
        email: githubUser.email,
        fullName: githubUser.name,
      }
    )

    await auth.use('web').login(user)
    session.flash('success', 'Logged in successfully')
    return response.redirect().toPath('/')
  }
}
