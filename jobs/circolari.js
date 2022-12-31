const axios = require('axios')
const { JSDOM } = require('jsdom')
const fs = require('fs')
const path = require('path')
module.exports = {
	name: 'circolari',
	interval: '0 */2 * * *',
	execute: async (client) => {
		let message = ''
		const URL =
			'https://web.spaggiari.eu/sdg/app/default/comunicati.php?sede_codice=FIIT0009&referer=www.itismeucci.net'
		async function getDataFromUrl() {
			// fetch the html file
			let page = await axios.get(URL)
			// convert it to text
			page = await page.data
			const dom = new JSDOM(page)
			// circolari table
			const table = dom.window.document.querySelector('#table-documenti').children[0]

			const circolari = []
			const circolariWithLinks = []
			// iterate over circolari
			for (let i = 1; i < table.children.length; i++) {
				// prendere il titolo della circolare
				const title = table.children[i].children[1].children[0].textContent
				// prendere l'id della circolare
				const id = table.children[i].children[2].children[0].getAttribute('id_doc')
				circolariWithLinks.push({
					title,
					id: `https://web.spaggiari.eu/sdg/app/default/view_documento.php?a=akVIEW_FROM_ID&id_documento=${id}&sede_codice=FIIT0009`
				})

				circolari.push(table.children[i].children[1].children[0].textContent)
			}
			return circolariWithLinks
		}

		let isChanged = false
		let oldData
		let newData

		try {
			isChanged = false
			oldData = JSON.parse(fs.readFileSync(path.join(__dirname + '/../storage/circolari.json')))
			newData = await getDataFromUrl()
			const guild = await client.guilds.fetch('1042453384009101483')
			const channel = await guild.channels.fetch('1047196335310393407')

			if (oldData) {
				// compare old and new data
				for (let i = 0; i < oldData.length; i++) {
					if (oldData[i].title !== newData[i].title) {
						for (let j = i; j < oldData.length; j++) {
							if (oldData[i].title == newData[j].title) {
								isChanged = true
								channel.send({
									embeds: [
										{
											title: `🔔 NUOVA CIRCOLARE!`,
											description: `**${newData[j].title}**\n${newData[j].id}`,
											color: 15548997
										}
									],
									ephemeral: true
								})
								break
							}
						}
					}
					if (isChanged) {
						break
					}
				}
				if (!isChanged) console.log('[CRON JOB - CIRCOLARI] Nessuna circolare nuova')
			}
			// if nothing changed, log and rewrite the file
			fs.writeFileSync(path.join(__dirname + '/../storage/circolari.json'), JSON.stringify(newData))
		} catch (error) {
			console.log(error)
			fs.writeFileSync(path.join(__dirname + '/../storage/circolari.json'), '[]')
		}
	}
}
