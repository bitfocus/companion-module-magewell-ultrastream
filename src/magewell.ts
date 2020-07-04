declare module Magewell {
  export interface GetStatusResponse extends BaseResponse {
    "cur-status": number;
    "last-rec-status": number;
    "cur-time": string;
    "box-name": string;
    "lock-user"?: (null)[] | null;
    "rec-status": any;
    "live-status": any;
    "upgrade-status": any;
    "format-status": any;
    "disk-test": any;
    "living-test": any;
    "check-upgrade": any;
    "input-signal": any;
    usb: any;
    sd: any;
    wifi: any;
    eth: any;
    mobile: any;
    upgrade: any;
    downgrade: any;
  }

  export interface BaseResponse {
    result: number;
  }

  export const enum DeviceStatus {
    statusFirst = 0x01,      // first boot
    statusRecord = 0x02,      // recording
    statusLiving = 0x04,      // live streaming
    statusStream = 0x08,      // Reserved
    statusDiskReady = 0x10,      // USB flash drive is ready to work
    statusRTMPReady = 0x20,      // RTMP is ready to live stream
    statusSoftAP = 0x40,      // The device is in Wi-Fi AP mode
    statusMIC = 0x100,     // Reserved
    statusPHONE = 0x200,     // Reserved
    statusOutput = 0x400,     // Reserved
    statusDiskTest = 0x1000,    // USB performance test is in progress 
    statusBlue = 0x2000,    // Reserved
    statusUpgrade = 0x4000,    // Firmware update is in progress
    statusNetTest = 0x8000,    // Streaming test is in progress
    statusPasswd = 0x10000,   // Device password has been set
    statusOccupied = 0x20000,   // Device has been locked by app(s), at most 2 simultaneously 
    statusFormatDisk = 0x100000,  // USB format is in progress
    statusSearchWifi = 0x400000,  // The device is searching for available Wi-Fi networks
    statusConnectWifi = 0x800000,  // The device is connecting to a Wi-Fi network
    statusConnectBlue = 0x1000000, // Reserved
    statusCheckUpgrade = 0x2000000, // The device is detecting if there is a new firmware version
    statusReset = 0x4000000,   // resetting 
    stausIPv6 = 0x8000000,   // Reserved
    statusTestLock = 0x10000000,  // Reserved
    statusReboot = 0x20000000,  // rebooting
  }
}

export = Magewell;
