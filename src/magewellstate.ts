import {
	DeviceStatus,
	GetSettingsResponse,
	GetStatusResponse,
	MagewellModel,
	MagewellProduct,
	NameValueElement,
	StreamServer,
	VideoMixerInfo,
} from './magewell.js'

// 'cur-status' is a mask of DeviceStatus flags, so test for the flag's bits rather than comparing values
export function hasStatusFlag(curStatus: number, flag: number): boolean {
	return (curStatus & flag) == flag
}

export class MagewellState {
	productType?: MagewellProduct
	modelType?: MagewellModel | string
	status?: GetStatusResponse
	settings?: GetSettingsResponse
	inputSources?: NameValueElement[]
	mixerInfo?: VideoMixerInfo

	hasCurStatus(value: DeviceStatus): boolean {
		if (!this.status) return false
		return hasStatusFlag(this.status['cur-status'], value)
	}

	getServers(): StreamServer[] {
		if (!this.settings) return []
		return this.settings['stream-server'] || []
	}
}
