import { DeviceStatus, GetSettingsResponse, GetStatusResponse, StreamServer } from './magewell.js'

export class MagewellState {
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
