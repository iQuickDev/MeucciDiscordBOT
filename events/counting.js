const { client } = require('../index.js')
const countingChannelID = '1053039207855177739' //production

//const countingChannelID = '1052681467706212502' //testing

let count = 1

client.on('messageCreate', (message) => {
	const { channel, content, member } = message

	if (channel.id === countingChannelID) {
		if (member.user.bot) return

		if (Number(content) !== count) {
			message.delete()

			console.error(`[Counting channel] ${member.displayName} ha sbagliato a contare, il contatore era a ${count - 1}, offending message "${message.content}"`)
		} else count++
	}
})
