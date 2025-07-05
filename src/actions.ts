import { CompanionActionDefinitions, CompanionActionEvent, DropdownChoice } from '@companion-module/base'
import { MagewellClient } from './client.js'
import type { ModuleInstance } from './index.js'
import { DeviceStatus, UltraEncodeGetSettingsResponse } from './magewell.js'
import { MagewellState } from './magewellstate.js'
import { BuildInputSourceItems, BuildMixerLocationItems, BuildServerItems } from './utility.js'

export enum ActionId {
	Stream = 'stream',
	Record = 'record',
	Server = 'server',
	Input = 'input',
	Mixer = 'mixer',
	MixerFormat = 'mixer_format',
}

export enum ActionOperation {
	StartEnable = 0,
	StopDisable = 1,
	Toggle = 2,
}

export interface ActionCache {
	StreamServers?: string
	InputSources?: string
}

export function UpdateActions(self: ModuleInstance, state: MagewellState, cache: ActionCache): void {
	const serverChoices: DropdownChoice[] = BuildServerItems(state)
	const inputChoices: DropdownChoice[] = BuildInputSourceItems(state)

	const serializedServerChoices = JSON.stringify(serverChoices)
	const serializedInputChoices = JSON.stringify(inputChoices)
	if (cache.StreamServers === serializedServerChoices && cache.InputSources === serializedInputChoices) {
		// No need to update the action definitions if the server choices and input choices haven't changed
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

	const mixerLocations = BuildMixerLocationItems(state)
	actions[ActionId.Mixer] = {
		name: 'Change mixer settings',
		options: [
			{
				type: 'dropdown',
				id: 'order',
				label: 'Layer Order',
				default: '0',
				choices: [
					{ id: '1', label: 'HDMI on top' },
					{ id: '0', label: 'SDI on top' },
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

	self.setActionDefinitions(actions)

	// uptdate cache
	cache.StreamServers = serializedServerChoices
	cache.InputSources = serializedInputChoices
}

async function record(client: MagewellClient, action: CompanionActionEvent) {
	if (action.options.action == ActionOperation.StartEnable) {
		await client.startRecording()
	} else if (action.options.action == ActionOperation.StopDisable) {
		await client.stopRecording()
	} else {
		const status = await client.getStatus()
		if (status && (status['cur-status'] & DeviceStatus.statusRecord) == <number>DeviceStatus.statusRecord) {
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
		if (status && (status['cur-status'] & DeviceStatus.statusLiving) == <number>DeviceStatus.statusLiving) {
			await client.stopLive()
		} else {
			await client.startLive()
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
