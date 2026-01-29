import { pool } from './src/db/index.js';

async function applyMigrationStepByStep() {
    const connection = await pool.getConnection();

    try {
        console.log('Applying gamification migration step by step...\n');

        // Step 1: Add trust_points column
        console.log('1. Adding trust_points column to users table...');
        try {
            await connection.query(`
        ALTER TABLE users 
        ADD COLUMN trust_points INT NOT NULL DEFAULT 0
      `);
            console.log('   ✓ Added trust_points column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('   ✓ trust_points column already exists');
            } else {
                throw err;
            }
        }

        // Step 2: Create badges table
        console.log('2. Creating badges table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS badges (
        badge_key VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255) NOT NULL,
        icon VARCHAR(20) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('   ✓ badges table created');

        // Step 3: Create user_badges table
        console.log('3. Creating user_badges table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        uid INT NOT NULL,
        badge_key VARCHAR(50) NOT NULL,
        earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uid, badge_key),
        CONSTRAINT fk_user_badges_user FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
        CONSTRAINT fk_user_badges_badge FOREIGN KEY (badge_key) REFERENCES badges(badge_key) ON DELETE CASCADE
      )
    `);
        console.log('   ✓ user_badges table created');

        // Step 4: Create user_ratings table
        console.log('4. Creating user_ratings table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS user_ratings (
        rating_id INT PRIMARY KEY AUTO_INCREMENT,
        pid INT NOT NULL,
        rater_uid INT NOT NULL,
        ratee_uid INT NOT NULL,
        rating TINYINT NOT NULL,
        comment VARCHAR(500) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5),
        UNIQUE KEY uniq_rating_once (pid, rater_uid),
        INDEX idx_ratings_ratee (ratee_uid),
        INDEX idx_ratings_pid (pid),
        CONSTRAINT fk_ratings_rater FOREIGN KEY (rater_uid) REFERENCES users(uid) ON DELETE CASCADE,
        CONSTRAINT fk_ratings_ratee FOREIGN KEY (ratee_uid) REFERENCES users(uid) ON DELETE CASCADE,
        CONSTRAINT fk_ratings_product FOREIGN KEY (pid) REFERENCES products(pid) ON DELETE CASCADE
      )
    `);
        console.log('   ✓ user_ratings table created');

        // Step 5: Seed badges
        console.log('5. Seeding badges...');
        await connection.query(`
      INSERT IGNORE INTO badges (badge_key, name, description, icon) VALUES
        ('first_trade', 'First Trade', 'Completed your first successful trade.', '🤝'),
        ('trusted_user', 'Trusted User', 'Reached a trust score of 100+ points.', '✅'),
        ('power_seller', 'Power Seller', 'Completed 5+ sales on CampusKart.', '⚡')
    `);
        console.log('   ✓ Badges seeded');

        // Verify
        const [badges] = await connection.query('SELECT badge_key, name, description FROM badges');
        console.log(`\n✅ Migration completed successfully!\n`);
        console.log(`Badges in system: ${badges.length}`);
        badges.forEach(b => console.log(`  - ${b.badge_key}: ${b.name} - ${b.description}`));

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.error('Error code:', err.code);
        throw err;
    } finally {
        connection.release();
        await pool.end();
    }
}

applyMigrationStepByStep();
