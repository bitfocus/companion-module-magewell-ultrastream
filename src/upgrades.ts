import type { CompanionStaticUpgradeScript } from '@companion-module/base'
import { CreateConvertToBooleanFeedbackUpgradeScript } from '@companion-module/base'
import type { MagewellConfig } from './config.js'
import { FeedbackId } from './feedbacks.js'

const upgradeToBooleanFeedbacks = CreateConvertToBooleanFeedbackUpgradeScript<MagewellConfig>({
	[FeedbackId.Stream]: true,
	[FeedbackId.Record]: true,
	[FeedbackId.Server]: true,
})

export const UpgradeScripts: CompanionStaticUpgradeScript<MagewellConfig>[] = [
	/*
	 * Place your upgrade scripts here
	 * Remember that once it has been added it cannot be removed!
	 */
	// function (context, props) {
	// 	return {
	// 		updatedConfig: null,
	// 		updatedActions: [],
	// 		updatedFeedbacks: [],
	// 	}
	// },
	upgradeToBooleanFeedbacks,
]
