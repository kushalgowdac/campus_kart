import { pool } from "./src/db/index.js";

/**
 * Verify Location Selection Schema Changes
 * Checks:
 * 1. prod_loc.is_selected column exists
 * 2. products.status enum includes new values
 */

async function verifyLocationSchema() {
    console.log('\n🔍 Verifying Location Selection Schema...\n');

    try {
        // Check prod_loc table structure
        const [prodLocColumns] = await pool.query('DESCRIBE prod_loc');
        const hasIsSelected = prodLocColumns.some(col => col.Field === 'is_selected');

        if (hasIsSelected) {
            console.log('✅ prod_loc.is_selected column exists');
            const isSelectedCol = prodLocColumns.find(col => col.Field === 'is_selected');
            console.log(`   Type: ${isSelectedCol.Type}, Null: ${isSelectedCol.Null}, Default: ${isSelectedCol.Default}`);
        } else {
            console.log('❌ prod_loc.is_selected column MISSING');
        }

        // Check products status enum
        const [productsColumns] = await pool.query("SHOW COLUMNS FROM products WHERE Field = 'status'");
        if (productsColumns.length > 0) {
            const statusEnum = productsColumns[0].Type;
            console.log('\n✅ products.status enum found:');
            console.log(`   ${statusEnum}`);

            const requiredStatuses = [
                'available',
                'reserved',
                'location_proposed',
                'location_selected',
                'otp_generated',
                'sold'
            ];

            const allPresent = requiredStatuses.every(status =>
                statusEnum.includes(`'${status}'`)
            );

            if (allPresent) {
                console.log('\n✅ All required status values present:');
                requiredStatuses.forEach(s => console.log(`   - ${s}`));
            } else {
                console.log('\n❌ Some status values missing. Required:');
                requiredStatuses.forEach(s => {
                    const present = statusEnum.includes(`'${s}'`);
                    console.log(`   ${present ? '✓' : '✗'} ${s}`);
                });
            }
        }

        // Test query with new columns
        console.log('\n📊 Testing query with new schema...');
        const [testResult] = await pool.query(`
            SELECT p.pid, p.pname, p.status, pl.location, pl.is_selected
            FROM products p
            LEFT JOIN prod_loc pl ON p.pid = pl.pid
            LIMIT 3
        `);
        console.log(`✅ Query successful. Sample rows: ${testResult.length}`);
        if (testResult.length > 0) {
            testResult.forEach(row => {
                console.log(`   Product ${row.pid}: ${row.pname} | Status: ${row.status || 'NULL'} | Location: ${row.location || 'NULL'} | Selected: ${row.is_selected !== null ? row.is_selected : 'NULL'}`);
            });
        }

        console.log('\n✅ Schema verification PASSED\n');
        return true;

    } catch (err) {
        console.error('\n❌ Schema verification FAILED:');
        console.error(err.message);
        return false;
    } finally {
        await pool.end();
    }
}

verifyLocationSchema();
