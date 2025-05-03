import { CompanionVariableDefinition, InstanceBase } from '@companion-module/base'
import { MagewellState } from './magewellstate.js'
import { MagewellConfig } from './config.js'
import { DeviceStatus, Duration } from './magewell.js'

export enum VariableId {
	RecordStatus = 'record_status',
	StreamStatus = 'stream_status',
	StreamBitrate = 'stream_bitrate',
	StreamDurationHM = 'stream_duration_hm',
	StreamDurationHMS = 'stream_duration_hms',
	RecordDurationHM = 'record_duration_hm',
	RecordDurationHMS = 'record_duration_hms',
}

export function UpdateVariableDefinitions(self: InstanceBase<MagewellConfig>, state: MagewellState): void {
	const variables: CompanionVariableDefinition[] = []

	variables.push({ variableId: VariableId.RecordStatus, name: 'Current recording status: Recording/Record' })
	variables.push({ variableId: VariableId.StreamStatus, name: 'Current streaming status: Streaming/Stream' })
	variables.push({ variableId: VariableId.StreamBitrate, name: 'Streaming bitrate in Mb/s' })
	variables.push({ variableId: VariableId.StreamDurationHM, name: 'Streaming duration (hh:mm)' })
	variables.push({ variableId: VariableId.StreamDurationHMS, name: 'Streaming duration (hh:mm:ss)' })
	variables.push({ variableId: VariableId.RecordDurationHM, name: 'Recording duration (hh:mm)' })
	variables.push({ variableId: VariableId.RecordDurationHMS, name: 'Recording duration (hh:mm:ss)' })

	self.setVariableDefinitions(variables)

	UpdateVariables(self, state)
}

export function UpdateVariables(self: InstanceBase<MagewellConfig>, state: MagewellState): void {
	if (!state.status) return

	const streamDuration = formatDurationMilliseconds(state.status['live-status']['run-ms'])
	const recordDuration = formatDurationMilliseconds(state.status['rec-status']['run-ms'])

	self.setVariableValues({
		[VariableId.RecordStatus]:
			(state.status['cur-status'] & DeviceStatus.statusRecord) == <number>DeviceStatus.statusRecord
				? 'Recording'
				: 'Record',
		[VariableId.StreamStatus]:
			(state.status['cur-status'] & DeviceStatus.statusLiving) == <number>DeviceStatus.statusLiving
				? 'Streaming'
				: 'Stream',
		[VariableId.StreamBitrate]: (state.status['live-status']['cur-bps'] / 125000).toFixed(2),
		[VariableId.StreamDurationHM]: streamDuration[0],
		[VariableId.StreamDurationHMS]: streamDuration[1],
		[VariableId.RecordDurationHM]: recordDuration[0],
		[VariableId.RecordDurationHMS]: recordDuration[1],
	})
}

function formatDuration(durationObj: Duration | undefined): [string, string] {
	let durationLong = '00:00:00'
	let durationShort = '00:00'

	if (durationObj) {
		durationShort = `${pad(`${durationObj.hours}`, '0', 2)}:${pad(`${durationObj.minutes}`, '0', 2)}`
		durationLong = `${durationShort}:${pad(`${durationObj.seconds}`, '0', 2)}`
	}

	return [durationShort, durationLong]
}

function pad(str: string, prefix: string, len: number): string {
	while (str.length < len) {
		str = prefix + str
	}
	return str
}

function formatDurationMilliseconds(totalMilliseconds: number | undefined): [string, string] {
	let duration: Duration | undefined

	if (totalMilliseconds) {
		duration = {
			hours: 0,
			minutes: 0,
			seconds: 0,
		}

		totalMilliseconds = Math.floor(totalMilliseconds / 1000)
		duration.seconds = totalMilliseconds % 60
		totalMilliseconds = Math.floor(totalMilliseconds / 60)
		duration.minutes = totalMilliseconds % 60
		totalMilliseconds = Math.floor(totalMilliseconds / 60)
		duration.hours = totalMilliseconds
	}

	return formatDuration(duration)
}
