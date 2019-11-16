const socket = io();

// selected elements
const messageForm = document.querySelector('#message-form');
const messageFormInput = messageForm.querySelector('input');
const messageFormSubmit = document.getElementById('submit');
const btnSendLocation = document.querySelector('#btn-send-location');
const messages = document.querySelector('#messages');

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
//location.search is the query sting in the URL
// we are making the const value by destructuring what Qs returns
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

//if user has more messages than can fit the screen
// scroll to the last message location unless they are on a higher message
//we dont want to sroll while they are reading a higer messeage
const autoScroll = () => {
  //get new message element
  console.log('scroll');
  //console.log('messages.lastElementChild', messages.lastElementChild);
  const newMessage = messages.lastElementChild;

  // get the height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visibleHeight = messages.offsetHeight;

  // height of messages container
  const containerHeight = messages.scrollHeight;
  console.log('containerHeight', containerHeight);

  // how far is the user scrolled?
  // how far from top plus element height
  const scrollOffset = messages.scrollTop + visibleHeight;
  console.log('scrollOffset', scrollOffset);

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};
// receives event
socket.on('welcomeMessage', message => {
  //console.log('Welcome message', message);
  const html = Mustache.render(messageTemplate, {
    // message: message.text,
    username: message.username,
    createdAt: moment(message.createdAt).format('h:mma - MMM Do gggg') //dddd is day
  });
  messages.insertAdjacentHTML('beforeend', html);
});

//receives event
socket.on('locationMessage', locationMessage => {
  //console.log('locationMessage', locationMessage);
  const html = Mustache.render(locationTemplate, {
    username: locationMessage.username,
    url: locationMessage.url,
    createdAt: moment(locationMessage.createdAt).format('h:mma - MMM Do gggg') //dddd is day
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

// receives event
socket.on('message', message => {
  //console.log('message', message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mma - MMM Do gggg') //dddd is day
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('roomData', ({ room, users }) => {
  //destructors incoming object
  //console.log('Room:', room);
  //console.log('users', users);
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  document.querySelector('#sidebar').innerHTML = html;
});

const message = document.querySelector('#messageInput');

// const messageInput = document.querySelector('#messageInput')

messageForm.addEventListener('submit', event => {
  event.preventDefault();
  // disable button stops user from sending messages before frist on is sent
  messageFormSubmit.setAttribute('disabled', 'disabled');
  // get value from user input
  let messageInput = event.target.elements.messageInput.value;
  console.log('Client sent', messageInput);
  socket.emit('sendMessage', messageInput, error => {
    // this gets sent to by the callback on the server
    //clear the input
    messageFormInput.value = '';
    messageFormInput.focus();
    // re-enable button
    messageFormSubmit.removeAttribute('disabled');

    // profanity triggers the error
    if (error) {
      return console.log('error: ', error);
    }
    // no error
    console.log('Message delivered');
  });
});

btnSendLocation.addEventListener('click', () => {
  //check if the users machine supports geo location
  if (!navigator.geolocation) {
    return alert('Sorry geolocation is not supported by your browser');
  }

  // disable send button
  btnSendLocation.setAttribute('disabled', 'disabled');

  //does not support promises so we need a callback
  navigator.geolocation.getCurrentPosition(position => {
    // console.log('Position', position.coords.longitude)
    const locationObj = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
    socket.emit('sendLocation', locationObj, () => {
      // this gets sent to by the callback on the server
      btnSendLocation.removeAttribute('disabled');
      console.log('Location Shared');
    });
  });
});

// send the sever an event with the name and room
socket.emit('join', { username, room }, error => {
  // if user cannot join (name already taken)
  // did not proved name and room
  // show them a message and take them back to login again
  if (error) {
    alert(`${error} info you need to pick a different name`); //should trigger modal
    //redirect to login
    location.href = '/';
  }
});
