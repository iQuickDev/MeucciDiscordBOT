const { SlashCommandBuilder, PermissionsBitField } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('pulisci la chat')
		.addIntegerOption((option) =>
			option.setName('quantità').setDescription('la quantità di messaggi da rimuovere').setRequired(true)
		),
	async execute(interaction) {
		const quantity = interaction.options.getInteger('quantità')
		const channel = await interaction.channel

		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
			await interaction.reply({
				embeds: [
					{
						title: `❌ Si è verificato un errore`,
						description: `Non hai i permessi necessari`,
						color: 15548997
					}
				],
				ephemeral: true
			})
			return
		}

		await channel.bulkDelete(quantity)

		await interaction.reply({
			embeds: [
				{
					title: `✅ Chat pulita`,
					color: 5763719
				}
			]
		})
	}
}
