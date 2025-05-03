import { InstanceBase, combineRgb } from '@companion-module/base'
import { MagewellConfig } from './config.js'
import { FeedbackId } from './feedbacks.js'
import { ActionId, ActionOperation } from './actions.js'

export function UpdatePresetDefinitions(self: InstanceBase<MagewellConfig>): void {
	self.setPresetDefinitions({
		preset_stream: {
			type: 'button',
			category: 'Stream',
			name: 'Start/Stop stream',
			style: {
				text: 'LIVE',
				size: 'auto',
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(209, 209, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.Stream,
					options: {},
					style: {
						bgcolor: combineRgb(222, 0, 0),
						color: combineRgb(255, 255, 255),
					},
				},
			],
			steps: [
				{
					down: [
						{
							actionId: ActionId.Stream,
							options: {
								action: ActionOperation.Toggle,
							},
						},
					],
					up: [],
				},
			],
		},
		preset_record: {
			type: 'button',
			category: 'Record',
			name: 'Start/Stop recording',
			style: {
				text: 'REC',
				size: 'auto',
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(209, 209, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.Record,
					options: {},
					style: {
						bgcolor: combineRgb(222, 0, 0),
						color: combineRgb(255, 255, 255),
					},
				},
			],
			steps: [
				{
					down: [
						{
							actionId: ActionId.Record,
							options: {
								action: ActionOperation.Toggle,
							},
						},
					],
					up: [],
				},
			],
		},
	})
}
