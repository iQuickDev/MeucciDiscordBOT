let appData = {
	guildID: '1042453384009101483',
	clientID: '1052681910071074837'
}

const dotenv = require('dotenv')
const { REST, Routes } = require('discord.js')
const fs = require('node:fs')
dotenv.config()

if (!process.env.TEST) {
	appData.clientID = '1042527020317413407'

	console.log('Deploying commands in normal mode...')
} else {
	console.log('Deploying commands in testing mode...')
}

const { guildID, clientID } = appData
const commands = []
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'))

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/${file}`)
	commands.push(command.data.toJSON())
}

const globalCommands = []
const globalCommandFiles = fs.readdirSync('./commands/globals').filter((file) => file.endsWith('.js'))

for (const file of globalCommandFiles) {
	const command = require(`./commands/globals/${file}`)
	globalCommands.push(command.data.toJSON())
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(process.env.discordSecret)

// and deploy your commands!
;(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`)

		// Deploy guild commands
		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(Routes.applicationGuildCommands(clientID, guildID), { body: commands })
		console.log(`Successfully reloaded ${data.length} application (/) commands.`)

		// Deploy global commands
		const globalData = await rest.put(Routes.applicationCommands(clientID), { body: globalCommands })
		console.log(`Successfully reloaded ${globalData.length} global (/) commands.`)
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error)
	}
})()
