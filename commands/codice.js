const { SlashCommandBuilder } = require('discord.js')
const client = require('../index.js').client

module.exports = {
	data: new SlashCommandBuilder()
		.setName('codice')
		.setDescription('Mostra il codice del comando selezionato')
		.addStringOption((option) =>
			option.setName('comando').setDescription('Il comando da visualizzare').setRequired(true)
		),
	async execute(interaction) {
		const command = client.commands.get(interaction.options.getString('comando'))
		if (!command) {
			await interaction.reply({
				embeds: [
					{
						title: `❌ Si è verificato un errore`,
						description: `Il comando non esiste`,
						color: 15548997
					}
				],
				ephemeral: true
			})
			return
		}

		await interaction.reply(
			`**Comando:** ${command.data.name}\n**Descrizione:** ${command.data.description}\n\`\`\`js\n${command.execute}\n\`\`\``
		)
	}
}
