import bcrypt from 'bcrypt';
import trips from './seeds/trips.json' with { type: 'json' };
import schedules from './seeds/schedules.json' with { type: 'json' };
import stations from './seeds/stations.json' with { type: 'json' };
import ticketClasses from './seeds/ticket-classes.json' with { type: 'json' };
import trains from './seeds/trains.json' with { type: 'json' };

// Standard roles for authentication
const starterRoles = [
  { name: 'customer' },
  { name: 'admin' }
];

// Seeded test accounts (passwords are hashed before being stored).
const starterUsers = [
  {
    name: 'Admin',
    username: 'admin',
    email: 'admin@example.com',
    password: 'password1#',
    role: 'admin'
  },
  {
    name: 'Customer',
    username: 'customer',
    email: 'customer@example.com',
    password: 'customer1#',
    role: 'customer'
  }
];

const starterCollections = [
  ['trips', trips],
  ['schedules', schedules],
  ['stations', stations],
  ['ticketClasses', ticketClasses],
  ['trains', trains]
];

const initializeDatabase = async (db) => {
  if (!db) {
    throw new Error('A database connection is required to initialize data.');
  }

  for (const [collectionName, documents] of starterCollections) {
    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    await collection.insertMany(documents);
  }

  const bookings = db.collection('bookings');
  await bookings.deleteMany({});
  await bookings.createIndex({ id: 1 }, { unique: true });

  // Seed the standard roles and the seeded test accounts.
  const roles = db.collection('roles');
  await roles.deleteMany({});
  await roles.insertMany(starterRoles);

  const roleIds = {};
  for (const role of starterRoles) {
    const found = await roles.findOne({ name: role.name });
    roleIds[role.name] = found._id;
  }

  const users = db.collection('users');
  await users.deleteMany({});
  const seededUsers = await Promise.all(
    starterUsers.map(async (user) => {
      const { password, ...document } = user;
      document.passwordHash = await bcrypt.hash(password, 12);
      document.role = roleIds[document.role];
      return document;
    })
  );
  await users.insertMany(seededUsers);
};

export { initializeDatabase, starterCollections };
