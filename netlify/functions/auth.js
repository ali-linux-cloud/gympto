const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// In a real app, you'd use a database. For demo, we'll use a simple object
let users = {};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { action, email, password } = JSON.parse(event.body);

  if (action === 'register') {
    if (users[email]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User already exists' }),
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users[email] = {
      email,
      password: hashedPassword,
      members: [],
    };

    const token = jwt.sign({ email }, process.env.JWT_SECRET);

    return {
      statusCode: 200,
      body: JSON.stringify({ token, email }),
    };
  }

  if (action === 'login') {
    const user = users[email];
    if (!user) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid password' }),
      };
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET);

    return {
      statusCode: 200,
      body: JSON.stringify({ token, email }),
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Invalid action' }),
  };
};
