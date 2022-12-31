const { client } = require('../index.js')
const { EmbedBuilder } = require('discord.js')
const { getAverageColor } = require('fast-average-color-node')
const fs = require('fs')
const genThumbnail = require('simple-thumbnail')
const path = require('path')

const thumbnailStorage = path.resolve(__dirname, '../thumbnails')
if (!fs.existsSync(thumbnailStorage)) {
	fs.mkdirSync(thumbnailStorage)
}

const allowedChannelIDs = ['1052681467706212502']
const necessaryStars = 1
const starboardChannelID = '1057418959672053811'
const loadLimit = 100

async function loadMessages(channelID, limit) {
	const channel = client.channels.cache.get(channelID)
	const messages = await channel.messages.fetch({ limit: limit })
}

client.on('ready', () => {
	loadMessages(starboardChannelID, loadLimit)
	for (const channelID of allowedChannelIDs) {
		loadMessages(channelID, loadLimit)
	}
})

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

async function ephemerallyDMUser(text, user, time) {
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

// given a rgb(r, g, b) string, returns an array with [r, g, b]
function rgbStringToArray(rgbString) {
	const rgbArray = rgbString
		.replace('rgb(', '')
		.replace(')', '')
		.split(',')
		.map((x) => parseInt(x))
	return rgbArray
}

client.on('messageReactionAdd', async (reaction, user) => {
	try {
		const { message } = reaction
		const channel = client.channels.cache.get(starboardChannelID)

		// First checks if we should ignore the reaction or not
		if (reaction.emoji.name !== '⭐') return
		if (!allowedChannelIDs.includes(message.channel.id)) return
		if (reaction.count < necessaryStars) return
		if (message.author.id === user.id) {
			reaction.remove(user.id)
			ephemerallyDMUser('Non puoi aggiungere una stella ad un tuo messaggio', user, 300000)
			return
		}
		if (message.author.bot) {
			reaction.remove(user.id)
			ephemerallyDMUser(
				`Non puoi aggiungere una stella ad un messaggio di ${message.author.username}.`,
				user,
				300000
			)
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
			const message = await channel.messages.fetch(embedMsgId)

			await editEmbedStarCount(message, reaction.count)
		} else {
			// Prep media
			const media = message.attachments.size > 0 ? message.attachments.first() : null
			let isVideoAttached = false
			let isImageAttached = false
			let image

			if (media) {
				isImageAttached = media.contentType.startsWith('image') ? true : false
				isVideoAttached = media.contentType.startsWith('video') ? true : false
				if (isVideoAttached) {
					// genThumbnail is an external library that uses ffmpeg
					await genThumbnail(media.url, `${thumbnailStorage}/thumbnail.png`, '?x1080')
					image = `${thumbnailStorage}/thumbnail.png`
				} else if (isImageAttached) {
					image = media.url
				}
			}

			let color = [35, 39, 42] // Default embed color is discord's grey

			// Prep color
			if (image) {
				// getAverageColor is an external api
				const averageColor = await getAverageColor(image)
				color = rgbStringToArray(averageColor.rgb)
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

			if (media) {
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

client.on('messageReactionRemove', async (reaction, user) => {
	try {
		const { message } = reaction
		const channel = client.channels.cache.get(starboardChannelID)

		// First checks if we should ignore the reaction or not
		if (reaction.emoji.name !== '⭐') return
		if (!allowedChannelIDs.includes(message.channel.id)) return

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
