const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const list = require('../storage/list.json')
const { client } = require('../index.js')

class Student {
	constructor(name, surname, section) {
		this.name = name
		this.surname = surname
		this.section = section
	}
}

function capitalizeFirstLetter(string) {
	return string[0].toUpperCase() + string.substring(1, string.length)
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('identifica')
		.setDescription('mostra informazioni riguardanti uno studente')
		.addStringOption((option) => option.setName('nome').setDescription('il nome dello studente'))
		.addStringOption((option) => option.setName('cognome').setDescription('il cognome dello studente'))
		.addStringOption((option) => option.setName('classe').setDescription('la classe dello studente')),
	async execute(interaction) {
		const requestedName = interaction.options.getString('nome')
		const requestedSurname = interaction.options.getString('cognome')
		const requestedSection = interaction.options.getString('classe')

		// Sanitize input
		if (requestedName) requestedName.replaceAll(' ', '').toLowerCase()
		if (requestedSurname) requestedSurname.replaceAll(' ', '').toLowerCase()

		const requestedStudent = new Student(requestedName, requestedSurname, requestedSection)

		let matches = []
		const foundStudents = []
		for (const className of Object.entries(list)) {
			for (const studentEmail of className[1]) {
				const studentSurname = studentEmail.split('.')[0]
				const studentName = studentEmail.split('.')[1].split('@')[0]
				const studentSection = className[0]
				const student = new Student(studentName, studentSurname, studentSection)

				/*
					Case to cover:

					1:
					class

					2:
					name
					surname

					3:
					name

					4:
					surname

					5:
					name
					class

					6:
					surname
					class
				*/

				//TODO: create an algorithm to search students properly

				// if (!requestedStudent.name && requestedStudent.surname == student.surname) {
				// 	foundStudents.push(new Student(student.name, student.surname, student.section))
				// } else if (!requestedStudent.surname && requestedStudent.name == student.name) {
				// 	foundStudents.push(new Student(student.name, student.surname, student.section))
				// } else if (
				// 	requestedStudent.name &&
				// 	requestedStudent.surname &&
				// 	requestedStudent.name == student.name &&
				// 	requestedStudent.surname == student.surname
				// ) {
				// 	foundStudents.push(new Student(student.name, student.surname, student.section))
				// } else if (requestedStudent.section == student.section) {
				// 	foundStudents.push(new Student(student.name, student.surname, student.section))
				// }

				// if (
				// 	(!requestedStudent.name && requestedStudent.surname == student.surname) ||
				// 	(!requestedStudent.surname && requestedStudent.name == student.name ) ||
				// 	(!requestedStudent.section && requestedStudent.name == student.section) ||
				// ) {
				// 	foundStudents.push(new Student(student.name, student.surname, student.section))
				// } else if (
				// 	requestedStudent.name == student.name ||
				// 	requestedStudent.surname == student.surname ||
				// 	requestedStudent.section == student.section
				// ) {
				// 	foundStudents.push(new Student(student.name, student.surname, student.section))
				// }
			}
		}

		// Embed building
		let embedColor = 'Orange'
		let results = ''
		let studentClass = ''
		for (const student of foundStudents) {
			if (student.section != studentClass) {
				studentClass = student.section

				results += `\n**${student.section}** \n`

				//TODO: fare output orario
			}

			results += `> ${capitalizeFirstLetter(student.name)} ${capitalizeFirstLetter(student.surname)}\n`
		}

		if (foundStudents.length == 0) {
			results = 'Nessuno studente trovato...'
			embedColor = 'Red'
		}

		const embed = new EmbedBuilder()
			.setColor({ embedColor })
			.setDescription(`**Lista Risultati (${foundStudents.length})**\n${results}`)

		await interaction.reply({ embeds: [embed] })
	}
}