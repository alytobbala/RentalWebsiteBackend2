const mysql = require('mysql2/promise');
const config = require('./config/config.json');

async function clearConnections() {
  try {
    console.log('🔧 Attempting to clear database connections...');
    
    // Create a temporary connection to check active connections
    const tempConnection = await mysql.createConnection({
      host: config.development.host,
      user: config.development.username,
      password: config.development.password,
      database: config.development.database,
      port: config.development.port || 3306
    });
    
    // Show current connections
    const [rows] = await tempConnection.execute(
      'SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST WHERE USER = ?', 
      [config.development.username]
    );
    
    console.log(`📊 Current connections for user ${config.development.username}:`, rows.length);
    
    // Show connection details
    rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ID: ${row.ID}, State: ${row.STATE}, Time: ${row.TIME}s`);
    });
    
    // Close the temporary connection
    await tempConnection.end();
    console.log('✅ Temporary connection closed');
    
    console.log('💡 Waiting for idle connections to timeout (5 seconds)...');
    
  } catch (error) {
    if (error.code === 'ER_USER_LIMIT_REACHED') {
      console.log('❌ Still at connection limit. Please wait a few minutes for connections to timeout.');
      console.log('💡 MySQL will automatically close idle connections after the idle timeout period.');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

clearConnections();
