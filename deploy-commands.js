let appData = {
	guildID: '1042453384009101483',
	clientID: '1052681910071074837'
}

const dotenv = require('dotenv')
const { REST, Routes } = require('discord.js')
const fs = require('node:fs')
const { guildID, clientID } = appData
dotenv.config()

if (!process.env.TEST) {
	appData.clientID = '1042527020317413407'

	console.log('Starting bot in normal mode...')
} else {
	console.log('Starting bot in testing mode...')
}

const commands = []
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'))

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/${file}`)
	commands.push(command.data.toJSON())
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(process.env.discordSecret)

// and deploy your commands!
;(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`)

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(Routes.applicationGuildCommands(clientID, guildID), { body: commands })

		console.log(`Successfully reloaded ${data.length} application (/) commands.`)
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error)
	}
})()
