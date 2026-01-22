import { pool } from "./src/db/index.js";
import fs from 'fs';

/**
 * Run Location Selection Migration
 */

async function runMigration() {
    console.log('\n🚀 Running Location Selection Migration...\n');

    const conn = await pool.getConnection();

    try {
        // Step 1: Add is_selected column to prod_loc
        console.log('1️⃣ Adding is_selected column to prod_loc table...');
        try {
            await conn.query(`
                ALTER TABLE prod_loc
                ADD COLUMN is_selected BOOLEAN DEFAULT false
            `);
            console.log('✅ Column added successfully');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Column already exists, skipping');
            } else {
                throw err;
            }
        }

        // Step 2: Update products status enum
        console.log('\n2️⃣ Updating products.status ENUM...');
        await conn.query(`
            ALTER TABLE products 
            MODIFY COLUMN status ENUM(
                'available',
                'sold', 
                'inactive',
                'reserved',
                'location_proposed',
                'location_selected',
                'meet_confirmed',
                'otp_generated'
            ) DEFAULT 'available'
        `);
        console.log('✅ Status enum updated successfully');

        // Step 3: Verify changes
        console.log('\n3️⃣ Verifying schema changes...');

        const [prodLocCols] = await conn.query('DESCRIBE prod_loc');
        const hasIsSelected = prodLocCols.some(col => col.Field === 'is_selected');

        const [statusCol] = await conn.query("SHOW COLUMNS FROM products WHERE Field = 'status'");
        const statusEnum = statusCol[0].Type;

        console.log(`\n✅ prod_loc.is_selected: ${hasIsSelected ? 'EXISTS' : 'MISSING'}`);
        console.log(`✅ products.status enum: ${statusEnum}`);

        console.log('\n🎉 Migration completed successfully!\n');

    } catch (err) {
        console.error('\n❌ Migration failed:');
        console.error(err.message);
        console.error(err);
    } finally {
        conn.release();
        await pool.end();
    }
}

runMigration();
