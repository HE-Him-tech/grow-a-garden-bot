import fs from 'fs';
import path from 'path';
import { Events } from 'discord.js';

export function loadEvents(client) {
  const eventsPath = path.join(process.cwd(), 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    import(`file://${filePath}`).then(eventModule => {
      const eventName = Object.keys(eventModule)[0];
      const eventHandler = eventModule[eventName];

      if (!eventHandler) {
        console.warn(`[WARNING] Event handler missing in file: ${filePath}`);
        return;
      }

      // Check if the event is meant to be handled once or on every emit
      if (file.startsWith('once')) {
        client.once(eventName, (...args) => eventHandler(client, ...args));
      } else {
        client.on(eventName, (...args) => eventHandler(client, ...args));
      }
    }).catch(console.error);
  }
}