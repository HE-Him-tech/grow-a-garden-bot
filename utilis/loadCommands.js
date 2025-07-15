import fs from 'fs';
import path from 'path';

export async function loadCommands(client) {
  const commandsPath = path.join(process.cwd(), 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = await import(`file://${filePath}`);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    } catch (error) {
      console.error(`Failed to load command at ${filePath}:`, error);
    }
  }

  console.log(`✅ Loaded ${client.commands.size} commands.`);
}
