import { CompanionFeedbacks, CompanionFeedbackEvent, CompanionFeedbackResult } from "../../../instance_skel_types"
import InstanceSkel = require("../../../instance_skel")
import { MagewellConfig } from "./config"
import { DeviceStatus } from "./magewell"
import { MagewellState } from "./magewellstate"

export enum FeedbackId {
  Stream = 'stream',
  Record = 'record'
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
    }
  }
}
