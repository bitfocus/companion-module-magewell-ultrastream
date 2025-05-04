import { CompanionActionDefinitions, CompanionActionEvent, DropdownChoice } from '@companion-module/base'
import { MagewellClient } from './client.js'
import type { ModuleInstance } from './index.js'
import { DeviceStatus } from './magewell.js'
import { MagewellState } from './magewellstate.js'

export enum ActionId {
	Stream = 'stream',
	Record = 'record',
	Server = 'server',
}

export enum ActionOperation {
	StartEnable = 0,
	StopDisable = 1,
	Toggle = 2,
}

export interface ActionCache {
	StreamServers?: string
}

export function UpdateActions(self: ModuleInstance, state: MagewellState, cache: ActionCache): void {
	const serverChoices: DropdownChoice[] = state.getServers().map(
		(s) =>
			<DropdownChoice>{
				id: s.id,
				label: s.name,
			},
	)

	const serializedServerChoices = JSON.stringify(serverChoices)
	if (cache.StreamServers === serializedServerChoices) {
		// No need to update the action definitions if the server choices haven't changed
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

	self.setActionDefinitions(actions)

	// uptdate cache
	cache.StreamServers = serializedServerChoices
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
