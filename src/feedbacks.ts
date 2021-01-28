import { CompanionFeedbacks, CompanionFeedbackEvent, CompanionFeedbackResult, DropdownChoice } from "../../../instance_skel_types"
import InstanceSkel = require("../../../instance_skel")
import { MagewellConfig } from "./config"
import { DeviceStatus } from "./magewell"
import { MagewellState } from "./magewellstate"

export enum FeedbackId {
  Stream = 'stream',
  Record = 'record',
  Server = 'server',
}

export function GetFeedbacks(instance: InstanceSkel<MagewellConfig>, state: MagewellState): CompanionFeedbacks {
  return {
    [FeedbackId.Record]: {
      label: 'Change color based on Record status',
      description: 'If the device is recording change the color',
      options: [
        {
          type: 'colorpicker',
          label: 'Foreground color',
          id: 'fg',
          default: instance.rgb(255, 255, 255)
        },
        {
          type: 'colorpicker',
          label: 'Background color',
          id: 'bg',
          default: instance.rgb(222, 0, 0)
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        if (!state.status) return {};
        if ((state.status["cur-status"] & DeviceStatus.statusRecord) == DeviceStatus.statusRecord) {
          return {
            bgcolor: evt.options.bg as number,
            color: evt.options.fg as number
          }
        }
        return {};
      }
    },
    [FeedbackId.Stream]: {
      label: 'Change color based on Stream status',
      description: 'If the device is streaming change the color',
      options: [
        {
          type: 'colorpicker',
          label: 'Foreground color',
          id: 'fg',
          default: instance.rgb(255, 255, 255)
        },
        {
          type: 'colorpicker',
          label: 'Background color',
          id: 'bg',
          default: instance.rgb(222, 0, 0)
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        if (!state.status) return {};
        if ((state.status["cur-status"] & DeviceStatus.statusLiving) == DeviceStatus.statusLiving) {
          return {
            bgcolor: evt.options.bg as number,
            color: evt.options.fg as number
          }
        }
        return {};
      }
    },
    [FeedbackId.Server]: {
      label: 'Change color based on Streaming server status',
      description: 'If the streaming server is enabled change the color',
      options: [
        {
          type: 'dropdown',
          label: 'Server',
          id: 'server',
          default: state.settings?.["stream-server"][0]?.id ?? 1,
          choices: state.settings?.["stream-server"].map(s => <DropdownChoice>{
            id: s.id,
            label: s.name
          }) ?? []
        },
        {
          type: 'colorpicker',
          label: 'Foreground color',
          id: 'fg',
          default: instance.rgb(255, 255, 255)
        },
        {
          type: 'colorpicker',
          label: 'Background color',
          id: 'bg',
          default: instance.rgb(222, 0, 0)
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        if (!state.settings) return {};
        const selectedServer = +(evt.options.server ?? 1);
        const serverStatus = state.settings["stream-server"]?.find(s => s.id == selectedServer);
        if (serverStatus?.["is-use"] == 1) {
          return {
            bgcolor: evt.options.bg as number,
            color: evt.options.fg as number
          }
        }
        return {};
      }
    }
  }
}
