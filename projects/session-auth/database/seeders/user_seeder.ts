import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

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
