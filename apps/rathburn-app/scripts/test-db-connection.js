const { PrismaClient } = require("../prisma/generated/client");

async function testConnection() {
  const prisma = new PrismaClient();
  try {
    // Try to query something simple
    const result = await prisma.suppliers.findFirst();
    console.log("Database connection successful!");
    console.log("Test query result:", result);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
