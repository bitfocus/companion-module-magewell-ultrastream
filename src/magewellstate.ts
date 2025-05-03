import {
	DeviceStatus,
	GetSettingsResponse,
	GetStatusResponse,
	MagewellModel,
	MagewellProduct,
	StreamServer,
} from './magewell.js'

export class MagewellState {
	productType?: MagewellProduct
	modelType?: MagewellModel | string
	status?: GetStatusResponse
	settings?: GetSettingsResponse

	hasCurStatus(value: DeviceStatus): boolean {
		if (!this.status) return false
		return (this.status['cur-status'] & value) == <number>value
	}

	getServers(): StreamServer[] {
		if (!this.settings) return []
		return this.settings['stream-server'] || []
	}
}
