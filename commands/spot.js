const { SlashCommandBuilder } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('spot')
		.setDescription('invia uno spot alla pagina instagram @spotted_itismeucci')
		.addStringOption((option) =>
			option
				.setName('testo')
				.setDescription('il testo da inviare')
				.setRequired(true)
		),
	async execute(interaction) {
		let spottedText = interaction.options.getString('testo')
		spottedText +=
			'\n[Spot inviato dal bot di discord del server di scuola (discord.gg/EhcYybM5CD)]'
		try {
			let request = await fetch('https://api.tellonym.me/tells/new', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					isInstagramInAppBrowser: false,
					isSnapchatInAppBrowser: false,
					isSenderRevealed: false,
					tell: spottedText,
					userId: /*81836474*/ 73789721,
					limit: 25,
				}),
			})

			if (request.statusText != 'OK')
				throw new Error('La richiesta non è andata a buon fine')
		} catch (error) {
			await interaction.reply({
				embeds: [
					{
						title: `❌ Si è verificato un errore nell\'invio dello spot`,
						description: `${error}`,
						color: 15548997,
					},
				],
				ephemeral: true,
			})
			return
		}

		await interaction.reply({
			embeds: [
				{
					title: `✅ Spot inviato correttamente`,
					description: `https://tellonym.me/spottedmeucci`,
					color: 5763719,
				},
			],
			ephemeral: true,
		})
	},
}
