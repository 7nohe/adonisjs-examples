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
