import { pool } from '../lib/db.js';

const resetDatabase = async () => {
  try {
    console.log('🔄 Resetting database...');
    
    // Clear all data from tables
    console.log('🗑️  Clearing all data...');
    await pool.query('DELETE FROM inference_logs');
    console.log('  ✓ Cleared inference_logs');
    
    await pool.query('DELETE FROM messages');
    console.log('  ✓ Cleared messages');
    
    await pool.query('DELETE FROM conversations');
    console.log('  ✓ Cleared conversations');
    
    console.log('\n✨ Everything has been reset!');
    console.log('You can now start fresh with a clean database.\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
  }
};

resetDatabase();
