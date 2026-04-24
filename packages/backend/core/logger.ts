import { appendFile, mkdir, readdir, unlink } from 'node:fs/promises'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const LOGS_DIR = process.env.LOGS_DIR || './logs'
const COMMANDS_DIR = path.join(LOGS_DIR, 'commands')
const ERRORS_DIR = path.join(LOGS_DIR, 'errors')

mkdirSync(COMMANDS_DIR, { recursive: true })
mkdirSync(ERRORS_DIR, { recursive: true })

const LOG_FILENAME_RE = /^(\d{4}-\d{2}-\d{2})\.log$/

async function writeLine(dir: string, entry: Record<string, unknown>) {
	const file = path.join(dir, `${new Date().toISOString().slice(0, 10)}.log`)
	const line = JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n'

	try {
		await appendFile(file, line, 'utf8')
	} catch (err) {
		// Ensure directory exists in case it was deleted at runtime, then retry once.
		try {
			await mkdir(dir, { recursive: true })
			await appendFile(file, line, 'utf8')
		} catch (retryErr) {
			console.error('Logger failed to write:', retryErr)
		}
	}
}

export type CommandLogEntry = {
	event: 'sent' | 'result'
	commandId: string
	deviceCode?: string
	command?: string
	payload?: unknown
	result?: unknown
	error?: string
}

export function logCommand(entry: CommandLogEntry) {
	void writeLine(COMMANDS_DIR, entry)
}

export function logError(context: string, error: unknown, meta?: Record<string, unknown>) {
	const err = error instanceof Error
		? { message: error.message, stack: error.stack, name: error.name }
		: { message: String(error) }

	void writeLine(ERRORS_DIR, { context, ...(meta || {}), ...err })
}

export async function cleanupOldLogs(retentionDays: number) {
	const cutoff = new Date()
	cutoff.setUTCHours(0, 0, 0, 0)
	cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays)

	let deleted = 0
	for (const dir of [COMMANDS_DIR, ERRORS_DIR]) {
		let files: string[]
		try {
			files = await readdir(dir)
		} catch {
			continue
		}

		for (const file of files) {
			const match = LOG_FILENAME_RE.exec(file)
			if (!match) continue

			const fileDate = new Date(`${match[1]}T00:00:00Z`)
			if (fileDate < cutoff) {
				try {
					await unlink(path.join(dir, file))
					deleted++
				} catch {
					// ignore individual file failures
				}
			}
		}
	}
	return deleted
}
