import { DefaultTimeout, MagewellConfig } from './config.js'
import axios, { AxiosResponse } from 'axios'
import { createHash } from 'crypto'
import {
	GetStatusResponse,
	BaseResponse,
	ApiResultCode,
	GetSettingsResponse,
	GetInfoResponse,
	MagewellProduct,
	MagewellModel,
	NameValueElement,
	UltraEncodeGetInfoResponse,
	VideoMixerInfo,
} from './magewell.js'
import { InstanceBase, InstanceStatus } from '@companion-module/base'

export class MagewellClient {
	private cookie?: string
	private initializing: boolean = false
	private authState?: boolean

	private productType?: MagewellProduct
	private modelType?: MagewellModel | string
	private inputSources?: NameValueElement[]
	private mixerInfo?: VideoMixerInfo

	constructor(
		private instance: InstanceBase<MagewellConfig>,
		private getConfig: () => MagewellConfig,
	) {}

	private async get<T extends BaseResponse>(
		method: string,
		params?: string,
		retry: boolean = false,
	): Promise<T | undefined> {
		const config = this.getConfig()
		const url = `http://${config.host}/usapi?method=${method}` + (params ?? '')

		if (!this.cookie) {
			const initResult = await this.initialize()
			if (!initResult) {
				return
			}
		}

		let result: AxiosResponse<T | any> | undefined = undefined
		try {
			result = await axios.get<T>(url, {
				headers: { Cookie: this.cookie },
				signal: AbortSignal.timeout(config.timeout ?? DefaultTimeout),
			})
		} catch (e: any) {
			this.instance.log('warn', `${method} call failed: ${e.response?.data.result}`)
		}

		if (!result) {
			this.instance.log('debug', `Missing result for ${method}`)
			return
		}

		if (result.data.result != 0) {
			if (
				result.data.result == <number>ApiResultCode.errNeedAuth ||
				result.data.result == <number>ApiResultCode.errPasswd
			) {
				// Auth error, try to reconnect
				if (!retry) {
					this.instance.log(
						'warn',
						`${method} call failed with authentication error: ${result.data.result} - performing re init`,
					)

					await this.initialize(true)
					return await this.get<T>(method, params, true)
				} else {
					this.instance.log(
						'warn',
						`${method} call failed consecutively with authentication error: ${result.data.result}`,
					)
				}
			} else {
				this.instance.log('warn', `${method} call failed: ${result.data.result}`)
			}
		}

		return result.data
	}

	getProductType(): MagewellProduct | undefined {
		return this.productType
	}

	getModelType(): MagewellModel | string | undefined {
		return this.modelType
	}

	getInputSources(): NameValueElement[] | undefined {
		return this.inputSources
	}

	getMixerInfo(): VideoMixerInfo | undefined {
		return this.mixerInfo
	}

	isConfigValid(config: MagewellConfig): boolean {
		return !(!config.username || !config.password || !config.host)
	}

	async initialize(force: boolean = false): Promise<GetStatusResponse | undefined> {
		if (this.initializing) return
		this.initializing = true

		const config = this.getConfig()

		try {
			if (this.cookie && !force) return

			if (!this.isConfigValid(config)) {
				this.instance.log('warn', 'Configuration not complete, missing username/password/host')
				this.instance.updateStatus(InstanceStatus.BadConfig, 'Configuration incomplete')
				return
			}

			this.instance.updateStatus(InstanceStatus.Connecting, 'Connecting')

			const passwordHash = createHash('md5')
				.update(<string>config.password)
				.digest('hex')

			try {
				const url = `http://${config.host}/usapi?method=login&id=${config.username}&pass=${passwordHash}`
				const result = await axios.get(url, { signal: AbortSignal.timeout(config.timeout ?? DefaultTimeout) })
				if (!result) return

				if (result.data.result != 0) {
					if (this.authState !== false) {
						// If we already tried to authenticate and failed, we don't want to log again
						this.instance.log('warn', 'Authentication failed.')
					}
					this.instance.updateStatus(InstanceStatus.ConnectionFailure, 'Authentication failed')
					this.authState = false
					return
				}

				// store login cookie
				this.cookie = (result.headers['set-cookie'] || [])[0]
				this.authState = true

				const info = await this.getInfo()

				// decode product and model type
				if (info?.result == 0) {
					const product = info?.product['product-name']
					this.productType = (Object.values(MagewellProduct) as string[]).includes(product)
						? (product as MagewellProduct)
						: undefined
					this.modelType = info?.product['module-name']

					const inputSource =
						(info as any)['input-source'] !== undefined
							? (info as UltraEncodeGetInfoResponse)['input-source']
							: undefined
					if (inputSource && inputSource.sources && Array.isArray(inputSource.sources)) {
						this.inputSources = inputSource.sources.map((source) => ({
							name: source.name,
							value: source.value,
						}))
						this.instance.log('debug', `${JSON.stringify(this.inputSources)}`)
					}
					if (inputSource && inputSource['video-mixer']) {
						this.mixerInfo = inputSource['video-mixer']
					}
				}

				// get status
				const status = await this.getStatus()

				if (status?.result != 0) {
					this.cookie = undefined
					this.instance.updateStatus(InstanceStatus.UnknownError, 'Status call failed')
					return
				}

				this.instance.log('info', `Connected to Magewell ${this.modelType ?? 'Ultra Stream'}`)
				this.instance.updateStatus(InstanceStatus.Ok, 'Connected')
				return status
			} catch (e) {
				this.instance.log('warn', 'Authentication failed.')
				this.instance.log('debug', 'Exception: ' + e)
				this.instance.updateStatus(InstanceStatus.ConnectionFailure, 'Authentication failed')
				return
			}
		} finally {
			this.initializing = false
		}
	}

	async getInfo(): Promise<GetInfoResponse | undefined> {
		return this.get<GetInfoResponse>('get-info')
	}

	async getStatus(): Promise<GetStatusResponse | undefined> {
		return this.get<GetStatusResponse>('get-status')
	}

	async getSettings(): Promise<GetSettingsResponse | undefined> {
		return this.get<GetSettingsResponse>('get-settings')
	}

	async selectInputSource(input: number): Promise<BaseResponse | undefined> {
		return this.get<BaseResponse>('select-input-source', `&input-source=${input}`)
	}

	async setVideoMixerConfig(
		inputDevice: number,
		isHdmiTop: number,
		type: number,
		location: number,
	): Promise<BaseResponse | undefined> {
		return this.get<BaseResponse>(
			'set-video-mixer-config',
			`&input-device=${inputDevice}&is-hdmi-top=${isHdmiTop}&type=${type}&location=${location}`,
		)
	}

	async startRecording(): Promise<BaseResponse | undefined> {
		return this.get<BaseResponse>('start-rec')
	}

	async stopRecording(): Promise<BaseResponse | undefined> {
		return this.get<BaseResponse>('stop-rec')
	}

	async startLive(): Promise<BaseResponse | undefined> {
		return this.get<BaseResponse>('start-live')
	}

	async stopLive(): Promise<BaseResponse | undefined> {
		return this.get<BaseResponse>('stop-live')
	}

	async enableServer(server: number): Promise<BaseResponse | undefined> {
		return this.get<BaseResponse>('enable-server', `&id=${server}&is-use=1`)
	}

	async disableServer(server: number): Promise<BaseResponse | undefined> {
		return this.get<BaseResponse>('enable-server', `&id=${server}&is-use=0`)
	}

	async disconnect(): Promise<void> {
		if (this.cookie) {
			await this.get<BaseResponse>('logout')
		}

		this.cookie = undefined
	}
}
