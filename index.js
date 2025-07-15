// index.js
import { Client, GatewayIntentBits, Partials, Collection, Events } from 'discord.js';
import mongoose from 'mongoose';
import config from './config.js';
import loadCommands from './utils/loadCommands.js';
import loadEvents from './utils/loadEvents.js';
<<<<<<< HEAD
import './server/server.js'; 
=======
import './server/server.js'; // Keeps Render project alive
>>>>>>> 6dceb51fb29d07ed3a39eb750ad3da1c8acb64d1

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.commands = new Collection();

// Load commands and events
await loadCommands(client);
await loadEvents(client);

// Connect to MongoDB
client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    await mongoose.connect(config.mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
});

// Log in the bot
client.login(config.token);