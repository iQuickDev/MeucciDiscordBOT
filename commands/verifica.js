const { SlashCommandBuilder } = require("discord.js")
const client = require("../index.js").client

module.exports = {
	data: new SlashCommandBuilder()
		.setName("verifica")
		.setDescription(
			"inizializza la procedura di verifica per l'utente che lo richiede",
		)
		.addStringOption((option) =>
			option
				.setName("nome")
				.setDescription("il nome reale dell'utente")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("cognome")
				.setDescription("il cognome dell'utente")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('classe')
				.setDescription('la classe dell\'utente')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('genere')
				.setDescription('il genere dell\'utente')
				.setRequired(false)
				.addChoices(
					{ name: 'Maschio', value: 'Maschio' },
					{ name: 'Femmina', value: 'Femmina' },
				),
		),
	async execute(interaction) {
		const name = interaction.options.getString('nome')
		const surname = interaction.options.getString('cognome')
		const selectedClass = interaction.options.getString('classe')
		const gender = interaction.options.getString('genere')
		const guild = await client.guilds.fetch('1042453384009101483')
		const classRole = guild.roles.cache.find(r => r.name == selectedClass)
		const genderRole = guild.roles.cache.find(r => r.name == gender)
		const verifiedRole = await guild.roles.fetch('1043205166431752223')

		if (interaction.member.roles.cache.has('1043205166431752223')) {
			interaction.reply(printError('Utente già verificato'))
			return
		}

		if (!classRole) {
			await interaction.reply(printError('La classe specificata non esiste'))
			return
		}

		try {
			await interaction.member.setNickname(`${name} ${surname} (${classRole.name})`)
			await interaction.member.roles.add(classRole)
			if (genderRole) {
				await interaction.member.roles.add(genderRole)
			}
			await interaction.member.roles.add(verifiedRole)
		}
		catch (error) {
			interaction.reply(printError(error))
			return
		}

		interaction.reply({
			embeds: [
				{
					title: `✅ Utente verificato con successo`,
					color: 5763719,
				},
			],
			ephemeral: true,
		})
	},
}

function printError(reason) {
	return {
		embeds: [
			{
				title: `❌ Si è verificato un errore`,
				description: `${reason}`,
				color: 15548997,
			},
		],
		ephemeral: true,
	}
}