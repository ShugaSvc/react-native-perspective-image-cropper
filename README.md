
# React Native perspective image cropper 📐🖼

A component that allows you to perform custom image crop and perspective correction !


## Installation 🚀🚀

`$ npm install react-native-perspective-image-cropper --save`

This library uses react-native-svg, you must install it too. See https://github.com/react-native-community/react-native-svg for more infos.

for RN0.47, react-native-svg have a issue cause android multiple touch crash. here is a custom build to resolve it.
See. https://github.com/irvingdp/react-native-svg/tree/v5.4.11

## Props

| Props             | Type            | Required | Description                                                                                |
|-------------------|-----------------|-----------------|---------------------------------------------------------------------------------------------|
| `rectangleCoordinates`            | `Object` see usage | No | Object to predefine an area to crop (an already detected image for example) |
| `initialImage`            | `String` | Yes | Base64 encoded image you want to be cropped |
| `height`            | `Number` | Yes | Height of the image (will probably disappear in the future |
| `width`            | `Number` | Yes | Width of the image (will probably disappear in the future |
| `bgImageOpacity`            | `Number` | No | Color of the bg image overlay  |
| `overlayStrokeColor`            | `String` | No | Color of the cropping area stroke  |
| `overlayStrokeWidth`            | `Number` | No | Width of the cropping area stroke  |
| `handlerColor`            | `String` | No | Color of the handlers  |
| `minSize`            | `Number` | No | thie min selection size  |


## Usage

```javascript
import CustomCrop from 'react-native-perspective-image-cropper';

class CropView extends Component {
  constructor(props) {
      this.state = {
         imageWidth: 0,
         imageHeight: 0,
     };
     this.imageUri = require('/images/image.png')
  }
  
  componentWillMount() {
    Image.getSize(this.imageUri, (width, height) => {
      this.setState({
        imageWidth: width,
        imageHeight: height
      });
    });
  }

  render() {
    return (
      <View>
        <CustomCrop
            initialImage={this.imageUri}
            height={this.state.imageHeight}
            width={this.state.imageWidth}
            bgImageOpacity={0.4}
            overlayColor="#CCCCCC"
            overlayStrokeColor="#FFFFFF"
            overlayStrokeWidth={2}
            handlerColor="#FFFFFF"
            handlerHorizontalHeight={8}
            handlerHorizontalWidth={30}
            strokeDasharray={[7,4]}
            minSize={30 * 3}
            rectangleCoordinates={{
                topLeft: { x: 100, y: 400 },
                topRight: { x: 500, y: 400 },
                bottomLeft: { x: 100, y: 600 },
                bottomRight: { x: 500, y: 600 },
            }}
        />
      </View>
    );
  }
}
```
