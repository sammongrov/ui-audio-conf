import React from 'react';
import renderer from 'react-test-renderer';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Actions } from 'react-native-router-flux';
import {
  // Dimensions,
  BackHandler,
  DeviceEventEmitter,
} from 'react-native';
import { RtcEngine /* AgoraView */ } from 'react-native-agora';
import InCallManager from 'react-native-incall-manager';
import AgoraAudioConf from '../index';

configure({ adapter: new Adapter() });

jest.mock('react-native-router-flux', () => ({
  Actions: {
    pop: jest.fn(),
  },
}));

jest.mock('Dimensions', () => ({
  get: () => ({ width: 720, height: 360 }),
}));

jest.mock('BackHandler', () => {
  const backHandler = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  return backHandler;
});

jest.mock('RCTDeviceEventEmitter', () => {
  const deviceEventEmitter = {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
  return deviceEventEmitter;
});

jest.mock('../../app/DBManager', () => {
  const dbManager = {
    app: {
      userId: 'MM1258g51dF92',
      getSettingsValue: jest.fn(() => ({ value: 'key-9995564t' })),
    },
    user: {
      list: {
        '0': { _id: 'PP1258g51dF92', name: 'busy-dev' },
        '1': { _id: 'MM1258g51dF92', name: 'dreaming-dev' },
        '2': { _id: 'CM1258g51dF00', name: 'comfort-forever' },
        '3': { _id: 'CM1258g51dF00', name: 'future-dev' },
        '4': { _id: 'UO1258g51dF92', name: 'unit-test-reader' },
      },
    },
  };
  return dbManager;
});

jest.mock('react-native-agora', () => {
  const rtcEngine = {
    init: jest.fn(),
    setDefaultAudioRouteToSpeakerphone: jest.fn(),
    setEnableSpeakerphone: jest.fn(),
    getSdkVersion: jest.fn((cb) => {
      cb('sdk-1.2.3.5');
    }),
    joinChannel: jest.fn(),
    enableAudioVolumeIndication: jest.fn(),
    eventEmitter: jest.fn(),
    startPreview: jest.fn(),
    leaveChannel: jest.fn(),
    destroy: jest.fn(),
    removeEmitter: jest.fn(),
    switchCamera: jest.fn(),
    muteLocalAudioStream: jest.fn(),
    muteAllRemoteAudioStreams: jest.fn(),
    setCameraTorchOn: jest.fn(),
    enableLocalVideo: jest.fn(),
    disableVideo: jest.fn(),
    enableVideo: jest.fn(),
  };
  /* eslint-disable */
  const React = require('React');
  const PropTypes = require('prop-types');
  class MockAgoraView extends React.Component {
    static propTypes = { children: PropTypes.any };

    static defaultProps = { children: '' };

    render() {
      return React.createElement('CameraRollPicker', this.props, this.props.children);
    }
    /* eslint-enable */
  }
  return { RtcEngine: rtcEngine, AgoraView: MockAgoraView };
});

jest.mock('react-native-incall-manager', () => ({
  start: jest.fn(),
  setKeepScreenOn: jest.fn(),
  stop: jest.fn(),
}));

const instance = 'fluffyunicorn';
const groupName = 'unit-test';
const groupID = 'XO12T8PE791l';
const userID = 'MM1258g51dF92';
const onPress = jest.fn();
const props = { instance, groupName, groupID, userID, onPress };

jest.useFakeTimers();

it('AudioConf render - modal is visible', () => {
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({
    isJoinSuccess: true,
    swapModal: true,
    visible: true,
  });
  tree.update();
  const modal = tree.find('Component').last();
  const closeModal = tree.find('TouchableOpacity').last();
  modal.props().onRequestClose();
  closeModal.props().onPress();
  expect(tree.state().visible).toBe(false);
  expect(tree.state().swapModal).toBe(false);
  expect(setTimeout).toBeCalled();
  jest.runAllTimers();
  expect(tree.state().swapModal).toBe(true);
});

/* ------------------------- Snapshots ----------------------- */
it('AudioConf renders correctly without props', () => {
  const tree = renderer.create(<AgoraAudioConf />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('AudioConf renders correctly with props', () => {
  const tree = renderer.create(<AgoraAudioConf {...props} />).toJSON();
  expect(tree).toMatchSnapshot();
});

/* ------------------- lifeCycle methods --------------------- */
it('AudioConf - componentWillMount - audio to headset', () => {
  const data = { isPlugged: true };
  DeviceEventEmitter.addListener = jest.fn((str, cb) => {
    cb(data);
  });
  RtcEngine.init.mockClear();
  RtcEngine.setDefaultAudioRouteToSpeakerphone.mockClear();
  InCallManager.start.mockClear();
  InCallManager.setKeepScreenOn.mockClear();
  BackHandler.addEventListener.mockClear();
  shallow(<AgoraAudioConf {...props} />);
  expect(RtcEngine.init).toBeCalledWith({
    appid: 'a7bff199bd6a478aaa3b3f49d0693fbd',
    channelProfile: 1,
    videoProfile: 40,
    clientRole: 1,
    swapWidthAndHeight: true,
  });
  expect(InCallManager.start).toBeCalledWith({ media: 'audio', auto: true, ringback: '' });
  expect(InCallManager.setKeepScreenOn).toBeCalledWith(true);
  expect(DeviceEventEmitter.addListener).toBeCalledWith('WiredHeadset', expect.any(Function));
  expect(RtcEngine.setDefaultAudioRouteToSpeakerphone).toBeCalledWith(false);
  expect(BackHandler.addEventListener).toBeCalled();
});

it('AudioConf - componentWillMount - audio to speakers', () => {
  const data = { isPlugged: false };
  DeviceEventEmitter.addListener = jest.fn((str, cb) => {
    cb(data);
  });
  RtcEngine.init.mockClear();
  RtcEngine.setDefaultAudioRouteToSpeakerphone.mockClear();
  InCallManager.start.mockClear();
  InCallManager.setKeepScreenOn.mockClear();
  BackHandler.addEventListener.mockClear();
  shallow(<AgoraAudioConf {...props} />);
  expect(RtcEngine.init).toBeCalled();
  expect(InCallManager.start).toBeCalled();
  expect(InCallManager.setKeepScreenOn).toBeCalled();
  expect(DeviceEventEmitter.addListener).toBeCalledWith('WiredHeadset', expect.any(Function));
  expect(RtcEngine.setDefaultAudioRouteToSpeakerphone).toBeCalledWith(true);
  expect(BackHandler.addEventListener).toBeCalled();
});

it('AudioConf - componentDidMount - audio to speakers, no userID', () => {
  const data = { isPlugged: true };
  DeviceEventEmitter.addListener = jest.fn((str, cb) => {
    cb(data);
  });
  RtcEngine.getSdkVersion.mockClear();
  RtcEngine.joinChannel.mockClear();
  RtcEngine.enableAudioVolumeIndication.mockClear();
  RtcEngine.setDefaultAudioRouteToSpeakerphone.mockClear();
  RtcEngine.disableVideo.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  const inst = tree.instance();
  inst.userID = null;
  inst.componentDidMount();
  expect(RtcEngine.getSdkVersion).toBeCalled();
  expect(RtcEngine.joinChannel).toBeCalled();
  expect(RtcEngine.enableAudioVolumeIndication).toBeCalledWith(500, 3);
  expect(RtcEngine.disableVideo).toBeCalled();
  expect(DeviceEventEmitter.addListener).toBeCalledWith('WiredHeadset', expect.any(Function));
  expect(RtcEngine.setDefaultAudioRouteToSpeakerphone).toBeCalledWith(false);
  expect(RtcEngine.eventEmitter).toBeCalled();
});

it('AudioConf - componentDidMount - onFirstRemoteVideoDecoded, a new remote added', () => {
  const data = { uid: 'US12789564' };
  RtcEngine.eventEmitter = jest.fn((obj) => {
    obj.onFirstRemoteVideoDecoded(data);
    obj.onJoinChannelSuccess();
    obj.onAudioVolumeIndication();
    obj.onUserJoined();
  });
  const remotes = ['MM1258g51dF92', 'CM1258g51dF00'];
  RtcEngine.startPreview.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ remotes });
  const inst = tree.instance();
  inst.componentDidMount();
  expect(RtcEngine.eventEmitter).toBeCalled();
  expect(RtcEngine.startPreview).toBeCalled();
  expect(tree.state().remotes).toEqual([...remotes, data.uid]);
  expect(tree.state().isJoinSuccess).toBe(true);
});

it('AudioConf - componentDidMount - onFirstRemoteVideoDecoded, a new remote is not added', () => {
  const data = { uid: 'US12789564' };
  const errorData = { err: 17 };
  RtcEngine.eventEmitter = jest.fn((obj) => {
    obj.onFirstRemoteVideoDecoded(data);
    obj.onError(errorData);
  });
  const remotes = ['MM1258g51dF92', 'US12789564'];
  RtcEngine.leaveChannel.mockClear();
  RtcEngine.destroy.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ remotes });
  const inst = tree.instance();
  inst.componentDidMount();
  expect(RtcEngine.eventEmitter).toBeCalled();
  expect(RtcEngine.leaveChannel).toBeCalled();
  expect(RtcEngine.destroy).toBeCalled();
  expect(tree.state().remotes).toEqual(remotes);
});

it('AudioConf - componentDidMount - onUserOffline', () => {
  const data = { uid: 'US12789564' };
  const errorData = { err: 23 };
  RtcEngine.eventEmitter = jest.fn((obj) => {
    obj.onUserOffline(data);
    obj.onError(errorData);
  });
  RtcEngine.leaveChannel.mockClear();
  RtcEngine.destroy.mockClear();
  const remotes = ['MM1258g51dF92', 'US12789564'];
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ remotes });
  const inst = tree.instance();
  inst.componentDidMount();
  expect(RtcEngine.eventEmitter).toBeCalled();
  expect(RtcEngine.leaveChannel).not.toBeCalled();
  expect(RtcEngine.destroy).not.toBeCalled();
  expect(tree.state().remotes).toEqual(remotes.slice(0, 1));
  expect(tree.state().swapModal).toEqual(false);
  expect(setTimeout).toBeCalled();
  jest.runAllTimers();
  expect(tree.state().swapModal).toEqual(true);
});

it('AudioConf - componentWillUnmount', () => {
  RtcEngine.removeEmitter.mockClear();
  InCallManager.stop.mockClear();
  BackHandler.removeEventListener.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  const inst = tree.instance();
  tree.unmount();
  expect(RtcEngine.removeEmitter).toBeCalled();
  expect(InCallManager.stop).toBeCalled();
  expect(BackHandler.removeEventListener).toBeCalled();
  expect(inst._mounted).toBe(false);
});

/* ------------------- component methods --------------------- */
it('AudioConf - onPressVideo', () => {
  const uid = 'US12789564';
  const tree = shallow(<AgoraAudioConf {...props} />);
  const inst = tree.instance();
  inst.onPressVideo(uid);
  expect(tree.state().selectUid).toMatch(uid);
  expect(tree.state().visible).toBe(true);
  expect(tree.state().swapModal).toBe(true);
});

it('AudioConf - handleBackPress', () => {
  RtcEngine.leaveChannel.mockClear();
  RtcEngine.destroy.mockClear();
  Actions.pop.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  const inst = tree.instance();
  const result = inst.handleBackPress();
  expect(RtcEngine.leaveChannel).toBeCalled();
  expect(RtcEngine.destroy).toBeCalled();
  expect(Actions.pop).toBeCalled();
  expect(result).toBe(true);
});

it('AudioConf - handlerCancel', () => {
  RtcEngine.leaveChannel.mockClear();
  RtcEngine.destroy.mockClear();
  Actions.pop.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  const inst = tree.instance();
  inst.handlerCancel();
  expect(RtcEngine.leaveChannel).toBeCalled();
  expect(RtcEngine.destroy).toBeCalled();
  expect(Actions.pop).toBeCalled();
});

it('AudioConf - handlerSwitchCamera', () => {
  RtcEngine.switchCamera.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  const inst = tree.instance();
  inst.handlerSwitchCamera();
  expect(RtcEngine.switchCamera).toBeCalled();
});

it('AudioConf - handlerMuteLocalAudioStream - mounted', () => {
  RtcEngine.muteLocalAudioStream.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ isMute: true });
  const inst = tree.instance();
  inst._mounted = true;
  inst.handlerMuteLocalAudioStream();
  expect(tree.state().isMute).toEqual(false);
  expect(RtcEngine.muteLocalAudioStream).toBeCalledWith(true);
});

it('AudioConf - handlerMuteLocalAudioStream - not mounted', () => {
  RtcEngine.muteLocalAudioStream.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ isMute: true });
  const inst = tree.instance();
  inst._mounted = false;
  inst.handlerMuteLocalAudioStream();
  expect(RtcEngine.muteLocalAudioStream).not.toBeCalled();
});

it('AudioConf - handlerMuteAllRemoteAudioStreams', () => {
  RtcEngine.muteAllRemoteAudioStreams.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ isMute: true });
  const inst = tree.instance();
  inst.handlerMuteAllRemoteAudioStreams();
  expect(tree.state().isMute).toEqual(false);
  expect(RtcEngine.muteAllRemoteAudioStreams).toBeCalledWith(true);
});

it('AudioConf - handlerSetEnableSpeakerphone', () => {
  RtcEngine.setDefaultAudioRouteToSpeakerphone.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ isSpeaker: false });
  const inst = tree.instance();
  inst.handlerSetEnableSpeakerphone();
  expect(tree.state().isSpeaker).toEqual(true);
  expect(RtcEngine.setDefaultAudioRouteToSpeakerphone).toBeCalledWith(false);
});

it('AudioConf - handlerChangeCameraTorch', () => {
  RtcEngine.setCameraTorchOn.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ isCameraTorch: true });
  const inst = tree.instance();
  inst.handlerChangeCameraTorch();
  expect(tree.state().isCameraTorch).toEqual(false);
  expect(RtcEngine.setCameraTorchOn).toBeCalledWith(true);
});

it('AudioConf - handlerChangeVideo - video disabled', () => {
  RtcEngine.enableLocalVideo.mockClear();
  RtcEngine.disableVideo.mockClear();
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ disableVideo: false });
  const inst = tree.instance();
  inst.handlerChangeVideo();
  expect(tree.state().disableVideo).toEqual(true);
  expect(RtcEngine.disableVideo).toBeCalled();
  expect(RtcEngine.enableLocalVideo).toBeCalledWith(false);
});

it('AudioConf - handlerChangeVideo - video enabled', () => {
  RtcEngine.enableLocalVideo.mockClear();
  RtcEngine.enableVideo.mockClear();

  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ disableVideo: true });
  const inst = tree.instance();
  inst.handlerChangeVideo();
  expect(tree.state().disableVideo).toEqual(false);
  expect(RtcEngine.enableVideo).toBeCalled();
  expect(RtcEngine.enableLocalVideo).toBeCalledWith(true);
});

it('AudioConf - handlerHideButtons', () => {
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ isHideButtons: false });
  const inst = tree.instance();
  inst.handlerHideButtons();
  expect(tree.state().isHideButtons).toEqual(true);
});

it('AudioConf renderRemotes - no remotes', () => {
  const remotes = ['MM1258g51dF92', 'US12789564', 'CM1258g51dF00'];
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ visible: true });
  const inst = tree.instance();
  const view = shallow(inst.renderRemotes(remotes));
  expect(view).toBeTruthy();
});

it('AudioConf renderRemotes - remotes', () => {
  const remotes = ['MM1258g51dF92', 'US12789564', 'CM1258g51dF00'];
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ visible: false });
  const inst = tree.instance();
  inst.onPressVideo = jest.fn();
  const videoButton = shallow(inst.renderRemotes(remotes))
    .find('TouchableOpacity')
    .first();
  videoButton.props().onPress();
  expect(inst.onPressVideo).toBeCalled();
});

it('AudioConf render - disableVideo', () => {
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({ isJoinSuccess: true, swapModal: true, disableVideo: true });
  tree.update();
  const videoOff = tree.find({ name: 'video-off' });
  expect(videoOff.length).toBe(1);
});

it('AudioConf render - not mute', () => {
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({
    isJoinSuccess: true,
    swapModal: true,
    disableVideo: true,
    isHideButtons: false,
    isMute: false,
  });
  tree.update();
  const micOff = tree.find({ name: 'microphone-off' });
  expect(micOff.length).toBe(1);
});

it('AudioConf render - operate button', () => {
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({
    isJoinSuccess: true,
    swapModal: true,
    disableVideo: true,
    isHideButtons: false,
    isMute: false,
  });
  tree.update();
  const operateButton = tree
    .find('OperateButton')
    .at(0)
    .shallow()
    .find('Icon');
  expect(operateButton.length).toBe(1);
});

it('AudioConf render - operate button', () => {
  const tree = shallow(<AgoraAudioConf {...props} />);
  tree.setState({
    isJoinSuccess: true,
    swapModal: true,
    disableVideo: false,
    isHideButtons: false,
    isMute: false,
  });
  tree.update();
  const operateButton = tree
    .find('OperateButton')
    .at(0)
    .shallow()
    .find('Icon');
  expect(operateButton.length).toBe(1);
});
