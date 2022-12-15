const { client } = require('../index.js')

const countingChannelID = "1053039207855177739"

let count = 0

client.on('messageCreate', ({ channel, content, member }) => {
	if (Number(channel.id) === Number(countingChannelID)) {
		if (member.user.bot) return

		count++
		// member.id !== user.id
		if (Number(content) !== count) {
			channel.send(
				`${member} ha sbagliato a contare, evidentemente gli piace il cazzo.\nContatore resettato da ${count-1} a 0.`
			)

			console.error(`[Counting channel] ${member} ha sbagliato a contare, il contatore era a ${count-1}`)

			count = 0
		}
	}
})
