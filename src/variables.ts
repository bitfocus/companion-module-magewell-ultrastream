import { CompanionVariableDefinition, InstanceBase } from '@companion-module/base'
import { MagewellState } from './magewellstate.js'
import { MagewellConfig } from './config.js'
import {
	DeviceStatus,
	Duration,
	MagewellProduct,
	UltraEncodeGetStatusResponse,
	UltraEncodeRtmpLiveStatus,
	UltraEncodeSrtListenerLiveStatus,
	UltraStreamGetStatusResponse,
} from './magewell.js'

export enum VariableId {
	ProductType = 'product_type',
	ModelType = 'model_type',
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

	variables.push({ variableId: VariableId.ProductType, name: 'Magewell Product Type (Ultra Stream vs Ultra Encode)' })
	variables.push({ variableId: VariableId.ModelType, name: 'Exact Magewell model name (e.g. Ultra Stream SDI)' })
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

	let streamRunMs = 0
	let recordRunMs = 0
	let mainBps = 0
	if (state.productType == MagewellProduct.UltraEncode) {
		const status = state.status as UltraEncodeGetStatusResponse
		const liveStatus = status['live-status']?.live?.length > 0 ? status['live-status'].live[0] : undefined
		if (liveStatus) {
			streamRunMs = liveStatus['run-ms']

			if ((<UltraEncodeRtmpLiveStatus>liveStatus)['inst-bps'] !== undefined) {
				mainBps = (<UltraEncodeRtmpLiveStatus>liveStatus)['inst-bps']
			} else if ((<UltraEncodeSrtListenerLiveStatus>liveStatus)['clients'] !== undefined) {
				const clients = (<UltraEncodeSrtListenerLiveStatus>liveStatus)['clients']
				if (clients.length > 0) {
					mainBps = clients[0]['inst-bps']
				} else {
					mainBps = 0
				}
			} else {
				mainBps = 0
			}
		}
		const recStatus = status['rec-status']?.rec?.length > 0 ? status['rec-status'].rec[0] : undefined
		if (recStatus) {
			recordRunMs = recStatus['run-ms']
		}
	} else if (state.productType == MagewellProduct.UltraStream) {
		const status = state.status as UltraStreamGetStatusResponse
		streamRunMs = status['live-status']['run-ms']
		recordRunMs = status['rec-status']['run-ms']
		mainBps = status['live-status']['cur-bps']
	}

	const streamDuration = formatDurationMilliseconds(streamRunMs)
	const recordDuration = formatDurationMilliseconds(recordRunMs)

	self.setVariableValues({
		[VariableId.ProductType]: state.productType ?? '',
		[VariableId.ModelType]: state.modelType ?? '',
		[VariableId.RecordStatus]:
			(state.status['cur-status'] & DeviceStatus.statusRecord) == <number>DeviceStatus.statusRecord
				? 'Recording'
				: 'Record',
		[VariableId.StreamStatus]:
			(state.status['cur-status'] & DeviceStatus.statusLiving) == <number>DeviceStatus.statusLiving
				? 'Streaming'
				: 'Stream',
		[VariableId.StreamBitrate]: (mainBps / 125000).toFixed(2),
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
