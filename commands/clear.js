const { SlashCommandBuilder, Permissions } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Pulisci la chat')
    .addIntegerOption(option => option.setName('quantità').setDescription('La quantità di messaggi da rimuovere').setRequired(true)),
  async execute(interaction) {
    const quantity = interaction.options.getInteger('quantità');
    const channel = await interaction.channel;

    if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
      return interaction.reply({ content: 'Non hai i permessi necessari.', ephemeral: true });
    }

    await channel.bulkDelete(quantity);

    await interaction.reply({ content: 'Chat pulita.', ephemeral: true });
  },
};