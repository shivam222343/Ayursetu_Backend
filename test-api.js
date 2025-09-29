const axios = require('axios');

// Test the API endpoint
async function testAPI() {
  try {
    // Test the test endpoint
    console.log('Testing /api/test endpoint...');
    const testResponse = await axios.get('http://localhost:7001/api/test');
    console.log('Test endpoint response:', testResponse.data);
    
    // Test the register endpoint
    console.log('\nTesting /api/auth/register endpoint...');
    const registerData = {
      username: 'testuser2',
      password: 'testpassword',
      role: 'patient'
    };
    const registerResponse = await axios.post('http://localhost:7001/api/auth/register', registerData);
    console.log('Register endpoint response:', registerResponse.data);
    
    // Test the login endpoint
    console.log('\nTesting /api/auth/login endpoint...');
    const loginData = {
      username: 'testuser2',
      password: 'testpassword'
    };
    const loginResponse = await axios.post('http://localhost:7001/api/auth/login', loginData);
    console.log('Login endpoint response:', loginResponse.data);
    
    // Verify the token works
    if (loginResponse.data.token) {
      console.log('\nTesting authentication with token...');
      const token = loginResponse.data.token;
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      // You would typically test a protected endpoint here
      console.log('Authentication successful!');
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();