const scheduler = require('node-schedule')
const fs = require('fs')
module.exports = class Scheduler {
	jobs = []
	constructor(client) {
		const modules = fs.readdirSync(`${__dirname}/jobs`)

		for (const module of modules) {
			this.jobs.push(require(`${__dirname}/jobs/${module}`))
		}

		for (const job of this.jobs) {
			scheduler.scheduleJob(job.name, job.interval, async () => {
				job.execute(client)
			})
		}
	}
}
