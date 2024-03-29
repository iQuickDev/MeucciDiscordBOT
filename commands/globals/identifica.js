const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const sqlite = require('better-sqlite3')
const client = require('../../index.js').client

const authorizedGuildID = '1042453384009101483'

function capitalizeFirstLetters(string) {
	return string
		.split(' ')
		.map((x) => x[0].toUpperCase() + x.substring(1, x.length).toLowerCase())
		.toString()
		.replaceAll(',', ' ')
}

function isUserFromServer(interaction, authorizedGuild) {
	const memberQuery = authorizedGuild.members.cache.get(interaction.user.id)
	if (!memberQuery) return false
	const hasBeenVerified = memberQuery.roles.cache.find((r) => r.name === '✅')
	return !!memberQuery && !!hasBeenVerified
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('identifica')
		.setDescription('Mostra informazioni riguardanti uno studente')
		.addStringOption((option) => option.setName('soggetto').setDescription('Il nome o cognome dello studente'))
		.addStringOption((option) => option.setName('classe').setDescription('La classe dello studente')),
	async execute(interaction) {
		const authorizedGuild = await client.guilds.fetch(authorizedGuildID)

		if (!isUserFromServer(interaction, authorizedGuild)) {
			await interaction.reply({
				embeds: [{
					title: `❌ Si è verificato un errore`,
					description: `Non puoi usare questo comando qui, non appartieni al server della scuola oppure non sei stato verificato`,
					color: 15548997
				}]
			})
			return
		}

		const requestedName = interaction.options.getString('soggetto') ?? ''
		const requestedSection = interaction.options.getString('classe') ?? ''

		if (!requestedName && !requestedSection) {
			await interaction.reply({
				embeds: [
					{
						title: `❌ Si è verificato un errore`,
						description: `Non è stato fornito nessun parametro di ricerca`,
						color: 15548997
					}
				],
				ephemeral: true
			})
			return
		}

		await interaction.deferReply()

		const db = sqlite(`${__dirname}/../../storage/db.sqlite`)

		const query = db.prepare(`
            SELECT st.name AS "name", se.name AS "section"
            FROM sections se
                     JOIN students st ON (se.id = st.section)
            WHERE st.name LIKE '%' || ? || '%'
              AND se.name LIKE '%' || ? || '%'
		`)

		const foundStudents = query.all(requestedName, requestedSection)

		// Embed building
		let embedColor = 'Green'
		let results = ''

		for (const student of foundStudents) {
			results += `${capitalizeFirstLetters(student.name)} (${student.section})\n`
		}

		if (foundStudents.length === 0) {
			results = 'Nessuno studente trovato'
			embedColor = 'Red'
		}

		const embed = new EmbedBuilder()
			.setColor(embedColor)
			.setDescription(`**Lista Risultati (${foundStudents.length})**\n${results}`)

		await interaction.followUp({ embeds: [embed] })
	}
}
