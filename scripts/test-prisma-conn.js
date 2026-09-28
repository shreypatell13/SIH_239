const { PrismaClient } = require("@prisma/client");

const passwords = [
  "postgres",
  "postgrespassword",
  "admin",
  "root",
  "password",
  "1234",
  "123456",
  "12345678",
  "sih",
  "sih2024",
];

async function testPassword(pwd) {
  const url = `postgresql://postgres:${pwd}@127.0.0.1:5432/tribalscholar_db?schema=public`;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const count = await prisma.user.count();
    console.log(`FOUND WORKING PASSWORD: "${pwd}"! User count:`, count);
    return true;
  } catch (err) {
    if (err.message.includes("Authentication failed")) {
      // wrong password
    } else if (
      err.message.includes("does not exist") ||
      err.message.includes('database "tribalscholar_db"')
    ) {
      console.log(`FOUND WORKING PASSWORD: "${pwd}", but DB tribalscholar_db needs creation!`);
      return true;
    } else {
      console.log(`Pwd "${pwd}" error:`, err.message);
    }
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  for (const pwd of passwords) {
    const ok = await testPassword(pwd);
    if (ok) break;
  }
}

run();
