// backfill-timestamps.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting to backfill timestamps for existing roadmap features...");

    try {
        const now = new Date();
        const result = await prisma.roadmap_features.updateMany({
            where: {
                createdAt: null, // Only update items where the timestamp is missing
            },
            data: {
                createdAt: now, // Set them all to the current time
            },
        });

        console.log(`✅ Success! Updated ${result.count} roadmap items.`);

    } catch (error) {
        console.error("❌ An error occurred during backfill:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();