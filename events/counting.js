const { client } = require('../index.js')

const countingChannelID = "1053039207855177739"

let count = 0

client.on('messageCreate', (message) => {

	const { channel, content, member } = message

	if (channel.id === countingChannelID) {
		if (member.user.bot) return

		count++

		if (Number(content) !== count) {
			
			message.delete()

			console.error(`[Counting channel] ${member} ha sbagliato a contare, il contatore era a ${count-1}`)

			count = 0
		}
	}
})
