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
      const errorEmbed = {
        title: '❌ Si è verificato un errore',
        description: 'Non hai i permessi necessari.',
        color: '#FF0000',
      };
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    await channel.bulkDelete(quantity);

    const successEmbed = {
      title: '✅ Chat pulita',
      color: '#00FF00',
    };
    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
  },
};
