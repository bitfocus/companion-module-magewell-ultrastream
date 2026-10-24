## Magewell Ultra Stream

Should work with all models of the Magewell Ultra Stream and Magewell Ultra Encode series.

### Configuration

- **Target IP**: IP address of the device
- **Username** and **Password**: the login for the web interface of the device (default: Admin / Admin)
- **Request timeout**: how long to wait for an answer from the device. The connection shows "Device not reachable" after three requests in a row get no answer.

### Actions

- Start/Stop recording
- Start/Stop streaming
- Enable/Disable streaming server
- Enable/Disable record channel: choose whether to record to USB, SD card or internal storage, or NAS. This does not start or stop a recording. (Ultra Encode only)
- Select input source (only for Ultra Encode AIO)
- Change mixer settings and mixer format (only for Ultra Encode AIO)
- Reboot device: the device is unreachable for a few minutes while it restarts

### Feedbacks

- Record status and stream status
- Streaming server status: whether a server is enabled
- Record channel status: whether a record channel is enabled (Ultra Encode only)
- Input signal: whether there is a signal on the active input, or on the HDMI or SDI input of an Ultra Encode. Each model only has the inputs it is built with.
- Storage status: whether USB, SD card or internal storage, or NAS (Ultra Encode only) is ready
- Selected input source, mixer settings and mixer format (only for Ultra Encode AIO)
- Volume (Ultra Encode only)

### Variables

- `product_type`, `model_type`: product (Ultra Stream or Ultra Encode) and exact model of the device
- `record_status`, `stream_status`: Recording/Record and Streaming/Stream
- `stream_duration_hm`, `stream_duration_hms`, `record_duration_hm`, `record_duration_hms`: duration of the current stream and recording
- `stream_bitrate`: streaming bitrate in Mb/s
- `input_signal`: format of the input signal, e.g. 1920x1080p25, or empty without a signal
- `input_source_id`, `input_source_name`: current input source (Ultra Encode)
- `mixer_location`, `mixer_hdmi_top`: mixer settings (Ultra Encode AIO)
