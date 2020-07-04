import { CompanionPreset } from "../../../instance_skel_types";
import InstanceSkel = require("../../../instance_skel");
import { MagewellConfig } from "./config";
import { FeedbackId } from "./feedbacks";
import { ActionId } from "./actions";

export function GetPresets(instance: InstanceSkel<MagewellConfig>): CompanionPreset[] {
  return [{
    category: 'Stream',
    label: 'Start/Stop stream',
    bank: {
      style: 'text',
      text: 'LIVE',
      size: 'auto',
      color: instance.rgb(0, 0, 0),
      bgcolor: instance.rgb(209, 209, 0)
    },
    feedbacks: [
      {
        type: FeedbackId.Stream,
        options: {
        }
      }
    ],
    actions: [{
      action: ActionId.Stream,
      options: {
        action: 2 // toggle
      }
    }]
  }, 
  {
    category: 'Record',
    label: 'Start/Stop recording',
    bank: {
      style: 'text',
      text: 'REC',
      size: 'auto',
      color: instance.rgb(0, 0, 0),
      bgcolor: instance.rgb(209, 209, 0)
    },
    feedbacks: [
      {
        type: FeedbackId.Record,
        options: {
        }
      }
    ],
    actions: [{
      action: ActionId.Record,
      options: {
        action: 2 // toggle
      }
    }]
  }];
}
