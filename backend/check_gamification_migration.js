import { pool } from './src/db/index.js';

async function checkMigrationStatus() {
    try {
        console.log('Checking gamification migration status...\n');

        // Check if trust_points column exists
        const [trustPointsCol] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'trust_points'
    `);

        console.log(`✓ trust_points column: ${trustPointsCol.length > 0 ? 'EXISTS' : 'MISSING'}`);

        // Check if badges table exists
        const [badgesTable] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'badges'
    `);

        console.log(`✓ badges table: ${badgesTable.length > 0 ? 'EXISTS' : 'MISSING'}`);

        // Check if user_badges table exists
        const [userBadgesTable] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'user_badges'
    `);

        console.log(`✓ user_badges table: ${userBadgesTable.length > 0 ? 'EXISTS' : 'MISSING'}`);

        // Check if user_ratings table exists
        const [userRatingsTable] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'user_ratings'
    `);

        console.log(`✓ user_ratings table: ${userRatingsTable.length > 0 ? 'EXISTS' : 'MISSING'}`);

        const allExist =
            trustPointsCol.length > 0 &&
            badgesTable.length > 0 &&
            userBadgesTable.length > 0 &&
            userRatingsTable.length > 0;

        if (allExist) {
            console.log('\n✅ All gamification schema components exist!');

            // Check badge data
            const [badgeCount] = await pool.query('SELECT COUNT(*) as count FROM badges');
            console.log(`\nBadges seeded: ${badgeCount[0].count}`);

            if (badgeCount[0].count > 0) {
                const [badges] = await pool.query('SELECT badge_key, name FROM badges');
                badges.forEach(b => console.log(`  - ${b.badge_key}: ${b.name}`));
            }
        } else {
            console.log('\n⚠️  Gamification migration NOT applied!');
            console.log('Please run: mysql -u root -p campuskart < database/gamification_migration.sql');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkMigrationStatus();
