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

router.on('/').renderInertia('home').use(middleware.auth())

const UsersSessionController = () => import('#controllers/users/session_controller')

router.get('login', [UsersSessionController, 'create']).use(middleware.guest())
router.post('login', [UsersSessionController, 'store'])
router.delete('logout', [UsersSessionController, 'destroy']).use(middleware.auth())
