import InstanceSkel = require('../../../instance_skel')
import { MagewellConfig, GetConfigFields } from './config';
import { CompanionSystem, CompanionInputField, CompanionActionEvent } from '../../../instance_skel_types';
import { HandleAction, GetActions } from './actions';
import { MagewellClient } from './client';
import { FeedbackId, GetFeedbacks } from './feedbacks';
import { MagewellState } from './magewellstate';
import { GetPresets } from './presets';
import { InitVariables, UpdateVariables } from './variables';

class MagewellInstance extends InstanceSkel<MagewellConfig> {
  private client: MagewellClient;
  private updater?: NodeJS.Timeout;
  private state: MagewellState;

  constructor(system: CompanionSystem, id: string, config: MagewellConfig) {
    super(system, id, config);

    this.client = new MagewellClient(this);
    this.state = new MagewellState();
  }

  init(): void {
    this.log('debug', 'Initializing Magewell');
    this.status(this.STATUS_UNKNOWN);

    this.initCompanion();
    this.initMagewell();
  }

  destroy(): void {
    if (this.updater) {
      clearInterval(this.updater);
      delete (this.updater);
    }

    this.client.disconnect().then(() => {
      this.status(this.STATUS_UNKNOWN, 'Disconnected');
    });
  }

  updateConfig(_config: MagewellConfig): void {
    this.config = _config;
    this.client.disconnect().then(() => {
      this.initMagewell();
    });
  }

  config_fields(): CompanionInputField[] {
    return GetConfigFields(this);
  }

  initMagewell() {
    return this.client.initialize().then(s => {
      this.state.status = s;
      if (!this.updater) {
        this.updater = setInterval(() => this.updateStatus(), 1000);
      }
    })
  }

  updateStatus() {
    this.client.getStatus().then(s => {
      const oldStatus = this.state.status;
      this.state.status = s;

      if (oldStatus?.["cur-status"] != s?.["cur-status"]) {
        // Current feedbacks only handle the cur-status
        this.checkFeedbacks();
      }

      UpdateVariables(this, this.state);
    });

    this.client.getSettings().then(s => {
      const oldSettings = this.state.settings;
      this.state.settings = s;

      this.updateActionsAndFeedbacks();

      if (oldSettings?.['stream-server'] != s?.['stream-server']) {
        var changed = false;
        s?.['stream-server'].forEach(streamServer => {
          const oldStatus = oldSettings?.['stream-server']?.find(ss => ss.id == streamServer.id);
          changed = changed || (oldStatus?.['is-use'] != streamServer['is-use']);
        });
        if (changed) {
          this.checkFeedbacks(FeedbackId.Server);
        }
      }
    });
  }

  updateActionsAndFeedbacks() {
    this.setActions(GetActions(this.state.settings));
    this.setFeedbackDefinitions(GetFeedbacks(this, this.state));
  }

  public action(action: CompanionActionEvent): void {
    HandleAction(this, this.client, action);
  }

  initCompanion() {
    this.updateActionsAndFeedbacks();
    this.setPresetDefinitions(GetPresets(this));
    this.checkFeedbacks();
    InitVariables(this, this.state);
  }
}
export = MagewellInstance
