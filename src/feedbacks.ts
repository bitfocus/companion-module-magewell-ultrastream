import {
	combineRgb,
	CompanionFeedbackDefinitions,
	CompanionFeedbackInfo,
	DropdownChoice,
	InstanceBase,
} from '@companion-module/base'
import { MagewellConfig } from './config.js'
import { MagewellState } from './magewellstate.js'
import { DeviceStatus, MagewellProduct } from './magewell.js'

export enum FeedbackId {
	Stream = 'stream',
	Record = 'record',
	Server = 'server',
	Vumeters = 'vumeters',
}

export interface FeedbackCache {
	StreamServers?: string
	Product?: MagewellProduct
}

export function UpdateFeedbacks(self: InstanceBase<MagewellConfig>, state: MagewellState, cache: FeedbackCache): void {
	const serverChoices: DropdownChoice[] = state.getServers().map(
		(s) =>
			<DropdownChoice>{
				id: s.id,
				label: s.name,
			},
	)

	const serializedServerChoices = JSON.stringify(serverChoices)
	if (cache.StreamServers === serializedServerChoices && cache.Product === state.productType) {
		// No need to update the action definitions if the server choices haven't changed
		return
	}

	const feedbacks: CompanionFeedbackDefinitions = {}

	feedbacks[FeedbackId.Record] = {
		name: 'Change color based on Record status',
		type: 'boolean',
		description: 'If the device is recording change the color',
		defaultStyle: {
			bgcolor: combineRgb(222, 0, 0),
			color: combineRgb(255, 255, 255),
		},
		options: [],
		callback: () => state.hasCurStatus(DeviceStatus.statusRecord),
	}

	feedbacks[FeedbackId.Stream] = {
		name: 'Change color based on Stream status',
		type: 'boolean',
		description: 'If the device is streaming change the color',
		defaultStyle: {
			bgcolor: combineRgb(222, 0, 0),
			color: combineRgb(255, 255, 255),
		},
		options: [],
		callback: () => state.hasCurStatus(DeviceStatus.statusLiving),
	}

	feedbacks[FeedbackId.Server] = {
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
	}

	if (state.productType === MagewellProduct.UltraEncode) {
		feedbacks[FeedbackId.Vumeters] = {
			name: 'Change color based on volume',
			type: 'boolean',
			description: 'If the volume is above a certain level change the color',
			defaultStyle: {
				bgcolor: combineRgb(222, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'number',
					label: 'Threshold',
					id: 'threshold',
					default: 30,
					min: 0,
					max: 98,
					required: true,
					range: true,
					step: 1,
				},
			],
			callback: (evt: CompanionFeedbackInfo) => {
				if (!state.status) return false
				if (!('vumeters' in state.status)) return false
				const maxVolume = state.status.vumeters.reduce((acc, v) => Math.max(acc, v))
				return maxVolume > Number(evt.options.threshold)
			},
		}
	} else {
		feedbacks[FeedbackId.Vumeters] = undefined
	}

	self.setFeedbackDefinitions(feedbacks)
	cache.StreamServers = serializedServerChoices
	cache.Product = state.productType
}
