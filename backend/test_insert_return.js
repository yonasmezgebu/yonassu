const { db } = require('./src/config/database');
async function run() {
  try {
    const result = await db('manager_chats').insert({
      sender_user_id: 1,
      receiver_user_id: 1,
      message: 'test'
    }).returning('id');
    console.log('Result:', result);
    console.log('Is Array?', Array.isArray(result));
    
    // clean up
    await db('manager_chats').where('message', 'test').delete();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
