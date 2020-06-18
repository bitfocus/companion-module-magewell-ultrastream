import InstanceSkel = require('../../../instance_skel')
import { MagewellConfig, GetConfigFields } from './config';
import { CompanionSystem, CompanionInputField, CompanionActionEvent } from '../../../instance_skel_types';
import { HandleAction, GetActions } from './actions';
import { MagewellClient } from './client';
import { GetFeedbacks } from './feedbacks';
import { MagewellState } from './magewellstate';
import { GetPresets } from './presets';

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
        this.updater = setInterval(() => this.updateStatus(), 1000 * 5);
      }
    })
  }

  updateStatus() {
    this.client.getStatus().then(s => {
      this.state.status = s;
      this.checkFeedbacks();
    });
  }

  public action(action: CompanionActionEvent): void {
    HandleAction(this, this.client, action);
  }

  initCompanion() {
    this.setActions(GetActions());
    this.setFeedbackDefinitions(GetFeedbacks(this, this.state));
    this.setPresetDefinitions(GetPresets(this));
    this.checkFeedbacks();
  }
}
export = MagewellInstance
