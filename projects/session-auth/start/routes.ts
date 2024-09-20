/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const HomeController = () => import('#controllers/home_controller')

router.get('/', [HomeController, 'index']).use(middleware.auth())

const UsersSessionController = () => import('#controllers/users/session_controller')

router.get('login', [UsersSessionController, 'create']).use(middleware.guest())
router.post('login', [UsersSessionController, 'store'])
router.delete('logout', [UsersSessionController, 'destroy']).use(middleware.auth())

const GithubController = () => import('#controllers/github_controller')

router
  .group(() => {
    router.get('redirect', [GithubController, 'redirect'])
    router.get('callback', [GithubController, 'callback'])
  })
  .prefix('github')
