
## Setup

```bash
npm init adonisjs@latest access-token-auth

> npx
> create-adonisjs token-auth


     _       _             _         _ ____  
    / \   __| | ___  _ __ (_)___    | / ___| 
   / _ \ / _` |/ _ \| '_ \| / __|_  | \___ \ 
  / ___ \ (_| | (_) | | | | \__ \ |_| |___) |
 /_/   \_\__,_|\___/|_| |_|_|___/\___/|____/ 
                                             

❯ Which starter kit would you like to use · API Starter Kit
❯ Which authentication guard you want to use · access_tokens
❯ Which database driver you want to use · postgres
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

## ## Migration

Starter Kitではすでにusersテーブルのマイグレーションファイルが用意されています。
アクセストークン認証の場合はアクセストークンテーブルも必要になります。

database/migrations/1726640358285_create_users_table.ts:
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

database/migrations/1726640358288_create_access_tokens_table.ts:
```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('tokenable_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('hash').notNullable()
      table.text('abilities').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('last_used_at').nullable()
      table.timestamp('expires_at').nullable()
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
❯ migrated database/migrations/1726640358285_create_users_table
❯ migrated database/migrations/1726640358288_create_access_tokens_table
```

## Model

Userモデルにトークンプロバイダを設定します。
Starter Kitではすでに設定されています。

```ts
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

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

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
```

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


## Controller

```bash
node ace make:controller api/auth
```

```ts
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


```

## Route

```ts
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

```
