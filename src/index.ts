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

		this.updateStatus(InstanceStatus.Ok)

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
		this.state.status = status

		if (!this.updater) {
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
		const status = await this.client.getStatus()

		const oldStatus = this.state.status
		this.state.status = status

		if (oldStatus?.['cur-status'] != status?.['cur-status']) {
			// Current feedbacks only handle the cur-status
			this.checkFeedbacks()
		}

		UpdateVariables(this, this.state)

		const settings = await this.client.getSettings()
		const oldSettings = this.state.settings
		this.state.settings = settings

		this.updateActions()
		this.updateFeedbacks()

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
