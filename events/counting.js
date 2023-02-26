const { client } = require('../index.js')

let countingChannelID = '1053039207855177739' //production
//let countingChannelID = '1052681467706212502' //testing

// take the last message from the counting channel as the counter start
let count
client.on('ready', () => {
	const channel = client.channels.cache.get(countingChannelID)

	channel.messages.fetch({ limit: 1 }).then((messages) => {
		const lastMessage = messages.last()

		count = Number(lastMessage.content) + 1
	})
})

client.on('messageCreate',async (message) => {
	const { channel, content, member } = message

	if (channel.id === countingChannelID) {
		if (member.user.bot) return

		if (Number(content) !== count) {
			await message.delete()
		} else count++
	}
})
