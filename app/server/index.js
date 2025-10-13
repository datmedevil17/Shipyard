const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3002",
    methods: ["GET", "POST"]
  }
});

// File paths for data persistence
const channelsFilePath = path.join(__dirname, 'data', 'channels.json');
const messagesFilePath = path.join(__dirname, 'data', 'messages.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load initial channels
const defaultChannels = [
  { id: 'general', name: 'general', type: 'text', createdAt: new Date() },
  { id: 'random', name: 'random', type: 'text', createdAt: new Date() },
  { id: 'dev-talk', name: 'dev-talk', type: 'text', createdAt: new Date() }
];

let channels = defaultChannels;
let channelMessages = {};

// Load channels from file
const loadChannels = () => {
  try {
    if (fs.existsSync(channelsFilePath)) {
      const data = fs.readFileSync(channelsFilePath, 'utf8');
      const loadedChannels = JSON.parse(data);
      channels = loadedChannels.length > 0 ? loadedChannels : defaultChannels;
      console.log('Channels loaded from file');
    } else {
      saveChannels();
    }
  } catch (error) {
    console.error('Error loading channels:', error);
    channels = defaultChannels;
  }
};

// Load messages from file
const loadMessages = () => {
  try {
    if (fs.existsSync(messagesFilePath)) {
      const data = fs.readFileSync(messagesFilePath, 'utf8');
      channelMessages = JSON.parse(data);
      console.log('Messages loaded from file');
    } else {
      saveMessages();
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    channelMessages = {};
  }
};

// Save channels to file
const saveChannels = () => {
  try {
    fs.writeFileSync(channelsFilePath, JSON.stringify(channels, null, 2));
  } catch (error) {
    console.error('Error saving channels:', error);
  }
};

// Save messages to file
const saveMessages = () => {
  try {
    fs.writeFileSync(messagesFilePath, JSON.stringify(channelMessages, null, 2));
  } catch (error) {
    console.error('Error saving messages:', error);
  }
};

// Initialize data on startup
loadChannels();
loadMessages();

// Map to track users by their public key
const userSessions = {}; // pubKey -> socket.id

io.on('connection', (socket) => {
  const pubKey = socket.handshake.auth.pubKey;
  
  if (!pubKey) {
    console.log('Connection rejected: No public key provided');
    socket.disconnect();
    return;
  }

  console.log('User connected with pubKey:', pubKey);
  userSessions[pubKey] = socket.id;

  // Send all channels to newly connected user
  socket.emit('channels-list', channels);

  // Join a channel
  socket.on('join-channel', (channelId) => {
    socket.join(channelId);
    console.log(`User ${pubKey} joined channel: ${channelId}`);

    // Send existing messages to the user
    if (channelMessages[channelId]) {
      socket.emit('channel-messages', channelMessages[channelId]);
    }

    // Notify others that user joined
    socket.to(channelId).emit('user-joined', {
      pubKey: pubKey,
      timestamp: new Date()
    });
  });

  // Leave a channel
  socket.on('leave-channel', (channelId) => {
    socket.leave(channelId);
    console.log(`User ${pubKey} left channel: ${channelId}`);

    socket.to(channelId).emit('user-left', {
      pubKey: pubKey,
      timestamp: new Date()
    });
  });

  // Create new channel
  socket.on('create-channel', (channelData) => {
    const { id, name, type } = channelData;

    // Check if channel already exists
    const exists = channels.some(ch => ch.id === id);
    if (exists) {
      socket.emit('error', { message: 'Channel already exists' });
      return;
    }

    const newChannel = {
      id,
      name,
      type,
      createdAt: new Date()
    };

    channels.push(newChannel);
    channelMessages[id] = [];
    saveChannels();
    saveMessages();

    console.log('Channel created:', newChannel);

    // Broadcast to all connected users
    io.emit('channels-list', channels);
    io.emit('channel-created', newChannel);
  });

  // Delete channel
  socket.on('delete-channel', (channelId) => {
    // Don't allow deleting default channels
    if (['general', 'random', 'dev-talk'].includes(channelId)) {
      socket.emit('error', { message: 'Cannot delete default channels' });
      return;
    }

    const index = channels.findIndex(ch => ch.id === channelId);
    if (index !== -1) {
      channels.splice(index, 1);
      delete channelMessages[channelId];
      saveChannels();
      saveMessages();

      console.log('Channel deleted:', channelId);

      // Notify all users
      io.emit('channels-list', channels);
      io.emit('channel-deleted', channelId);
      io.to(channelId).emit('channel-deleted', channelId);
    }
  });

  // Send message
  socket.on('send-message', (data) => {
    const { channelId, message } = data;

    if (!channelMessages[channelId]) {
      channelMessages[channelId] = [];
    }

    const messageWithUserInfo = {
      ...message,
      pubKey: pubKey,
      timestamp: new Date()
    };

    channelMessages[channelId].push(messageWithUserInfo);
    saveMessages();

    console.log('Message saved to channel:', channelId);

    // Broadcast to all users in the channel
    io.to(channelId).emit('receive-message', messageWithUserInfo);
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.channelId).emit('user-typing', {
      pubKey: pubKey,
      username: data.username
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(data.channelId).emit('user-stop-typing', {
      pubKey: pubKey
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', pubKey);
    delete userSessions[pubKey];
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});