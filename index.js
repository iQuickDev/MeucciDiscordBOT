const { Client, Events, Collection } = require("discord.js")
const path = require("path")
const dotenv = require("dotenv")
const fs = require("fs")
dotenv.config()

const client = new Client({
	intents: 3276799,
	partials: ["MESSAGE", "CHANNEL", "REACTION"],
})
module.exports.client = client
client.commands = new Collection()
const commandsPath = path.join(__dirname, "commands")
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js"))

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file)
	const command = require(filePath)
	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command)
		console.log(`[LOADED] ${file}`)
	}
	else {
		console.log(
			`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property`,
		)
	}
}

client.once(Events.ClientReady, () => {
	console.log("Client is ready")
})

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return

	const command = interaction.client.commands.get(interaction.commandName)

	if (!command) {
		console.error(`command ${interaction.commandName} does not exist`)
		return
	}

	try {
		await command.execute(interaction)
	}
	catch (error) {
		console.error(error)
		await interaction.reply({
			content: "There was an error while executing this command!",
			ephemeral: true,
		})
	}
})

client.login(process.env.secret)
