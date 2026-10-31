import { CompanionActionDefinitions, CompanionActionEvent, DropdownChoice } from '@companion-module/base'
import { MagewellClient } from './client.js'
import type { ModuleInstance } from './index.js'
import { DeviceStatus, MagewellProduct, UltraEncodeGetSettingsResponse } from './magewell.js'
import { hasStatusFlag, MagewellState } from './magewellstate.js'
import { BuildInputSourceItems, BuildMixerLocationItems, BuildRecChannelItems, BuildServerItems } from './utility.js'

export enum ActionId {
	Stream = 'stream',
	Record = 'record',
	Server = 'server',
	Input = 'input',
	Mixer = 'mixer',
	MixerFormat = 'mixer_format',
	RecChannel = 'rec_channel',
	Reboot = 'reboot',
}

export enum ActionOperation {
	StartEnable = 0,
	StopDisable = 1,
	Toggle = 2,
}

export interface ActionCache {
	StreamServers?: string
	InputSources?: string
	RecChannels?: string
	MixerLocations?: string
	Product?: MagewellProduct
}

export function UpdateActions(self: ModuleInstance, state: MagewellState, cache: ActionCache): void {
	const serverChoices: DropdownChoice[] = BuildServerItems(state)
	const inputChoices: DropdownChoice[] = BuildInputSourceItems(state)
	const recChannelChoices: DropdownChoice[] = BuildRecChannelItems(state)
	const mixerLocations: DropdownChoice[] = BuildMixerLocationItems(state)

	const serializedServerChoices = JSON.stringify(serverChoices)
	const serializedInputChoices = JSON.stringify(inputChoices)
	const serializedRecChannelChoices = JSON.stringify(recChannelChoices)
	const serializedMixerLocations = JSON.stringify(mixerLocations)
	if (
		cache.StreamServers === serializedServerChoices &&
		cache.InputSources === serializedInputChoices &&
		cache.RecChannels === serializedRecChannelChoices &&
		cache.MixerLocations === serializedMixerLocations &&
		cache.Product === state.productType
	) {
		// No need to update the action definitions if the choices and the product haven't changed
		return
	}

	const actions: CompanionActionDefinitions = {}

	actions[ActionId.Record] = {
		name: 'Start/Stop recording',
		options: [
			{
				type: 'dropdown',
				id: 'action',
				label: 'Action',
				default: ActionOperation.StartEnable,
				choices: [
					{ id: ActionOperation.StartEnable, label: 'Start' },
					{ id: ActionOperation.StopDisable, label: 'Stop' },
					{ id: ActionOperation.Toggle, label: 'Toggle' },
				],
			},
		],
		callback: async (event) => {
			record(self.client, event).catch((e) => self.log('error', 'Failed to execute action: ' + e))
		},
	}

	actions[ActionId.Stream] = {
		name: 'Start/Stop streaming',
		options: [
			{
				type: 'dropdown',
				id: 'action',
				label: 'Action',
				default: ActionOperation.StartEnable,
				choices: [
					{ id: ActionOperation.StartEnable, label: 'Start' },
					{ id: ActionOperation.StopDisable, label: 'Stop' },
					{ id: ActionOperation.Toggle, label: 'Toggle' },
				],
			},
		],
		callback: async (event) => {
			stream(self.client, event).catch((e) => self.log('error', 'Failed to execute action: ' + e))
		},
	}

	actions[ActionId.Server] = {
		name: 'Enable/Disable streaming server',
		options: [
			{
				type: 'dropdown',
				id: 'action',
				label: 'Action',
				default: ActionOperation.StartEnable,
				choices: [
					{ id: ActionOperation.StartEnable, label: 'Enable' },
					{ id: ActionOperation.StopDisable, label: 'Disable' },
					{ id: ActionOperation.Toggle, label: 'Toggle' },
				],
			},
			{
				type: 'dropdown',
				id: 'server',
				label: 'Server',
				default: serverChoices.length > 0 ? serverChoices[0].id : 1,
				choices: serverChoices,
			},
		],
		callback: async (event) => {
			server(self.client, event).catch((e) => self.log('error', 'Failed to execute action: ' + e))
		},
	}

	// Input source and mixer actions only for devices that report them in get-info (the Ultra Encode models).
	// The Ultra Stream API has neither select-input-source nor set-video-mixer-config.
	if (inputChoices.length > 0) {
		actions[ActionId.Input] = {
			name: 'Select input source',
			options: [
				{
					type: 'dropdown',
					id: 'input',
					label: 'Input Source',
					default: inputChoices.length > 0 ? inputChoices[0].id : 1,
					choices: inputChoices,
				},
			],
			callback: async (event) => {
				const selectedInput = +(event.options.input ?? 1)
				await self.client.selectInputSource(selectedInput)
			},
		}
	}

	if (state.mixerInfo) {
		actions[ActionId.Mixer] = {
			name: 'Change mixer settings',
			options: [
				// Numeric ids, like the mixer feedback and the presets. Buttons from before 1.1.1 may still
				// store the text '0' or '1': Companion matches dropdown values loosely (==), so they still show
				// the right choice, and the callback converts the value with +. No upgrade script needed.
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
			callback: async (event) => {
				const settings = (await self.client.getSettings()) as UltraEncodeGetSettingsResponse
				if (!settings || !settings['input-source']?.mixer) {
					self.log('error', 'Failed to get mixer settings')
					return
				}

				const format = settings['input-source'].mixer['input-device'] ?? 1
				const order = +(event.options.order ?? 0)
				const location = event.options.location ?? 'pip_1'
				const locationParts = (location + '').split('_')
				const type = locationParts.length > 0 && locationParts[0] === 'sbs' ? 1 : 0
				const locationId = locationParts.length > 1 ? parseInt(locationParts[1], 10) : 0
				await self.client.setVideoMixerConfig(format, order, type, locationId)
			},
		}

		actions[ActionId.MixerFormat] = {
			name: 'Change mixer format',
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
			callback: async (event) => {
				const format = +(event.options.format ?? 1)

				const settings = (await self.client.getSettings()) as UltraEncodeGetSettingsResponse
				if (!settings || !settings['input-source']?.mixer) {
					self.log('error', 'Failed to get mixer settings')
					return
				}

				const mixerSettings = settings['input-source'].mixer
				await self.client.setVideoMixerConfig(
					format,
					mixerSettings['is-hdmi-top'],
					mixerSettings.type,
					mixerSettings.location,
				)
			},
		}
	}

	// Only the Ultra Encode has record channels (USB, SD card or internal storage, NAS)
	if (state.productType == MagewellProduct.UltraEncode) {
		actions[ActionId.RecChannel] = {
			name: 'Enable/Disable record channel',
			description: 'Choose where to record to. This does not start or stop a recording.',
			options: [
				{
					type: 'dropdown',
					id: 'action',
					label: 'Action',
					default: ActionOperation.StartEnable,
					choices: [
						{ id: ActionOperation.StartEnable, label: 'Enable' },
						{ id: ActionOperation.StopDisable, label: 'Disable' },
						{ id: ActionOperation.Toggle, label: 'Toggle' },
					],
				},
				{
					type: 'dropdown',
					id: 'channel',
					label: 'Record channel',
					default: recChannelChoices.length > 0 ? recChannelChoices[0].id : 0,
					choices: recChannelChoices,
				},
			],
			callback: async (event) => {
				recChannel(self.client, event).catch((e) => self.log('error', 'Failed to execute action: ' + e))
			},
		}
	}

	actions[ActionId.Reboot] = {
		name: 'Reboot device',
		description: 'The device is unreachable for a few minutes while it restarts.',
		options: [],
		callback: async () => {
			self.client.reboot().catch((e) => self.log('error', 'Failed to execute action: ' + e))
		},
	}

	self.setActionDefinitions(actions)

	// uptdate cache
	cache.StreamServers = serializedServerChoices
	cache.InputSources = serializedInputChoices
	cache.RecChannels = serializedRecChannelChoices
	cache.MixerLocations = serializedMixerLocations
	cache.Product = state.productType
}

async function record(client: MagewellClient, action: CompanionActionEvent) {
	if (action.options.action == ActionOperation.StartEnable) {
		await client.startRecording()
	} else if (action.options.action == ActionOperation.StopDisable) {
		await client.stopRecording()
	} else {
		const status = await client.getStatus()
		if (status && hasStatusFlag(status['cur-status'], DeviceStatus.statusRecord)) {
			await client.stopRecording()
		} else {
			await client.startRecording()
		}
	}
}

async function stream(client: MagewellClient, action: CompanionActionEvent) {
	if (action.options.action == ActionOperation.StartEnable) {
		await client.startLive()
	} else if (action.options.action == ActionOperation.StopDisable) {
		await client.stopLive()
	} else {
		const status = await client.getStatus()
		if (status && hasStatusFlag(status['cur-status'], DeviceStatus.statusLiving)) {
			await client.stopLive()
		} else {
			await client.startLive()
		}
	}
}

async function recChannel(client: MagewellClient, action: CompanionActionEvent) {
	const selectedChannel = +(action.options.channel ?? 0)
	if (action.options.action == ActionOperation.StartEnable) {
		await client.enableRecChannel(selectedChannel)
	} else if (action.options.action == ActionOperation.StopDisable) {
		await client.disableRecChannel(selectedChannel)
	} else {
		const recChannels = await client.getRecChannels()
		if (recChannels) {
			if (recChannels['rec-channels'].find((c) => c.id == selectedChannel)?.['is-use'] == 1) {
				await client.disableRecChannel(selectedChannel)
			} else {
				await client.enableRecChannel(selectedChannel)
			}
		}
	}
}

async function server(client: MagewellClient, action: CompanionActionEvent) {
	const selectedServer = +(action.options.server ?? 1)
	if (action.options.action == ActionOperation.StartEnable) {
		await client.enableServer(selectedServer)
	} else if (action.options.action == ActionOperation.StopDisable) {
		await client.disableServer(selectedServer)
	} else {
		const settings = await client.getSettings()
		if (settings) {
			if (settings['stream-server'].find((s) => s.id == selectedServer)?.['is-use'] == 1) {
				await client.disableServer(selectedServer)
			} else {
				await client.enableServer(selectedServer)
			}
		}
	}
}
