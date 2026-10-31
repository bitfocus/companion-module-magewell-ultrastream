import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type MagewellConfig } from './config.js'
import { UpdateVariableDefinitions, UpdateVariables } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { ActionCache, UpdateActions } from './actions.js'
import { FeedbackCache, FeedbackId, UpdateFeedbacks } from './feedbacks.js'
import { MagewellClient } from './client.js'
import { MagewellState } from './magewellstate.js'
import { PresetCache, UpdatePresetDefinitions } from './presets.js'
import { MagewellProduct } from './magewell.js'

export class ModuleInstance extends InstanceBase<MagewellConfig> {
	config!: MagewellConfig // Setup in init()
	client!: MagewellClient
	updater?: NodeJS.Timeout
	intervalQueryRunning: boolean = false
	lastStatus?: { status: InstanceStatus; message: string | null }
	state: MagewellState = new MagewellState()
	actionCache: ActionCache = {}
	feedbackCache: FeedbackCache = {}
	presetCache: PresetCache = {}

	constructor(internal: unknown) {
		super(internal)

		this.client = new MagewellClient(this, () => this.config)
		this.state = new MagewellState()
	}

	async init(config: MagewellConfig): Promise<void> {
		this.config = config

		this.log('info', 'Initializing module')

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		this.updatePresetDefinitions() // export preset definitions

		this.initMagewell()
			.then(() => {
				/* ignore */
			})
			.catch(() => {
				this.updateStatus(InstanceStatus.ConnectionFailure, 'Failed to connect to device')
			})
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')

		if (this.updater) {
			clearInterval(this.updater)
			this.updater = undefined
		}

		this.client
			.disconnect()
			.then(() => {
				/* ignore */
			})
			.catch(() => {
				/* ignore */
			})
	}

	async configUpdated(config: MagewellConfig): Promise<void> {
		// Log out with the old config, so the logout goes to the device the session belongs to
		try {
			await this.client.disconnect()
		} catch {
			/* ignore */
		}

		// The host may now point to a different device, so start without anything from the old one
		this.config = config
		this.state.reset()

		try {
			await this.initMagewell()
		} catch (e) {
			this.updateStatus(InstanceStatus.ConnectionFailure, 'Failed to connect to device')
			this.log('error', 'Failed to connect to device: ' + e)
		}
	}

	getClient(): MagewellClient {
		return this.client
	}

	getConfig(): MagewellConfig {
		return this.config
	}

	// Only pass on changes: Companion writes a line to the connection log for every status update,
	// and the status is set again on every poll
	override updateStatus(status: InstanceStatus, message?: string | null): void {
		message = message ?? null
		if (this.lastStatus?.status === status && this.lastStatus.message === message) return

		this.lastStatus = { status, message }
		super.updateStatus(status, message)
	}

	async initMagewell(): Promise<void> {
		this.updateStatus(InstanceStatus.Connecting, 'Connecting')
		const status = await this.client.initialize()
		this.syncDeviceInfo()
		this.state.status = status

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		this.updatePresetDefinitions() // export preset definitions

		if (!this.updater && this.client.isConfigValid(this.config)) {
			// Only start interval, when not already started and config is valid.
			// If config is invalid, this code will run again when config is updated.
			this.intervalQueryRunning = false
			this.updater = setInterval(() => this.triggerQueryStatus(), 1000)
		}
	}

	// Copy device info (product, model, input sources, mixer) from the client into the state.
	// Returns true if anything changed, e.g. because the device was not reachable during init.
	syncDeviceInfo(): boolean {
		const productType = this.client.getProductType()
		const modelType = this.client.getModelType()
		const inputSources = this.client.getInputSources()
		const mixerInfo = this.client.getMixerInfo()

		const changed =
			this.state.productType !== productType ||
			this.state.modelType !== modelType ||
			JSON.stringify(this.state.inputSources) !== JSON.stringify(inputSources) ||
			JSON.stringify(this.state.mixerInfo) !== JSON.stringify(mixerInfo)

		this.state.productType = productType
		this.state.modelType = modelType
		this.state.inputSources = inputSources
		this.state.mixerInfo = mixerInfo

		return changed
	}

	triggerQueryStatus(): void {
		this.queryStatus()
			.then(() => {
				/* ignore */
			})
			.catch((reason) => {
				this.updateStatus(InstanceStatus.UnknownError, `Error querying device status: ${reason}`)
			})
	}

	async queryStatus(): Promise<void> {
		if (this.intervalQueryRunning) return

		let checkFeedbacks = false

		try {
			this.intervalQueryRunning = true

			const status = await this.client.getStatus()

			// The client logs in again on its own when the device becomes reachable later,
			// so pick up device info that was missing during init.
			if (this.syncDeviceInfo()) {
				this.updateVariableDefinitions()
				checkFeedbacks = true
			}

			const oldStatus = this.state.status
			const oldConditions = this.state.getStatusConditions()
			this.state.status = status

			if (oldStatus?.['cur-status'] != status?.['cur-status'] || oldConditions !== this.state.getStatusConditions()) {
				checkFeedbacks = true
			}

			UpdateVariables(this, this.state)

			// Don't query settings if the status is not available
			if (status) {
				const settings = await this.client.getSettings()
				const oldSettings = this.state.settings
				this.state.settings = settings

				// Record channels can also be switched in the web UI of the device, so poll them with the settings
				if (this.state.productType == MagewellProduct.UltraEncode) {
					const recChannels = (await this.client.getRecChannels())?.['rec-channels']
					if (JSON.stringify(recChannels) !== JSON.stringify(this.state.recChannels)) {
						checkFeedbacks = true
					}
					this.state.recChannels = recChannels
				}

				this.updateActions()
				this.updateFeedbacks()
				this.updatePresetDefinitions()

				if (JSON.stringify(oldSettings) !== JSON.stringify(settings)) {
					// If settings changed, update the feedbacks
					checkFeedbacks = true
				}

				// Failures are reported by the client, which knows whether the device did not answer or refused
				if (status.result == 0) {
					this.updateStatus(InstanceStatus.Ok, 'Connected')
				}
			}

			if (checkFeedbacks) {
				this.checkFeedbacks()
			} else if (this.state.productType == MagewellProduct.UltraEncode) {
				// The volume changes on every poll, unlike what the checks above look at
				this.checkFeedbacks(FeedbackId.Vumeters)
			}
		} finally {
			this.intervalQueryRunning = false
		}
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this, this.state, this.actionCache)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this, this.state, this.feedbackCache)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this, this.state)
	}

	updatePresetDefinitions(): void {
		UpdatePresetDefinitions(this, this.state, this.presetCache)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
