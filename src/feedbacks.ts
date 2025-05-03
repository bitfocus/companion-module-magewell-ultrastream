import { combineRgb, CompanionFeedbackInfo, DropdownChoice, InstanceBase } from '@companion-module/base'
import { MagewellConfig } from './config.js'
import { MagewellState } from './magewellstate.js'
import { DeviceStatus } from './magewell.js'

export enum FeedbackId {
	Stream = 'stream',
	Record = 'record',
	Server = 'server',
}

export function UpdateFeedbacks(self: InstanceBase<MagewellConfig>, state: MagewellState): void {
	self.setFeedbackDefinitions({
		[FeedbackId.Record]: {
			name: 'Change color based on Record status',
			type: 'boolean',
			description: 'If the device is recording change the color',
			defaultStyle: {
				bgcolor: combineRgb(222, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				if (!state.status) return false
				return (state.status['cur-status'] & DeviceStatus.statusRecord) == <number>DeviceStatus.statusRecord
			},
		},
		[FeedbackId.Stream]: {
			name: 'Change color based on Stream status',
			type: 'boolean',
			description: 'If the device is streaming change the color',
			defaultStyle: {
				bgcolor: combineRgb(222, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				if (!state.status) return false
				return (state.status['cur-status'] & DeviceStatus.statusLiving) == <number>DeviceStatus.statusLiving
			},
		},
		[FeedbackId.Server]: {
			name: 'Change color based on Streaming server status',
			type: 'boolean',
			description: 'If the streaming server is enabled change the color',
			defaultStyle: {
				bgcolor: combineRgb(222, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Server',
					id: 'server',
					default: state.settings?.['stream-server'][0]?.id ?? 1,
					choices:
						state.settings?.['stream-server'].map(
							(s) =>
								<DropdownChoice>{
									id: s.id,
									label: s.name,
								},
						) ?? [],
				},
			],
			callback: (evt: CompanionFeedbackInfo) => {
				if (!state.settings) return false
				const selectedServer = +(evt.options.server ?? 1)
				const serverStatus = state.settings['stream-server']?.find((s) => s.id == selectedServer)
				return serverStatus?.['is-use'] == 1
			},
		},
	})
}
