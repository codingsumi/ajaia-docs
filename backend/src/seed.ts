import "dotenv/config";
import { prisma } from "./db.js";
import { hashPassword } from "./lib/password.js";

const DEMO_USERS = [
  {
    name: "Alice Demo",
    email: "alice@example.com",
    password: "password123",
  },
  {
    name: "Bob Demo",
    email: "bob@example.com",
    password: "password123",
  },
] as const;

async function main() {
  for (const user of DEMO_USERS) {
    const password = await hashPassword(user.password);
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      create: {
        name: user.name,
        email: user.email,
        password,
      },
      update: {
        name: user.name,
        password,
      },
      select: { id: true, name: true, email: true },
    });
    console.log(`Seeded user ${saved.email} (${saved.id})`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
