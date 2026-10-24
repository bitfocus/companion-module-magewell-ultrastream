import {
	DeviceStatus,
	DiskInfo,
	DiskValid,
	GetSettingsResponse,
	GetStatusResponse,
	InputSignal,
	InputSignalStatus,
	MagewellModel,
	MagewellProduct,
	NameValueElement,
	RecordChannel,
	StorageMedium,
	StreamServer,
	UltraEncodeGetStatusResponse,
	UltraStreamGetStatusResponse,
	VideoMixerInfo,
} from './magewell.js'

// 'cur-status' is a mask of DeviceStatus flags, so test for the flag's bits rather than comparing values
export function hasStatusFlag(curStatus: number, flag: number): boolean {
	return (curStatus & flag) == flag
}

// The active input, or one of the inputs of an Ultra Encode (each model reports only the inputs it has)
export type SignalInput = 'active' | 'hdmi' | 'sdi'

export class MagewellState {
	productType?: MagewellProduct
	modelType?: MagewellModel | string
	status?: GetStatusResponse
	settings?: GetSettingsResponse
	inputSources?: NameValueElement[]
	mixerInfo?: VideoMixerInfo
	recChannels?: RecordChannel[]

	hasCurStatus(value: DeviceStatus): boolean {
		if (!this.status) return false
		return hasStatusFlag(this.status['cur-status'], value)
	}

	getServers(): StreamServer[] {
		if (!this.settings) return []
		return this.settings['stream-server'] || []
	}

	getInputSignal(input: SignalInput): InputSignal | undefined {
		const signal: InputSignalStatus | undefined = this.status?.['input-signal']
		return input === 'active' ? signal : signal?.[input]
	}

	hasInputSignal(input: SignalInput): boolean {
		// The API docs don't list the values of status, but it is 0 without a signal
		const status = this.getInputSignal(input)?.status
		return status !== undefined && status != 0
	}

	getStorage(medium: StorageMedium): DiskInfo | undefined {
		if (!this.status) return undefined
		if (this.productType == MagewellProduct.UltraEncode) {
			const status = this.status as UltraEncodeGetStatusResponse
			return status['disk-info']?.find((disk) => disk['disk-type'] === medium)
		}

		// An Ultra Stream reports USB and SD card separately, and has no NAS
		const status = this.status as UltraStreamGetStatusResponse
		if (medium === StorageMedium.Usb) return status.usb
		if (medium === StorageMedium.Sd) return status.sd
		return undefined
	}

	isStorageReady(medium: StorageMedium): boolean {
		const storage = this.getStorage(medium)
		return storage !== undefined && hasStatusFlag(storage['disk-status'], DiskValid)
	}

	isRecChannelEnabled(id: number): boolean {
		return this.recChannels?.find((channel) => channel.id == id)?.['is-use'] == 1
	}

	// Feedback conditions that come from the status besides cur-status, to tell whether feedbacks need a check
	getStatusConditions(): string {
		const inputs: SignalInput[] = ['active', 'hdmi', 'sdi']
		const media = [StorageMedium.Usb, StorageMedium.Sd, StorageMedium.Nas]
		return JSON.stringify([
			inputs.map((input) => this.hasInputSignal(input)),
			media.map((medium) => this.isStorageReady(medium)),
		])
	}
}
