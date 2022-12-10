window.onload = async () => {
	replaceDescription()
	if (localStorage.getItem('googleToken')) {
		document.querySelector('#google').remove()
		const code = new URLSearchParams(window.location.search).get('code')

		if (!code) {
			return
		}

		const result = await fetch('https://discord.meucci.party/api/login/discord', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				googleToken: localStorage.getItem('googleToken'),
				discordCode: code
			})
		})

		document.querySelector('#discord').remove()
		localStorage.clear()

		if (result.status == 200) {
			document.querySelector('#info').textContent = 'Utente verificato correttamente'
			document.querySelector('#description').remove()
		}
		else
		{
			document.querySelector('#info').textContent = 'Si è verificato un problema'
			document.querySelector('#description').textContent = await result.text()
		}
	} else {
		document.querySelector('#discord').remove()
	}
}

async function sendCredentials(data) {
	const req = await fetch('https://discord.meucci.party/api/login/google', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})
    
    if (req.status != 200)
    {
        document.querySelector('#info').textContent = 'Si è verificato un errore'
        document.querySelector('#description').remove()
        setTimeout(() => window.location.reload(), 5000)
        return
    }
    const googleToken = await req.json()

	localStorage.setItem('googleToken', googleToken.token)
	window.location.reload()
}

function replaceDescription() {
	if (Math.floor(Math.random() * 100) === 0)
		document.querySelector('#description').textContent = 'facendo così, ti crescerà il cazzo di 12cm assicurati!'
}
