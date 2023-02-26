const fs = require('fs')
let fastify
if (process.env.NODE_ENV === 'production') {
	fastify = require('fastify')({
		https: {
			allowHTTP1: true,
			key: fs.readFileSync('/etc/letsencrypt/live/discord.meucci.party/privkey.pem'),
			cert: fs.readFileSync('/etc/letsencrypt/live/discord.meucci.party/cert.pem')
		}
	})
} else {
	fastify = require('fastify')()
}

const path = require('path')
const jwt = require('jsonwebtoken')
const sqlite = require('better-sqlite3')

module.exports = class VerificationServer {
	server
	port
	client
	options
	db

	constructor(client) {
		this.client = client
		this.port = 443
		this.db = sqlite(`${__dirname}/../storage/db.sqlite`)

		fastify.post('/api/login/google', async (req, res) => {
			const credential = jwt.decode(req.body.credential)
			if (credential.email.split('@')[1] != 'itismeucci.com') {
				res.code(403).send()
				return
			}

			const foundStudent = this.db
				.prepare(
					`
			SELECT st.email AS "email", se.name AS "section"
			FROM students st INNER JOIN sections se ON (st.section = se.id)
			WHERE st.email = ?
			`
				)
				.get(credential.email)

			if (foundStudent) {
				let guild = await this.client.guilds.fetch('1042453384009101483')
				let role = guild.roles.cache.find((r) => r.name == foundStudent.section)
				let token = jwt.sign(
					{
						name: credential.name,
						class: role.name
					},
					process.env.jwtSecret
				)
				res.send({ token })
			}

			res.send()
		})

		fastify.post('/api/login/discord', async (req, res) => {
			if (!req.body.discordCode) return res.code(400).send()

			try {
				const discordCode = req.body.discordCode
				const googleToken = jwt.verify(req.body.googleToken, process.env.jwtSecret)
				const name = googleToken.name
					.split(' ')
					.map((w) => w[0].toUpperCase() + w.substring(1, w.length).toLowerCase())
					.join(' ')
				const schoolClass = googleToken.class

				const oauthData = await (
					await fetch('https://discord.com/api/oauth2/token', {
						method: 'POST',
						body: new URLSearchParams({
							client_id: '1042527020317413407',
							client_secret: process.env.discordAuthSecret,
							code: discordCode,
							grant_type: 'authorization_code',
							redirect_uri: 'https://discord.meucci.party',
							scope: 'identify guilds.join'
						}).toString(),
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded'
						}
					})
				).json()

				const user = await (
					await fetch('https://discord.com/api/users/@me', {
						headers: {
							authorization: `${oauthData.token_type} ${oauthData.access_token}`
						}
					})
				).json()

				let checkDuplicate = false
				const guild = await this.client.guilds.fetch('1042453384009101483')
				guild.members.cache.forEach((user) => {
					if (user.nickname) {
						if (user.nickname.includes(name)) {
							checkDuplicate = true
							res.code(403).send('Utente già verificato')
							return
						}
					}
				})

				if (checkDuplicate) return

				const member = await guild.members.fetch(user.id)
				const classRole = await guild.roles.cache.find((r) => r.name == schoolClass)
				const verifiedRole = await guild.roles.cache.find((r) => r.id == '1043205166431752223')

				await fetch(`https://discord.com/api/v8/guilds/1042453384009101483/members/${user.id}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bot ${process.env.discordSecret}`
					},
					body: JSON.stringify({ access_token: oauthData.access_token })
				})

				await member.roles.add(classRole)
				await member.roles.add(verifiedRole)
				await member.setNickname(`${name} (${schoolClass})`)
			} catch (error) {
				console.error(error)
				res.code(403).send(error)
			}
			res.code(200)
		})

		fastify.register(require('@fastify/static'), {
			root: path.join(__dirname, 'public')
		})

		fastify.listen({ port: this.port, host: '0.0.0.0' }, (err, addr) => {
			if (err) {
				console.error(err)
				return
			}
			console.log(`WebServer listening on ${addr}`)
		})
	}
}
