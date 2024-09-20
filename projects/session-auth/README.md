## Setup

```bash
npm init adonisjs@latest session-auth
> npx
> create-adonisjs session-auth


     _       _             _         _ ____  
    / \   __| | ___  _ __ (_)___    | / ___| 
   / _ \ / _` |/ _ \| '_ \| / __|_  | \___ \ 
  / ___ \ (_| | (_) | | | | \__ \ |_| |___) |
 /_/   \_\__,_|\___/|_| |_|_|___/\___/|____/ 
                                             

❯ Which starter kit would you like to use · Inertia Starter Kit
❯ Which authentication guard you want to use · session
❯ Which database driver you want to use · postgres
❯ Which frontend adapter you want to use with Inertia · react
❯ Do you want to setup server-side rendering with Inertia (y/N) · false
```


.envを編集します
```
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_DATABASE=postgres
```

compose.yamlを作成、Postgresを起動します
```yaml
services:
  postgresql:
    image: postgres:16
    environment:
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - 5432:5432
    volumes:
      - postgres:/var/lib/postgresql/data
volumes:
  postgres:
```

```bash
docker compose up -d
```


## Migration

Starter Kitではすでにusersテーブルのマイグレーションファイルが用意されています。

database/migrations/1726614277572_create_users_table.ts:

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

```bash
node ace migration:run
[ info ] Upgrading migrations version from "1" to "2"
❯ migrated database/migrations/1726614277572_create_users_table
```

## Model

Starter KitではすでにUserのモデルファイルが用意されています。

```ts
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
```

### [withAuthFinderミックスインについて](https://adonisjs-docs-ja.vercel.app/guides/authentication/verifying-user-credentials#authfinder%E3%83%9F%E3%83%83%E3%82%AF%E3%82%B9%E3%82%A4%E3%83%B3%E3%81%AE%E4%BD%BF%E7%94%A8)

- Userテーブルにレコードをインサートする前（beforeSave）にパスワードのハッシュ化がされる
- パスワード検証メソッド（`verifyCredentials`）がUserモデルに追加される
- 自前で`hash.verify`を用いてパスワード検証を行なっても良いがtiming attack対策されているwithAuthFinderミックスインを基本的に使用する

## Seeder

```bash
node ace make:seeder User
```

database/seeders/user_seeder.ts:

```ts
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await User.createMany([
      {
        email: 'john.doe@example.com',
        fullName: 'John Doe',
        password: 'password',
      },
    ])
  }
}
```

```bash
node ace db:seed
```

REPLでユーザー情報を確認する

```bash
node ace repl
> loadModels()
> await models.user.first()
```

ユーザーが作成されていて、`password`がハッシュ化されていることを確認します

## Guard/Provider

ガードは認証機能が実装されている部分で、以下認証タイプがサポートされています。

- セッション
- アクセストークン
- Basic認証
- カスタム

プロバイダはデータベースからユーザーやトークンを検索してガードに渡す役割の部分。組み込みのプロバイダを使用するか、独自のプロバイダを実装できます。

今回のセッション認証ではガードとプロバイダはすでに設定済みでconfig/auth.tsに記述されています。

```ts
import { defineConfig } from '@adonisjs/auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'

const authConfig = defineConfig({
  default: 'web',
  guards: {
    web: sessionGuard({
      useRememberMeTokens: false,
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
    }),
  },
})
```

## Controller

ログイン処理を行うコントローラを作成します。

```bash
node ace make:controller users/session
```

```ts
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
    response.redirect('/login')
  }
}

```

- `create`: ログイン画面の表示
- `store`: ログイン処理
- `destroy`: ログアウト処理

参考: https://adonisjs-docs-ja.vercel.app/guides/authentication/session-guard#%E3%83%AD%E3%82%B0%E3%82%A4%E3%83%B3%E3%81%AE%E5%AE%9F%E8%A1%8C


ルーティングの設定を行います

start/routes.ts:
```ts
const UsersSessionController = () => import('#controllers/users/session_controller')

router.get('login', [UsersSessionController, 'create'])
router.post('login', [UsersSessionController, 'store'])
router.delete('logout', [UsersSessionController, 'destroy'])
```

設定されたかの確認を行います

```bash
node ace list:routes
```

Homeのコントローラも用意します。

```bash
node ace make:controller home
```

```ts
import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  async index({ inertia }: HttpContext) {
    return inertia.render('home')
  }
}
```

start/routes.ts:
```ts
const HomeController = () => import('#controllers/home_controller')
router.get('/', [HomeController, 'index'])
```

## Middleware

ミドルウェアを使用して認証されたユーザーだけ特定のルートにアクセスできるようにします。
Authミドルウェアはすでに作成されてるのでこちらを利用します。

```ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })
    return next()
  }
}
```

start/kernel.tsで名前付きミドルウェアとして登録されています。

```ts
import router from '@adonisjs/core/services/router'

export const middleware = router.named({
  guest: () => import('#middleware/guest_middleware'),
  auth: () => import('#middleware/auth_middleware'),
})
```


制限したいルートにAuthミドルウェアを挟むように記述します。

start/routes.ts:
```ts
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const HomeController = () => import('#controllers/home_controller')
router.get('/', [HomeController, 'index']).use(middleware.auth())

const UsersSessionController = () => import('#controllers/users/session_controller')
router.get('login', [UsersSessionController, 'create']).use(middleware.guest())
router.post('login', [UsersSessionController, 'store'])
router.delete('logout', [UsersSessionController, 'destroy']).use(middleware.auth())

```


## View

 [(Optional) TailwindCSSのセットアップ](https://7nohe-tech-blog.vercel.app/post/adonisjs-inertia-starter-kit-tailwindcss-shadcn-ui#tailwindcss%E3%81%AE%E3%82%BB%E3%83%83%E3%83%88%E3%82%A2%E3%83%83%E3%83%97)


ログイン画面を用意します。

inertia/pages/users/login.tsx:
```tsx
import SessionController from '#controllers/users/session_controller'
import { InferPageProps } from '@adonisjs/inertia/types'
import { router } from '@inertiajs/react'
import { useState } from 'react'

export default function Login(props: InferPageProps<SessionController, 'create'>) {
  const { error } = props
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    router.post(`/login`, {
      password,
      email,
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {error && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-red-500 text-white text-center">
            {error}
          </div>
        )}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        <form method="post" action="/login" onSubmit={handleSubmit} className="space-y-4">
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
      </div>
    </div>
  )
}

```


inertia/pages/home.tsx:
```tsx

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

```

SharedPropsの型定義を追加します。

config/inertia.ts:
```ts
import User from '#models/user'
import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps } from '@adonisjs/inertia/types'

class UserDto {
  constructor(private user: User) { }

  toJson() {
    return {
      id: this.user.id,
      fullName: this.user.fullName,
      email: this.user.email,
    }
  }
}

const inertiaConfig = defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Data that should be shared with all rendered pages
   */
  sharedData: {
    user: (ctx) => ctx.auth.user ? new UserDto(ctx.auth.user).toJson() : null,
    error: (ctx) => ctx.session.flashMessages.get('error') as string | undefined,
    success: (ctx) => ctx.session.flashMessages.get('success') as string | undefined,
  },

  /**
   * Options for the server-side rendering
   */
  ssr: {
    enabled: false,
    entrypoint: 'inertia/app/ssr.tsx',
  },
})

export default inertiaConfig

```


## Social Authenticaiton（GitHub）

```bash
node ace add @adonisjs/ally --providers=github
```

## Configuration

```ts
import env from '#start/env'
import { defineConfig, services } from '@adonisjs/ally'

const allyConfig = defineConfig({
  github: services.github({
    clientId: env.get('GITHUB_CLIENT_ID'),
    clientSecret: env.get('GITHUB_CLIENT_SECRET'),
    callbackUrl: '',
  }),
})

export default allyConfig

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
```

https://github.com/settings/applications/new でOAuth Appを作成し、`GITHUB_CLIENT_ID`と`GITHUB_CLIENT_SECRET`を取得します。

- Homepage URL: http://localhost:3333
- Authorization callback URL: http://localhost:3333/github/callback

と設定します。

```bash
node ace make:controller social
```

```ts
node ace make:controller github -s
```

app/controllers/github_controller.ts:
```ts
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

```

start/routes.ts:
```ts
const GithubController = () => import('#controllers/github_controller')

router
  .group(() => {
    router.get('redirect', [GithubController, 'redirect'])
    router.get('callback', [GithubController, 'callback'])
  })
  .prefix('github')

```

passwordをnullabeに変更します

```bash
node ace make:migration User --alter
```

database/migrations/1726646431580_alter_users_table.ts:
```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable('password')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable('password')
    })
  }
}

```


```bash
node ace migration:run
```

ログイン画面にGitHubログインボタンを追加します。

inertia/pages/users/login.tsx:
```tsx
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

```

