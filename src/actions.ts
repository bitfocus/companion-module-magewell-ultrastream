import InstanceSkel = require("../../../instance_skel");
import { MagewellConfig } from "./config";
import { CompanionActionEvent, CompanionActions, DropdownChoice } from "../../../instance_skel_types";
import { MagewellClient } from "./client";
import { DeviceStatus, GetSettingsResponse } from "./magewell";

export enum ActionId {
  Stream = 'stream',
  Record = 'record',
  Server = 'server'
}

export function HandleAction(instance: InstanceSkel<MagewellConfig>, client: MagewellClient, action: CompanionActionEvent): void {
  try {
    switch (action.action) {
      case ActionId.Record:
        record(client, action).catch(e => instance.log('error', 'Failed to execute action: ' + e));
        break;
      case ActionId.Stream:
        stream(client, action).catch(e => instance.log('error', 'Failed to execute action: ' + e));
        break;
      case ActionId.Server:
        server(client, action).catch(e => instance.log('error', 'Failed to execute action: ' + e));
        break;
      default:
        return;
    }
  } catch (e) {
    instance.log('error', 'Failed to execute action: ' + e);
  }
}

export function GetActions(settings?: GetSettingsResponse): CompanionActions {
  return {
    [ActionId.Record]: {
      label: 'Start/Stop recording',
      options: [{
        type: 'dropdown',
        id: 'action',
        label: 'Action',
        default: 0,
        choices: [{
          id: 0,
          label: 'Start'
        }, {
          id: 1,
          label: 'Stop'
        }, {
          id: 2,
          label: 'Toggle'
        }]
      }]
    },
    [ActionId.Stream]: {
      label: 'Start/Stop streaming',
      options: [{
        type: 'dropdown',
        id: 'action',
        label: 'Action',
        default: 0,
        choices: [{
          id: 0,
          label: 'Start'
        }, {
          id: 1,
          label: 'Stop'
        }, {
          id: 2,
          label: 'Toggle'
        }]
      }]
    },
    [ActionId.Server]: {
      label: 'Enable/Disable streaming server',
      options: [{
        type: 'dropdown',
        id: 'action',
        label: 'Action',
        default: 0,
        choices: [{
          id: 0,
          label: 'Enable'
        }, {
          id: 1,
          label: 'Disable'
        }, {
          id: 2,
          label: 'Toggle'
        }]
      },
      {
        type: 'dropdown',
        id: 'server',
        label: 'Server',
        default: settings?.["stream-server"][0]?.id ?? 1,
        choices: settings?.["stream-server"].map(s => <DropdownChoice>{
          id: s.id,
          label: s.name
        }) ?? []
      }]
    }
  }
}

async function record(client: MagewellClient, action: CompanionActionEvent) {
  if (action.options.action == 0) {
    await client.startRecording();
  } else if (action.options.action == 1) {
    await client.stopRecording();
  } else {
    var status = await client.getStatus();
    if (status && (status["cur-status"] & DeviceStatus.statusRecord) == DeviceStatus.statusRecord) {
      await client.stopRecording();
    } else {
      await client.startRecording();
    }
  }
}

async function stream(client: MagewellClient, action: CompanionActionEvent) {
  if (action.options.action == 0) {
    await client.startLive();
  } else if (action.options.action == 1) {
    await client.stopLive();
  } else {
    var status = await client.getStatus();
    if (status && (status["cur-status"] & DeviceStatus.statusLiving) == DeviceStatus.statusLiving) {
      await client.stopLive();
    } else {
      await client.startLive();
    }
  }
}

async function server(client: MagewellClient, action: CompanionActionEvent) {
  const selectedServer = +(action.options.server ?? 1);
  if (action.options.action == 0) {
    await client.enableServer(selectedServer);
  } else if (action.options.action == 1) {
    await client.disableServer(selectedServer);
  } else {
    var settings = await client.getSettings();
    if (settings) {
      if (settings["stream-server"].find(s => s.id == selectedServer)?.["is-use"] == 1) {
        await client.disableServer(selectedServer);
      } else {
        await client.enableServer(selectedServer);
      }
    }
  }
}
