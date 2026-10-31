import {
	combineRgb,
	CompanionFeedbackDefinitions,
	CompanionFeedbackInfo,
	DropdownChoice,
	InstanceBase,
} from '@companion-module/base'
import { MagewellConfig } from './config.js'
import { MagewellState, SignalInput } from './magewellstate.js'
import {
	DeviceStatus,
	MagewellProduct,
	StorageMedium,
	UltraEncodeGetSettingsResponse,
	UltraEncodeGetStatusResponse,
} from './magewell.js'
import {
	BuildInputSourceItems,
	BuildMixerLocationItems,
	BuildRecChannelItems,
	BuildServerItems,
	BuildSignalInputItems,
	BuildStorageItems,
} from './utility.js'

export enum FeedbackId {
	Stream = 'stream',
	Record = 'record',
	Server = 'server',
	Input = 'input',
	Mixer = 'mixer',
	MixerFormat = 'mixer_format',
	Vumeters = 'vumeters',
	InputSignal = 'input_signal',
	Storage = 'storage',
	RecChannel = 'rec_channel',
}

export interface FeedbackCache {
	StreamServers?: string
	Product?: MagewellProduct
	InputSources?: string
	RecChannels?: string
	MixerInfo?: string
}

export function UpdateFeedbacks(self: InstanceBase<MagewellConfig>, state: MagewellState, cache: FeedbackCache): void {
	const serverChoices: DropdownChoice[] = BuildServerItems(state)
	const inputChoices: DropdownChoice[] = BuildInputSourceItems(state)
	const recChannelChoices: DropdownChoice[] = BuildRecChannelItems(state)
	const mixerLocations: DropdownChoice[] = BuildMixerLocationItems(state)

	const serializedServerChoices = JSON.stringify(serverChoices)
	const serializedInputChoices = JSON.stringify(inputChoices)
	const serializedRecChannelChoices = JSON.stringify(recChannelChoices)
	// Compare the mixer info, not the locations: without a mixer and with an empty one they are both empty
	const serializedMixerInfo = JSON.stringify(state.mixerInfo)
	if (
		cache.StreamServers === serializedServerChoices &&
		cache.InputSources === serializedInputChoices &&
		cache.RecChannels === serializedRecChannelChoices &&
		cache.MixerInfo === serializedMixerInfo &&
		cache.Product === state.productType
	) {
		// No need to update the feedback definitions if the server choices and input choices haven't changed
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
					state.settings?.['stream-server'].map((s) => ({
						id: s.id,
						label: s.name,
					})) ?? [],
			},
		],
		callback: (evt: CompanionFeedbackInfo) => {
			if (!state.settings) return false
			const selectedServer = +(evt.options.server ?? 1)
			const serverStatus = state.settings['stream-server']?.find((s) => s.id == selectedServer)
			return serverStatus?.['is-use'] == 1
		},
	}

	// Input source and mixer feedbacks only for devices that report them in get-info (the Ultra Encode models)
	if (inputChoices.length > 0) {
		feedbacks[FeedbackId.Input] = {
			name: 'Change color based on selected Input Source',
			type: 'boolean',
			description: 'If the input source is active change the color',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Input Source',
					id: 'input',
					default: inputChoices.length > 0 ? inputChoices[0].id : 1,
					choices: inputChoices,
				},
			],
			callback: (evt: CompanionFeedbackInfo) => {
				if (state.productType != MagewellProduct.UltraEncode) return false

				const status = state.status as UltraEncodeGetStatusResponse
				const selectedInput = +(evt.options.input ?? 1)
				return status && status['input-source'] === selectedInput
			},
		}
	} else {
		feedbacks[FeedbackId.Input] = undefined
	}

	if (state.mixerInfo) {
		feedbacks[FeedbackId.Mixer] = {
			name: 'Change color based on Mixer settings',
			type: 'boolean',
			description: 'If the mixer settings match the selected options change the color',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					id: 'order',
					label: 'Layer Order',
					default: 0,
					choices: [
						{ id: 1, label: 'HDMI on top' },
						{ id: 0, label: 'SDI on top' },
					],
				},
				{
					type: 'dropdown',
					id: 'location',
					label: 'Location',
					default: mixerLocations.length > 0 ? mixerLocations[0].id : 'pip_1',
					choices: mixerLocations,
				},
			],
			callback: (evt: CompanionFeedbackInfo) => {
				const order = +(evt.options.order ?? 0)
				const location = evt.options.location ?? 'pip_1'
				const locationParts = (location + '').split('_')
				const type = locationParts.length > 0 && locationParts[0] === 'sbs' ? 1 : 0
				const locationId = locationParts.length > 1 ? parseInt(locationParts[1], 10) : 0

				const settings = state.settings as UltraEncodeGetSettingsResponse
				if (!settings || !settings['input-source'] || !settings['input-source'].mixer) return false
				const mixerSettings = settings['input-source']?.mixer
				return (
					mixerSettings &&
					mixerSettings['is-hdmi-top'] === order &&
					mixerSettings['type'] === type &&
					mixerSettings['location'] === locationId
				)
			},
		}

		feedbacks[FeedbackId.MixerFormat] = {
			name: 'Change color based on Mixer format',
			type: 'boolean',
			description: 'If the mixer format matches the selected options change the color',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					id: 'format',
					label: 'Format',
					default: 1,
					choices: [
						{ id: 1, label: 'same as SDI input' },
						{ id: 2, label: 'same as HDMI input' },
					],
				},
			],
			callback: (evt: CompanionFeedbackInfo) => {
				const format = +(evt.options.format ?? 1)
				const settings = state.settings as UltraEncodeGetSettingsResponse
				if (!settings || !settings['input-source'] || !settings['input-source'].mixer) return false
				const mixerSettings = settings['input-source']?.mixer
				return mixerSettings && mixerSettings['input-device'] === format
			},
		}
	} else {
		feedbacks[FeedbackId.Mixer] = undefined
		feedbacks[FeedbackId.MixerFormat] = undefined
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

	const signalInputChoices = BuildSignalInputItems(state)
	feedbacks[FeedbackId.InputSignal] = {
		name: 'Change color based on Input signal',
		type: 'boolean',
		description: 'If there is a signal on the input change the color',
		defaultStyle: {
			bgcolor: combineRgb(0, 153, 0),
			color: combineRgb(255, 255, 255),
		},
		options: [
			{
				type: 'dropdown',
				label: 'Input',
				id: 'input',
				default: 'active',
				choices: signalInputChoices,
			},
		],
		callback: (evt: CompanionFeedbackInfo) => state.hasInputSignal((evt.options.input ?? 'active') as SignalInput),
	}

	const storageChoices = BuildStorageItems(state)
	feedbacks[FeedbackId.Storage] = {
		name: 'Change color based on Storage status',
		type: 'boolean',
		description: 'If the storage medium is connected and ready change the color',
		defaultStyle: {
			bgcolor: combineRgb(0, 153, 0),
			color: combineRgb(255, 255, 255),
		},
		options: [
			{
				type: 'dropdown',
				label: 'Storage',
				id: 'medium',
				default: StorageMedium.Usb,
				choices: storageChoices,
			},
		],
		callback: (evt: CompanionFeedbackInfo) => state.isStorageReady(+(evt.options.medium ?? StorageMedium.Usb)),
	}

	if (state.productType == MagewellProduct.UltraEncode) {
		feedbacks[FeedbackId.RecChannel] = {
			name: 'Change color based on Record channel status',
			type: 'boolean',
			description: 'If the record channel is enabled change the color',
			defaultStyle: {
				bgcolor: combineRgb(222, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Record channel',
					id: 'channel',
					default: recChannelChoices.length > 0 ? recChannelChoices[0].id : 0,
					choices: recChannelChoices,
				},
			],
			callback: (evt: CompanionFeedbackInfo) => state.isRecChannelEnabled(+(evt.options.channel ?? 0)),
		}
	} else {
		feedbacks[FeedbackId.RecChannel] = undefined
	}

	self.setFeedbackDefinitions(feedbacks)
	cache.StreamServers = serializedServerChoices
	cache.Product = state.productType
	cache.InputSources = serializedInputChoices
	cache.RecChannels = serializedRecChannelChoices
	cache.MixerInfo = serializedMixerInfo
}
