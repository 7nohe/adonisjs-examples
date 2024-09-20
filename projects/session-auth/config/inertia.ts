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

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> { }
}
