import { DropdownChoice } from '@companion-module/base'
import { MagewellState } from './magewellstate.js'

export function BuildMixerLocationItems(state: MagewellState): DropdownChoice[] {
	const items: DropdownChoice[] = []
	if (state.mixerInfo) {
		for (const pip of state.mixerInfo.pip) {
			items.push({
				id: `pip_${pip.value}`,
				label: `PIP: ${pip.name}`,
			})
		}
		for (const sbs of state.mixerInfo.sbs) {
			items.push({
				id: `sbs_${sbs.value}`,
				label: `SBS: ${sbs.name}`,
			})
		}
	}
	return items
}

export function BuildInputSourceItems(state: MagewellState): DropdownChoice[] {
	const items: DropdownChoice[] = []
	if (state.inputSources) {
		for (const source of state.inputSources) {
			items.push({
				id: source.value,
				label: source.name,
			})
		}
	}
	return items
}

export function BuildServerItems(state: MagewellState): DropdownChoice[] {
	const items: DropdownChoice[] = []
	if (state.settings) {
		for (const server of state.getServers()) {
			items.push({
				id: server.id,
				label: server.name,
			})
		}
	}
	return items
}
