import { pool } from "./src/db/index.js";

/**
 * Run Time Slot Migration
 */

async function runTimeSlotMigration() {
    console.log('\n🚀 Running Time Slot Migration...\n');

    const conn = await pool.getConnection();

    try {
        console.log('1️⃣ Adding meeting_time column to prod_loc table...');
        try {
            await conn.query(`
                ALTER TABLE prod_loc
                ADD COLUMN meeting_time VARCHAR(100) DEFAULT NULL
            `);
            console.log('✅ Column added successfully');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Column already exists, skipping');
            } else {
                throw err;
            }
        }

        // Verify changes
        console.log('\n2️⃣ Verifying schema changes...');

        const [prodLocCols] = await conn.query('DESCRIBE prod_loc');
        const hasTime = prodLocCols.some(col => col.Field === 'meeting_time');

        console.log(`\n✅ prod_loc.meeting_time: ${hasTime ? 'EXISTS' : 'MISSING'}`);

        console.log('\n🎉 Migration completed successfully!\n');

    } catch (err) {
        console.error('\n❌ Migration failed:');
        console.error(err.message);
    } finally {
        conn.release();
        await pool.end();
    }
}

runTimeSlotMigration();
