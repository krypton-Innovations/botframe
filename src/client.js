const { Client, GatewayIntentBits, Partials } = require('discord.js');
const registerCommands = require('./registry/registerCommands');
const getLocalCommands = require('./registry/getLocalCommands');
const getBuiltInCommands = require('./registry/getBuiltInCommands');
const { loadEvents } = require('./handlers/eventHandler');
const { handleCommand } = require('./handlers/commandHandler');

// ... defaultIntents, defaultPartials unchanged ...

class FrameworkClient extends Client {
  constructor(options = {}) {
    // ... constructor unchanged ...
  }

  async start(token) {
    console.log('BOOT | Preparing to login...');
    const time = Date.now();

    const builtInCommands = getBuiltInCommands();

    const localCommands = getLocalCommands(this.config.commandsPath);
    
    const allCommands = [...builtInCommands];
    for (const cmd of localCommands) {
      const existingIndex = allCommands.findIndex(c => c.name === cmd.name);
      if (existingIndex !== -1) {
        allCommands[existingIndex] = cmd; // override with bot's version
      } else {
        allCommands.push(cmd);
      }
    }

    this.commands.clear();
    for (const cmd of allCommands) {
      this.commands.set(cmd.name, cmd);
    }

    if (this.config.eventsPath) {
      await loadEvents(this, this.config.eventsPath);
    }

    this.on('interactionCreate', async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await handleCommand(this, interaction, this.commands);
      }
    });

    await this.login(token);

    await new Promise((resolve) => {
      if (this.isReady()) return resolve();
      this.once('clientReady', resolve);   // fixed deprecation
    });

    await registerCommands(this, allCommands);

    const timeTaken = Date.now() - time;
    console.log(`BOOT | ${this.user.username} is online (took ${timeTaken}ms)`);
  }
}

module.exports = { FrameworkClient };