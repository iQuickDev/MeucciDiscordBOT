const { client } = require('../index.js')
const { EmbedBuilder } = require('discord.js')
const { getAverageColor } = require('fast-average-color-node')
const fs = require('fs')
const genThumbnail = require('simple-thumbnail')
const path = require('path')

// Config options
const thumbnailStorage = path.resolve(__dirname, '../thumbnails') // Where to store video thumbnails
const allowedChannelIDs = ['1043936292989317190','1043944028930052147','1047196335310393407','1052681467706212502'] // The channel IDs allowed having messages forwarded to the starboard
const necessaryStars = 1 // The number of stars needed forward a message to the starboard
const starboardChannelID = '1057418959672053811' // The channel ID of the starboard
const loadLimit = 100 // The number of messages to load from the starboard channel

// Thumbnail storage folder creation
if (!fs.existsSync(thumbnailStorage)) {
	fs.mkdirSync(thumbnailStorage)
}

// Shorthand to load messages (100 is the limit imposed by Discord's APIs)
async function loadMessages(channelID, limit = 100) {
	if (limit > 100) {
		throw new Error('The channel loading limit cannot be greater than 100, as imposed by Discord\'s APIs')
	}
	const channel = client.channels.cache.get(channelID)
	return await channel.messages.fetch({ limit: limit })
}

// Loads messages from the starboard channel because the messageReactionAdd and messageReactionRemove events don't work with uncached messages
client.on('ready', async () => {
	await loadMessages(starboardChannelID, loadLimit)
	for (const channelID of allowedChannelIDs) {
		await loadMessages(channelID, loadLimit)
	}
})

// Given a message object containing an embed, edits the embed star count.
// If it fails, it'll retry 3 more times by default
async function editEmbedStarCount(message, stars, retries = 3) {
	try {
		const oldEmbed = message.embeds[0]

		const oldFooter = oldEmbed.footer.text
		const newFooter = oldFooter.replace(/(\d+)/, stars)

		const newEmbed = new EmbedBuilder(oldEmbed).setFooter({ text: newFooter })

		await message.edit({ embeds: [newEmbed] })
	} catch (err) {
		console.error(err)
		if (retries <= 0) {
			return Promise.reject(finalErr)
		}
		return editEmbedStarCount(message, stars, retries - 1)
	}
}

// DMs the user with the given message and deletes it after a given time
async function ephemerallyDMUser(text, user, time = 300000) {
	try {
		user.send(text).then((message) => {
			setTimeout(() => {
				message.delete()
			}, time)
		})
	} catch (err) {
		console.error(err)
	}
}

// Given a rgb(r, g, b) string, returns an array with [r, g, b]
function rgbStringToArray(rgbString) {
	return rgbString
		.replace('rgb(', '')
		.replace(')', '')
		.split(',')
		.map((x) => parseInt(x))

}

client.on('messageReactionAdd', async (reaction, user) => {
	try {
		const { message } = reaction
		const channel = client.channels.cache.get(starboardChannelID)

		// First checks if we should ignore the reaction or not
		if (reaction.emoji.name !== '⭐') return
		if (!allowedChannelIDs.includes(message.channel.id.toString())) return
		if (reaction.count < necessaryStars) return
		if (message.author.id === user.id) {
			await reaction.remove()
			await ephemerallyDMUser('Non puoi aggiungere una stella a un tuo messaggio', user)
			return
		}
		if (message.author.bot) {
			await reaction.remove()
			await ephemerallyDMUser(`Non puoi aggiungere una stella a un messaggio di ${message.author.username}.`, user)
			return
		}

		let embedMsgId
		if (
			// Screen if the message is already in the starboard
			channel.messages.cache.find((msg) => {
				const footer = msg.embeds[0].footer.text

				const detectedID = footer.match(/\|\s(\d+)/)[1]

				embedMsgId = msg.id

				return detectedID === message.id
			})
		) {
			// Edit the existing embed
			const message = await channel.messages.fetch(embedMsgId)

			await editEmbedStarCount(message, reaction.count)
		} else {
			// Create a new embed
			// Prepare media
			const media = message.attachments.size > 0 ? message.attachments.first() : null
			let isVideoAttached = false
			let isImageAttached = false
			let image

			if (media) {
				isImageAttached = media.contentType.startsWith('image')
				isVideoAttached = media.contentType.startsWith('video')
				if (isVideoAttached) {
					// genThumbnail is an external library that uses ffmpeg
					await genThumbnail(media.url, `${thumbnailStorage}/thumbnail.png`, '?x1080')
					image = `${thumbnailStorage}/thumbnail.png`
				} else if (isImageAttached) {
					image = media.url
				}
			}

			// Prepare embed color
			let color = [35, 39, 42] // The default embed color is Discord's grey
			// Works if there is an image or a video attached
			if (image) {
				// getAverageColor is an external library we use to color the embed
				const averageColor = await getAverageColor(image)
				color = rgbStringToArray(averageColor.rgb)
			}
			// Delete the thumbnail if it exists
			if (isVideoAttached) {
				fs.unlink(image, (err) => {
					if (err) console.error(err)
				})
			}

			const embed = new EmbedBuilder()
				.setColor(color)
				.setAuthor({
					name: message.author.tag,
					iconURL: message.author.displayAvatarURL(),
					url: `https://discord.com/users/${message.author.id}`
				})
				.setDescription(`${message.content}\n\n[Link](${message.url})`)
				.setTimestamp(message.createdAt)
				.setFooter({ text: `⭐ ${reaction.count} | ${message.id}` })
				.setURL(message.url)

			// If there is a media which isn't an image, add it as an attachment else add an embed image
			if (media && !isImageAttached) {
				await channel.send({ embeds: [embed], files: [media.url] })
			} else {
				embed.setImage(image)
				await channel.send({ embeds: [embed] })
			}
		}
	} catch (err) {
		console.error(err)
	}
})

client.on('messageReactionRemove', async (reaction) => {
	try {
		const { message } = reaction
		const channel = client.channels.cache.get(starboardChannelID)

		// First checks if we should ignore the reaction or not
		if (reaction.emoji.name !== '⭐') return
		if (!allowedChannelIDs.includes(message.channel.id.toString())) return

		const embedMsg = channel.messages.cache.find((msg) => {
			const footer = msg.embeds[0].footer.text

			const detectedID = footer.match(/\|\s(\d+)/)[1]

			return detectedID === message.id
		})

		const starboardMessage = await channel.messages.fetch(embedMsg.id)

		if (reaction.count < necessaryStars) {
			await starboardMessage.delete()
		} else {
			await editEmbedStarCount(starboardMessage, reaction.count)
		}
	} catch (err) {
		console.error(err)
	}
})
