import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type MagewellConfig } from './config.js'
import { UpdateVariableDefinitions, UpdateVariables } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { ActionCache, UpdateActions } from './actions.js'
import { FeedbackCache, UpdateFeedbacks } from './feedbacks.js'
import { MagewellClient } from './client.js'
import { MagewellState } from './magewellstate.js'
import { PresetCache, UpdatePresetDefinitions } from './presets.js'

export class ModuleInstance extends InstanceBase<MagewellConfig> {
	config!: MagewellConfig // Setup in init()
	client!: MagewellClient
	updater?: NodeJS.Timeout
	intervalQueryRunning: boolean = false
	intervalQueryFailures: number = 0
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
		this.config = config

		try {
			await this.client.disconnect()
		} catch {
			/* ignore */
		}

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

	async initMagewell(): Promise<void> {
		const status = await this.client.initialize()
		this.state.productType = this.client.getProductType()
		this.state.modelType = this.client.getModelType()
		this.state.inputSources = this.client.getInputSources()
		this.state.mixerInfo = this.client.getMixerInfo()
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

			const oldStatus = this.state.status
			this.state.status = status

			if (oldStatus?.['cur-status'] != status?.['cur-status']) {
				checkFeedbacks = true
			}

			UpdateVariables(this, this.state)

			// Don't query settings if the status is not available
			if (status) {
				const settings = await this.client.getSettings()
				const oldSettings = this.state.settings
				this.state.settings = settings

				this.updateActions()
				this.updateFeedbacks()
				this.updatePresetDefinitions()

				if (JSON.stringify(oldSettings) !== JSON.stringify(settings)) {
					// If settings changed, update the feedbacks
					checkFeedbacks = true
				}

				this.intervalQueryFailures = 0 // Reset failures on successful query
			} else {
				this.intervalQueryFailures += 1
			}

			if (checkFeedbacks) {
				this.checkFeedbacks()
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
