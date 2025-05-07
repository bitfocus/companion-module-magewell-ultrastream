import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type MagewellConfig } from './config.js'
import { UpdateVariableDefinitions, UpdateVariables } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { ActionCache, UpdateActions } from './actions.js'
import { FeedbackCache, FeedbackId, UpdateFeedbacks } from './feedbacks.js'
import { MagewellClient } from './client.js'
import { MagewellState } from './magewellstate.js'
import { UpdatePresetDefinitions } from './presets.js'

export class ModuleInstance extends InstanceBase<MagewellConfig> {
	config!: MagewellConfig // Setup in init()
	client!: MagewellClient
	updater?: NodeJS.Timeout
	intervalQueryRunning: boolean = false
	state: MagewellState = new MagewellState()
	actionCache: ActionCache = {}
	feedbackCache: FeedbackCache = {}

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
		this.state.status = status

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
			.catch(() => {
				this.updateStatus(InstanceStatus.UnknownError, 'Error querying device status')
			})
	}

	async queryStatus(): Promise<void> {
		if (this.intervalQueryRunning) return

		try {
			this.intervalQueryRunning = true

			const status = await this.client.getStatus()

			const oldStatus = this.state.status
			this.state.status = status

			if (oldStatus?.['cur-status'] != status?.['cur-status']) {
				// Current feedbacks only handle the cur-status
				this.checkFeedbacks()
			}

			UpdateVariables(this, this.state)

			// Don't query settings if the status is not available
			if (!status) return

			const settings = await this.client.getSettings()
			const oldSettings = this.state.settings
			this.state.settings = settings

			this.updateActions()
			this.updateFeedbacks()
			this.updatePresetDefinitions()

			if (oldSettings?.['stream-server'] != settings?.['stream-server']) {
				let changed = false
				settings?.['stream-server'].forEach((streamServer) => {
					const oldStatus = oldSettings?.['stream-server']?.find((ss) => ss.id == streamServer.id)
					changed = changed || oldStatus?.['is-use'] != streamServer['is-use']
				})
				if (changed) {
					this.checkFeedbacks(FeedbackId.Server)
				}
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
		UpdatePresetDefinitions(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
