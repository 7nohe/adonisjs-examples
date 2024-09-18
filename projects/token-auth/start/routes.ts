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

router
  .get('/', async () => {
    return {
      hello: 'world',
    }
  })
  .use(middleware.auth())

const AuthController = () => import('#controllers/api/auth_controller')

router
  .group(() => {
    router.post('login', [AuthController, 'store'])
    router.delete('logout', [AuthController, 'destroy']).use(middleware.auth())
  })
  .prefix('api')
