// track the users in an array

//add user, removeUser, getUser, getUsersInRoom

const users = [];
// every open socket returns an id
const addUser = ({ id, username, room }) => {
  // clean data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // Validate the data
  if (!username || !room) {
    return {
      error: 'User name and Room are required'
    };
  }

  // Check for exsiting user in room
  const existingUser = users.find(user => {
    // is the user in the room and have the same name,
    // ((dont' want to users with the same name in a room)
    // if so return true and call error below
    return user.room === room && user.username === username;
  });

  if (existingUser) {
    return {
      error: `Your username is in use in the ${room} room`
    };
  }

  // everything is cool add the user to the array
  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = id => {
  // find user with that id
  // return 0 for no match, if found returns position of item in the array
  const index = users.findIndex(user => user.id === id); //returns true if found
  if (index !== -1) {
    //was user found, yes if more than 0
    return users.splice(index, 1)[0];
  }
};

const getUser = id => {
  // find user with that id
  // return undefined for no match, if found returns user
  return users.find(user => user.id === id);
};

const getUsersInRoom = room => {
  // returns new array
  return users.filter(user => user.room === room);
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
};

// testing

// addUser({
//   id: 22,
//   username: 'Peter',
//   room: 'detroit'
// });

// addUser({
//   id: 12,
//   username: 'Dave',
//   room: 'Warren'
// });

// addUser({
//   id: 32,
//   username: 'Joe',
//   room: 'Warren'
// });

//console.log(users);
//const test = getUser(22);
// console.log('Result: ', getUser(12));
// console.log('Room Result', getUsersInRoom('warren'));

//console.log(getUsersInRoom('detroit'));

// const removedUser = removeUser(22);
// console.log(removedUser);
// console.log(users);

// const res = addUser({
//   id: 23,
//   username: 'Peter',
//   room: 'detroit'
// });
// console.log(res);
