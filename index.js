const config = require('./config.json')
const dotenv = require('dotenv')
dotenv.config()

const {Client, Events, GatewayIntentBits} = require('discord.js')

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent], partials: ['MESSAGE', 'CHANNEL', 'REACTION']})

client.once(Events.ClientReady, c => {
	console.log('Client is ready')
})

client.login(process.env.secret)

async function start()
{
    let guild = await client.guilds.fetch("1042453384009101483")
    guild.channels.fetch('1042486185500610690').then(c => c.send("Message sent from **Render**"))
}

start()