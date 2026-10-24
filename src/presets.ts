import { CompanionPresetDefinitions, DropdownChoice, InstanceBase, combineRgb } from '@companion-module/base'
import { MagewellConfig } from './config.js'
import { FeedbackId } from './feedbacks.js'
import { ActionId, ActionOperation } from './actions.js'
import { MagewellState } from './magewellstate.js'
import { MagewellProduct } from './magewell.js'
import {
	BuildInputSourceItems,
	BuildMixerLocationItems,
	BuildRecChannelItems,
	BuildServerItems,
	BuildSignalInputItems,
	BuildStorageItems,
} from './utility.js'

export interface PresetCache {
	StreamServers?: string
	InputSources?: string
	RecChannels?: string
	Product?: MagewellProduct
}

export function UpdatePresetDefinitions(
	self: InstanceBase<MagewellConfig>,
	state: MagewellState,
	cache: PresetCache,
): void {
	const serverChoices: DropdownChoice[] = BuildServerItems(state)
	const inputChoices: DropdownChoice[] = BuildInputSourceItems(state)
	const recChannelChoices: DropdownChoice[] = BuildRecChannelItems(state)

	const serializedServerChoices = JSON.stringify(serverChoices)
	const serializedInputChoices = JSON.stringify(inputChoices)
	const serializedRecChannelChoices = JSON.stringify(recChannelChoices)
	if (
		cache.StreamServers === serializedServerChoices &&
		cache.InputSources === serializedInputChoices &&
		cache.RecChannels === serializedRecChannelChoices &&
		cache.Product === state.productType
	) {
		// No need to update the preset definitions if the server choices and input choices haven't changed
		return
	}

	const presets: CompanionPresetDefinitions = {}
	presets['preset_stream'] = {
		type: 'button',
		category: 'Commands',
		name: 'Start/Stop stream',
		style: {
			text: 'LIVE',
			size: '18',
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(209, 209, 0),
		},
		feedbacks: [
			{
				feedbackId: FeedbackId.Stream,
				options: {},
				style: {
					bgcolor: combineRgb(222, 0, 0),
					color: combineRgb(255, 255, 255),
				},
			},
		],
		steps: [
			{
				down: [
					{
						actionId: ActionId.Stream,
						options: {
							action: ActionOperation.Toggle,
						},
					},
				],
				up: [],
			},
		],
	}

	presets['preset_record'] = {
		type: 'button',
		category: 'Commands',
		name: 'Start/Stop recording',
		style: {
			text: 'REC',
			size: '18',
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(209, 209, 0),
		},
		feedbacks: [
			{
				feedbackId: FeedbackId.Record,
				options: {},
				style: {
					bgcolor: combineRgb(222, 0, 0),
					color: combineRgb(255, 255, 255),
				},
			},
		],
		steps: [
			{
				down: [
					{
						actionId: ActionId.Record,
						options: {
							action: ActionOperation.Toggle,
						},
					},
				],
				up: [],
			},
		],
	}

	if (state.productType === MagewellProduct.UltraEncode) {
		presets['vumeter'] = {
			type: 'button',
			category: 'Status',
			name: 'Vumeter',
			style: {
				text: 'Volume',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.Vumeters,
					options: { threshold: 33 },
					style: {
						bgcolor: combineRgb(48, 234, 43),
					},
				},
				{
					feedbackId: FeedbackId.Vumeters,
					options: { threshold: 88 },
					style: {
						bgcolor: combineRgb(255, 246, 0),
					},
				},
				{
					feedbackId: FeedbackId.Vumeters,
					options: { threshold: 94 },
					style: {
						bgcolor: combineRgb(255, 63, 26),
					},
				},
			],
			steps: [],
		}
	}

	presets['preset_reboot'] = {
		type: 'button',
		category: 'Commands',
		name: 'Reboot device',
		style: {
			text: 'REBOOT',
			size: '14',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		feedbacks: [],
		steps: [
			{
				down: [{ actionId: ActionId.Reboot, options: {} }],
				up: [],
			},
		],
	}

	for (const input of BuildSignalInputItems(state)) {
		presets[`preset_signal_${input.id}`] = {
			type: 'button',
			category: 'Status',
			name: `Input signal: ${input.label}`,
			style: {
				text: input.id === 'active' ? 'SIGNAL' : `${input.label} SIGNAL`,
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.InputSignal,
					options: { input: input.id },
					style: {
						bgcolor: combineRgb(0, 153, 0),
						color: combineRgb(255, 255, 255),
					},
				},
			],
			steps: [],
		}
	}

	for (const medium of BuildStorageItems(state)) {
		presets[`preset_storage_${medium.id}`] = {
			type: 'button',
			category: 'Status',
			name: `Storage: ${medium.label}`,
			style: {
				text: medium.label,
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.Storage,
					options: { medium: medium.id },
					style: {
						bgcolor: combineRgb(0, 153, 0),
						color: combineRgb(255, 255, 255),
					},
				},
			],
			steps: [],
		}
	}

	for (const channel of recChannelChoices) {
		presets[`preset_rec_channel_${channel.id}`] = {
			type: 'button',
			category: 'Record channels',
			name: `Enable/Disable recording to ${channel.label}`,
			style: {
				text: `REC to ${channel.label}`,
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.RecChannel,
					options: { channel: channel.id },
					style: {
						bgcolor: combineRgb(222, 0, 0),
						color: combineRgb(255, 255, 255),
					},
				},
			],
			steps: [
				{
					down: [
						{
							actionId: ActionId.RecChannel,
							options: {
								action: ActionOperation.Toggle,
								channel: channel.id,
							},
						},
					],
					up: [],
				},
			],
		}
	}

	if (serverChoices.length > 0) {
		for (const server of serverChoices) {
			presets[`preset_server_${server.id}`] = {
				type: 'button',
				category: 'Servers',
				name: `Enable/Disable ${server.label}`,
				style: {
					text: `Enable ${server.label}`,
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				feedbacks: [
					{
						feedbackId: FeedbackId.Server,
						options: { server: server.id },
						style: {
							bgcolor: combineRgb(222, 0, 0),
							color: combineRgb(255, 255, 255),
							text: `Disable ${server.label}`,
						},
					},
				],
				steps: [
					{
						down: [
							{
								actionId: ActionId.Server,
								options: {
									action: ActionOperation.Toggle,
									server: server.id,
								},
							},
						],
						up: [],
					},
				],
			}
		}
	}

	if (inputChoices.length > 0) {
		for (const input of inputChoices) {
			presets[`preset_input_${input.id}`] = {
				type: 'button',
				category: 'Input',
				name: `Select ${input.label}`,
				style: {
					text: `Select ${input.label}`,
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				feedbacks: [
					{
						feedbackId: FeedbackId.Input,
						options: { input: input.id },
						style: {
							bgcolor: combineRgb(255, 255, 0),
							color: combineRgb(0, 0, 0),
						},
					},
				],
				steps: [
					{
						down: [
							{
								actionId: ActionId.Input,
								options: {
									input: input.id,
								},
							},
						],
						up: [],
					},
				],
			}
		}
	}

	if (state.mixerInfo) {
		presets['preset_mixer_format_1'] = {
			type: 'button',
			category: 'Mixer Format',
			name: 'Mixer format: SDI',
			style: {
				text: 'Mixer format: SDI',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.MixerFormat,
					options: {
						format: 1,
					},
					style: {
						bgcolor: combineRgb(255, 255, 0),
						color: combineRgb(0, 0, 0),
					},
				},
			],
			steps: [
				{
					down: [
						{
							actionId: ActionId.MixerFormat,
							options: {
								format: 1,
							},
						},
					],
					up: [],
				},
			],
		}

		presets['preset_mixer_format_2'] = {
			type: 'button',
			category: 'Mixer Format',
			name: 'Mixer format: HDMI',
			style: {
				text: 'Mixer format: HDMI',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.MixerFormat,
					options: {
						format: 2,
					},
					style: {
						bgcolor: combineRgb(255, 255, 0),
						color: combineRgb(0, 0, 0),
					},
				},
			],
			steps: [
				{
					down: [
						{
							actionId: ActionId.MixerFormat,
							options: {
								format: 2,
							},
						},
					],
					up: [],
				},
			],
		}

		const locationChoices = BuildMixerLocationItems(state)
		BuildMixerPreset(locationChoices, presets, 0, 'Mixer (SDI on top)')
		BuildMixerPreset(locationChoices, presets, 1, 'Mixer (HDMI on top)')
	}

	self.setPresetDefinitions(presets)
	cache.StreamServers = serializedServerChoices
	cache.InputSources = serializedInputChoices
	cache.RecChannels = serializedRecChannelChoices
	cache.Product = state.productType
}

function BuildMixerPreset(
	locationChoices: DropdownChoice[],
	presets: CompanionPresetDefinitions,
	order: number,
	category: string,
) {
	for (const location of locationChoices) {
		presets[`preset_mixer_${order}_${location.id}`] = {
			type: 'button',
			category: category,
			name: `${ReduceLabel(location.label)} ${order === 0 ? '(SDI)' : '(HDMI)'}`,
			style: {
				text: `${ReduceLabel(location.label)} ${order === 0 ? '(SDI)' : '(HDMI)'}`,
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.Mixer,
					options: {
						order: order,
						location: location.id,
					},
					style: {
						bgcolor: combineRgb(255, 255, 0),
						color: combineRgb(0, 0, 0),
					},
				},
			],
			steps: [
				{
					down: [
						{
							actionId: ActionId.Mixer,
							options: {
								order: order,
								location: location.id,
							},
						},
					],
					up: [],
				},
			],
		}
	}
}

function ReduceLabel(label: string): string {
	return label
		.replace(' Corner', '')
		.replace(' Thirds', '/3')
		.replace(' Third', '/3')
		.replace(' Fourths', '/4')
		.replace(' Fourth', '/4')
		.replace('One', '1')
		.replace('Two', '2')
		.replace('Three', '3')
		.replace('Four', '4')
		.replace('Half', '1/2')
}
