const jwt = require('jsonwebtoken');

// In a real app, you'd use a database. For demo, we'll use a simple object
let userMembers = {};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

exports.handler = async (event) => {
  const token = event.headers.authorization?.split(' ')[1];
  const user = verifyToken(token);

  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify(userMembers[user.email] || []),
    };
  }

  if (event.httpMethod === 'POST') {
    const member = JSON.parse(event.body);
    if (!userMembers[user.email]) {
      userMembers[user.email] = [];
    }
    userMembers[user.email].push(member);

    return {
      statusCode: 200,
      body: JSON.stringify(member),
    };
  }

  if (event.httpMethod === 'PUT') {
    const { id, ...updates } = JSON.parse(event.body);
    const members = userMembers[user.email] || [];
    const index = members.findIndex(m => m.id === id);

    if (index === -1) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Member not found' }),
      };
    }

    members[index] = { ...members[index], ...updates };
    userMembers[user.email] = members;

    return {
      statusCode: 200,
      body: JSON.stringify(members[index]),
    };
  }

  if (event.httpMethod === 'DELETE') {
    const { id } = JSON.parse(event.body);
    const members = userMembers[user.email] || [];
    userMembers[user.email] = members.filter(m => m.id !== id);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
