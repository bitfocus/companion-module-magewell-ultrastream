import InstanceSkel = require("../../../instance_skel")
import { CompanionVariable } from "../../../instance_skel_types"
import { MagewellConfig } from "./config"
import { DeviceStatus, Duration } from "./magewell"
import { MagewellState } from "./magewellstate"

export function UpdateVariables(instance: InstanceSkel<MagewellConfig>, state: MagewellState): void {
  if (!state.status) return;
  instance.setVariable(`record_status`, (state.status["cur-status"] & DeviceStatus.statusRecord) == DeviceStatus.statusRecord ? 'Recording' : 'Record');
  instance.setVariable(`stream_status`, (state.status["cur-status"] & DeviceStatus.statusLiving) == DeviceStatus.statusLiving ? 'Streaming' : 'Stream');
  instance.setVariable(`stream_bitrate`, (state.status["live-status"]["cur-bps"] / 125000).toFixed(2));
  const streamDuration = formatDurationMilliseconds(state.status["live-status"]["run-ms"]);
  instance.setVariable(`stream_duration_hm`, streamDuration[0]);
  instance.setVariable(`stream_duration_hms`, streamDuration[1]);

  const recordDuration = formatDurationMilliseconds(state.status["rec-status"]["run-ms"]);
  instance.setVariable(`record_duration_hm`, recordDuration[0]);
  instance.setVariable(`record_duration_hms`, recordDuration[1]);
}

export function InitVariables(instance: InstanceSkel<MagewellConfig>, state: MagewellState): void {
  const variables: CompanionVariable[] = []

  variables.push({
    name: 'record_status',
    label: 'Current recording status: Recording/Record'
  });


  variables.push({
    name: 'stream_status',
    label: 'Current streaming status: Streaming/Stream'
  });


  variables.push({
    label: 'Streaming bitrate in Mb/s',
    name: 'stream_bitrate',
  });
  variables.push({
    label: 'Streaming duration (hh:mm)',
    name: 'stream_duration_hm',
  });
  variables.push({
    label: 'Streaming duration (hh:mm:ss)',
    name: 'stream_duration_hms',
  });

  variables.push({
    label: 'Recording duration (hh:mm)',
    name: 'record_duration_hm',
  });
  variables.push({
    label: 'Recording duration (hh:mm:ss)',
    name: 'record_duration_hms',
  });

  UpdateVariables(instance, state);

  instance.setVariableDefinitions(variables)
}

function formatDuration(durationObj: Duration | undefined): [string, string] {
	let durationLong = '00:00:00'
	let durationShort = '00:00'

	if (durationObj) {
		durationShort = `${pad(`${durationObj.hours}`, '0', 2)}:${pad(`${durationObj.minutes}`, '0', 2)}`
		durationLong = `${durationShort}:${pad(`${durationObj.seconds}`, '0', 2)}`
	}

	return [durationShort, durationLong]
}

function pad(str: string, prefix: string, len: number): string {
	while (str.length < len) {
		str = prefix + str
	}
	return str
}

function formatDurationMilliseconds(totalMilliseconds: number | undefined): [string, string] {
	let duration: Duration | undefined

	if (totalMilliseconds) {
		duration = {
			hours: 0,
			minutes: 0,
			seconds: 0
		}

    totalMilliseconds = Math.floor(totalMilliseconds / 1000);
		duration.seconds = totalMilliseconds % 60
		totalMilliseconds = Math.floor(totalMilliseconds / 60)
		duration.minutes = totalMilliseconds % 60
		totalMilliseconds = Math.floor(totalMilliseconds / 60)
		duration.hours = totalMilliseconds
	}

	return formatDuration(duration)
}
