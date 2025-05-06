// export const saveUser = (email, data) => {
//     const users = JSON.parse(localStorage.getItem('users')) || {};
//     users[email] = data;
//     localStorage.setItem('users', JSON.stringify(users));
//   };
  
//   export const getUser = (email) => {
//     const users = JSON.parse(localStorage.getItem('users')) || {};
//     return users[email];
//   };
  
//   export const setLoggedInUser = (email) => {
//     localStorage.setItem('loggedInUser', email);
//   };
  
//   export const getLoggedInUser = () => {
//     return localStorage.getItem('loggedInUser');
//   };
  
//   export const logoutUser = () => {
//     localStorage.removeItem('loggedInUser');
//   };
  
  // src/utils/storage.js

// Save or update a user. If `data.enabled` is omitted, default to true.
export const saveUser = (email, data) => {
  const users = JSON.parse(localStorage.getItem('users')) || {};
  users[email] = {
    ...data,
    enabled: data.enabled !== true  // default to true
  };
  localStorage.setItem('users', JSON.stringify(users));
};

// Fetch one user by email (including the new `.enabled` field).
export const getUser = (email) => {
  const users = JSON.parse(localStorage.getItem('users')) || {};
  return users[email];
};

// Get the currently‐logged‐in user’s email
export const setLoggedInUser = (email) => {
  localStorage.setItem('loggedInUser', email);
};
export const getLoggedInUser = () => {
  return localStorage.getItem('loggedInUser');
};
export const logoutUser = () => {
  localStorage.removeItem('loggedInUser');
};

// ——— NEW HELPERS BELOW ——— //

// Return an array of all user‐objects: [{ email, ...data }, …]
export const getAllUsers = () => {
  const users = JSON.parse(localStorage.getItem('users')) || {};
  return Object.entries(users).map(([email, data]) => ({ email, ...data }));
};

// Overwrite one user’s data (merge on email)
export const updateUser = (email, newData) => {
  const users = JSON.parse(localStorage.getItem('users')) || {};
  if (!users[email]) return;
  users[email] = { ...users[email], ...newData };
  localStorage.setItem('users', JSON.stringify(users));
};

// Toggle or set the `.enabled` flag
export const setUserEnabled = (email, enabled) => {
  updateUser(email, { enabled });
};

// Optional: use in your login routine
export const authenticate = (email, password) => {
  const user = getUser(email);
  if (!user) throw new Error("User not found");
  if (user.password !== password) throw new Error("Invalid credentials");
  if (!user.enabled) throw new Error("Account is disabled");
  return user;
};
