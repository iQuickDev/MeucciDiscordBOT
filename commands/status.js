const { SlashCommandBuilder, version, EmbedBuilder } = require('discord.js')
const client = require('../index.js').client
const moment = require('moment')
require('moment-duration-format')
const os = require('os')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('mostra le risorse utilizzate dal bot'),
	async execute(interaction) {
		await interaction.deferReply({
			ephemeral: false,
		})

		const duration1 = moment
			.duration(interaction.client.uptime)
			.format(' d [days], h [hrs], m [mins], s [secs]')
		let guildsCounts = await client.guilds.fetch()
		let userCounts = client.guilds.cache.reduce(
			(acc, guild) => acc + guild.memberCount,
			0
		)

		const embed = new EmbedBuilder()
			.setColor('Blue')
			.setThumbnail(interaction.client.user.displayAvatarURL())
			.setDescription(`**ITIS Meucci BOT**
                      **Server** : ${guildsCounts.size}
                        **Utenti** : ${userCounts}
                      **Discord.js** : v${version}
                      **Node** : ${process.version}
                      **Piattaforma** : ${os.type}
                      **Uptime** : ${duration1}
                      **CPU** :
                      > **Cores** : ${os.cpus().length}
                      > **Modello** : ${os.cpus()[0].model} 
                      > **Frequenza** : ${os.cpus()[0].speed} MHz
                      **MEMORIA** :
                      > **Memoria totale** : ${(
												os.totalmem() /
												1024 /
												1024
											).toFixed(0)} MB
                      > **Memoria libera** : ${(
												os.freemem() /
												1024 /
												1024
											).toFixed(0)} MB
                      > **Totale heap** : ${(
												process.memoryUsage().heapTotal /
												1024 /
												1024
											).toFixed(0)} MB
                      > **Utilizzo heap** : ${(
												process.memoryUsage().heapUsed /
												1024 /
												1024
											).toFixed(0)} MB
                  `)
		interaction.followUp({ embeds: [embed] })
	},
}
