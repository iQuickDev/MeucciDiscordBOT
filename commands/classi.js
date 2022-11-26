const { SlashCommandBuilder } = require('discord.js')
const client = require('../index.js').client

module.exports = {
	data: new SlashCommandBuilder().setName('classi').setDescription('mostra la lista delle classi'),

	async execute(interaction) {
		const guild = await client.guilds.fetch(interaction.guild.id)
		const classes = await guild.roles.cache.filter((r) => !isNaN(r.name[0])).sort()
		let list = ''

		classes.forEach((c) => (list += `${c.name}\n`))

		await interaction.reply({
			embeds: [
				{
					title: `📑 Lista classi`,
					description: list,
					color: 5763719
				}
			],
			ephemeral: true
		})
	}
}
