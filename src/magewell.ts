export enum MagewellModel {
	UltraStreamHdmi = 'Ultra Stream HDMI',
	UltraStreamSdi = 'Ultra Stream SDI',
	UltraEncodeHdmi = 'Ultra Encode HDMI',
	UltraEncodeSdi = 'Ultra Encode SDI',
	UltraEncodeHdmiPlus = 'Ultra Encode HDMI Plus',
	UltraEncodeSdiPlus = 'Ultra Encode SDI Plus',
	UltraEncodeAio = 'Ultra Encode AIO',
}

export enum MagewellProduct {
	UltraStream = 'Ultra Stream',
	UltraEncode = 'Ultra Encode',
}

export interface NameValueElement {
	name: string
	value: number
}

export type GetInfoResponse = BaseGetInfoResponse | UltraEncodeGetInfoResponse

export interface BaseGetInfoResponse extends BaseResponse {
	product: Product
}

export interface UltraEncodeGetInfoResponse extends BaseGetInfoResponse {
	'input-source': InputSourceInfo
}

export interface Product {
	sn: string
	'product-id': number
	'hardware-ver': string
	'firmware-id': number
	'firmware-ver-s': string
	'factory-firmware-ver-s': string
	'product-name': MagewellProduct | string
	'module-name': MagewellModel | string
	'manu-name': string
	features: number
	'max-lock-count': number
}

export interface InputSourceInfo {
	sources: NameValueElement[]
	'video-mixer': VideoMixerInfo
}

export interface VideoMixerInfo {
	types: NameValueElement[]
	pip: NameValueElement[]
	sbs: NameValueElement[]
}

export type GetSettingsResponse = UltraStreamGetSettingsResponse | UltraEncodeGetSettingsResponse

export interface UltraStreamGetSettingsResponse extends BaseResponse {
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
	'stream-server': UltraStreamStreamServer[]
}

export interface UltraEncodeGetSettingsResponse extends BaseResponse {
	name: string // device name
	'is-check-update': number // enable status of auto-check online update
	'audio-sync-offset': number // audio offset in ms
	'udp-mtu': number // UDP MTU
	'enable-ndi-hx3': number // NDI|HX3 enable status
	softap: any // AP settings
	'date-time': any // value of date and time
	'input-source': InputSourceSetting // input source value
	'video-color': any // video information
	volume: any // audio information
	'enable-deinterlace': number // deinterlace enable status
	'3d-output': any // 3D output settings
	'main-stream': any // main stream settings
	'sub-stream': any // sub stream settings
	audio: any // audio settings
	'audio-streams': [] // ÒôÆµÂëÁ÷ÁÐ±í
	eth: any // Ethernet information
	wifi: any // Wi-Fi information
	rndis: any // USB NET information
	'stream-server': UltraEncodeStreamServer[] // streaming server list
	'video-input-format': any // input video format
	'video-output-format': any // output video format
	'use-nosignal-file': 1 // whether to show an image when there is no input signal
	'nosignal-files': [] // no signal images list
	nas: [] // NAS list
	'send-file-cloud': [] // Upload server list
	web: any // Web security management and theme configuration information
	rec: any // record settings
	living: any // live settings
	'lcd-control': any // LCD screen settings
}

export interface InputSourceSetting {
	source: number
	mixer: {
		'input-device': number
		'is-hdmi-top': number
		type: number
		location: number
	}
}

export interface StreamServer {
	id: number
	type: number
	'is-use': number
	name: string
}

export interface UltraStreamStreamServer extends StreamServer {
	url: string
	key: string
	'is-auth': number
	user: string
	passwd: string
	token: string
	'net-mode': number
}

export type GetStatusResponse = UltraStreamGetStatusResponse | UltraEncodeGetStatusResponse

export interface UltraEncodeStreamServer extends StreamServer {
	'source-name': string
	'group-name': string
	'enable-discovery': number
	'discovery-server': string
	'transport-mode': number
	'mcast-addr': string
	'mcast-mask': string
	'mcast-ttl': number
	'enable-failover': number
	'fail-over-ndi-name': string
	'fail-over-ip-addr': string
	'enable-web-control': number
	'enable-ptz-control': number
	'main-stream': number
	'prvw-stream': number
	audio: number
	opt: number
	'is-media-hub': number
}

export interface UltraStreamGetStatusResponse extends BaseResponse {
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

export interface UltraEncodeGetStatusResponse extends BaseResponse {
	'cur-status': DeviceStatus // device running status mask
	'cur-time': string // device current time
	'box-name': string // device name
	'input-source': number // input source
	'input-device': number // input device
	'cpu-temperature': number
	'enable-ndi-hx3': number
	codec: {
		// codec status
		'main-stream': any
		'sub-stream': any
		audio: any
	}
	sysstat: any // device running status
	'live-status': {
		// live status
		live: UltraEncodeLiveStatus[]
	}
	'upgrade-status': any // update status
	'rec-status': {
		// recording status
		rec: UltraEncodeRecordingStatus[]
	}
	'format-status': any // disk format status
	'disk-test': any // disk performance test status
	nas: any // nas connection status
	'living-test': any // live test status
	'check-upgrade': any // online update check status
	'conn-wifi': any // wifi connection status
	'input-signal': InputSignalStatus // input signal
	'disk-info': any // disk information
	wifi: any // wifi network
	softap: any // AP network
	eth: any // ethernet network
	mobile: any // mobile broadband network
	rndis: any // USB net
	upgrade: any // new firmware information
	'channel-count': 2
	vumeters: Array<number>
}

export interface InputSignalStatus extends InputSignal {
	hdmi?: InputSignal
	sdi?: InputSignal
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

export interface UltraEncodeRecordingStatus {
	id: number
	type: number
	'is-use': number
	'is-skd-running': number
	result: number
	'run-ms': number
	'parted-num': number
	'video-frame-count': number
	'audio-frame-count': number
}

export interface RecordingStatus {
	result: number
	'run-ms': number
	'cur-bps': number
	'avg-bps': number
	'client-id': string
}

export type UltraEncodeLiveStatus = UltraEncodeRtmpLiveStatus | UltraEncodeSrtListenerLiveStatus

export interface UltraEncodeBaseLiveStatus {
	id: number
	type: number
	'is-use': number
	'is-skd-running': number
	name: string
	'run-ms': number
	result: number
	'stream-index': number
	'video-frames-totoal': number
	'audio-frames-totoal': number
	'video-frames-dropped': number
	'audio-frames-dropped': number
}

export interface UltraEncodeSrtListenerLiveStatus extends UltraEncodeBaseLiveStatus {
	'max-connections': number
	'num-clients': number
	clients: UltraEncodeSrtListenerClient[]
}

export interface UltraEncodeSrtListenerClient {
	'uptime-ms': number
	'rrt-ms': number
	'pkt-send-total': number
	'pkt-retrans-total': number
	'buf-ms': number
	'inst-bps': number
	'ip-addr': string
	port: number
}

export interface UltraEncodeRtmpLiveStatus extends UltraEncodeBaseLiveStatus {
	'uptime-ms': number
	'inst-bps': number
	net: number
	'video-frames-totoal': number
	'audio-frames-totoal': number
	'video-frames-dropped': number
	'audio-frames-dropped': number
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
	statusOccupied = 0x20000, // Device has been locked by app(s), at most 2 apps simultaneously
	statusFormatDisk = 0x100000, // USB is formatting
	statusFormatSD = 0x200000, // SD card is formatting
	statusSearchWifi = 0x400000, // The device is searching for available Wi-Fi networks
	statusConnectWifi = 0x800000, // The device is connecting to a Wi-Fi hotspot
	statusLoading = 0x1000000, // The device is loading configuration profile
	statusCheckUpgrade = 0x2000000, // The device is checking for new firmware versions
	statusReset = 0x4000000, // The device is resetting all parameters to default
	stausIPv6 = 0x8000000, // Reserved
	statusTestLock = 0x10000000, // Reserved
	statusReboot = 0x20000000, // The device is rebooting
	statusSendTest = 0x40000000, // The device is testing the server for file uploading
}

export const enum ApiResultCode {
	retSendWaiting = 31, // Reserved
	retLivingAuthErr = 30, // Live stream status: authentication error
	retLivingNotset = 29, // Live stream address not set
	retLivingDNS = 28, // Live stream status: Resolving DNS
	retInit = 27, // Initialization
	retLivingAuthing = 25, // Live stream status: authorizing
	retLivingWaiting = 24, // Live stream status: waiting for connection
	retLivingConnecting = 23, // Live stream status: connecting to the streaming destination
	retLivingConnected = 22, // Live stream status: stream server connected
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
	errNoUser = -25, // User not exist
	errNoPermissin = -26,
	errSameName = -27, // Name already in use
	errString = -28, // Invalid input characters
	errChannelsLimited = -29, // Streaming 6 sessions simultaneously at most.
	err8MLimited = -30, // Reserved
	errFacebookLimited = -31, // Reserved
	errCodecLimited = -32, // Reserved
	err4GLimited = -33, // Reserved
	errMWFUnsupported = -34, // Update package does not match current model or hardware version
	errNoSignal = -35, // No signal
	errSDCard = -36,
	errXinYueServer = -37, // Reserved
	errAliYunOSS = -38, // Reserved
	errSDNoSpace = -39, // Reserved
	errSDNoPermission = -40, // Reserved
	errRTSPLimited = -41, // Only one RTSP session is supported at a time
	errRTSP8MLimited = -42, // Reserved
	errBandwidthLimited = -43, // Reserved
	errPortLimited = -44, // Stream port occupied
	errNDILimited = -45, // Streaming one NDI|HX session is supported
	errSRTLimited = -46, // Streaming one SRT Listener session is supported
	errNDISettings = -47, // The substream can be up to 640x480@60 for a NDI|HX session
	errSubStreamSettings = -48, // The substream can be up to 1280x720@30 for a non-NDI|HX session
	errHLSLimited = -49, // Streaming one HLS session is supported
	errProtocolLimited = -50, // Allow 1 simultaneous session over the same streaming protocol
	errInit = -51, // Failed to initialize channels for live streaming
	errDeinterlaceSettings = -52, // Deinterlace settings error
	errTVULimitted = -53, // Streaming one TVU ISSP task is supported
	errProtocolOneChannel = -54, // Unified error codes including errRTSPLimited/errNDILimited/errSRTLimited/errHLSLimited/errTVULimitted
	errUHDSettings = -55, // The frame rate of the main stream should be no greater than 30 FPS when the encode resolution is greater than 2048x1080.
	errInputSignal = -56, // The frame rate of the main stream should be no greater than 30 FPS when the input resolution is greater than 2048x1080.
	errScheduler = -57, // Reserved
	errMountPoint = -58, // Error NAS mount point
}

export interface Duration {
	hours: number
	minutes: number
	seconds: number
}
