// reset-admin-password.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

// This creates an interface to read from the command line
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log("--- Admin Password Reset Tool ---");

    // Ask for the admin email address
    rl.question('Enter the email address of the admin user to update: ', async (email) => {
        
        // Ask for the new password
        rl.question('Enter the new password: ', async (newPassword) => {

            if (!email || !newPassword) {
                console.error("❌ Error: Both email and password are required.");
                rl.close();
                return;
            }

            try {
                // Hash the new password
                const hashedPassword = await bcrypt.hash(newPassword, 10);

                // Update the user in the database
                const updatedAdmin = await prisma.admins.update({
                    where: { email: email },
                    data: {
                        password: hashedPassword,
                    },
                });

                console.log(`✅ Success! Password for admin user '${updatedAdmin.email}' has been updated.`);

            } catch (error) {
                // This error will happen if the user email is not found
                if (error.code === 'P2025') {
                     console.error(`❌ Error: No admin user found with the email address '${email}'.`);
                } else {
                    console.error("❌ An unexpected error occurred:", error.message);
                }
            } finally {
                // Disconnect from the database and close the script
                await prisma.$disconnect();
                rl.close();
            }
        });
    });
}

// Run the main function
main();