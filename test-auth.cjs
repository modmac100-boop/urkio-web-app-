const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, deleteUser } = require('firebase/auth');
const firebaseConfig = require('./firebase-applet-config.json');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAuth() {
  try {
    const email = `test-${Date.now()}@example.com`;
    console.log('Attempting to create user with email:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, 'password123');
    console.log('Success! Email/Password provider IS ENABLED.');
    console.log('Deleting test user...');
    await deleteUser(userCredential.user);
    console.log('Cleanup complete.');
  } catch (error) {
    console.error('Error creating user:', error.code, error.message);
  }
  process.exit(0);
}

testAuth();
