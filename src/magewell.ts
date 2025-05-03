export interface GetSettingsResponse extends BaseResponse {
	name: string
	passwd: number
	'is-settings': number
	'is-ssdp': number
	'is-startup': number
	'is-startup-rec': number
	'is-startup-live': number
	'is-signal-lost': number
	'is-hdmi-rec-ctrl': number
	softap: any
	'date-time': any
	'rec-control': any
	'video-color': any
	volume: any
	'rec-stream': number
	'live-stream': number
	'mws-stream': number
	'main-stream': any
	'sub-stream': any
	audio: any
	eth: any
	'stream-server': StreamServer[]
}

export interface StreamServer {
	id: number
	type: number
	url: string
	key: string
	'is-auth': number
	user: string
	passwd: string
	'is-use': number
	token: string
	'net-mode': number
	name: string
}

export interface GetStatusResponse extends BaseResponse {
	'cur-status': DeviceStatus
	'last-rec-status': number
	'cur-time': string
	'box-name': string
	'lock-user'?: null[] | null
	'rec-status': RecordingStatus
	'live-status': LiveStatus
	'upgrade-status': any
	'format-status': any
	'disk-test': any
	'living-test': any
	'check-upgrade': any
	'input-signal': InputSignal
	usb: any
	sd: any
	wifi: any
	eth: any
	mobile: any
	upgrade: any
	downgrade: any
}

export interface InputSignal {
	status: number
	cx: number
	cy: number
	interlaced: number
	'frame-rate': number
	'channel-valid': number
	'is-lpcm': number
	'bits-per-sample': number
	'sample-rate': number
}

export interface RecordingStatus {
	result: number
	'run-ms': number
	'cur-bps': number
	'avg-bps': number
	'client-id': string
}

export interface LiveStatus {
	result: number
	'run-ms': number
	'cur-bps': number
	'avg-bps': number
	net: number
	result2: number
	'cur-bps2': number
	net2: number
	'client-id': string
}

export interface BaseResponse {
	result: number
}

export const enum StreamServerType {
	RTMP = 0,
	Twitch = 1,
	YouTube = 2,
	Facebook = 3,
}

export const enum DeviceStatus {
	statusFirst = 0x01, // first boot
	statusRecord = 0x02, // recording
	statusLiving = 0x04, // live streaming
	statusStream = 0x08, // Reserved
	statusDiskReady = 0x10, // USB flash drive is ready to work
	statusRTMPReady = 0x20, // RTMP is ready to live stream
	statusSoftAP = 0x40, // The device is in Wi-Fi AP mode
	statusMIC = 0x100, // Reserved
	statusPHONE = 0x200, // Reserved
	statusOutput = 0x400, // Reserved
	statusDiskTest = 0x1000, // USB performance test is in progress
	statusBlue = 0x2000, // Reserved
	statusUpgrade = 0x4000, // Firmware update is in progress
	statusNetTest = 0x8000, // Streaming test is in progress
	statusPasswd = 0x10000, // Device password has been set
	statusOccupied = 0x20000, // Device has been locked by app(s), at most 2 simultaneously
	statusFormatDisk = 0x100000, // USB format is in progress
	statusSearchWifi = 0x400000, // The device is searching for available Wi-Fi networks
	statusConnectWifi = 0x800000, // The device is connecting to a Wi-Fi network
	statusConnectBlue = 0x1000000, // Reserved
	statusCheckUpgrade = 0x2000000, // The device is detecting if there is a new firmware version
	statusReset = 0x4000000, // resetting
	stausIPv6 = 0x8000000, // Reserved
	statusTestLock = 0x10000000, // Reserved
	statusReboot = 0x20000000, // rebooting
}

export const enum ApiResultCode {
	retLivingAuthErr = 30, // Live stream status: the authentication is error
	retLivingNotset = 29, // Live stream address is not set
	retLivingDNS = 28, // Live stream status: Resolving DNS
	retInit = 27, // Initial status
	retLivingAuthing = 25, // Live stream status: the authorization is in progress
	retLivingWaiting = 24, // Live stream status: the device is waiting for connection to the stream server
	retLivingConnecting = 23, // Live stream status: the device is connecting to the stream server
	retLivingConnected = 22, // Live stream status: the stream server has connected
	retPushReboot = 21,
	retAudioSignalChange = 20,
	retBlueWrite = 19,
	retBlueRead = 18,
	retBlueShutDown = 17,
	retDiskOn = 16,
	retDiskOff = 15,
	retDiskChange = 14,
	retSnapshotOver = 13,
	retPushReset = 12,
	retPushLiving = 11,
	retPushRecord = 10,
	retSignalChange = 9,
	retRouteChange = 8,
	retIPChange = 7,
	retNetChange = 6,
	retCancel = 5, // Request is canceled
	retLowSpace = 4, // There is not enough free space on the storage device.
	retLowSpeed = 3, // The storage device is too slow to record smooth video.
	retRunning = 2, // The request is running
	retRepeat = 1, // Repeat request
	retSucceed = 0, // Request has succeeded
	errPasswd = -1, // Password is error
	errOccupied = -2, // The device is being used by others currently
	errDisconnect = -3, // Reserved
	errDevice = -4,
	errDisk = -5,
	errUnconnect = -6,
	errKey = -7,
	errVersion = -8,
	errBusy = -9, // System is busy
	errParam = -10, // Error request parameters
	errUsage = -11, // Reserved
	errTimeout = -12,
	errIP = -13, // Reserved
	errNotFound = -14, // Data does not exist
	errFile = -15, // Error file
	errNoSpace = -16, // There is not any free space on the storage device.
	errNeedAuth = -17, // An authentication is required.
	errSystem = -18, // System error
	errDiskSpeed = -19,
	errEmpty = -20,
	errNetwork = -21,
	errEvent = -22,
	errCodec = -23,
	errBlue = -24,
	errNoUser = -25, // This user does not exist
	errSameName = -27, // The name already exists
	errString = -28, // Input characters are not valid
	errChannelsLimited = -29, // Stream simultaneously to 2 servers at most.
	err8MLimited = -30, // When the bitrate is 8 Mbps, the encoder can stream to 1 server only.
	errFacebookLimited = -31, // As is required by Facebook's Terms of Service, the device can not stream simultaneously to Facebook and other online streaming services.
	errCodecLimited = -32, // Live stream is not allowed when HEVC encoder is used.
	err4GLimited = -33, // The maximum size of a single saved recording file should be no more than 4G
	errMWFUnsupported = -34, // The update package does not match current model or hardware version of the product
}

export interface Duration {
	hours: number
	minutes: number
	seconds: number
}
