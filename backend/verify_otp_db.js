import { pool } from './src/db/index.js';

async function verifyDatabase() {
    console.log('🔍 Checking OTP Database Schema...\n');

    try {
        // Check if otp_tokens table exists
        const [tables] = await pool.query("SHOW TABLES LIKE 'otp_tokens'");

        if (tables.length === 0) {
            console.log('❌ otp_tokens table NOT FOUND');
            console.log('   Run migration: mysql -u root -p campuskart < database/otp_tokens_migration.sql\n');
            await pool.end();
            return false;
        }

        console.log('✅ otp_tokens table exists\n');

        // Show table schema
        const [schema] = await pool.query('DESCRIBE otp_tokens');
        console.log('📋 OTP Tokens Schema:');
        console.table(schema.map(col => ({
            Field: col.Field,
            Type: col.Type,
            Key: col.Key,
            Default: col.Default
        })));

        // Check product status enum
        const [productStatus] = await pool.query("SHOW COLUMNS FROM products LIKE 'status'");
        console.log('\n📋 Product Status Enum:');
        console.log('   ', productStatus[0].Type);

        // Check if enum includes required states
        const enumValues = productStatus[0].Type;
        const requiredStates = ['available', 'reserved', 'meet_confirmed', 'sold'];
        const hasAllStates = requiredStates.every(state => enumValues.includes(state));

        if (!hasAllStates) {
            console.log('❌ Product status enum missing required states');
            console.log('   Required:', requiredStates.join(', '));
            await pool.end();
            return false;
        }

        console.log('✅ Product status enum includes all required states\n');

        // Check if reserved_by and reserved_at columns exist
        const [reservedBy] = await pool.query("SHOW COLUMNS FROM products LIKE 'reserved_by'");
        const [reservedAt] = await pool.query("SHOW COLUMNS FROM products LIKE 'reserved_at'");

        if (reservedBy.length === 0 || reservedAt.length === 0) {
            console.log('❌ Products table missing reservation columns');
            await pool.end();
            return false;
        }

        console.log('✅ Products table has reserved_by and reserved_at columns\n');

        // Count existing OTP tokens
        const [otpCount] = await pool.query('SELECT COUNT(*) as count FROM otp_tokens');
        console.log(`📊 Existing OTP tokens: ${otpCount[0].count}\n`);

        console.log('✅ Database schema verification PASSED\n');
        return true;

    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    } finally {
        await pool.end();
    }
}

verifyDatabase().then(success => {
    process.exit(success ? 0 : 1);
});
