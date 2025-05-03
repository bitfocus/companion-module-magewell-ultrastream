import { GetSettingsResponse, GetStatusResponse } from './magewell.js'

export class MagewellState {
	status?: GetStatusResponse
	settings?: GetSettingsResponse
}
