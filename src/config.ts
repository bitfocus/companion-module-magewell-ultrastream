import { SomeCompanionConfigField } from "../../../instance_skel_types";
import InstanceSkel = require("../../../instance_skel");

export interface MagewellConfig {
  host?: string,
  username?: string,
  password?: string
}

export function GetConfigFields(self: InstanceSkel<MagewellConfig>): SomeCompanionConfigField[] {
  return [
    {
      type: 'text',
      id: 'info',
      width: 12,
      label: 'Information',
      value:
        'Should work with the SDI and HDMI models of the Magewell Ultra Stream.'
    },
    {
      type: 'textinput',
      id: 'host',
      label: 'Target IP',
      width: 6,
      regex: self.REGEX_IP
    },
    {
      type: 'textinput',
      id: 'username',
      label: 'Username',
      width: 12
    },
    {
      type: 'textinput',
      id: 'password',
      label: 'Password',
      width: 12
    }
  ]
}
