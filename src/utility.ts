import { DropdownChoice } from '@companion-module/base'
import { MagewellState } from './magewellstate.js'
import { MagewellProduct, StorageMedium } from './magewell.js'

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

export function GetStorageMediumLabel(medium: StorageMedium): string {
	switch (medium) {
		case StorageMedium.Usb:
			return 'USB flash drive'
		case StorageMedium.Sd:
			return 'SD card / internal storage'
		case StorageMedium.Nas:
			return 'NAS'
		default:
			return `Storage ${medium}`
	}
}

export function BuildStorageItems(state: MagewellState): DropdownChoice[] {
	const media = [StorageMedium.Usb, StorageMedium.Sd]
	if (state.productType == MagewellProduct.UltraEncode) {
		media.push(StorageMedium.Nas)
	}
	return media.map((medium) => ({ id: medium, label: GetStorageMediumLabel(medium) }))
}

export function BuildRecChannelItems(state: MagewellState): DropdownChoice[] {
	const channels = state.recChannels ?? []
	return channels.map((channel) => {
		// Channels have no name, so tell channels with the same medium apart by their id
		const sameMedium = channels.filter((c) => c.type === channel.type).length > 1
		const label = GetStorageMediumLabel(channel.type)
		return { id: channel.id, label: sameMedium ? `${label} (${channel.id})` : label }
	})
}

export function BuildSignalInputItems(state: MagewellState): DropdownChoice[] {
	const items: DropdownChoice[] = [{ id: 'active', label: 'Active input' }]
	if (state.productType == MagewellProduct.UltraEncode) {
		items.push({ id: 'hdmi', label: 'HDMI' }, { id: 'sdi', label: 'SDI' })
	}
	return items
}
