const { Builder } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const fs = require('fs')
const path = require('path')
const sqlite = require('better-sqlite3')
const settings = require('./settings.json')

	; (async () => {
		if (!settings) {
			console.log("Please populate the settings.json file")
			return
		}

		// timeout ensures that everything loads properly

		const TIMEOUT = 30000000
		let options = new chrome.Options()
		options.addArguments(`user-data-dir=${__dirname}/browser-data`)
		let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()

		driver.manage().setTimeouts({
			implicit: TIMEOUT,
			pageLoad: TIMEOUT,
			script: TIMEOUT
		})

		// go to the schedules page and scrape the sections

		driver.get(settings.scheduleLink)
		let columns = await driver.findElements({ tagName: 'p' })
		let sections = (await columns[2].getText()).replaceAll("^", "").split('\n')

		for (const s of [...sections]) {
			if (s.includes(" ") || s.includes("_")) {
				sections.splice(sections.indexOf(s), 1)
				continue
			}

			// sorry for this but it is made to fix mistakes made by the school

			if (!s.includes("-")) {
				let currentSection = `${s.substring(0, 2)}-${s.substring(2, s.length)}`
				sections[sections.indexOf(s)] = currentSection
				if (
					currentSection.split("-")[1].length == 3 && currentSection.split("-")[1] != "MME"
				) {
					sections[sections.indexOf(currentSection)] = `${s.substring(0, 2)}-MME`
				}
			}
		}

		console.log("Retrieved the following sections:")
		console.log(sections)

		const databaseFile = path.resolve(__dirname + '/db.sqlite')
		// delete the existing db (if it exists) and proceed to create a new one

		try {
			fs.unlinkSync(databaseFile)
			console.log("Updating the existing database file")
		} catch (e) {
			console.log("Database file is not present, creating one")
		}

		const db = sqlite(databaseFile)

		db.prepare(
			`CREATE TABLE sections(
		id INTEGER NOT NULL UNIQUE PRIMARY KEY AUTOINCREMENT,
		name TEXT
	);`
		).run()
		db.prepare(
			`CREATE TABLE students(
		id INTEGER NOT NULL UNIQUE PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		email TEXT,
		section INTEGER NOT NULL,
		FOREIGN KEY (section) REFERENCES sections(id)
	);`
		).run()

		// fill in the sections
		for (let section of sections) {
			db.prepare(`INSERT INTO sections(name) VALUES (?)`).run(section)
		}

		const insertionQuery = db.prepare('INSERT INTO students(name, email, section) VALUES (?, ?, ?)')
		let totalStudents = 0

		for (const section of sections) {
			driver.get(`https://groups.google.com/u/1/a/itismeucci.com/g/studenti.${section.replace('-', '')}/members`)

			// need to change classnames when they rebuild google groups
			let emails = await driver.findElements({ className: 'p480bb Sq3iG' })
			let names = await driver.findElements({ className: 'LnLepd' })

			for (let i = 0; i < emails.length; i++) {
				let completeName = (await names[i].getText()).toLowerCase()
				let email = (await emails[i].getText()).toLowerCase()

				if (email.startsWith("provvisoria"))
					continue

				let sectionId = db.prepare('SELECT id FROM sections WHERE name = ?').get(section)

				insertionQuery.run(completeName, email, sectionId.id)
			}

			totalStudents += emails.length
			console.log(`Retrieved ${section} with ${emails.length} entries`)
		}

		// fix users with email instead of name in name field
		console.log("Fixed " + db.prepare(`
		UPDATE students
		SET name = SUBSTR(email, 0, INSTR(email, '.')) || SUBSTR(email, INSTR(email, '@'))
		WHERE name LIKE '%.%@itismeucci.com';
	`).run().changes + " occurrences")

		fs.renameSync(databaseFile, path.resolve(`${__dirname}/../storage/db.sqlite`))
		console.table([{ sections: sections.length, totalStudents }])
	})()