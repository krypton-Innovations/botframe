const { Client, GatewayIntentBits, Partials } = require('discord.js');
const registerCommands = require('./registry/registerCommands');
const getLocalCommands = require('./registry/getLocalCommands');
const { loadEvents } = require('./handlers/eventHandler');
const { handleCommand } = require('./handlers/commandHandler');

const defaultIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.DirectMessages,
];

const defaultPartials = [
  Partials.Message,
  Partials.Channel,
  Partials.Reaction,
];

class FrameworkClient extends Client {
  constructor(options = {}) {
    const {
      intents = defaultIntents,
      partials = defaultPartials,
      commandsPath,
      eventsPath,
      devUserIds = [],
      ...clientOptions
    } = options;

    super({ intents, partials, ...clientOptions });

    this.config = {
      commandsPath,
      eventsPath,
      devUserIds,
    };

    this.commands = new Map();
  }

  async start(token) {
    console.log('BOOT | Preparing to login...');
    console.log(require("../../../package.json").version)
    const time = Date.now();

    const localCommands = getLocalCommands(this.config.commandsPath);
    for (const cmd of localCommands) {
      this.commands.set(cmd.name, cmd);
    }

    await registerCommands(this, localCommands);

    if (this.config.eventsPath) {
      await loadEvents(this, this.config.eventsPath);
    }

    this.on('interactionCreate', async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await handleCommand(this, interaction, this.commands);
      }
    });

    await this.login(token);
    const timeTaken = Date.now() - time;
    console.log(`BOOT | ${this.user.username} is online (took ${timeTaken}ms)`);
  }
}

module.exports = { FrameworkClient };
