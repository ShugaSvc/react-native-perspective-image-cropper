import React, {Component} from 'react';
import {Animated, Dimensions, Image, PanResponder, View, Platform} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import Exif from 'react-native-exif';

const DIRECTION = {
    MIDDLE_LEFT: 'MIDDLE_LEFT',
    MIDDLE_RIGHT: 'MIDDLE_RIGHT',
    MIDDLE_TOP: 'MIDDLE_TOP',
    MIDDLE_BOTTOM: 'MIDDLE_BOTTOM',
    MOVE: 'MOVE',
    TOP_RIGHT: 'TOP_RIGHT',
    TOP_LEFT: 'TOP_LEFT',
    BOTTOM_RIGHT: 'BOTTOM_RIGHT',
    BOTTOM_LEFT: 'BOTTOM_LEFT',
}

const screenWidth = Dimensions.get('window').width;

class CustomCrop extends Component {
    constructor(props) {
        super(props);
        this._forgroundImageRef = null;
        this.preDxy = null;

        this.state = {
            viewHeight: screenWidth * (props.height / props.width),
            height: props.height,
            width: props.width,
            image: props.initialImage,
            hideStrict: false,
        };

        this.initalTopLeft = props.rectangleCoordinates ? this.imageCoordinatesToViewCoordinates(props.rectangleCoordinates.topLeft, true) : {
            x: 100,
            y: 100
        };
        this.initalTopRight = props.rectangleCoordinates ? this.imageCoordinatesToViewCoordinates(props.rectangleCoordinates.topRight, true) : {
            x: screenWidth - 100,
            y: 100
        };
        this.initalBottomLeft = props.rectangleCoordinates ? this.imageCoordinatesToViewCoordinates(props.rectangleCoordinates.bottomLeft, true) : {
            x: 100,
            y: this.state.viewHeight - 100
        };
        this.initalBottomRight = props.rectangleCoordinates ? this.imageCoordinatesToViewCoordinates(props.rectangleCoordinates.bottomRight, true) : {
            x: screenWidth - 100,
            y: this.state.viewHeight - 100
        };

        this.state = {
            ...this.state,
            topLeft: new Animated.ValueXY(this.initalTopLeft),
            topRight: new Animated.ValueXY(this.initalTopRight),
            bottomLeft: new Animated.ValueXY(this.initalBottomLeft),
            bottomRight: new Animated.ValueXY(this.initalBottomRight),
            imageZoomPanResponder: {panHandlers: {}},
        };
        this.panResponderTopLeft = this.createPanResponser(this.state.topLeft, DIRECTION.TOP_LEFT);
        this.panResponderTopRight = this.createPanResponser(this.state.topRight, DIRECTION.TOP_RIGHT);
        this.panResponderBottomLeft = this.createPanResponser(this.state.bottomLeft, DIRECTION.BOTTOM_LEFT);
        this.panResponderBottomRight = this.createPanResponser(this.state.bottomRight, DIRECTION.BOTTOM_RIGHT);
        this.state = {
            ...this.state,
            middleLeft: new Animated.ValueXY(
                props.rectangleCoordinates ?
                    this.imageCoordinatesToViewCoordinates(
                        {
                            x: (props.rectangleCoordinates.topLeft.x + props.rectangleCoordinates.bottomLeft.x) / 2,
                            y: (props.rectangleCoordinates.topLeft.y + props.rectangleCoordinates.bottomLeft.y) / 2,
                        }
                        , true) :
                    {x: 100, y: this.state.viewHeight / 2}
            ),
            middleRight: new Animated.ValueXY(
                props.rectangleCoordinates ?
                    this.imageCoordinatesToViewCoordinates(
                        {
                            x: (props.rectangleCoordinates.topRight.x + props.rectangleCoordinates.bottomRight.x) / 2,
                            y: (props.rectangleCoordinates.topRight.y + props.rectangleCoordinates.bottomRight.y) / 2,
                        }
                        , true) :
                    {x: screenWidth - 100, y: this.state.viewHeight / 2}
            ),
            middleTop: new Animated.ValueXY(
                props.rectangleCoordinates ?
                    this.imageCoordinatesToViewCoordinates(
                        {
                            x: (props.rectangleCoordinates.topRight.x + props.rectangleCoordinates.topLeft.x) / 2,
                            y: (props.rectangleCoordinates.topRight.y + props.rectangleCoordinates.topLeft.y) / 2,
                        }
                        , true) :
                    {x: screenWidth / 2, y: 100}
            ),
            middleBottom: new Animated.ValueXY(
                props.rectangleCoordinates ?
                    this.imageCoordinatesToViewCoordinates(
                        {
                            x: (props.rectangleCoordinates.bottomRight.x + props.rectangleCoordinates.bottomLeft.x) / 2,
                            y: (props.rectangleCoordinates.bottomRight.y + props.rectangleCoordinates.bottomLeft.y) / 2,
                        }
                        , true) :
                    {x: screenWidth / 2, y: this.state.viewHeight - 100}
            ),
        }
        this.panResponderMiddleLeft = this.createPanResponser(this.state.middleLeft, DIRECTION.MIDDLE_LEFT);
        this.panResponderMiddleRight = this.createPanResponser(this.state.middleRight, DIRECTION.MIDDLE_RIGHT);
        this.panResponderMiddleTop = this.createPanResponser(this.state.middleTop, DIRECTION.MIDDLE_TOP);
        this.panResponderMiddleBottom = this.createPanResponser(this.state.middleBottom, DIRECTION.MIDDLE_BOTTOM);
        this._imageZoomInfo = {
            positionX: 0,
            positionY: 0,
            scale: 1,
        };

        this._forgroundImagePanResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                for (let point of this.allPoints) {
                    point.setOffset({x: point.x._value, y: point.y._value});
                    point.setValue({x: 0, y: 0});
                }
            },
            onPanResponderMove: (evt, gs) => {
                this.updatePoints(DIRECTION.MOVE, gs);
                this.updateForgroundImagePosition();

            },
            onPanResponderRelease: (evt, gs) => {
                for (let point of this.allPoints) {
                    point.flattenOffset();
                }
            },
        });

        this.allPoints = [
            this.state.middleBottom,
            this.state.middleTop,
            this.state.middleRight,
            this.state.middleLeft,
            this.state.topLeft,
            this.state.topRight,
            this.state.bottomLeft,
            this.state.bottomRight
        ];
    }

    resetCropPosition() {
        let {rectangleCoordinates} = this.props;

        this.state.topLeft.setValue(this.initalTopLeft);
        this.state.topRight.setValue(this.initalTopRight);
        this.state.bottomLeft.setValue(this.initalBottomLeft);
        this.state.bottomRight.setValue(this.initalBottomRight);

        this.updateMiddlePoints();
    }

    updateForgroundImagePosition() {
        let _topLeft = this.getFlattenXY(this.state.topLeft);
        this._forgroundImageRef && this._forgroundImageRef.setNativeProps({
            style: {
                top: -(_topLeft.y),
                left: -(_topLeft.x),
            }
        })
    }

    updateForgroundImageSize() {
        let {width, height} = this.getCropSize();
        this._forgroundImageContainerRef && this._forgroundImageContainerRef.setNativeProps({
            style: {
                width, height
            }
        })
    }

    getCropSize() {
        let {topRight, topLeft, bottomRight} = this.state;
        let _topRight = this.getFlattenXY(topRight);
        let _topLeft = this.getFlattenXY(topLeft);
        let _bottomRight = this.getFlattenXY(bottomRight);
        return {
            width: _topRight.x - _topLeft.x,
            height: _bottomRight.y - _topRight.y
        }
    }

    createPanResponser(point, direction = 'point') {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                this.preCropSize = this.getCropSize();
                point.setOffset({x: point.x._value, y: point.y._value});
                point.setValue({x: 0, y: 0});
            },
            onPanResponderMove: (evt, gs) => {
                this.updatePoints(direction, gs);
                this.updateForgroundImageSize();
                this.updateForgroundImagePosition();
            },
            onPanResponderRelease: () => {
                this.minDx = null;
                this.minDy = null;
                point.flattenOffset();
            },
        });
    }

    isTooSamll({dx, dy}) {
        let {width, height} = this.getCropSize();
        if (width < this.props.minSize)
            this.minDx === null && (this.minDx = dx);
        else
            this.minDx = null;

        if (height < this.props.minSize)
            this.minDy === null && (this.minDy = dy);
        else
            this.minDy = null;


        return {
            x: width < this.props.minSize,
            y: height < this.props.minSize,
        }
    }

    getBoundaryDXY({dx, dy, direction}) {
        let isTooSamll = this.isTooSamll({dx, dy});
        let _dx, _dy;

        if (isTooSamll.x) {
            _dx = this.minDx
        } else {
            _dx = dx;
        }

        if (isTooSamll.y) {
            _dy = this.minDy
        } else {
            _dy = dy;
        }
        return {dx: _dx, dy: _dy};
    }

    viewCoordinatesToImageCoordinates(corner) {
        return {
            x: (this.offsetX(corner.x._value) / screenWidth) * this.state.width,
            y: (this.offsetY(corner.y._value) / this.state.viewHeight) * this.state.height,
        };
    }

    offsetX(x) {
        let maxOffSetX = screenWidth - (screenWidth / this._imageZoomInfo.scale);
        return (x / this._imageZoomInfo.scale) + (maxOffSetX / 2 - this._imageZoomInfo.positionX);
    }

    offsetY(y) {
        let maxOffSetY = this.state.viewHeight - (this.state.viewHeight / this._imageZoomInfo.scale);
        return (y / this._imageZoomInfo.scale) + (maxOffSetY / 2 - this._imageZoomInfo.positionY);
    }

    async getCropData() {
        const coordinates = {
            topLeft: this.viewCoordinatesToImageCoordinates(this.state.topLeft),
            topRight: this.viewCoordinatesToImageCoordinates(this.state.topRight),
            bottomLeft: this.viewCoordinatesToImageCoordinates(this.state.bottomLeft),
            bottomRight: this.viewCoordinatesToImageCoordinates(this.state.bottomRight),
        };

        let size = {
            width: parseInt(Math.abs(coordinates.topRight.x - coordinates.topLeft.x)),
            height: parseInt(Math.abs(coordinates.topLeft.y - coordinates.bottomRight.y)),
        };
        let offset = {
            x: parseInt(coordinates.topLeft.x),
            y: parseInt(coordinates.topLeft.y),
        };
        // transform view crop coordinates per image orientation
        // better solution is just to rotate image when transformig to Bitmap in ImageEditingManager.java...
        // https://stackoverflow.com/questions/7286714/android-get-orientation-of-a-camera-bitmap-and-rotate-back-90-degrees
        try {
            if (Platform.OS === 'android') {
                let exif = await Exif.getExif(this.state.image);
                if (exif.Orientation == 6) {
                    console.warn('exif.Orientation to flip CW by 90...');
                    let tmpWidth = size.width;
                    size.width = size.height;
                    size.height = tmpWidth;

                    offset.x = offset.y;
                    offset.y = parseInt(this.state.width - coordinates.topRight.x);
                }
                else if (exif.Orientation == 8) {
                    console.warn('exif.Orientation to flip CW by 270...');
                    let tmpWidth = size.width;
                    size.width = size.height;
                    size.height = tmpWidth;

                    offset.x = parseInt(this.state.height - coordinates.bottomLeft.y);
                    offset.y = offset.x;
                }
            }
        } catch (err) {
            console.warn(err);
        }

        return ({
            offset,
            size
        });
    }

    updatePoints(direction, gs) {
        let isInvalidSize = {
            x: false,
            y: false,
        }
        if (!this.preDxy)
            this.preDxy = {dx: gs.dx, dy: gs.dy};

        if (direction === DIRECTION.MIDDLE_LEFT) {
            isInvalidSize.x = this.preCropSize.width + (-gs.dx) < this.props.minSize;
            this.state.middleLeft.setValue({
                x: isInvalidSize.x ? this.preDxy.dx : gs.dx,
                y: 0,
            });

            this.state.topLeft.setValue({
                x: this.state.middleLeft.x._value + this.state.middleLeft.x._offset,
                y: this.state.topLeft.y._value
            });
            this.state.bottomLeft.setValue({
                x: this.state.middleLeft.x._value + this.state.middleLeft.x._offset,
                y: this.state.bottomLeft.y._value
            });
            this.state.middleTop.setValue({
                x: (this.state.topLeft.x._value + this.state.topRight.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.topRight.y._value) / 2,
            });
            this.state.middleBottom.setValue({
                x: (this.state.bottomLeft.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.bottomLeft.y._value + this.state.bottomRight.y._value) / 2,
            });
        } else if (direction === DIRECTION.MIDDLE_RIGHT) {
            isInvalidSize.x = this.preCropSize.width + gs.dx < this.props.minSize;
            this.state.middleRight.setValue({
                x: isInvalidSize.x ? this.preDxy.dx : gs.dx,
                y: 0,
            });
            this.state.topRight.setValue({
                x: this.state.middleRight.x._value + this.state.middleRight.x._offset,
                y: this.state.topRight.y._value
            });
            this.state.bottomRight.setValue({
                x: this.state.middleRight.x._value + this.state.middleRight.x._offset,
                y: this.state.bottomRight.y._value
            });
            this.state.middleTop.setValue({
                x: (this.state.topLeft.x._value + this.state.topRight.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.topRight.y._value) / 2,
            });
            this.state.middleBottom.setValue({
                x: (this.state.bottomLeft.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.bottomLeft.y._value + this.state.bottomRight.y._value) / 2,
            });
        } else if (direction === DIRECTION.MIDDLE_TOP) {
            isInvalidSize.y = this.preCropSize.height + (-gs.dy) < this.props.minSize;
            this.state.middleTop.setValue({
                x: 0,
                y: isInvalidSize.y ? this.preDxy.dy : gs.dy,
            });

            this.state.topLeft.setValue({
                x: this.state.topLeft.x._value,
                y: this.state.middleTop.y._value + this.state.middleTop.y._offset,
            });
            this.state.topRight.setValue({
                x: this.state.topRight.x._value,
                y: this.state.middleTop.y._value + this.state.middleTop.y._offset,
            });
            this.state.middleLeft.setValue({
                x: (this.state.topLeft.x._value + this.state.bottomLeft.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.bottomLeft.y._value) / 2,
            });
            this.state.middleRight.setValue({
                x: (this.state.topRight.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.topRight.y._value + this.state.bottomRight.y._value) / 2,
            });
        } else if (direction === DIRECTION.MIDDLE_BOTTOM) {
            isInvalidSize.y = this.preCropSize.height + gs.dy < this.props.minSize;
            this.state.middleBottom.setValue({
                x: 0,
                y: isInvalidSize.y ? this.preDxy.dy : gs.dy,
            });

            this.state.bottomLeft.setValue({
                x: this.state.topLeft.x._value,
                y: this.state.middleBottom.y._value + this.state.middleBottom.y._offset
            });
            this.state.bottomRight.setValue({
                x: this.state.topRight.x._value,
                y: this.state.middleBottom.y._value + this.state.middleBottom.y._offset
            });
            this.state.middleLeft.setValue({
                x: (this.state.topLeft.x._value + this.state.bottomLeft.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.bottomLeft.y._value) / 2,
            });
            this.state.middleRight.setValue({
                x: (this.state.topRight.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.topRight.y._value + this.state.bottomRight.y._value) / 2,
            });
        } else if (direction === DIRECTION.MOVE) {

            this.state.topLeft.setValue({x: gs.dx, y: gs.dy});
            this.state.topRight.setValue({x: gs.dx, y: gs.dy});
            this.state.bottomLeft.setValue({x: gs.dx, y: gs.dy});
            this.state.bottomRight.setValue({x: gs.dx, y: gs.dy});
            this.state.middleLeft.setValue({x: gs.dx, y: gs.dy});
            this.state.middleRight.setValue({x: gs.dx, y: gs.dy});
            this.state.middleTop.setValue({x: gs.dx, y: gs.dy});
            this.state.middleBottom.setValue({x: gs.dx, y: gs.dy});

        } else if (direction === DIRECTION.TOP_RIGHT) {

            isInvalidSize.x = this.preCropSize.width + gs.dx < this.props.minSize;
            isInvalidSize.y = this.preCropSize.height + (-gs.dy) < this.props.minSize;

            this.state.topRight.setValue({
                x: isInvalidSize.x ? this.preDxy.dx : gs.dx,
                y: isInvalidSize.y ? this.preDxy.dy : gs.dy,
            });
            this.state.topLeft.setValue({
                x: this.state.topLeft.x._value,
                y: this.state.topRight.y._value + this.state.topRight.y._offset,
            });
            this.state.bottomRight.setValue({
                x: this.state.topRight.x._value + this.state.topRight.x._offset,
                y: this.state.bottomRight.y._value,
            });
            this.updateMiddlePoints();

        } else if (direction === DIRECTION.TOP_LEFT) {

            isInvalidSize.x = this.preCropSize.width + (-gs.dx) < this.props.minSize;
            isInvalidSize.y = this.preCropSize.height + (-gs.dy) < this.props.minSize;

            this.state.topLeft.setValue({
                x: isInvalidSize.x ? this.preDxy.dx : gs.dx,
                y: isInvalidSize.y ? this.preDxy.dy : gs.dy,
            });
            this.state.topRight.setValue({
                x: this.state.topRight.x._value,
                y: this.state.topLeft.y._value + this.state.topLeft.y._offset,
            });
            this.state.bottomLeft.setValue({
                x: this.state.topLeft.x._value + this.state.topLeft.x._offset,
                y: this.state.bottomLeft.y._value,
            });
            this.updateMiddlePoints();

        } else if (direction === DIRECTION.BOTTOM_RIGHT) {

            isInvalidSize.x = this.preCropSize.width + gs.dx < this.props.minSize;
            isInvalidSize.y = this.preCropSize.height + gs.dy < this.props.minSize;

            this.state.bottomRight.setValue({
                x: isInvalidSize.x ? this.preDxy.dx : gs.dx,
                y: isInvalidSize.y ? this.preDxy.dy : gs.dy,
            });

            this.state.topRight.setValue({
                x: this.state.bottomRight.x._value + this.state.bottomRight.x._offset,
                y: this.state.topRight.y._value,
            });
            this.state.bottomLeft.setValue({
                x: this.state.bottomLeft.x._value,
                y: this.state.bottomRight.y._value + this.state.bottomRight.y._offset,
            });
            this.updateMiddlePoints();

        } else if (direction === DIRECTION.BOTTOM_LEFT) {

            isInvalidSize.x = this.preCropSize.width + (-gs.dx) < this.props.minSize;
            isInvalidSize.y = this.preCropSize.height + gs.dy < this.props.minSize;

            this.state.bottomLeft.setValue({
                x: isInvalidSize.x ? this.preDxy.dx : gs.dx,
                y: isInvalidSize.y ? this.preDxy.dy : gs.dy,
            });

            this.state.topLeft.setValue({
                x: this.state.bottomLeft.x._value + this.state.bottomLeft.x._offset,
                y: this.state.topLeft.y._value,
            });
            this.state.bottomRight.setValue({
                x: this.state.bottomRight.x._value,
                y: this.state.bottomLeft.y._value + this.state.bottomLeft.y._offset,
            });
            this.updateMiddlePoints();
        }

        if (!isInvalidSize.x) {
            this.preDxy.dx = gs.dx
        }
        if (!isInvalidSize.y) {
            this.preDxy.dy = gs.dy
        }
    }

    updateMiddlePoints() {
        let {topLeft, topRight, bottomRight, bottomLeft} = this.state;
        let _topLeft = this.getFlattenXY(topLeft);
        let _topRight = this.getFlattenXY(topRight);
        let _bottomRight = this.getFlattenXY(bottomRight);
        let _bottomLeft = this.getFlattenXY(bottomLeft);

        this.state.middleTop.setValue({
            x: (_topLeft.x + _topRight.x) / 2,
            y: (_topLeft.y + _topRight.y) / 2,
        });
        this.state.middleBottom.setValue({
            x: (_bottomLeft.x + _bottomRight.x) / 2,
            y: (_bottomLeft.y + _bottomRight.y) / 2,
        });
        this.state.middleLeft.setValue({
            x: (_topLeft.x + _bottomLeft.x) / 2,
            y: (_topLeft.y + _bottomLeft.y) / 2,
        });
        this.state.middleRight.setValue({
            x: (_topRight.x + _bottomRight.x) / 2,
            y: (_topRight.y + _bottomRight.y) / 2,
        });
    }

    imageCoordinatesToViewCoordinates(corner) {
        return {
            x: (corner.x * screenWidth) / this.state.width,
            y: (corner.y * this.state.viewHeight) / this.state.height,
        };
    }

    getFlattenXY(point) {
        return {
            x: (point.x._value + point.x._offset),
            y: (point.y._value + point.y._offset),
        }
    }

    calculateXY({point, dx, dy}) {
        return {
            x: (dx + point.x._offset),
            y: (dy + point.y._offset),
        }
    }


    static defaultProps = {
        handlerColor: 'white',
        handlerLength: 25,
        handlerWidth: 3,
        minSize: 20,
        bgImageOpacity: 0.5,
        overlayStrokeColor: "white",
        overlayStrokeWidth: 0.5,
    };

    render() {
        return (
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <View style={[s(this.props).cropContainer, {height: this.state.viewHeight}]}>
                    <ImageZoom cropWidth={screenWidth}
                               cropHeight={this.state.viewHeight}
                               imageWidth={screenWidth}
                               imageHeight={this.state.viewHeight}
                               onPanResponderCreated={(panResponder) => {
                                   this.setState({imageZoomPanResponder: panResponder})
                               }}
                               onMove={(obj) => {
                                   this._imageZoomInfo = obj;
                                   this._forgroundImageRef && this._forgroundImageRef.setNativeProps({
                                       style: {
                                           transform: [
                                               {
                                                   scale: this._imageZoomInfo.scale
                                               },
                                               {
                                                   translateX: this._imageZoomInfo.positionX
                                               },
                                               {
                                                   translateY: this._imageZoomInfo.positionY
                                               }
                                           ]
                                       }
                                   })
                               }}
                               maxScale={3}>
                        <Image
                            style={[s(this.props).image, {height: this.state.viewHeight}, {opacity: this.props.bgImageOpacity}]}
                            resizeMode="contain"
                            source={{uri: this.state.image}}
                        />
                    </ImageZoom>

                    <Animated.View renderToHardwareTextureAndroid
                                   ref={(ref) => ref && (this._forgroundImageContainerRef = ref)}
                                   style={[
                                       this.state.topLeft.getLayout(),
                                       {width: this.getCropSize().width},
                                       {height: this.getCropSize().height},
                                       {position: "absolute", backgroundColor: "transparent", overflow: 'hidden'},
                                       {
                                           borderWidth: this.props.overlayStrokeWidth,
                                           borderColor: this.props.overlayStrokeColor,
                                           //borderStyle:'dashed',
                                           //borderRadius: 0.1
                                       }
                                   ]}
                                   {...this._forgroundImagePanResponder.panHandlers}>
                        <Animated.Image
                            ref={(ref) => ref && (this._forgroundImageRef = ref)}
                            style={[
                                s(this.props).image,
                                {position: 'absolute', overflow: 'hidden'},
                                {height: this.state.viewHeight},
                                {opacity: 1},
                                {top: -(this.state.topLeft.y._value)},
                                {left: -(this.state.topLeft.x._value)},
                                {
                                    transform: [
                                        {
                                            scale: this._imageZoomInfo.scale
                                        },
                                        {
                                            translateX: this._imageZoomInfo.positionX
                                        },
                                        {
                                            translateY: this._imageZoomInfo.positionY
                                        }
                                    ]
                                }
                            ]}
                            resizeMode="cover"
                            source={{uri: this.state.image}}
                        />
                    </Animated.View>

                    <Animated.View
                        {...this.panResponderTopLeft.panHandlers}
                        hitSlop={{top: this.props.handlerLength, left: this.props.handlerLength}}
                        style={[this.state.topLeft.getLayout(), s(this.props).handlerCornerContainer, {transform: [{translateX: -this.props.handlerWidth / 2}, {translateY: -this.props.handlerWidth / 2}]}]}>
                        <View style={[s(this.props).handlerTopLeft]}/>
                    </Animated.View>
                    <Animated.View
                        {...this.panResponderTopRight.panHandlers}
                        hitSlop={{top: this.props.handlerLength, right: this.props.handlerLength}}
                        style={[this.state.topRight.getLayout(), s(this.props).handlerCornerContainer, {transform: [{translateX: -this.props.handlerLength + (this.props.handlerWidth / 2)}, {translateY: -this.props.handlerWidth / 2}]}]}>
                        <View style={[s(this.props).handlerTopRight]}/>
                    </Animated.View>
                    <Animated.View
                        {...this.panResponderBottomLeft.panHandlers}
                        hitSlop={{bottom: this.props.handlerLength, left: this.props.handlerLength}}
                        style={[this.state.bottomLeft.getLayout(), s(this.props).handlerCornerContainer, {transform: [{translateX: -this.props.handlerWidth / 2}, {translateY: -this.props.handlerLength + this.props.handlerWidth / 2}]}]}>
                        <View style={[s(this.props).handlerBottomLeft]}/>
                    </Animated.View>
                    <Animated.View
                        {...this.panResponderBottomRight.panHandlers}
                        hitSlop={{bottom: this.props.handlerLength, right: this.props.handlerLength}}
                        style={[this.state.bottomRight.getLayout(), s(this.props).handlerCornerContainer, {transform: [{translateX: -this.props.handlerLength + this.props.handlerWidth / 2}, {translateY: -this.props.handlerLength + this.props.handlerWidth / 2}]}]}>
                        <View style={[s(this.props).handlerBottomRight]}/>
                    </Animated.View>


                    <Animated.View
                        {...this.panResponderMiddleLeft.panHandlers}
                        hitSlop={{left: this.props.handlerLength, right: this.props.handlerLength}}
                        style={[this.state.middleLeft.getLayout(), s(this.props).handlerVerticalContainer]}>
                        <View style={[s(this.props).handlerVertical]}/>
                    </Animated.View>
                    <Animated.View
                        {...this.panResponderMiddleRight.panHandlers}
                        hitSlop={{left: this.props.handlerLength, right: this.props.handlerLength}}
                        style={[this.state.middleRight.getLayout(), s(this.props).handlerVerticalContainer]}>
                        <View style={[s(this.props).handlerVertical]}/>
                    </Animated.View>
                    <Animated.View
                        {...this.panResponderMiddleTop.panHandlers}
                        hitSlop={{top: this.props.handlerLength, bottom: this.props.handlerLength}}
                        style={[this.state.middleTop.getLayout(), s(this.props).handlerHorizontalContainer]}>
                        <View style={[s(this.props).handlerHorizontal]}/>
                    </Animated.View>
                    <Animated.View
                        {...this.panResponderMiddleBottom.panHandlers}
                        hitSlop={{top: this.props.handlerLength, bottom: this.props.handlerLength}}
                        style={[this.state.middleBottom.getLayout(), s(this.props).handlerHorizontalContainer]}>
                        <View style={[s(this.props).handlerHorizontal]}/>
                    </Animated.View>
                </View>
            </View>
        );
    }


}


const s = (props) => {
    return {
        handlerCornerContainer: {
            width: props.handlerLength,
            height: props.handlerLength,
            overflow: 'visible',
            position: 'absolute',
            marginTop: 0,
            marginLeft: 0,
        },
        handlerTopLeft: {
            position: 'absolute',
            overflow: 'visible',
            width: props.handlerLength,
            height: props.handlerLength,
            borderColor: props.handlerColor,
            borderTopWidth: props.handlerWidth,
            borderLeftWidth: props.handlerWidth
        },
        handlerTopRight: {
            position: 'absolute',
            overflow: 'visible',
            width: props.handlerLength,
            height: props.handlerLength,
            borderColor: props.handlerColor,
            borderTopWidth: props.handlerWidth,
            borderRightWidth: props.handlerWidth
        },
        handlerBottomLeft: {
            position: 'absolute',
            overflow: 'visible',
            width: props.handlerLength,
            height: props.handlerLength,
            borderColor: props.handlerColor,
            borderBottomWidth: props.handlerWidth,
            borderLeftWidth: props.handlerWidth
        },
        handlerBottomRight: {
            position: 'absolute',
            overflow: 'visible',
            width: props.handlerLength,
            height: props.handlerLength,
            borderColor: props.handlerColor,
            borderBottomWidth: props.handlerWidth,
            borderRightWidth: props.handlerWidth
        },


        handlerHorizontalContainer: {
            width: props.handlerLength,
            height: props.handlerWidth,
            overflow: 'visible',
            position: 'absolute',
            transform: [
                {translateX: -(props.handlerLength / 2)},
                {translateY: -(props.handlerWidth / 2)}
            ]
        },
        handlerHorizontal: {
            position: 'absolute',
            width: props.handlerLength,
            height: props.handlerWidth,
            backgroundColor: props.handlerColor,
        },

        handlerVerticalContainer: {
            width: props.handlerWidth,
            height: props.handlerLength,
            overflow: 'visible',
            position: 'absolute',
            transform: [
                {translateX: -(props.handlerWidth / 2)},
                {translateY: -(props.handlerLength / 2)}
            ]
        },
        handlerVertical: {
            position: 'absolute',
            width: props.handlerWidth,
            height: props.handlerLength,
            backgroundColor: props.handlerColor,
        },

        image: {
            width: screenWidth,
            position: 'absolute',
        },
        handler: {
            height: 0,
            width: 0,
            overflow: 'visible',
            position: 'absolute',
        },
        cropContainer: {
            width: screenWidth,
        }
    };
};

export default CustomCrop;
