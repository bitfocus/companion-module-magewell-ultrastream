import { CompanionPresetDefinitions, DropdownChoice, InstanceBase, combineRgb } from '@companion-module/base'
import { MagewellConfig } from './config.js'
import { FeedbackId } from './feedbacks.js'
import { ActionId, ActionOperation } from './actions.js'
import { MagewellState } from './magewellstate.js'
import { MagewellProduct } from './magewell.js'

export interface PresetCache {
	StreamServers?: string
	Product?: MagewellProduct
}

export function UpdatePresetDefinitions(
	self: InstanceBase<MagewellConfig>,
	state: MagewellState,
	cache: PresetCache,
): void {
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

	self.setPresetDefinitions(presets)
	cache.StreamServers = serializedServerChoices
}
