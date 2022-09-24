import { MagewellConfig } from "./config";
import axios from 'axios';
import { Md5 } from 'ts-md5';
import InstanceSkel = require("../../../instance_skel");
import { GetStatusResponse, BaseResponse, ApiResultCode, GetSettingsResponse } from "./magewell";

export class MagewellClient {
  private cookie?: string;
  private initializing: boolean = false;

  constructor(private instance: InstanceSkel<MagewellConfig>) {
  }

  private async get<T extends BaseResponse>(method: string, params?: string, retry: boolean = false): Promise<T | undefined> {
    const url = `http://${this.instance.config.host}/usapi?method=${method}` + (params ?? '');

    if (!this.cookie && !await this.initialize()) return;

    return await axios.get<T>(url, {
      headers: {
        Cookie: this.cookie!
      }
    }).catch(e => {
      this.instance.log('warn', method + ' call failed:' + e.response?.data.result);
    }).then(async result => {
      if (result == null) return;

      if (result.data.result != 0) {
        this.instance.log('warn', method + ' call failed:' + result.data.result);

        if (result.data.result == ApiResultCode.errNeedAuth || result.data.result == ApiResultCode.errPasswd) {
          // Auth error, try to reconnect
          if (!retry) {
            await this.initialize(true);
            return await this.get<T>(method, params, true);
          }
        }
      }
      return result.data;
    });
  }

  async initialize(force: boolean = false): Promise<GetStatusResponse | undefined> {
    if (this.initializing) return;
    this.initializing = true;

    try {
      if (this.cookie && !force) return;

      if (!this.instance.config.username || !this.instance.config.password || !this.instance.config.host) {
        this.instance.log('warn', 'Configuration not complete, missing username/password/host');
        this.instance.status(this.instance.STATUS_ERROR, 'Configuration incomplete');
        return;
      }

      this.instance.status(this.instance.STATUS_WARNING, 'Connecting');

      const password = Md5.hashStr(this.instance.config.password);
      return await axios.get(`http://${this.instance.config.host}/usapi?method=login&id=${this.instance.config.username}&pass=${password}`)
        .catch(() => {
          this.instance.log('warn', 'Authentication failed.');
          this.instance.status(this.instance.STATUS_ERROR, 'Authentication failed');
        }).then(async result => {
          if (result == null) return;

          if (result.data.result != 0) {
            this.instance.log('warn', 'Authentication failed.');
            this.instance.status(this.instance.STATUS_ERROR, 'Authentication failed');
            return;
          }

          this.cookie = (result.headers["set-cookie"] || [])[0];
          const status = await this.getStatus();

          if (status?.result != 0) {
            this.cookie = undefined;
            this.instance.status(this.instance.STATUS_ERROR, 'Status call failed');
            return;
          }

          this.instance.log('info', 'Connected to Magewell Ultra Stream');
          this.instance.status(this.instance.STATUS_OK, 'Connected');
          return status;
        });
    } finally {
      this.initializing = false;
    }
  }

  async getStatus(): Promise<GetStatusResponse | undefined> {
    return this.get<GetStatusResponse>('get-status');
  }

  async getSettings(): Promise<GetSettingsResponse | undefined> {
    return this.get<GetSettingsResponse>('get-settings');
  }

  async startRecording() {
    return this.get<BaseResponse>('start-rec');
  }

  async stopRecording() {
    return this.get<BaseResponse>('stop-rec');
  }

  async startLive() {
    return this.get<BaseResponse>('start-live');
  }

  async stopLive() {
    return this.get<BaseResponse>('stop-live');
  }

  async enableServer(server: number) {
    return this.get<BaseResponse>('enable-server', `&id=${server}&is-use=1`);
  }

  async disableServer(server: number) {
    return this.get<BaseResponse>('enable-server', `&id=${server}&is-use=0`);
  }

  async disconnect() {
    if (this.cookie) {
      await this.get<BaseResponse>('logout');
    }

    this.cookie = undefined;
  }
}
