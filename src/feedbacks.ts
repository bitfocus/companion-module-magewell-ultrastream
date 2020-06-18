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
          label: 'Color Live',
          id: 'color_live',
          default: instance.rgb(222, 0, 0)
        },
        {
          type: 'colorpicker',
          label: 'Color Ready',
          id: 'color_ready',
          default: instance.rgb(209, 209, 0)
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        if (!state.status) return {};
        if ((state.status["cur-status"] & DeviceStatus.statusRecord) == DeviceStatus.statusRecord) {
          return {
            bgcolor: Number(evt.options.color_live)
          }
        } else {
          return {
            bgcolor: Number(evt.options.color_ready)
          }
        }
      }
    },
    [FeedbackId.Stream]: {
      label: 'Change color based on Stream status',
      description: 'If the device is streaming change the color',
      options: [
        {
          type: 'colorpicker',
          label: 'Color Live',
          id: 'color_live',
          default: instance.rgb(222, 0, 0)
        },
        {
          type: 'colorpicker',
          label: 'Color Ready',
          id: 'color_ready',
          default: instance.rgb(209, 209, 0)
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        if (!state.status) return {};
        if ((state.status["cur-status"] & DeviceStatus.statusLiving) == DeviceStatus.statusLiving) {
          return {
            bgcolor: Number(evt.options.color_live)
          }
        } else {
          return {
            bgcolor: Number(evt.options.color_ready)
          }
        }
      }
    }
  }
}
