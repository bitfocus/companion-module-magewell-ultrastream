import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface MagewellConfig {
	host?: string
	username?: string
	password?: string
	timeout?: number
}

export const DefaultTimeout: number = 5000

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			regex: Regex.IP,
		},
		{
			type: 'textinput',
			id: 'username',
			label: 'Username',
			width: 12,
			default: 'Admin',
		},
		{
			type: 'textinput',
			id: 'password',
			label: 'Password',
			width: 12,
			default: 'Admin',
		},
		{
			type: 'number',
			id: 'timeout',
			label: 'Request timeout (ms)',
			default: DefaultTimeout,
			min: 200,
			max: 30000,
			width: 6,
		},
	]
}
