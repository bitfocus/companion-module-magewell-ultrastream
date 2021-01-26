import { GetSettingsResponse, GetStatusResponse } from "./magewell";

export class MagewellState {
  status?: GetStatusResponse;
  settings?: GetSettingsResponse;
}
